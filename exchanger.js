var db = require("@rando4.me/db");
var config = require("config");
var async = require("async");
var logger = require("./src/log/logger");
var metrics = require("./src/metrics");
var printService = require("./src/service/printService");
var randoService = require("./src/service/randoService");
var dbService = require("./src/service/dbService");
var firebaseService = require("./src/service/firebaseService");
var consistencyService = require("./src/service/consistencyService");

global.users = {};
global.randos = [];
global.strangerEmailsAndRandoIds = [];

function exchangeRandos (callback) {
  logger.info("[exchanger.exchangeRandos]", "Trying exchange randos");

  var choosers = randoService.findAllChoosers(global.randos);

  printService.printChooser(choosers);

  async.eachSeries(choosers, function (chooser, done) {
    initExchangerLog(choosers);

    //chooser is rando that will search other rando and put it to rando.user.in
    logger.debug("[exchanger.exchangeRandos]", "Chooser is:", chooser.randoId, "of [", chooser.email, "]");

    logger.trace("[exchanger.exchangeRandos]", "Start calculating by metrics");
    metrics.calculate(chooser, global.randos);

    logger.trace("[exchanger.exchangeRandos]", "Calculation is done. Print metrics");
    printService.printMetrics(global.randos, chooser);

    logger.trace("[exchanger.exchangeRandos]", "Trying to select best rando");
    var bestRando = randoService.selectBestRando(global.randos);

    logger.debug("[exchanger.exchangeRandos]", "Best rando:", bestRando.randoId, "of", bestRando.email);

    if (bestRando.mark < 0) {
      logger.trace("[exchanger.exchangeRandos]", "Continue, because bestRando.mark < 0");
      return done();
    }

    global.exchangeLog.chooserId = chooser.randoId;
    global.exchangeLog.choosenId = bestRando.randoId;


    logger.trace("[exchanger.exchangeRandos]", "Trying put bestRando", bestRando.randoId ,"to user", chooser.email);
    putRandoToUserAsync(chooser, bestRando, global.randos, done);

    logger.trace("[exchanger.exchangeRandos]", "Do body is done.");
  }, function (err) {
    logger.info("[exchanger.exchangeRandos]", "exchangeRandos Done. We done successfully without error. Right?", !err);
    callback(err);
  });
}

function putRandoToUserAsync (chooser, rando, randos, callback) {
  logger.trace("[exchanger.putRandoToUserAsync]", "Trying put rando to user in db");
  async.waterfall([
    function saveExchangeLog (done) {
      global.exchangeLog.exchangedAt = Date.now();

      db.exchangeLog.add(global.exchangeLog, function (err) {
        if (err) {
          logger.trace("[exchanger.exchangeRandos]", "Cannot save following exchangeLog:", global.exchangeLog);
          logger.warn("[exchanger.exchangeRandos]", "Cannot save exchangeLog, because:", err);
        }

        global.exchangeLog = {
          metrics: []
        };
        done();
      });
    },
    function putRandoToUserIn (done) {
      var user = global.users[chooser.email];
      logger.trace("[exchanger.putRandoToUserAsync.putRandoToUserIn]", "Put rando to user.in");
      logger.data("Rando", rando.randoId, "by", rando.email, "----in--->", user.email);

      var chooserOnUser = randoService.findRandoByRandoId(chooser.randoId, user.out);
      if (chooserOnUser) {
        chooserOnUser.chosenRandoId = rando.randoId;
        user.in.push(rando);
        async.parallel([
          (updateDone) => {
            db.user.updateOutRandoProperties(user.email, chooser.randoId, {chosenRandoId: rando.randoId}, updateDone);
          },
          (updateDone) => {
            db.user.addRandoToUserInByEmail(user.email, rando, updateDone);
          }
        ], (err) => {
          if (err) {
            logger.err("[exchanger.putRandoToUserAsync.putRandoToUserIn]", "Cannot add rando to user in by email or update out rando properties because:", err);
            return done(err);
          }
          return done(null, user);
        });
      } else {
        var err = new Error("Incorrect state: chooserOnUser not found");
        logger.err("[exchanger.putRandoToUserAsync.putRandoToUserIn]", "Cannot putRandoToUserIn, because:", err);
        return done(err);
      }
    },
    function sendNotificationToUser (user, done) {
      logger.trace("[exchanger.sendNotificationToUser]", "Send message with ranodId: ", rando.randoId ," to user:", user.email);
      var message = {
        notificationType: "received",
        rando: randoService.buildRando(rando)
      };

      firebaseService.sendMessageToAllActiveUserDevices(message, user, done);
    },
    function updateRandoInStrangerOut (done) {
      var user = global.users[rando.email];
      logger.trace("[exchanger.putRandoToUserAsync.updateRandoInStrangerOut]", "Update rando in stranger out");
      var updatedRando = randoService.findRandoByRandoId(rando.randoId, user.out);
      if (updatedRando) {

        updatedRando.strangerRandoId = chooser.randoId;
        updatedRando.strangerMapURL = chooser.mapURL;
        updatedRando.strangerMapSizeURL = chooser.mapSizeURL;

        db.user.updateOutRandoProperties(user.email, rando.randoId, {
          strangerRandoId: chooser.randoId,
          strangerMapURL: chooser.mapURL,
          strangerMapSizeURL: chooser.mapSizeURL
        }, (err) => {
          if (err) {
            logger.err("[exchanger.putRandoToUserAsync.updateRandoInStrangerOut]", "Cannot updateRandoInStrangerOut because:", err);
            return done(err);
          }
          logger.data("Rando", rando.randoId, "by", user.email, " ---landed--to--user--->", chooser.email, "because his rando", chooser.randoId);
          return done(null, user, updatedRando);
        });

      } else {
        var err = new Error("Incorrect state: updatedRando not found");
        logger.err("[exchanger.putRandoToUserAsync.updateRandoInStrangerOut]", "Cannot putRandoToUserIn, because:", err);
        return done(err);
      }
    },
    function sendNotificationToStranger (user, updatedRando, done) {
      logger.trace("[exchanger.sendNotificationToStranger]", "Send message with ranodId: ", updatedRando.randoId ," to stranger:", user.email);
      var message = {
        notificationType: "landed",
        rando: randoService.buildLandedRando(updatedRando)
      };

      firebaseService.sendMessageToAllActiveUserDevices(message, user, done);
    },
    function updateRandoBucket (done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateRandoBucket]", "updateRandoBucket rando: ", rando.randoId, ", chooser: ", chooser.randoId, " in db.randos");

      chooser.chosenRandoId = rando.randoId;

      rando.strangerRandoId = chooser.randoId;
      rando.strangerMapURL = chooser.mapURL;
      rando.strangerMapSizeURL = chooser.mapSizeURL;

      async.parallel({
        updateRando (updateDone) {
          db.rando.updateRandoProperties(rando.randoId, {
            strangerRandoId: chooser.randoId,
            strangerMapURL: chooser.mapURL,
            strangerMapSizeURL: chooser.mapSizeURL
          }, updateDone);
        },
        updateChooser (updateDone) {
          db.rando.updateRandoProperties(chooser.randoId, {chosenRandoId: rando.randoId}, updateDone);
        }
      }, (err) => {
        logger.trace("[exchanger.putRandoToUserAsync.updateRandoBucket]", "rando: ", rando.randoId, " and chooser: ", chooser.randoId, " was updated in db.randos");
        done();
      });
    },
    function cleanup (done) {
      logger.trace("[exchanger.putRandoToUserAsync.cleanup]", "Cleanup start");

      var fullyExchangedRandos = randoService.findFullyExchangedRandos(randos);
      var randoIds = fullyExchangedRandos.map(r => r.randoId);

      randoService.removeByRandoIds(randoIds, global.randos);
      randoService.syncUsersWithRandos(global.users, global.randos);

      db.rando.removeByRandoIds(randoIds, done);
    }
  ], function (err) {
    if (err) {
      logger.warn("[exchanger.putRandoToUserAsync.waterfall]", "Done. But we have error:", err);
    } else {
      logger.warn("[exchanger.putRandoToUserAsync.waterfall]", "Done without errors");
    }
    callback(err);
  });
}

