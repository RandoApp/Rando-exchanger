var logger = require("../log/logger");

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
  //PRIVATE?
  isRandoWasChooser (rando, randos) {
    logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Process rando ", rando.randoId, " for ", randos.length, " randos");
    for (var i = 0; i < randos.length; i++) {
      if (rando.randoId === randos[i].strangerRandoId) {
        logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can NOT be chooser");
        return true;
      }
    }
    logger.trace("[randoService.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can be chooser");
    return false;
  },
  isRandoFullyExchanged (rando, randos) {
    if (!rando || !randos) {
      return false;
    }

    return this.isRandoWasChooser (rando, randos) 
      && rando.strangerRandoId 
      && this.isRandoWasChooser(this.findRandoByRandoId(rando.strangerRandoId, randos), randos);
  },
  //PRIVATE?
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
      mapSizeURL: rando.mapSizeURL
    };
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
