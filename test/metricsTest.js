var should = require("should");
var sinon = require("sinon");
var metrics = require("../src/metrics");

describe('Metrics.', function () {
    it('Should contains metric modules in metrics array', function (done) {
        metrics.metrics.length.should.be.above(0);
        done();
    });

    it('Should reset metrics array to empty array', function (done) {
        var metricsMaster = metrics.metrics.slice(0);
        metrics.metrics.should.not.have.length(0);
        metrics.reset();
        metrics.metrics.should.have.length(0);
        metrics.metrics = metricsMaster;
        done();
    });

    it('Should add metric func to metrics array', function (done) {
        var metricsMaster = metrics.metrics.slice(0);
        metrics.add(function someMetric () {});
        metrics.metrics.should.have.length(metricsMaster.length + 1);
        metrics.metrics = metricsMaster;
        done();
    });

     it('Should set mark property for all randos', function (done) {
        var metricsMaster = metrics.metrics.slice(0);
        metrics.metrics = [
            function someMetric () {
                return 10;
            },
            function someMetric () {
                return 4;
            },
            function someMetric () {
                return -1;
            }
        ];
        
        var randos = [{}, {}];
        var randoChooser = {};
        metrics.calculate(randoChooser, randos);

        randos[0].should.have.property("mark", 13);
        randos[1].should.have.property("mark", 13);
        randoChooser.should.not.have.property("mark");

        done();
    });

    it('Should set 0 mark property for all randos when metrics array are empty', function (done) {
        var metricsMaster = metrics.metrics.slice(0);
        metrics.metrics = [];
        
        var randos = [{}, {}];
        var randoChooser = {};
        metrics.calculate(randoChooser, randos);

        randos[0].should.have.property("mark", 0);
        randos[1].should.have.property("mark", 0);
        randoChooser.should.not.have.property("mark");

        done();
    });

    it('Should set mark property for all randos and ignore privious mark value when mark property already exist', function (done) {
        var metricsMaster = metrics.metrics.slice(0);
        metrics.metrics = [];
        
        var randos = [{mark: 2}, {mark: 4}];
        var randoChooser = {};
        metrics.calculate(randoChooser, randos);

        randos[0].should.have.property("mark", 0);
        randos[1].should.have.property("mark", 0);
        randoChooser.should.not.have.property("mark");

        done();
    });

});
