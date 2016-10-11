var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var mockUtil = require("../mockUtil");
var consistencyService = require("../../src/service/consistencyService");

describe("ConsistencyService.", function () {
  describe("checkThatBucketDoNotHaveFullyExchangedRandos.", function () {
    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Should return broken randos when randos has fully exchanged rando", function (done) {
      var randos = [
        {randoId: 1, strangerRandoId: 2},
        {randoId: 2, choosenRandoId: 1, strangerRandoId: 5},
        {randoId: 3, strangerRandoId: 4},
        {randoId: 4},
        {randoId: 5},
      ];

      var brokenRandos = consistencyService.checkThatBucketDoNotHaveFullyExchangedRandos(randos);

      brokenRandos.should.have.length(1);
      brokenRandos[0].rando.should.have.property("randoId", 2);
      brokenRandos[0].rando.should.have.property("choosenRandoId", 1);
      brokenRandos[0].rando.should.have.property("strangerRandoId", 5);
      brokenRandos[0].should.have.property("discrepancyReason", "Rando is fully exchanged but exists in db bucket");
      brokenRandos[0].should.have.property("detectedAt");

      done();
    });

    it("Should return empty array when randos is empty", function (done) {
      var brokenRandos = consistencyService.checkThatBucketDoNotHaveFullyExchangedRandos([]);
      brokenRandos.should.be.empty();

      done();
    });
  });

  describe("checkThatBucketDoesNotHaveVeryOldRandos.", function () {
    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Should return broken randos when randos is too old", function (done) {
      var randos = [
        {randoId: 1, creation: 10},
        {randoId: 2, creation: Date.now()}
      ];

      var brokenRandos = consistencyService.checkThatBucketDoesNotHaveVeryOldRandos(randos);

      brokenRandos.should.have.length(1);
      brokenRandos[0].rando.should.have.property("randoId", 1);
      brokenRandos[0].rando.should.have.property("creation", 10);
      brokenRandos[0].should.have.property("discrepancyReason", "Rando is too old");
      brokenRandos[0].should.have.property("detectedAt");

      done();
    });

    it("Should return empty array when randos is empty", function (done) {
      var brokenRandos = consistencyService.checkThatBucketDoesNotHaveVeryOldRandos([]);
      brokenRandos.should.be.empty();

      done();
    });
  });

});
