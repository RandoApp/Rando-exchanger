module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    for (var i = 0; i < global.users.length; i++) {
      if (global.users[i].email === randoChooser.email) {
        for (var j = 0; j < global.users[i].in.length; j++) {
          if (global.users[i].in[j].email === randoToMark.email) {
            return -5;
          }
        }

      }
    }
    return 0;
  }
};
