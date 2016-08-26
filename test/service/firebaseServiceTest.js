var should = require("should");
var sinon = require("sinon");
var db = require("randoDB");
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


});
