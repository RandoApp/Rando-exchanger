var logger = require("../log/logger");
var randoService = require("./randoService");

var ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  check (randos, users) {
    var brokenRandos = this.checkThatStrangerRandoIdIsCorrectLink(randos);
    this.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos);

    brokenRandos = this.checkThatBucketDoNotHaveFullyExchangedRandos(randos);
    this.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos);

    brokenRandos = this.checkThatBucketDoesNotHaveVeryOldRandos(randos);
    this.moveBrokenRandosToTrashIfNeeded(brokenRandos, randos);
  },
  checkThatStrangerRandoIdIsCorrectLink (randos) {
    var brokenRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (randos[i].strangerRandoId) {
        var rando = randoService.findRandoByRandoId(randos[i].strangerRandoId, randos);
        if (!rando.randoId) {
          brokenRandos.push({rando: randos[i], discrepancy: "Rando has incorrect strangetRandoId", detectedAt: Date.now()});
        }
      }
    }

    return brokenRandos;
  },
  checkThatBucketDoNotHaveFullyExchangedRandos (randos) {
    return [];
  },
  checkThatBucketDoesNotHaveVeryOldRandos (randos) {
    var brokenRandos = [];

    for (var i = 0; i < randos.length; i++) {
      if (randos[i].creation <= Date.now() - ONE_WEEK) {
        brokenRandos.push({rando: randos[i], discrepancy: "Rando is too old", detectedAt: Date.now()});
      }
    }

    return brokenRandos;
  },
  moveBrokenRandosToTrashIfNeeded (brokenRandos, randos) {
    if (brokenRandos.length > 0) {
      //TODO: move rando to trash + clear global.randos
    }
  }
};
