var logger = require("../log/logger");
var config = require("config");

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    var chooserUser = global.users[randoChooser.email];
    if (chooserUser && Array.isArray(chooserUser.in)) {
      var alreadyExchangedWithThisUser = chooserUser.in.filter(rando => {return rando.email === randoToMark.email}).length > 0;
      if (alreadyExchangedWithThisUser) {
        return config.app.metrics.increaseUserEntropy;
      }
    }
    return 0;
  }
};
