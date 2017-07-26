const should = require("should");
const sinon = require("sinon");
const db = require("randoDB");
const metric = require("../../src/metrics/excludeRandosThatAlreadyHasStrangerRando");
const config = require("config");

describe("excludeRandosThatAlreadyHasStrangerRando.", function () {
  describe("Calculation.", function () {
    it("Should return -MIN_SAFE_INTEGER when randoToMark and chooser from same user", function (done) {
      var mark = metric.calculate({}, { randoId: 2, strangerRandoId: 1 }, []);
      mark.should.be.eql(config.app.metrics.MIN_MARK);
      done();
    });

    it("Should return 0 for randos that doesn't have strangerRandoId", function (done) {
      var mark = metric.calculate({}, { randoId: 2 }, []);
      mark.should.be.eql(0);
      done();
    });
  });
});
