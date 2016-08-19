var logger = require("./log/logger");

module.exports = {
  metrics: [
    require("./metrics/excludeRandosThatAlreadyHasStrangerRando"),
    require("./metrics/excludeThemselves"),
    require("./metrics/timeWaitingCorrection")
  ],
  add: function (metric) {
    this.metrics.push(metric);
  },
  reset: function () {
    this.metrics = [];
  },
  calculate: function (randoChooser, randos) {
    logger.trace("[metrics.calculate]", "Start");
    var allMarks = [];
    for (var i = 0; i < this.metrics.length; i++) {
      var marks = this.calculateForMetric(this.metrics[i], randoChooser, randos);
      logger.debug("Metric ", this.metrics[i].name, " result: ", marks);
      allMarks.push(marks);
    }
    var marks = this.reduceMarks(allMarks, randoChooser);
    logger.debug("All metric final result: ", marks);
    this.applyMarks(marks, randos);
  },
  calculateForMetric: function (metric, randoChooser, randos) {
    var marks = {};
    for (var i = 0; i < randos.length; i++) {
      marks[randos[i].randoId] = metric.calculate(randoChooser, randos[i], randos);
    }
    return marks;
  },
  reduceMarks: function (marks, chooser) {
    logger.trace("[metrics.reduceMarks]", marks);
    var finalMarks = {};
    for (var id in marks[0]) {
      finalMarks[id] = 0;
    }

    logger.trace("[metrics.reduceMarks]", "Empty finalMarks: ", finalMarks);

    for (var i = 0; i < marks.length; i++) {
      for (var id in marks[0]) {
        logger.trace("[metrics.reduceMarks]", id, ":", finalMarks[id], "+=", marks[i][id]);
        finalMarks[id] += marks[i][id];
      }
    }
    logger.info("[metrics.reduceMarks]", "Final marks for chooser", chooser.randoId, " ===>", finalMarks);
    return finalMarks;
  },
  applyMarks: function (marks, randos) {
    logger.trace("[metrics.applyMarks]");
    this.resetMarksForRandos(randos);

    for (var i = 0; i < randos.length; i++) {
      if (marks[randos[i].randoId]) {
        randos[i].mark += marks[randos[i].randoId];
        logger.trace("[metrics.applyMarks]", randos[i].randoId, "[", randos[i].mark, "]", "+=", marks[randos[i].randoId]);
      }
    }
  },
  resetMarksForRandos: function (randos) {
    for (var i = 0; i < randos.length; i++) {
      randos[i].mark = 0;
    }
  }
};
