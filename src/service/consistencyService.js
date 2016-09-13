var logger = require("../log/logger");
var async = require("async");
var randoService = require("./randoService");
var db = require("randoDB");

var ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  check (randos, users, callback) {
    logger.debug("[consistencyService.check]", "Start check");
    var self = this;
    async.waterfall([
      function check1 (done) {
        var brokenRandos = self.checkThatStrangerRandoIdIsCorrectLink(randos);
        self.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos, done);
      },
      function check2 (done) {
        var brokenRandos = self.checkThatBucketDoNotHaveFullyExchangedRandos(randos);
        self.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos, done);
      },
      function check3 (done) {
        var brokenRandos = self.checkThatBucketDoesNotHaveVeryOldRandos(randos);
        self.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos, done);
      }
    ], function (err) {
      logger.debug("[consistencyService.check]", "Finish check");
      callback(err);
    });
  },
  checkThatStrangerRandoIdIsCorrectLink (randos) {
    logger.trace("[consistencyService.checkThatStrangerRandoIdIsCorrectLink]", "Start check");
    var brokenRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (randos[i].strangerRandoId) {
        var rando = randoService.findRandoByRandoId(randos[i].strangerRandoId, randos);
        if (!rando.randoId) {
          brokenRandos.push({rando: randos[i], discrepancyReason: "Rando has incorrect strangetRandoId", detectedAt: Date.now()});
        }
      }
    }

    return brokenRandos;
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

    return brokenRandos
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
  }
};
