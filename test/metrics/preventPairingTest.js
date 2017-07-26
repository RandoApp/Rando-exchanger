const should = require("should");
const sinon = require("sinon");
const db = require("randoDB");
const metric = require("../../src/metrics/preventPairing");
const config = require("config");

describe("PreventPairing.", function () {
  before(() => {
    global.exchangeLog = {
      metrics: []
    };
  });

  describe("Calculation.", function () {
    it("Should return MIN_MARK for paired users", (done) => {
      var randoChooser = {
        randoId: 1,
        email: "user1@rando4.me",
        strangerRandoId: 2
      };

      global.strangerEmailsAndRandoIds = [{
          randoId: 1,
          email: "stranger1@rando4.me"
        }, {
          randoId: 2,
          email: "stranger2@rando4.me"
      }];

      global.users = {}

      var randoToMark = {
        randoId: 2,
        email: "stranger2@rando4.me",
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);

      mark.should.be.eql(config.app.metrics.MIN_MARK);
      done();
    });

    it("Should return 0 for NON paired users", (done) => {
      var randoChooser = {
        randoId: 1,
        email: "user1@rando4.me",
        strangerRandoId: 2
      };

      global.strangerEmailsAndRandoIds = [{
          randoId: 1,
          email: "stranger1@rando4.me"
        }, {
          randoId: 2,
          email: "stranger2@rando4.me"
      }];

      global.users = {}

      var randoToMark = {
        randoId: 2,
        email: "strangerNOT_A_PAIR@rando4.me",
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);

      mark.should.be.eql(0);
      done();
    });

    it("Should return 0 when global strangerEmailsAndRandoIds is empty", (done) => {
      var randoChooser = {
        randoId: 1,
        email: "user1@rando4.me",
        strangerRandoId: 2
      };

      global.strangerEmailsAndRandoIds = [];

      global.users = {}

      var randoToMark = {
        randoId: 2,
        email: "stranger2@rando4.me",
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);

      mark.should.be.eql(0);
      done();
    });
  });
});
