var should = require("should");
var sinon = require("sinon");
var metrics = require("../../src/engine/metrics");

describe('Metrics.', function () {
    describe('Calculate.', function () {
        afterEach(function (done) { 
            metrics.reset();
            done();
        });

	it('Metrics functions should accamulate mark in rando', function (done) {
            metrics.use(function (chooser, randos) {
                randos.length.should.be.eql(2);
                return 5;
            });
            metrics.calculate(null, [{randoId: 1}, {randoId: 2}], function (err, chooser, randos) {
                for (var i = 0; i < randos.length; i++) {
                    randos[i].mark.should.be.eql(5);
                }
                done();
            });
        });
	it('No Metrics functions should set 0 as mark in rando', function (done) {
            metrics.calculate(null, [{randoId: 1}, {randoId: 2}], function (err, chooser, randos) {
                for (var i = 0; i < randos.length; i++) {
                    randos[i].mark.should.be.eql(0);
                }
                done();
            });
        });
	it('Empty randos should not call any metric function', function (done) {
            metrics.use(function (choose, randos) {
                should.fail("Metric function should not be called when randos is empty");
            });
            metrics.calculate(null, [], function (err, chooser, randos) {
                done();
            });
        });
    });
});
