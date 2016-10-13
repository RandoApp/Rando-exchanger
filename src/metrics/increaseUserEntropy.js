var logger = require("../log/logger");

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    var chooserUser = getUserByEmail(randoChooser.email);
    if (chooserUser && userToMark) {
      if (containsEmail(randoToMark.email, chooserUser.in)) {
        logger.trace("[increaseUserEntropy] -5 for rando chooser:", randoChooser.randoId, "and randoToMark:", randoToMark.randoId);
        return -5;
      }
    }
    logger.trace("[increaseUserEntropy] 0 for rando chooser:", randoChooser.randoId, "and randoToMark:", randoToMark.randoId);
    return 0;
  }
};

function getUserByEmail (email) {
  for (var i = 0; i < global.users.length; i++) {
    if (global.users[i].email === email) {
      logger.trace("[increaseUserEntropy] user found:", global.users[i].email);
      return global.users[i];
    }
  }
  logger.trace("[increaseUserEntropy] user NOT found", email);
  return null;
}

function containsEmail (email, randos) {
  for (var i = 0; i < randos.length; i++) {
    if (randos[i].email === email) {
      logger.trace("[increaseUserEntropy] Email:", email, "in", randos.length, "randos");
      return true
    }
  }
  logger.trace("[increaseUserEntropy] Email:", email, "NOT in", randos.length, "randos");
  return false;
}
