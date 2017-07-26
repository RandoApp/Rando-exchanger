const logger = require("../log/logger");
const config = require("config");
const dbService = require("../service/dbService");

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) {
    var strangerEmail = getStrangerEmailByStrangerRandoId(randoChooser.strangerRandoId, randos);
    if (strangerEmail === randoToMark.email) {
      return config.app.metrics.MIN_MARK;
    }
    return 0;
  }
};

function getStrangerEmailByStrangerRandoId (strangerRandoId, randos) {
  var strangerEmail = "";
  var strangers = global.strangerEmailsAndRandoIds.filter(stranger => stranger.randoId === strangerRandoId);
  if (strangers.length > 0) {
    strangerEmail = strangers[0].email;
  }
  return strangerEmail;
}
