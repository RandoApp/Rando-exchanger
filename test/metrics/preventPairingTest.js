var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var metric = require("../../src/metrics/preventPairing");

describe("PreventPairing.", function () {
  describe("Calculation.", function () {
    it("Should return -MIN_SAFE_INTEGER for randos that can be pair", function (done) {
      var randoChooser = {
        randoId: 1,
        email: "user@mail.com",
        strangerRandoId: 2
      };
      
      var randoToMark = {
        randoId: 2,
        email: "user2@mail.com",
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);
      
      mark.should.be.eql(Number.MIN_SAFE_INTEGER);
      done();
    });

    it("Should return 0 for randos that cannot be a pair", function (done) {
      var randoChooser = {
        randoId: 1,
        email: "user@mail.com",
        strangerRandoId: 2
      };
      
      var randoToMark = {
        randoId: 3,
        email: "user3@mail.com",
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);
      
      mark.should.be.eql(0);
      done();
    });
  });
});
