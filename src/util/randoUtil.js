var logger = require("../log/logger");

module.exports = {
  //NOT USED?
  hasUserRando (rando, user) {
    for (var i = 0; i < user.in.length; i++) {
      if (user.in[i].randoId === rando.randoId) {
        return true;
      }
    }
    return false;
  },
  findAllChoosers (randos) {
    var choosers = [];
    for (var i = 0; i < randos.length; i++) {
      if (!isRandoWasChooser(randos[i], randos)) {
        choosers.push(randos[i]);
      }
    }
    return choosers;
  },
  //PRIVATE?
  isRandoWasChooser (rando, randos) {
    logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Process rando ", rando.randoId, " for ", randos.length, " randos");
    for (var i = 0; i < randos.length; i++) {
      if (rando.randoId === randos[i].strangerRandoId) {
        logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can NOT be chooser");
        return true;
      }
    }
    logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.isRandoWasChooser]", "Rando ", rando.randoId, " can be chooser");
    return false;
  },
  isRandoFullyExchanged (rando, randos) {
    return isRandoWasChooser (rando, randos) 
      && rando.strangerRandoId 
      && isRandoWasChooser(findRandoByRandoId(rando.strangerRandoId, randos), randos);
  },
  //NOT USED?
  findRandoByRandoId(randoId, randos) {
    logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.findRandoByRandoId]", "Process rando ", randoId, " for ", randos.length, " randos");
    for (var i = 0; i < randos.length; i++) {
      if (randos[i].randoId === randoId) {
        logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.findRandoByRandoId]", "Ranod with id ", randoId, " found in randos");
        return randos[i];
      }
    }
    logger.trace("[exchanger.putRandoToUserAsync.cleanBucket.findRandoByRandoId]", "Ranod with id ", randoId, " not found in randos");
    return null;
  },
  findActiveFirabseIds (user) {
    logger.trace("[findActiveFirabseIds] Find firebase ids for user: ", user.email);
    var firebaseIds = [];
    if (user.firebaseInstanceIds) {
      for (var i = 0; i < user.firebaseInstanceIds.length; i++) {
        if (user.firebaseInstanceIds[i].active) {
          firebaseIds.push(user.firebaseInstanceIds[i].instanceId);
        }
      }
    }
    logger.trace("[findActiveFirabseIds] Found firebase ids: ", firebaseIds, " for user: ", user.email);
    return firebaseIds;
  }
};
