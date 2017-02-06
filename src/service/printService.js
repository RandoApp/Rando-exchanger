var logger = require("../log/logger");

module.exports = {
  printChooser (choosers) {
    var printableChoosers = [];
    if (choosers) {
      for (var i = 0; i < choosers.length; i++) {
        printableChoosers.push({
          chooserId: choosers[i].randoId,
          chooserEmail: choosers[i].email}
        );
      }
    }
    logger.debug("[printUtil.printChooser] Choosers:", printableChoosers);
  },
  printMetrics (randos, chooser) {
    if (!chooser) {
      return logger.debug("[printUtil.printMetrics] Metrics[chooser EMPTY]!!!");
    }

    var metrics = [];
    if (randos) {
      for (var i = 0; i < randos.length; i++) {
        metrics.push({
          randoId: randos[i].randoId,
          mark: randos[i].mark
        });
      }
    }
    logger.debug("[printUtil.printMetrics]", "Metrics[chooser", chooser.randoId, "]:", metrics);
  }
};
