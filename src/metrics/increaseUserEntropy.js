var logger = require("../log/logger");

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    var chooserUser = global.users[randoChooser.email];
    if (chooserUser) {
      return getMarkBasedOnLast10Randos(randoToMark.email, chooserUser.in);
    }
    return 0;
  }
};

function getMarkBasedOnLast10Randos (email, randos) {
  sortRandosByCreation(randos);

  for (var i = 0; i < randos.length ; i++) {
    if (i > 10) {
      break;
    }

    if (randos[i].email === email) {
      return i * 10 - 100;
    }
  }

  return 0;
}

function sortRandosByCreation(randos) {
  return randos.sort(function (rando1, rando2) {
    if (rando1.creation < rando2.creation) {
      return 1;
    } else if (rando1.creation > rando2.creation) {
      return -1;
    } else {
      return 0;
    }
  });
}
