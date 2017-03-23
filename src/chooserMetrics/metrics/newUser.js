module.exports = {
  name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
  calculate (chooser) { 
    if (chooser.out && chooser.out.length === 0) {
      return 300;
    }
    return 0;
  }
};
