var config = require("config");

module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    if (randoToMark.strangerRandoId) {
      return config.app.metrics.MIN_MARK;
    }
    return 0;
  }
};

