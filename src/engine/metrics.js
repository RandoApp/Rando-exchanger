var async = require("async");

var metrics = [];

module.exports = {
    use: function (metric) {
        metrics.push(metric);
    },
    reset: function () {
        metrics = [];
    },
    calculate: function (chooser, randos, callback) {
        async.each(randos, function (rando, done) {
            var mark = 0;
            for (var i = 0; i < metrics.length; i++) {
                mark += metrics[i](chooser, randos);
            }
            rando.mark = mark;
            done();
        }, function (err) {
            callback(err, chooser, randos);
        });
    },
    isGiftOk: function (rando) {
        return (rando.mark >= config.mark.min);
    }
};
