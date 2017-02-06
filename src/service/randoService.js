var logger = require("../log/logger");
var config = require("config");

module.exports = {
  findAllChoosers (randos) {
    var choosers = [];

    if (randos) {
      for (var i = 0; i < randos.length; i++) {
        if (!this.isRandoWasChooser(randos[i], randos)) {
          choosers.push(randos[i]);
        }
      }
    }

    return choosers;
  },
  isRandoWasChooser (rando) {
    logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Process rando ", rando.randoId, " for ", randos.length, " randos");
    if (rando.chosenRandoId) {
      logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can NOT be chooser");
      return true;
    } else {
      logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can be chooser");
      return false;
    }
  },
  isRandoFullyExchanged (rando, randos) {
    if (!rando || !randos) {
      return false;
    }

    logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoFullyExchanged]", "Process rando ", rando.randoId, " for ", randos.length, " randos");

    return this.isRandoWasChooser (rando) && rando.strangerRandoId;
  },
  findRandoByRandoId(randoId, randos) {
    if (randoId && randos) {
      for (var i = 0; i < randos.length; i++) {
        if (randos[i].randoId === randoId) {
          return randos[i];
        }
      }
    }
    return {};
  },
  buildRando (rando) {
    if (!rando) {
      logger.trace("[randoService.buildRando]", "rando is empty => return empty object");
      return {};
    }

    logger.trace("[randoService.buildRando] build rando with id: ", rando.randoId);
    
    return {
      creation: rando.creation,
      randoId: rando.randoId,
      imageURL: rando.imageURL,
      imageSizeURL: rando.imageSizeURL,
      mapURL: rando.mapURL,
      mapSizeURL: rando.mapSizeURL,
      //1.0.19+
      detected: Array.isArray(rando.tags) ? rando.tags.map(tag => {
        for (var detectedTag in config.app.detectedTagMap) {
          if (config.app.detectedTagMap[detectedTag].indexOf(tag) !== -1) {
            return detectedTag;
          }
        }
      }).filter(tag => tag) : []
    };
  },
  buildLandedRando (rando) {
    if (!rando) {
      logger.trace("[randoService.buildLandedRando]", "rando is empty => return empty object");
      return {};
    }

    logger.trace("[randoService.buildLandedRando] build rando with id: ", rando.randoId);
    var landedRando = this.buildRando(rando);
    landedRando.mapURL = rando.strangerMapURL;
    landedRando.mapSizeURL = rando.strangerMapSizeURL;
    delete landedRando.detected;

    return landedRando;
  },
  findFullyExchangedRandos (randos) {
    var fullyExchangedRandos = [];
    if (randos) {
      for (var i = 0; i < randos.length; i++) {
        if (this.isRandoFullyExchanged(randos[i], randos)) {
          logger.trace("[randoService.putRandoToUserAsync.cleanBucket]", "Remove rando from db.randos", randos[i].randoId);
          fullyExchangedRandos.push(randos[i]);
        }
      }
    }
    return fullyExchangedRandos;
  },
  removeByRandoId (randoId, randos) {
    if (!randoId || !randos) {
      return {};
    }

    for (var i = 0; i < randos.length; i++) {
      if (randoId === randos[i].randoId) {
        return randos.splice(i, 1)[0];
      }
    }
    return {};
  },
  removeByRandoIds (randoIds, randos) {
    var self = this;
    randoIds.forEach(rando => {
      self.removeByRandoId(rando, randos);
    });
  },
  syncUsersWithRandos (users, randos) {
    var survivedUsers = randos.map(rando => rando.email);
    for (var user in users) {
      if (survivedUsers.indexOf(user) === -1) {
        delete users[user];
      }
    }
  },
  selectBestRando (randos) {
    if (!randos) {
      return {};
    }

    var bestRando = randos[0];
    logger.trace("[randoService.selectBestRando]", "Starting with best rando:", bestRando.randoId, "[", bestRando.mark, "]");
    for (var i = 1; i < randos.length; i++) {
      logger.trace("[randoService.selectBestRando]", bestRando.randoId, "[", bestRando.mark,"] < ", randos[i].randoId, "[", randos[i].mark ,"]");
      if (bestRando.mark < randos[i].mark) {
        bestRando = randos[i];
        logger.trace("[randoService.selectBestRando]", "Update bestRando to ", randos[i].randoId);
      }
    }
    return bestRando;
  }
};
