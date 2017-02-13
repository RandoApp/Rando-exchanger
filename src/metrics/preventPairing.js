var logger = require("../log/logger");
var config = require("config");
var dbService = require("../service/dbService")

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    var strangerEmail = getStrangerEmailByStrangerRandoId(randoChooser.strangerRandoId, randos);
    if (strangerEmail === randoToMark.email) {
      return -60;
    }
    return 0;
  }
};

function getStrangerEmailByStrangerRandoId(strangerRandoId, randos) {
  var strangerEmail = "";
  if (Array.isArray(randos)) {
    var strangers = randos.filter(rando => {return rando.randoId === strangerRandoId});
    if (strangers.length > 0) {
      strangerEmail = strangers[0].email;
    }
  }
  return strangerEmail;
}
