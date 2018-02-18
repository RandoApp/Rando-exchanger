require('why-is-node-running')()
var should = require("should");
var sinon = require("sinon");
var db = require("@rando4.me/db");
var mockUtil = require("../mockUtil");
var dbService = require("../../src/service/dbService");

describe("dbService.", function () {

  describe("fetchRandos.", function () {
    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Should fetch randos when all is ok", function (done) {
      sinon.stub(db.rando, "getFirstLightN", function (email, callback) {
        callback(null, [{randoId: 1}, {randoId: 2}]);
      });

      dbService.fetchRandos(function (err, randos) {
        should.not.exist(err);
        [{randoId: 1}, {randoId: 2}].should.be.eql(randos);
        done();
      });
    });

    it("Should return error when db return error", function (done) {
      sinon.stub(db.rando, "getFirstLightN", function (email, callback) {
        callback("DB error");
      });

      dbService.fetchRandos(function (err, user) {
        err.should.be.eql("DB error");
        done();
      });
    });

    it("Should return Randos not found when db return empty randos", function (done) {
      sinon.stub(db.rando, "getFirstLightN", function (email, callback) {
        callback();
      });

      dbService.fetchRandos(function (err, randos) {
        err.should.have.property("message", "Randos not found");
        done();
      });
    });
  });

  describe("fetchUsersForRandos.", function () {
    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Should find user by email when all is ok", (done) => {
      sinon.stub(db.user, "getLightUserWithInAndOutByEmail", (email, callback) => {
        if (email === "user1@mail.com") {
          return callback(null, {email: "user1@mail.com", password: "123"});
        } else if (email === "user2@mail.com") {
          return callback(null, {email: "user2@mail.com", password: "456"});
        } else {
          return callback("!!!");
        }
      });

      var randos = [
        {randoId: 1, email: "user1@mail.com"},
        {randoId: 2, email: "user2@mail.com"},
        {randoId: 3, email: "user1@mail.com"}
      ];

      dbService.fetchUsersForRandos(randos, (err, users) => {
        users.should.be.eql({
          "user1@mail.com": {
            email: "user1@mail.com",
            password: "123"
          },
          "user2@mail.com": {
            email: "user2@mail.com",
            password: "456"
          }
        });
        done();
      });
    });

    it("Should return db error when db return error", function (done) {
      sinon.stub(db.user, "getLightUserWithInAndOutByEmail", function (email, callback) {
        callback("DB error");
      });

      var randos = [
        {randoId: 1, email: "user1@mail.com"},
        {randoId: 2, email: "user2@mail.com"},
        {randoId: 3, email: "user1@mail.com"}
      ];

      dbService.fetchUsersForRandos(randos, function (err, users) {
        err.should.be.eql("DB error");
        done();
      });
    });

    it("Should return db error when db return error", function (done) {
      sinon.stub(db.user, "getLightUserWithInAndOutByEmail", function (email, callback) {
        callback();
      });

      var randos = [
        {randoId: 1, email: "user1@mail.com"},
        {randoId: 2, email: "user2@mail.com"},
        {randoId: 3, email: "user1@mail.com"}
      ];

      dbService.fetchUsersForRandos(randos, function (err, users) {
        err.should.have.property("message", "User not found");
        done();
      });
    });

  });


});
