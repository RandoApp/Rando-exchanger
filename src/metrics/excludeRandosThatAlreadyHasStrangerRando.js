module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (randoChooser, randoToMark, randos) { 
    if (randoToMark.strangerRandoId) {
      return Number.MIN_SAFE_INTEGER;
    }
    return 0;
  }
};

