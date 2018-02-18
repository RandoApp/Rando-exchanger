require('why-is-node-running')()
const should = require("should");
const sinon = require("sinon");
const db = require("@rando4.me/db");
const metric = require("../../src/metrics/increaseUserEntropy");
const config = require("config");

describe("IncreaseUserEntropy.", function () {
  before(() => {
    global.exchangeLog = {
      metrics: []
    };
  });

  describe("Calculation.", function () {
    it("Should return -5 for for users that already paired in the past", function (done) {
      var randoChooser = {
        randoId: 1,
        email: "user1@mail.com",
        strangerRandoId: 2
      };

      global.users = {
        "user1@mail.com": {
          email: "user1@mail.com",
          in: [{
            randoId: 876,
            creation: 2,
            email: "user876@mail.com",
          }, {
            randoId: 777,
            creation: 5,
            email: "user2@mail.com",
          }]
        }
      };

      var randoToMark = {
        randoId: 2,
        email: "user2@mail.com",
      };

      var randos = [];

      var mark = metric.calculate(randoChooser, randoToMark, randos);

      mark.should.be.eql(config.app.metrics.increaseUserEntropy);
      done();
    });

    it("Should return 0 for randos that can be a pair", function (done) {
      var randoChooser = {
        randoId: 1,
        email: "user@mail.com",
        strangerRandoId: 2
      };

      global.users = {
        "user1@mail.com": {
          email: "user1@mail.com",
          in: [{
            randoId: 876,
            email: "user876@mail.com",
          }, {
            randoId: 777,
            email: "user2@mail.com",
          }]
        }
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
