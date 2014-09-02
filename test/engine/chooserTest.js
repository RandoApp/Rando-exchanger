var should = require("should");
var sinon = require("sinon");
var chooser = require("../../src/engine/chooser");

describe('Chooser.', function () {
    describe('Find Chooser.', function () {
	it('Should return the oldest rando', function (done) {
            var inputRandos = [
                {randoId: 1, creation: 114},
                {randoId: 2, creation: 113},
                {randoId: 3, creation: 112},
                {randoId: 4, creation: 111},
            ];
            chooser.findChooser(inputRandos, function (err, chooser, randos) {
                chooser.should.be.eql({randoId: 4, creation: 111});
                inputRandos.should.be.eql(randos);
                done();
            });
        });
	it('Empty randos should return nullable choser', function (done) {
            chooser.findChooser([], function (err, chooser, randos) {
                should.not.exist(chooser);
                randos.should.be.empty;
                done();
            });
        });
    });
});
