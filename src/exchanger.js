var db = require("randoDB");
var config = require("config");
var logger = require("./log/logger");
var async = require("async");
var metrics = require("./metrics");
var printService = require("./service/printService");
var randoService = require("./service/randoService");
var dbService = require("./service/dbService");
var firebaseService = require("./service/firebaseService");

global.users = {};
global.randos = [];

function exchangeRandos (callback) {
  logger.info("[exchanger.exchangeRandos]", "Trying exchange randos");

  var choosers = randoService.findAllChoosers(global.randos);
  printService.printChooser(choosers);

  async.eachSeries(choosers, function (chooser, done) {
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
      done();
      return;
    }

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
    function fetchUser (done) {
      dbService.fetchUserByEmail(chooser.email, done);
    },
    function putRandoToUserIn (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.putRandoToUserIn]", "Put rando to user.in");
      logger.data("Rando", rando.randoId, "by", rando.email, "----in--->", user.email);
      user.in.push(rando);
      done(null, user);
    },
    function updateUser (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateUser]", "Updating user");
      db.user.update(user, function (err) {
        global.users[user.email] = user;
        done(err, user);
      });
    },
    function sendNotificationToUser (user, done) {
      logger.trace("[exchanger.sendNotificationToUser]", "Send message with ranodId: ", rando.randoId ," to user:", user.email);
      var message = {
        notificationType: "received",
        rando: randoService.buildRando(rando)
      };

      firebaseService.sendMessageToDevices(message, firebaseService.findActiveFirabseIds(user), done);
    },
    function fetchStranger (done) {
      logger.trace("[exchanger.putRandoToUserAsync.fetchStranger", "Fetching stranger user: ", rando.email);
      dbService.fetchUserByEmail(rando.email, done);
    },
    function putRandoToStrangerOut (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.putRandoToStrangerOut]", "Fetching stranger user");
      var updatedRando = randoService.findRandoByRandoId(rando.randoId, user.out);
      if (updatedRando) {
        updatedRando.strangerRandoId = chooser.randoId;
        updatedRando.strangerMapURL = chooser.mapURL;
        updatedRando.strangerMapSizeURL = chooser.mapSizeURL;

        logger.data("Rando", rando.randoId, "by", user.email, " ---landed--to--user--->", chooser.email, "because his rando", chooser.randoId); 
        done(null, user, updatedRando);
      } else {
        logger.err("INCORRECT STATE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        done("incorrect state");
      }
    },
    function updateStranger (user, updatedRando, done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateStranger]", "Updating stranger");
      db.user.update(user, function (err) {
        global.users[user.email] = user;
        done(err, user, updatedRando);
      });
    },
    function sendNotificationToStranger (user, updatedRando, done) {
      logger.trace("[exchanger.sendNotificationToStranger]", "Send message with ranodId: ", updatedRando.randoId ," to stranger:", user.email);
      var message = {
        notificationType: "landed",
        rando: randoService.buildRando(updatedRando)
      };

      firebaseService.sendMessageToDevices(message, firebaseService.findActiveFirabseIds(user), done);
    },
    function fetchRandoFromDBBucket (done) {
      logger.trace("[exchanger.putRandoToUserAsync.fetchRandoFromDBBucket]", "Fetching rando from db.randos");
      db.rando.getByRandoId(rando.randoId, done);
    },
    function updateRando (randoFromDBBucket, done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateRando]", "updateRando rando: ", randoFromDBBucket.randoId, " in db.randos");
      
      randoFromDBBucket.strangerRandoId = chooser.randoId;
      randoFromDBBucket.strangerMapURL = chooser.mapURL;
      randoFromDBBucket.strangerMapSizeURL = chooser.mapSizeURL;

      rando.strangerRandoId = chooser.randoId;
      rando.strangerMapURL = chooser.mapURL;
      rando.strangerMapSizeURL = chooser.mapSizeURL;
      
      db.rando.update(randoFromDBBucket, done);
    },
    function cleanup (done) {
      logger.trace("[exchanger.putRandoToUserAsync.cleanup]", "Cleanup start");

      var fullyExchangedRandos = randoService.findFullyExchangedRandos(randos);
      async.forEach(fullyExchangedRandos, function (rando, eachDone) {
        db.rando.removeById(rando.randoId, function () {
          randoService.removeByRandoId(rando.randoId, global.randos);
          eachDone();
        });
      }, done);
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

function main () {
  var start = Date.now();
  logger.info("---> Exchanger start: " + new Date());
  async.waterfall([
    function init (done) {
      db.connect(config.db.url);
      done();
    },
    function loadRandos (done) {
      dbService.fetchRandos(function (err, randos) {
        if (err && randos.length <= 1) {
          return done("Error when fetch ALL randos");
        }

        global.randos = randos;
        done(null, randos);
      });
    },
    function loadUsers (randos, done) {
      dbService.fetchUsers(randos, (err, users) => {
        if (err) {
          return done("Error when fetch users");
        }

        global.users = users;
        done(null);
      });
    },
    function exchange (randos, users, done) {
      exchangeRandos(randos, users, done);
    }
  ], function (err) {
    if (err) {
      logger.info("===> Exchanger finish with error:  ", err);
    }

    db.disconnect();
    var end = Date.now();
    var timeSpent = (end-start) / 1000;
    logger.info("===> Exchanger finish at " + new Date(), " Time spent:", timeSpent, "sec");
  });
}

module.exports = main;
