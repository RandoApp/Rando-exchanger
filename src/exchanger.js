var db = require("randoDB");
var config = require("config");
var logger = require("./log/logger");
var async = require("async");
var metrics = require("./metrics");

//lonelyBucket: Bucket with randos, that doesn't have any pair: not in stanger.in; not in user.out.
var lonelyBucket = [];

//halfPairBucket: Bucket with randos, that stranger is alreddy put to his 'in'
var halfPairBucket = [];

function fetchAllRandosAsync (callback) {
  db.rando.getFirstN(config.exch.fetchRandosNumber, function (err, randos) {
    if (err) {
      logger.warn("[exchanger.fetchAllRandosAsync] ", "Exchanger.pair: Can't get all randos: ", err);
      callback(err);
      return;
    }

    logger.trace("[exchanger.fetchAllRandosAsync] ", "Is randos null?");
    if (!randos) {
      logger.debug("[exchanger.fetchAllRandosAsync] ", "Randos are null. Throw Randos not found error");
      callback(new Error("Randos not found"));
      return;
    }

    logger.info("[exchanger.fetchAllRandosAsync] ", "Exchanger.pair: Get ", randos.length, " randos");

    async.eachLimit(randos, 30, function (rando, callback) {
      logger.trace("[exchanger.fetchAllRandosAsync]", " Process rando: ", rando.randoId);
      attachUserToRando(rando, function (err) {
        logger.trace("[exchanger.fetchAllRandosAsync.attachUserToRando callback] ", "Done");
        callback(err);
      });
    }, function (err) {
      logger.warn("[exchanger.fetchAllRandosAsync] ", "Each done with error: ", err);
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


function printRandos(randos) {
	for (var i = 0; i < randos.length; i++) {
		var userIn = [];
		for (var j = 0; j < randos[i].user.in.length; j++) {
			userIn.push(randos[i].user.in[j].randoId);
		}
		var userOut = [];
		for (var j = 0; j < randos[i].user.out.length; j++) {
			userOut.push(randos[i].user.out[j].randoId);
		}
		logger.debug("[exchanger.attachUserToRando]", "rando " + randos[i].randoId + ": " + randos[i].user.email + " in:[" + userIn + "], out:[" + userOut + "]");
	}
}

function exchangeRandos (randos) {
  logger.info("[exchanger.exchangeRandos]", "Trying exchange randos");
	printRandos(randos);
  fillBuckets(randos);
  
  async.doUntil(function (done) {
    //chooser is rando that will search other rando and put it to rando.user.in
    var chooser = selectChooser(lonelyBucket);
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
    putRandoToUserAsync(chooser, bestRando, done);

    logger.trace("[exchanger.exchangeRandos]", "Do body is done.", lonelyBucket.length);
  }, function () {
    return lonelyBucket.length >= 2;
  }, function (err) {
    logger.info("[exchanger.exchangeRandos]", "exchangeRandos Done. We done successfully without error. Right?", !err);
  });
}

function printMetrics (randos, chooser) {
  var metrics = [];
  for (var i = 0; i < randos.length; i++) {
    metrics.push(JSON.stringify({randoId: randos[i].randoId, mark: randos[i].mark}));
  }
  logger.debug("[exchanger.exchangeRandos]", "Metrics[chooser " + chooser.randoId + "]: " + metrics);
}

function fillBuckets (randos) {
  for (var i = 0; i < randos.length; i++) {
    if (randos[i].strangerRandoId) {
      logger.trace("[exchanger.fillBuckets]", "Put in halfPairBucket because randos with id:", randos[i].randoId, "has strangerRandoId: ", randos[i].strangerRandoId);
      halfPairBucket.push(randos[i]);
    } else {
      logger.trace("[exchanger.fillBuckets]", "Put in lonelyBucket because randos with id:", randos[i].randoId, "doesn't have strangerRandoId");
      lonelyBucket.push(randos[i]);
   }
  }


  logger.trace("[exchanger.fillBuckets]", "Fill lonelyBucketIds");
  var lonelyBucketIds = [];
  for (var i = 0; i < lonelyBucket.length; i++) {
    lonelyBucketIds.push(lonelyBucket[i].randoId);
  }

  logger.trace("[exchanger.fillBuckets]", "Fill halfPairBucketIds");
  var halfPairBucketIds = [];
  for (var i = 0; i < halfPairBucket.length; i++) {
    halfPairBucketIds.push(halfPairBucket[i].randoId);
  }

  logger.debug("lonelyBucket: [" + lonelyBucketIds + "]");
  logger.debug("halfPairBucket: [" + halfPairBucketIds + "]");
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
  for (var i = 1; i < randos.length; i++) {
    if (bestRando.mark < randos[i].mark) {
      bestRando = randos[i];
    }
  }
  return bestRando;
}

function putRandoToUserAsync (chooser, rando, callback) {
  cleanBuckets(chooser);

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
      db.user.update(user, done);
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

function cleanBuckets (chooser) {
  for (var i = 0; i < lonelyBucket.length; i++) {
    if (lonelyBucket[i].randoId == chooser.randoId) {
      logger.trace("[exchanger.putRandoToUserAsync]", "Remove chooser-rando from lonelyBucket");
      lonelyBucket.splice(i, 1);
      logger.trace("[exchanger.putRandoToUserAsync]", "Push chooser-rando to halfPairBucket");
      halfPairBucket.push(chooser);
    }
  }

  for (var i = 0; halfPairBucket.length; i++) {
    if (halfPairBucket[i].randoId == chooser.randoId) {
      logger.trace("[exchanger.putRandoToUserAsync]", "Remove rando that was exchanged from halfPairBucket");
      halfPairBucket.splice(i, 1);
    }
  }
}

function main () {
  var start = Date.now();
  logger.info("---> Exchanger start: " + new Date());
  db.connect(config.db.url);
  fetchAllRandosAsync(function (err, randos) {
    if (!err && randos && randos.length > 1) {
      exchangeRandos(randos, function () {

      });
      return;
    }

    db.disconnect();
    var end = Date.now();
    var timeSpent = (end-start) / 1000;
    logger.info("===> Exchanger finish at " + new Date(), " Time spent:", timeSpent, "sec");
  });
}

module.exports = main;
