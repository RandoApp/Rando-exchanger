var should = require("should");
var sinon = require("sinon");
var exchangeModel= require("../../src/model/exchangeModel");
var db = require("randoDB");

describe('Exchange Model.', function () {
    describe('Fetch Randos.', function () {
	it('Should return randos with users in success case', function (done) {
            sinon.stub(db.rando, "getFirstN", function (N, callback) {
                db.rando.getFirstN.restore();
                callback(null, [
                    {email: "user1@mail.com", randoId: 1},
                    {email: "user2@mail.com", randoId: 2},
                    {email: "user3@mail.com", randoId: 3}
                ]); 
            });
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                callback(null, {
                    email: email
                });
            });
            exchangeModel.fetchRandos(function (err, randos) {
                db.user.getByEmail.restore();

                randos.length.should.be.eql(3);
                randos[0].user.email.should.be.eql("user1@mail.com");
                randos[1].user.email.should.be.eql("user2@mail.com");
                randos[2].user.email.should.be.eql("user3@mail.com");
                randos[0].email.should.be.eql("user1@mail.com");
                randos[1].email.should.be.eql("user2@mail.com");
                randos[2].email.should.be.eql("user3@mail.com");
                done();
            });
        });
	it('Should return error when getFirstN return error', function (done) {
            sinon.stub(db.rando, "getFirstN", function (N, callback) {
                db.rando.getFirstN.restore();
                callback(new Error("DB error"));
            });
            exchangeModel.fetchRandos(function (err, randos) {
                err.should.have.property("message", "DB error");
                done();
            });
        });
	it('Randos should be empty when db is empty', function (done) {
            sinon.stub(db.rando, "getFirstN", function (N, callback) {
                db.rando.getFirstN.restore();
                callback(null, []);
            });
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                should.fail("db.user.getByEmail shoule not be called");
            });
            exchangeModel.fetchRandos(function (err, randos) {
                db.user.getByEmail.restore();

                randos.length.should.be.eql(0);
                done();
            });
        });
	it('User property in rando should be empty if user not found', function (done) {
            sinon.stub(db.rando, "getFirstN", function (N, callback) {
                db.rando.getFirstN.restore();
                callback(null, [{email: "user1@mail.com", randoId: 1},
                                {email: "user2@mail.com", randoId: 2}]);
            });
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                if (email == "user1@mail.com") {
                    callback();
                    return;
                }
                callback(null, {email: email});
            });
            exchangeModel.fetchRandos(function (err, randos) {
                db.user.getByEmail.restore();
                should.not.exist(randos[0].user);
                randos[1].user.email.should.be.eql("user2@mail.com");
                done();
            });
        });
	it('Should return error when one of getByEmail return error', function (done) {
            sinon.stub(db.rando, "getFirstN", function (N, callback) {
                db.rando.getFirstN.restore();
                callback(null, [{email: "user1@mail.com", randoId: 1},
                                {email: "user2@mail.com", randoId:2}]);
            });
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                callback(new Error("DB user"));
            });
            exchangeModel.fetchRandos(function (err, randos) {
                db.user.getByEmail.restore();
                err.should.have.property("message", "DB user");
                done();
            });
        });
    });
});
