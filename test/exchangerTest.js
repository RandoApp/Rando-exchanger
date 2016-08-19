var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var exchanger = require("../src/exchanger");

describe("Exchanger.", function () {
  describe("Main.", function () {
   it("Should exchange", function (done) {
    sinon.stub(db.rando, "getFirstN", function (N, callback) {
      db.rando.getFirstN.restore();
      callback(null, [
        {email: "user1@mail.com", creation: Date.now(), randoId: 1},
        {email: "user2@mail.com", creation: Date.now(), randoId: 2},
        {email: "user3@mail.com", creation: Date.now() - 4 * 60 * 60 * 1000, randoId: 3}
        ]); 
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
      } else if (email === "user3@mail.com") {
        callback(null, {
          email,
          in: [],
          out: [{email: "user3@mail.com", creation: Date.now(), randoId: 3}],
          save (callback) {
            callback(null);
          }
        });
      }
      });

    exchanger();
    done();
  });
 });
});
