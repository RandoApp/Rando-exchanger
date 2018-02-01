var firebase = require("unirest");
var should = require("should");
var sinon = require("sinon");
var db = require("@rando4.me/db");
var mockUtil = require("../mockUtil");
var firebaseService = require("../../src/service/firebaseService");

describe("FirebaseService.", function () {
  describe("findActiveFirabseIds.", function () {
    it("Should find active ids when all is ok", function (done) {
      var user = {
        email: "user@email.com",
        firebaseInstanceIds: [
          { instanceId: 1, active: false },
          { instanceId: 2, active: true },
          { instanceId: 3, active: false },
          { instanceId: 4, active: true }
        ]
      };

      var expected = [ 2, 4];

      var ids = firebaseService.findActiveFirabseIds(user);

      expected.should.be.eql(ids);

      done();
    });

    it("Should find empty ids when user is null or has empty firebaseInstanceIds or doesn't have firebaseInstanceIds", function (done) {
      firebaseService.findActiveFirabseIds().should.be.empty();
      firebaseService.findActiveFirabseIds({email: "user@email.com"}).should.be.empty();
      firebaseService.findActiveFirabseIds({email: "user@email.com", firebaseInstanceIds: []}).should.be.empty();
      done();
    });

    it("Should find empty ids when all ids is not active", function (done) {
      var user = {
        email: "user@email.com",
        firebaseInstanceIds: [
          { instanceId: 1, active: false },
          { instanceId: 2, active: false },
          { instanceId: 3, active: false },
          { instanceId: 4, active: false }
        ]
      };


      firebaseService.findActiveFirabseIds(user).should.be.empty();

      done();
    });
  });

  describe("sendMessageToSingleDevice.", function () {
    afterEach(function() {
      mockUtil.clean(firebase);
    });

    it("Should send message when all is ok", function (done) {
      sinon.stub(firebase, "post", function () {
        return {
          headers () { return this; },
          send (msg) {
            msg.should.be.eql({ data: "Test message", to: "id1" });
            return this;
          },
          end (done) {
            done({body: "ok"});
          }
        };
      });

      firebaseService.sendMessageToSingleDevice("Test message", "id1", function (err, status) {
        should.not.exist(err);
        status.should.be.eql("ok");
        done();
      });
    });

    it("Should return error when message is undefined", function (done) {
      firebaseService.sendMessageToSingleDevice(null, "id1", function (err, status) {
        err.should.have.property("message", "Message or deviceFirebaseId is empty");
        done();
      });
    });

    it("Should return error when firebaseInstanceId is undefined", function (done) {
      firebaseService.sendMessageToSingleDevice("Test message", null, function (err, status) {
        err.should.have.property("message", "Message or deviceFirebaseId is empty");
        done();
      });
    });
  });


  describe("sendMessageToDevices.", function () {
    afterEach(function() {
      mockUtil.clean(firebase);
    });

    it("Should send messages when all is ok", function (done) {
      sinon.stub(firebase, "post", function () {
        return {
          headers () { return this; },
          send (msg) {
            msg.data.should.be.eql("Test message");
            msg.to.should.match(/id[1-3]/);
            return this;
          },
          end (done) {
            done({body: "ok"});
          }
        };
      });

      firebaseService.sendMessageToDevices("Test message", ["id1", "id2", "id3"], function (err) {
        should.not.exist(err);
        done();
      });
    });

    it("Should return error when message is undefined", function (done) {
      firebaseService.sendMessageToDevices(null, ["id1", "id2", "id3"], function (err) {
        err.should.have.property("message", "Message or deviceFirebaseId is empty");
        done();
      });
    });

    it("Should return error when firebaseInstanceId is undefined", function (done) {
      firebaseService.sendMessageToDevices("Test message", [], function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe("sendMessageToAllActiveUserDevices.", function () {
    afterEach(function() {
      mockUtil.clean(firebase);
    });

    it("Should send messages when all is ok", function (done) {
      var user = {
        email: "user@email.com",
        firebaseInstanceIds: [
          { instanceId: "id0", active: false },
          { instanceId: "id1", active: true },
          { instanceId: "id9", active: false },
          { instanceId: "id2", active: true }
        ]
      };

      sinon.stub(firebase, "post", function () {
        return {
          headers () { return this; },
          send (msg) {
            msg.data.should.be.eql("Test message");
            msg.to.should.match(/id[1-2]/);
            return this;
          },
          end (done) {
            done({body: "ok"});
          }
        };
      });

      firebaseService.sendMessageToAllActiveUserDevices("Test message", user, function (err) {
        should.not.exist(err);
        done();
      });
    });

    it("Should return error when message is undefined", function (done) {
      var user = {
        email: "user@email.com",
        firebaseInstanceIds: [
          { instanceId: "id0", active: false },
          { instanceId: "id1", active: true },
          { instanceId: "id9", active: false },
          { instanceId: "id2", active: true }
        ]
      };

      firebaseService.sendMessageToAllActiveUserDevices(null, user, function (err) {
        err.should.have.property("message", "Message or deviceFirebaseId is empty");
        done();
      });
    });

    it("Should return error when firebaseInstanceId is undefined", function (done) {
      var user = {
        email: "user@email.com",
        firebaseInstanceIds: []
      };

      firebaseService.sendMessageToAllActiveUserDevices("Test message", user, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

});
