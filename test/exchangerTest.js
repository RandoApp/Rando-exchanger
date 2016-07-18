var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
var exchanger = require("../src/exchanger");

describe('Exchanger.', function () {
  describe('Main.', function () {
   it('Should exchange', function (done) {
    sinon.stub(db.rando, "getFirstN", function (N, callback) {
      db.rando.getFirstN.restore();
      callback(null, [
        {email: "user1@mail.com", creation: Date.now(), randoId: 1},
        {email: "user2@mail.com", creation: Date.now(), randoId: 2},
        {email: "user3@mail.com", creation: Date.now(), randoId: 3}
        ]); 
    });

    sinon.stub(db.user, "getByEmail", function (email, callback) {
      callback(null, {
        email: email,
        in: [],
        out: []
      });
    });

    exchanger();
    done();
  });
 });
});
