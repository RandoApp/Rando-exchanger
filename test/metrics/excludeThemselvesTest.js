const should = require("should");
const sinon = require("sinon");
const db = require("randoDB");
const metric = require("../../src/metrics/excludeThemselves");
const config = require("config");

describe("excludeThemselvesTest.js.", function () {
  describe("Calculation.", function () {
    it("Should return -MIN_SAFE_INTEGER for randos that have strangerRandoId", function (done) {
      var mark = metric.calculate({randoId: 1, email: "user@gmail.com"}, {randoId: 2, email: "user@gmail.com"}, []);
      mark.should.be.eql(config.app.metrics.MIN_MARK);
      done();
    });

    it("Should return 0 for randos from differnet users", function (done) {
      var mark = metric.calculate({randoId: 1, email: "user@gmail.com"}, {randoId: 2, email: "stranger@gmail.com"}, []);
      mark.should.be.eql(0);
      done();
    });
  });
});
