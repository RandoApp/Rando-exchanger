var config = require("config");
var logger = require("../log/logger");
var async = require("async");
var randoService = require("./randoService");
var db = require("randoDB");

var ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  checkRandos (randos, callback) {
    logger.debug("[consistencyService.check]", "Start check");
    var self = this;
    async.waterfall([
      (done) => {
        var brokenRandos = self.checkThatBucketDoNotHaveFullyExchangedRandos(randos);
        self.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos, done);
      },
      (done) => {
        var brokenRandos = self.checkThatBucketDoesNotHaveVeryOldRandos(randos);
        self.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos, done);
      },
      (done) => {
        var googleTestDevices = self.checkGoogleTestDevicesIps(randos);
        self.moveBrokenRandosToTrashIfNeeded(googleTestDevices, randos, done);
      },
      (done) => {
        var badRandos = self.checkThatRandoDoesNotCotainBadTags(randos);
        self.copyBrokenRandosToTrashIfNeeded(badRandos, randos, done);
      },
    ], function (err) {
      logger.debug("[consistencyService.check]", "Finish check");
      callback(err);
    });
  },
  checkThatBucketDoNotHaveFullyExchangedRandos (randos) {
    logger.trace("[consistencyService.checkThatBucketDoNotHaveFullyExchangedRandos]", "Start check");
    var brokenRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (randoService.isRandoFullyExchanged(randos[i], randos)) {
        logger.debug("[consistencyService.checkThatBucketDoNotHaveFullyExchangedRandos]", "Fully exchanged rando detected:", randos[i].randoId);
        brokenRandos.push({rando: randos[i], discrepancyReason: "Rando is fully exchanged but exists in db bucket", detectedAt: Date.now()});
      }
    }

    return brokenRandos;
  },
  checkThatBucketDoesNotHaveVeryOldRandos (randos) {
    logger.trace("[consistencyService.checkThatBucketDoesNotHaveVeryOldRandos]", "Start check");
    var brokenRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (randos[i].creation <= Date.now() - ONE_WEEK) {
        brokenRandos.push({rando: randos[i], discrepancyReason: "Rando is too old", detectedAt: Date.now()});
      }
    }

    return brokenRandos;
  },
  checkThatRandoDoesNotCotainBadTags (randos) {
    logger.trace("[consistencyService.checkThatRandoDoesNotCotainBadTags]", "Start check");
    logger.trace("[consistencyService.checkThatRandoDoesNotCotainBadTags]", "Following bad tags will be used:", config.app.badTags);
    var badRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (Array.isArray(randos[i].tags)) {
        logger.trace("[consistencyService.checkThatRandoDoesNotCotainBadTags]", "Check tags:", randos[i].tags);
        var badTag = randos[i].tags.filter( (tag) => { return config.app.badTags.indexOf(tag) != -1 })[0];
        if (badTag) {
          logger.debug("[consistencyService.checkThatRandoDoesNotCotainBadTags]", "Bad tag fount: ", badTag);
          badRandos.push({rando: randos[i], discrepancyReason: badTag, detectedAt: Date.now()});
        }
      }
    }

    return badRandos;
  },
  checkGoogleTestDevicesIps (randos) {
    logger.trace("[consistencyService.checkGoogleTestDevicesIps]", "Start check");
    var googleTestDevicesRandos = [];
    var googleIpsRegex = new RegExp(config.app.googleTestDevicesIpRegex);

    for (var i = 0; i < randos.length; i++) {
      logger.trace("[consistencyService.checkGoogleTestDevicesIps]", "Check ip: ", randos[i].ip);
      if (googleIpsRegex.test(randos[i].ip)) {
        googleTestDevicesRandos.push({rando: randos[i], discrepancyReason: "Google test device", detectedAt: Date.now()});
      }
    }

    logger.trace("[consistencyService.checkGoogleTestDevicesIps]", "Return badRandos: ", googleTestDevicesRandos);
    return googleTestDevicesRandos;
  },
  moveBrokenRandosToTrashIfNeeded (brokenRandos, randos, callback) {
    logger.trace("[consistencyService.moveBrokenRandosToTrashIfNeeded]", "BrokenRandos:", brokenRandos.length);
    async.forEach(brokenRandos, function (brokenRando, eachDone) {
      async.waterfall([
        function removeRandoFromBucket (done) {
          logger.info("[consistencyService.moveBrokenRandosToTrashIfNeeded]", "Delete broken rando from db bucket: ", brokenRando.rando.randoId);
          db.rando.removeById(brokenRando.rando.randoId, done);
        },
        function saveAnomaly (done) {
          logger.info("[consistencyService.moveBrokenRandosToTrashIfNeeded]", "Log anomaly in db: ", brokenRando.rando.randoId, "discrepancyReason:", brokenRando.discrepancyReason);
          db.anomaly.add(brokenRando, done);
        },
        function clearRandosInMemory (done) {
          randoService.removeByRandoId(brokenRando.rando.randoId, randos);
          done();
        }
      ], function (err) {
        logger.trace("[consistencyService.moveBrokenRandosToTrashIfNeeded]", "Done");
        eachDone(err);
      });
    }, function (err) {
      callback(err);
    });
  },
  copyBrokenRandosToTrashIfNeeded (brokenRandos, randos, callback) {
    logger.trace("[consistencyService.copyBrokenRandosToTrashIfNeeded]", "BrokenRandos:", brokenRandos.length);
    async.forEach(brokenRandos, function (brokenRando, eachDone) {
      async.waterfall([
        function saveAnomaly (done) {
          logger.info("[consistencyService.copyBrokenRandosToTrashIfNeeded]", "Log anomaly in db: ", brokenRando.rando.randoId, "discrepancyReason:", brokenRando.discrepancyReason);
          db.anomaly.add(brokenRando, done);
        },
        function clearRandosInMemory (done) {
          randoService.removeByRandoId(brokenRando.rando.randoId, randos);
          done();
        }
      ], function (err) {
        logger.trace("[consistencyService.copyBrokenRandosToTrashIfNeeded]", "Done");
        eachDone(err);
      });
    }, function (err) {
      callback(err);
    });
  }
};
