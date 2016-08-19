module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    if (randoChooser.email === randoToMark.email) {
      return Number.MIN_SAFE_INTEGER;
    }
    return 0;
  }
};

