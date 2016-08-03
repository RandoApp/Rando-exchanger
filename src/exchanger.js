var db = require("randoDB");
var config = require("config");
var logger = require("./log/logger");
var async = require("async");
var metrics = require("./metrics");

function fetchAllRandosAsync (callback) {
  db.rando.getFirstN(config.exch.fetchRandosNumber, function (err, randos) {
    if (err) {
      logger.warn("[exchanger.fetchAllRandosAsync]", "Exchanger.pair: Can't get all randos: ", err);
      callback(err);
      return;
    }

    logger.trace("[exchanger.fetchAllRandosAsync]", "Is randos null?");
    if (!randos) {
      logger.debug("[exchanger.fetchAllRandosAsync]", "Randos are null. Throw Randos not found error");
      callback(new Error("Randos not found"));
      return;
    }

    logger.info("[exchanger.fetchAllRandosAsync]", "Exchanger.pair: Get ", randos.length, " randos");

    async.eachLimit(randos, 30, function (rando, callback) {
      logger.trace("[exchanger.fetchAllRandosAsync]", " Process rando: ", rando.randoId);
      attachUserToRando(rando, function (err) {
        logger.trace("[exchanger.fetchAllRandosAsync.attachUserToRando callback] ", "Done");
        callback(err);
      });
    }, function (err) {
      if (err) {
        logger.warn("[exchanger.fetchAllRandosAsync]", "Each done with error: ", err);
      } else {
        logger.warn("[exchanger.fetchAllRandosAsync]", "Each done successfully");
      }
      callback(err, randos);
    });
  });
}

function attachUserToRando (rando, callback) {
  db.user.getByEmail(rando.email, function (err, user) {
    if (err) {
      logger.debug("[exchanger.attachUserToRando] ", "Error on attachUserToRando: " + err);
      callback(err);
      return;
    }

    if (user) {
      logger.trace("[exchanger.attachUserToRando] ", "Fetched user with email: ", user.email);
      rando.user = user;
      callback(err);
    } else {
      logger.debug("[exchanger.attachUserToRando] ", "User with email: " + rando.email + " not found");
      callback(new Error("not found"));
    }
  });
}

function exchangeRandos (randos, callback) {
  logger.info("[exchanger.exchangeRandos]", "Trying exchange randos");

  async.doUntil(function (done) {
    //chooser is rando that will search other rando and put it to rando.user.in
    var chooser = selectChooser(randos);
    logger.debug("[exchanger.exchangeRandos]", "Chooser is:", chooser.randoId, "of [", chooser.email, "]");

    logger.trace("[exchanger.exchangeRandos]", "Start calculating by metrics");
    metrics.calculate(chooser, randos);

    logger.trace("[exchanger.exchangeRandos]", "Calculation is done. Print metrics");
    printMetrics(randos, chooser);

    logger.trace("[exchanger.exchangeRandos]", "Trying to select best rando");
    var bestRando = selectBestRando(randos);

    logger.debug("[exchanger.exchangeRandos]", "Best rando:", bestRando.randoId, "of", bestRando.user.email);

    if (bestRando.mark < 0) {
      logger.trace("[exchanger.exchangeRandos]", "Continue, because bestRando.mark < 0");
      done(null);
    }

    logger.trace("[exchanger.exchangeRandos]", "Trying put bestRando", bestRando.randoId ,"to user", chooser.user.email);
    putRandoToUserAsync(chooser, bestRando, randos, done);

    logger.trace("[exchanger.exchangeRandos]", "Do body is done.");
  }, function () {
    return true;
    // return selectChooser(randos) !== null;
  }, function (err) {
    logger.info("[exchanger.exchangeRandos]", "exchangeRandos Done. We done successfully without error. Right?", !err);
    callback(err);
  });
}

function printMetrics (randos, chooser) {
  var metrics = [];
  for (var i = 0; i < randos.length; i++) {
    metrics.push(JSON.stringify({randoId: randos[i].randoId, mark: randos[i].mark}));
  }
  logger.debug("[exchanger.exchangeRandos]", "Metrics[chooser " + chooser.randoId + "]: " + metrics);
}

