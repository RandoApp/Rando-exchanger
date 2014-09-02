var db = require("randoDB");
var config = require("config");
var async = require("async");
var exchangeModel = require("./model/exchangeModel");

var metrics = [];
var chooser = {};

function use () {
    for (var i = 0; i < arguments.length; i++) {
        metrics.push(arguments[i]);
    }
}

function run () {
    exchangeModel.fetchRandos(function (err, randos) {
        console.log(randos[0].user.email);
    });

    /*
    async.waterfall([
        exchageModel.fetchRandos,
        fetchRandos,
        findChooser,
        calculateMetrics,
        chooseGift,
        giveGift
    ], function (err) {
        console.error("Error in Rando-echanger.main waterfall: " + err);
    });
    */
}

function findChooser (randos, callback) {
    randos.sort(function (rando1, rando2) {
        return rando1.creation - rando2.creation;
    });
    callback(randos[0]);
}

function calculateMetrics(randos, chooser, callback) {
    for (var i = 0; i < randos.length; i++) {
        for (var j = 0; j < metrics.length; j++) {
            var metricMark = metrics[j](chooser, ran );
        }
    }
}

function chooseGift (gifts, callback) {
    gifts.sort();
    callback();
}

function giveGift (gift, callback) {
    callback();
}


module.exports = {
    use: use,
    run: run
};
