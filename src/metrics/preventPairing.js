module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    if (randoChooser.strangerRandoId  === randoToMark.randoId) {
      return Number.MIN_SAFE_INTEGER;
    }
    return 0;
  }
};

