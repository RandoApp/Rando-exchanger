var logger = require("../log/logger");
var config = require("config");
var dbService = require("../service/dbService")

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

function getStrangerEmailByStrangerRandoId(strangerRandoId, randos) {
  var strangerEmail = "";
  var strangerRandos = randos.filter(rando => {return rando.randoId === strangerRandoId});
  if (strangerRandos.length > 0) {
    strangerEmail = strangerRandos[0].email;
  } else {
    var strangerGlobalRandos = global.strangerEmailsAndRandoIds.filter(stranger => {return stranger.randoId === strangerRandoId});
    if (strangerGlobalRandos.length > 0) {
      strangerEmail = strangerGlobalRandos[0].email;
    }
  }
  return strangerEmail;
}
