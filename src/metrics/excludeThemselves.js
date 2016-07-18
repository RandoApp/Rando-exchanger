module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate: function (randoChooser, randoToMark, randos) { 
    if (randoChooser.email == randoToMark.email) {
      return -Number.MIN_VALUE;
    }
    return 0;
  }
};

