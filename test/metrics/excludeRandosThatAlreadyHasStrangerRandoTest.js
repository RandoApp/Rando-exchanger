var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var metric = require("../../src/metrics/excludeRandosThatAlreadyHasStrangerRando");

describe("excludeRandosThatAlreadyHasStrangerRando.", function () {
  describe("Calculation.", function () {
    it("Should return -MIN_SAFE_INTEGER when randoToMark and chooser from same user", function (done) {
      var mark = metric.calculate({}, { randoId: 2, strangerRandoId: 1 }, []);
      mark.should.be.eql(Number.MIN_SAFE_INTEGER);
      done();
    });

    it("Should return 0 for randos that doesn't have strangerRandoId", function (done) {
      var mark = metric.calculate({}, { randoId: 2 }, []);
      mark.should.be.eql(0);
      done();
    });
  });
});
