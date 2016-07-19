module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate: function (randoChooser, randoToMark, randos) { 
    if (randoToMark.strangerRandoId > 0) {
      return -Number.MIN_VALUE;
    }
    return 0;
  }
};
