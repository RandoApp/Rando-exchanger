var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var metric = require("../../src/metrics/excludeThemselves");

describe("excludeThemselvesTest.js.", function () {
  describe("Calculation.", function () {
    it("Should return -MIN_SAFE_INTEGER for randos that have strangerRandoId", function (done) {
      var mark = metric.calculate({randoId: 1, email: "user@gmail.com"}, {randoId: 2, email: "user@gmail.com"}, []);
      mark.should.be.eql(Number.MIN_SAFE_INTEGER);
      done();
    });

    it("Should return 0 for randos from differnet users", function (done) {
      var mark = metric.calculate({randoId: 1, email: "user@gmail.com"}, {randoId: 2, email: "stranger@gmail.com"}, []);
      mark.should.be.eql(0);
      done();
    });
  });
});
