var logger = require("../log/logger");

module.exports = {
  printChooser (choosers) {
    var printableChoosers = [];
    for (var i = 0; i < choosers.length; i++) {
      printableChoosers.push({
        chooserId: choosers[i].randoId,
        chooserEmail: choosers[i].email}
      );
    }
    logger.info("[printUtil.printChooser] Choosers:", printableChoosers);
  },
  printMetrics (randos, chooser) {
    var metrics = [];
    for (var i = 0; i < randos.length; i++) {
      metrics.push(JSON.stringify({
        randoId: randos[i].randoId,
        mark: randos[i].mark
      }));
    }
    logger.info("[printUtil.printMetrics]", "Metrics[chooser", chooser.randoId, "]:", metrics);
  }
};
