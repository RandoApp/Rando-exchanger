const logger = require("../log/logger");
const config = require("config");
const dbService = require("../service/dbService");

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) {
    var strangerEmail = getStrangerEmailByStrangerRandoId(randoChooser.strangerRandoId);
    if (strangerEmail === randoToMark.email) {
      return config.app.metrics.MIN_MARK;
    }
    return 0;
  }
};

function getStrangerEmailByStrangerRandoId (strangerRandoId) {
  logger.trace("[preventPairing.getStrangerEmailByStrangerRandoId] Try find by strangerRandoId:", strangerRandoId);
  var strangerEmail = "";
  var strangers = global.strangerEmailsAndRandoIds.filter(stranger => stranger.randoId === strangerRandoId);
  logger.trace("[preventPairing.getStrangerEmailByStrangerRandoId] Find following strangers:",  strangers);
  if (strangers.length > 0) {
    strangerEmail = strangers[0].email;
  }
  logger.trace("[preventPairing.getStrangerEmailByStrangerRandoId] Return strangerEmail:", strangerEmail);
  return strangerEmail;
}