function hasUserRando (rando, user) {
  for (var i = 0; i < user.in.length; i++) {
    if (user.in[i].randoId == rando.randoId) {
      return true;
    }
  }
  return false;
}

function selectChooser (randos) {
  var potentialChoosers = [];

  for (var i = 0; i < randos.length; i++) {
    if (!isRandoWasChooser(randos[i], randos)) {
      potentialChoosers.push(randos[i]);
    }
  }

  //chooserIds needs just for logging:
  var chooserIds = [];
  for (var i = 0; i < potentialChoosers.length; i++) {
    chooserIds.push(potentialChoosers[i].randoId);
  }
  logger.info("[exchanger.selectChooser] can be chooser: ", chooserIds);  

  if (potentialChoosers.length <= 0) {
    return null;
  }
  
  var chooser = findOldestRando(potentialChoosers);
  logger.info("[exchanger.selectChooser] Chooser is", chooser.randoId, "-", chooser.user.email);
  return chooser;
}

function findOldestRando (randos) {
  var oldRando = randos[0];
  for (var i = 1; i < randos.length; i++) {
    if (oldRando.creation > randos[i]) {
      oldRando = randos[i];
    }
  }
  return oldRando;
}

function selectBestRando(randos) {
  var bestRando = randos[0];
  logger.trace("[exchanger.selectBestRando]", "Starting with best rando:", bestRando.randoId, "[", bestRando.mark, "]");
  for (var i = 1; i < randos.length; i++) {
    logger.trace("[exchanger.selectBestRando]", bestRando.randoId, "[", bestRando.mark,"] < ", randos[i].randoId, "[", randos[i].mark ,"]");
    if (bestRando.mark < randos[i].mark) {
      bestRando = randos[i];
      logger.trace("[exchanger.selectBestRando]", "Update bestRando to ", randos[i].randoId);
    }
  }
  return bestRando;
}

