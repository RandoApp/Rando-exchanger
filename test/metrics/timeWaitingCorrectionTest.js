var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var metric = require("../../src/metrics/timeWaitingCorrection");

describe('TimeWaitingCorrectionTest.', function () {
  describe('Calculation.', function () {
    it('Should add 10 for every hour of wating', function (done) {
      var randoChooser = {};
      
      var randoToMark = {
        randoId: 2,
        creation: Date.now() - 4 * 60  * 60 * 1000
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);
      
      mark.should.be.eql(40);
      done();
    });
  });
});