function initExchangerLog (choosers) {
  global.exchangeLog = {
    metrics: []
  };

  global.exchangeLog.choosers = choosers.map(rando => {
    return {
      email: rando.email,
      randoId: rando.randoId,
      creation: rando.creation
    };
  });

  global.exchangeLog.randos = global.randos.map(rando => {
    return {
      email: rando.email,
      randoId: rando.randoId,
      chosenRandoId: rando.chosenRandoId,
      creation: rando.creation
    };
  });
}

function main (callback) {
  var start = Date.now();
  logger.info("---> Exchanger start: " + new Date());
  async.waterfall([
    function init (done) {
      logger.info("Connecting to db: " + config.db.url);
      db.connect(config.db.url, done);
    },
    function loadRandos (done) {
      dbService.fetchRandos((err, randos) => {
        if (err && randos.length <= 1) {
          return done("Error when fetch ALL randos");
        }

        global.randos = randos;
        done();
      });
    },
    function checkConsistency (done) {
      consistencyService.checkRandos(global.randos, done);
    },
    function loadUsers (done) {
      dbService.fetchUsersForRandos(global.randos, (err, users) => {
        if (err) {
          return done("Error when fetch users");
        }

        global.users = users;
        done();
      });
    },
    function loadStrangerRandosIfNeeded (done) {
      let randosWithStrangerRandoId = global.randos.map(rando => rando.strangerRandoId).filter(strangerRandoId => strangerRandoId);
      async.eachLimit(randosWithStrangerRandoId, 1, (strangerRandoId, eachDone) => {
        let strangerRandos = global.randos.filter(globalRando => globalRando.randoId === strangerRandoId);
        if (strangerRandos.length > 0) {
          global.strangerEmailsAndRandoIds.push({randoId: strangerRandoId, email: strangerRandos[0].email});
          return eachDone();
        } else {
          dbService.getEmailByRandoId(strangerRandoId, (err, email) => {
            if (email) {
              global.strangerEmailsAndRandoIds.push({randoId: strangerRandoId, email});
            }
            return eachDone();
          });
        }
      }, done);
    },
    function exchange (done) {
      exchangeRandos(done);
    }
  ], function (err) {
    if (err) {
      logger.info("===> Exchanger finish with error:  ", err);
    }

    var end = Date.now();
    var timeSpent = (end-start) / 1000;
    logger.info("===> Exchanger finish at " + new Date(), " Time spent:", timeSpent, "sec");
    db.disconnect(callback);
  });
}

module.exports = main;
