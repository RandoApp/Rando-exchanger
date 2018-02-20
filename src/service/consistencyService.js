var config = require("config");
var logger = require("../log/logger");
var async = require("async");
var randoService = require("./randoService");
var db = require("@rando4.me/db");

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
        self.processRandosWithTags(badRandos, randos, done);
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
    var badRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (Array.isArray(randos[i].tags)) {
        logger.trace("[consistencyService.checkThatRandoDoesNotCotainBadTags]", "Check tags:", randos[i].tags);

        for (var tag in config.app.tags) {
          if (randos[i].tags.indexOf(tag) !== -1) {
            logger.debug("[consistencyService.checkThatRandoDoesNotCotainBadTags]", "Bad tag found: ", tag);
            badRandos.push({rando: randos[i], discrepancyReason: tag, detectedAt: Date.now()});
            break;
          }
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
  processRandosWithTags (brokenRandos, randos, callback) {
    logger.trace("[consistencyService.processRandosWithTags]", "BrokenRandos:", brokenRandos.length);
    var self = this;
    async.forEach(brokenRandos, function (brokenRando, eachDone) {
      var action = config.app.tags[brokenRando.discrepancyReason];
      logger.debug("[consistencyService.processRandosWithTags]", "Apply action:", action);
      if (typeof self[action] === "function" ) {
        self[action](brokenRando, randos, eachDone);
      }
    }, function (err) {
      callback(err);
    });
  },
  moveBrokenRandosToTrashIfNeeded (brokenRandos, randos, callback) {
    logger.trace("[consistencyService.moveBrokenRandosToTrashIfNeeded]", "BrokenRandos:", brokenRandos.length);
    var self = this;
    async.forEach(brokenRandos, function (brokenRando, eachDone) {
      self.moveToAnomaly(brokenRando, randos, eachDone);
    }, function (err) {
      callback(err);
    });
  },
  moveToAnomaly (brokenRando, randos, callback) {
    logger.debug("[consistencyService.moveToAnomaly]", "Move anomaly with randoId:", brokenRando.rando.randoId);
    async.waterfall([
      function removeRandoFromBucket (done) {
        logger.info("[consistencyService.moveToAnomaly]", "Delete broken rando from db bucket: ", brokenRando.rando.randoId);
        db.rando.removeById(brokenRando.rando.randoId, done);
      },
      function doesThisBadRandoAlreadyInAnomalies (done) {
        db.anomaly.getByRandoId(brokenRando.rando.randoId, done);
      },
      function saveAnomaly (anomaly, done) {
        if (anomaly) {
          logger.info("[consistencyService.moveToAnomaly]", "Anomaly with randoId:", brokenRando.rando.randoId, " already in anomalies. Skip saving to anomalies");
          //skip save to anomaly, beacause this bad rando is already in anomalies
          return done();
        }

        logger.info("[consistencyService.moveToAnomaly]", "Log anomaly in db: ", brokenRando.rando.randoId, "discrepancyReason:", brokenRando.discrepancyReason);
        db.anomaly.add(brokenRando, done);
      },
      function clearRandoInMemory (done) {
        randoService.removeByRandoId(brokenRando.rando.randoId, randos);
        done();
      }
    ], function (err) {
      logger.trace("[consistencyService.moveToAnomaly]", "Done");
      callback(err);
    });
  },
  copyToAnomaly (brokenRando, randos, callback) {
    logger.debug("[consistencyService.copyToAnomaly]", "Copy anomaly with randoId:", brokenRando.rando.randoId);
    async.waterfall([
      function doesThisBadRandoAlreadyInAnomalies (done) {
        db.anomaly.getByRandoId(brokenRando.rando.randoId, done);
      },
      function saveAnomaly (anomaly, done) {
        if (anomaly) {
          //skip save to anomaly, beacause this bad rando is already in anomalies
          return done();
        }

        logger.info("[consistencyService.copyToAnomaly]", "Log anomaly in db: ", brokenRando.rando.randoId, "discrepancyReason:", brokenRando.discrepancyReason);
        db.anomaly.add(brokenRando, done);
      }
    ], function (err) {
      logger.trace("[consistencyService.copyToAnomaly]", "Done");
      callback(err);
    });
  },
  copyBrokenRandosToTrashIfNeeded (brokenRandos, randos, callback) {
    logger.trace("[consistencyService.copyBrokenRandosToTrashIfNeeded]", "BrokenRandos:", brokenRandos.length);
    var self = this;

    async.forEach(brokenRandos, function (brokenRando, eachDone) {
      self.copyToAnomaly(brokenRando, randos, eachDone);
    }, function (err) {
      callback(err);
    });
  }
};
