var async = require("async");
var winston = require("winston");
var db = require("randoDB");
db.connect("mongodb://localhost/rando");

db.anomaly.getAll(function (err, anomalies) {
  var anomaliesAboutIncorrectStrangetRandoId = [];
  for (var i = 0; i < anomalies.length; i++) {
    if (anomalies[i].discrepancyReason === "Rando has incorrect strangetRandoId") {
      winston.info("Find anomaly with incorrect strangetRandoId: ", anomalies[i].rando.randoId);
      anomaliesAboutIncorrectStrangetRandoId.push(anomalies[i]);
    }
  }
  processAnomaliesWithIncorrectStrangetRandoId(anomaliesAboutIncorrectStrangetRandoId);

});

function processAnomaliesWithIncorrectStrangetRandoId (anomalies) {
  winston.info("Start processing", anomalies.length, "anomalies");

  async.forEachLimit(anomalies, 1, function (anomaly, done) {
    async.parallel({
      addToRandoBucket: function (callback) {
        winston.info("Add rando", anomaly.randoId, "to bucket");
        db.rando.add(anomaly.rando, callback);
      },
      removeFromAnomalies: function (callback) {
        winston.info("Remove anomaly by randoId:", anomaly.rando.randoId);
        db.anomaly.removeByRandoId(anomaly.rando.randoId, callback);
      }
    },
    done);
  }, function (err) {
    if (err) {
      winston.info("We have error when processing anomalies: ", err);
    } else {
      winston.info("We are done. Please Ctrl-C this scipt");
    }
  });
}
