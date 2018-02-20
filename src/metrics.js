var logger = require("./log/logger");

module.exports = {
  metrics: [
    require("./metrics/excludeRandosThatAlreadyHasStrangerRando"),
    require("./metrics/excludeThemselves"),
    require("./metrics/timeWaitingCorrection"),
    require("./metrics/increaseUserEntropy"),
    require("./metrics/preventPairing")
  ],
  add (metric) {
    this.metrics.push(metric);
  },
  reset () {
    this.metrics = [];
  },
  calculate (randoChooser, randos) {
    logger.trace("[metrics.calculate]", "Start");
    var allMarks = [];
    var marks = {};
    for (var i = 0; i < this.metrics.length; i++) {
      marks = this.calculateForMetric(this.metrics[i], randoChooser, randos);

      logger.debug("Metric ", this.metrics[i].name, " result: ", marks);
      allMarks.push(marks);
    }
    marks = this.reduceMarks(allMarks, randoChooser);
    logger.debug("All metric final result: ", marks);
    this.applyMarks(marks, randos);
  },
  calculateForMetric (metric, randoChooser, randos) {
    var marks = {};
    for (var i = 0; i < randos.length; i++) {
      marks[randos[i].randoId] = metric.calculate(randoChooser, randos[i], randos);

      global.exchangeLog.metrics.push({
        metrica: metric.name,
        randoId: randos[i].randoId,
        mark: marks[randos[i].randoId]
      });
    }

    return marks;
  },
  reduceMarks (marks, chooser) {
    logger.trace("[metrics.reduceMarks]", marks);
    var id;
    var finalMarks = {};
    for (id in marks[0]) {
      finalMarks[id] = 0;
    }

    logger.trace("[metrics.reduceMarks]", "Empty finalMarks: ", finalMarks);

    for (var i = 0; i < marks.length; i++) {
      for (id in marks[0]) {
        logger.trace("[metrics.reduceMarks]", id, ":", finalMarks[id], "+=", marks[i][id]);
        finalMarks[id] += marks[i][id];
      }
    }
    logger.debug("[metrics.reduceMarks]", "Final marks for chooser", chooser.randoId, " ===>", finalMarks);
    return finalMarks;
  },
  applyMarks (marks, randos) {
    logger.trace("[metrics.applyMarks]");
    this.resetMarksForRandos(randos);

    for (var i = 0; i < randos.length; i++) {
      if (marks[randos[i].randoId]) {
        randos[i].mark += marks[randos[i].randoId];
        logger.trace("[metrics.applyMarks]", randos[i].randoId, "[", randos[i].mark, "]", "+=", marks[randos[i].randoId]);
      }
    }
  },
  resetMarksForRandos (randos) {
    for (var i = 0; i < randos.length; i++) {
      randos[i].mark = 0;
    }
  }
};
