var should = require("should");
var sinon = require("sinon");
var chooser = require("../../src/engine/chooser");

describe('Chooser.', function () {
    describe('Find Chooser.', function () {
	it('Should return the oldest rando', function (done) {
            chooser.findChooser([
                {randoId: 1, creation: 114},
                {randoId: 2, creation: 113},
                {randoId: 3, creation: 112},
                {randoId: 4, creation: 111},
            ], function (err, chooser) {
                chooser.should.be.eql({randoId: 4, creation: 111});
                done();
            });
        });
	it('Empty randos should return nullable choser', function (done) {
            chooser.findChooser([], function (err, chooser) {
                should.not.exist(chooser);
                done();
            });
        });
    });
});
