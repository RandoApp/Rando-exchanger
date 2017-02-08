module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    if (randoChooser.email === randoToMark.email) {
      return config.app.metrics.MIN_MARK;
    }
    return 0;
  }
};