function putRandoToUserAsync (chooser, rando, randos, callback) {
  logger.trace("[exchanger.putRandoToUserAsync]", "Trying put rando to user in db");
  async.waterfall([
    function fetchUser (done) {
      fetchUserByEmail(chooser.email, done);
    },
    function putRandoToUserIn (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.putRandoToUserIn]", "Put rando to user.in");
      logger.data("Rando", rando.randoId, "by", rando.user.email, "----in--->", user.email);
      user.in.push(rando);
      done(null, user);
    },
    function updateUser (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateUser]", "Updating user");
      updateUserOnRandos(user, randos);
      db.user.update(user, done);
    },
    function fetchStranger (done) {
      logger.trace("[exchanger.putRandoToUserAsync.fetchStranger", "Fetching stranger user: ", rando.email);
      fetchUserByEmail(rando.email, done);
    },
    function putRandoToStrangerOut (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.putRandoToStrangerOut]", "Fetching stranger user");
      for (var i = 0; i < user.out.length; i++) {
        if (user.out[i].randoId == rando.randoId) {
          logger.trace("[exchanger.putRandoToUserAsync.putRandoToStrangerOut]", "Updating strangerRandoId on stranger");
          user.out[i].strangerRandoId = chooser.randoId;
          logger.data("Rando", rando.randoId, "by", user.email, " ---landed--to--user--->", chooser.email, "because his rando", chooser.randoId);
          break;
        }
      }
      done(null, user);
    },
    function updateStranger (user, done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateStranger]", "Updating stranger");
      updateUserOnRandos(user, randos);
      db.user.update(user, done);
    },
    function fetchRandoFromDBBucket (done) {
      logger.trace("[exchanger.putRandoToUserAsync.fetchRandoFromDBBucket]", "Fetching rando from db.randos");
      db.rando.getByRandoId(rando.randoId, done);
    },
    function updateRando (randoFromDBBucket, done) {
      logger.trace("[exchanger.putRandoToUserAsync.updateRando]", "updateRando rando: ", randoFromDBBucket.randoId, " in db.randos");
      randoFromDBBucket.strangerRandoId = chooser.randoId;
      rando.strangerRandoId = chooser.randoId;
      db.rando.update(randoFromDBBucket, done);
    },
    function cleanup (done) {
      logger.trace("[exchanger.putRandoToUserAsync.cleanup]", "Cleanup start");
      cleanBucket(randos, done);
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

function updateUserOnRandos (user, randos) {
  for (var i = 0; i < randos.length; i++) {
    if (randos[i].user.email == user.email) {
      randos[i].user = user;
    }
  }
}

function fetchUserByEmail (email, done) {
  db.user.getByEmail(email, function (err, user) {
    if (err) {
      logger.warn("[exchanger.putRandoToUserAsync.fetchUserByEmail]", "Data base error when getByEmail:", email);
      done(err);
      return;
    }

    if (!user) {
      logger.warn("[exchanger.putRandoToUserAsync.fetchUserByEmail]", "User not found:", email);
      done(new Error("User not found"));
      return;
    }

    done(null, user);
  });
}

function cleanBucket (randos, done) {
  var removedRandos = [];
  async.forEachOf(randos, function (rando, index, eachDone) {
    logger.trace("[exchanger.putRandoToUserAsync.cleanBucket]", "Process rando ", rando.randoId, "[", index, "/", randos.length, "]");
    if (isRandoFullyExchanged(rando, randos)) {
      logger.trace("[exchanger.putRandoToUserAsync.cleanBucket]", "Remove rando from db.randos", rando.randoId);
      removedRandos.push(rando);
      db.rando.removeById(rando.randoId, eachDone);
    } else {
      logger.trace("[exchanger.putRandoToUserAsync.cleanBucket]", "Continue");
      eachDone();
    }
  }, function (err) {
    if (err) {
      logger.warn("[exchanger.putRandoToUserAsync.cleanBucket]", "Clean buckets done with error: ", err);  
    } else {
      logger.trace("[exchanger.putRandoToUserAsync.cleanBucket]", "Clean buckets done. ");
    }

    for (var i = 0; i < removedRandos.length; i++) {
      for (var j = 0; j < randos.length; j++) {
        if (removedRandos[i].randoId == randos[j].randoId) {
          logger.trace("[exchanger.putRandoToUserAsync.cleanBucket]", "Clean rando from randos array in memory. ");
          randos.splice(j, 1);
        }
      }
    }

    done(err);
  });
}

function isRandoWasChooser (rando, randos) {
  logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Process rando ", rando.randoId, " for ", randos.length, " randos");
  for (var i = 0; i < randos.length; i++) {
    if (rando.randoId == randos[i].strangerRandoId) {
      logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can be choolser");
      return true;
    }
  }
  logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can not be choolser");
  return false;
}

function isRandoFullyExchanged (rando, randos) {
  return isRandoWasChooser (rando, randos) 
    && rando.strangerRandoId 
    && isRandoWasChooser(findRandoByRandoId(rando.strangerRandoId, randos), randos);
}

function findRandoByRandoId(randoId, randos) {
  logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.findRandoByRandoId]", "Process rando ", randoId, " for ", randos.length, " randos");
  for (var i = 0; i < randos.length; i++) {
    if (randos[i].randoId == randoId) {
      logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.findRandoByRandoId]", "Ranod with id ", randoId, " found in randos");
      return randos[i];
    }
  }
  logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.findRandoByRandoId]", "Ranod with id ", randoId, " not found in randos");
  return null;
}

function main () {
  var start = Date.now();
  logger.info("---> Exchanger start: " + new Date());
  async.waterfall([
    function init (done) {
      db.connect(config.db.url);
      done();
    },
    function loadData (done) {
      fetchAllRandosAsync(function (err, randos) {
        if (!err && randos && randos.length > 1) {
          done(null, randos);
        } else {
          done("Error when fetch ALL randos");
        }
      });
    },
    function exchange (randos, done) {
      exchangeRandos(randos, done);
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
