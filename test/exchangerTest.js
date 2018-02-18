var should = require("should");
var sinon = require("sinon");
var db = require("@rando4.me/db");
var mockUtil = require("./mockUtil");
var exchanger = require("../exchanger");

describe("Exchanger.", function () {
  describe("Main.", function () {
    afterEach(function() {
      mockUtil.clean(db);
    });

   it("Should exchange", function (done) {
    sinon.stub(db.rando, "getFirstN", function (N, callback) {
      callback(null, [
        {email: "user1@mail.com", creation: 2014, randoId: 1},
        {email: "user2@mail.com", creation: 2016, randoId: 2},
      ]);
    });

    sinon.stub(db.rando, "getByRandoId", function (randoId, callback) {
      callback(null, {
          email: "user" + randoId + "@mail.com",
          creation: 2015,
          randoId
        });
    });

    sinon.stub(db.user, "getByEmail", function (email, callback) {
      if (email === "user1@mail.com") {
        callback(null, {
          email,
          in: [],
          out: [{email: "user1@mail.com", creation: Date.now(), randoId: 1}],
          save (callback) {
            callback(null);
          }
        });
      } else if (email === "user2@mail.com") {
        callback(null, {
          email,
          in: [],
          out: [{email: "user2@mail.com", creation: Date.now(), randoId: 2}],
          save (callback) {
            callback(null);
          }
        });
      }
    });

    sinon.stub(db.rando, "update", function (rando, callback) {
      if (rando.randoId === 1) {
        rando.should.have.property("strangerRandoId", 2);
      } else {
        rando.should.have.property("strangerRandoId", 1);
      }
      callback();
    });

    exchanger();

    done();
  });
 });
});
