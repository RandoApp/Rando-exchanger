var firebase = require("unirest");
var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var mockUtil = require("../mockUtil");
var printService = require("../../src/service/printService");
var logger = require("../../src/log/logger");

describe("PrintService.", function () {
  describe("printChooser.", function () {
    afterEach(function() {
      mockUtil.clean(logger);
    });

    it("Should pritty print choosers when all is ok", function (done) {
      var choosers = [
        { chooserId: 999, randoId: 1, email: "user1@mail.com" },
        { chooserId: 999, randoId: 2, email: "user2@mail.com" },
        { chooserId: 999, randoId: 3, email: "user3@mail.com" },
        { chooserId: 999, randoId: 4, email: "user4@mail.com" }
      ];

      sinon.stub(logger, "info", function (msg, printableChoosers) {
        printableChoosers.should.be.eql([
          { chooserId: 1, chooserEmail: "user1@mail.com" },
          { chooserId: 2, chooserEmail: "user2@mail.com" },
          { chooserId: 3, chooserEmail: "user3@mail.com" },
          { chooserId: 4, chooserEmail: "user4@mail.com" }
        ]);
      });
      
      printService.printChooser(choosers);

      done();
    });

    it("Should print empty array when choosers arg is undefined", function (done) {

      sinon.stub(logger, "info", function (msg, printableChoosers) {
        printableChoosers.should.be.empty();
      });
      
      printService.printChooser(null);

      done();
    });

    it("Should print empty array when choosers are empty array", function (done) {

      sinon.stub(logger, "info", function (msg, printableChoosers) {
        printableChoosers.should.be.empty();
      });
      
      printService.printChooser([]);

      done();
    });

  });

  describe("printMetrics.", function () {
    afterEach(function() {
      mockUtil.clean(logger);
    });

    it("Should pritty print metrics when all is ok", function (done) {
      var randos  = [
        { mark: 199, randoId: 1, email: "user1@mail.com" },
        { mark: 299, randoId: 2, email: "user2@mail.com" },
        { mark: 399, randoId: 3, email: "user3@mail.com" },
        { mark: 499, randoId: 4, email: "user4@mail.com" }
      ];

      sinon.stub(logger, "info", function (method, msg, choserRandoId, comma, metrics) {
        choserRandoId.should.be.eql(777);
        metrics.should.be.eql([
          { mark: 199, randoId: 1 },
          { mark: 299, randoId: 2 },
          { mark: 399, randoId: 3 },
          { mark: 499, randoId: 4 }
        ]);
      });

      printService.printMetrics(randos, {randoId: 777});

      done();
    });

    it("Should print empty array when randos arg is undefined", function (done) {
      sinon.stub(logger, "info", function (method, msg, choserRandoId, comma, metrics) {
        choserRandoId.should.be.eql(777);
        metrics.should.be.empty();
      });
      
      printService.printMetrics(null, {randoId: 777});

      done();
    });

    it("Should print chooser empty message when chooser arg is undefined", function (done) {
      var randos  = [
        { mark: 199, randoId: 1, email: "user1@mail.com" },
        { mark: 299, randoId: 2, email: "user2@mail.com" },
        { mark: 399, randoId: 3, email: "user3@mail.com" },
        { mark: 499, randoId: 4, email: "user4@mail.com" }
      ];

      sinon.stub(logger, "info", function (msg) {
        msg.should.be.eql("[printUtil.printMetrics] Metrics[chooser EMPTY]!!!");
      });
      
      printService.printMetrics(randos);

      done();
    });
  });
});
