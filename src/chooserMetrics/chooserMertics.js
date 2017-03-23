var logger = require("../log/logger");

module.exports = {
  metrics: [
    require("./metrics/newUser"),
  ],
  calculate (choosers) {
    logger.trace("[chooserMetrics.calculate]", "Start");
    for (var i = 0; i < choosers.length; i++) {
      choosers[i].mark = 0;
    }

    for (var i = 0; i < choosers.length; i++) {
      for (var j = 0; j < this.metrics.length; j++) {
        choosers[i].mark += this.metrics[j].calculate(choosers[i]);
      }
    }
    return choosers;
  }
};
