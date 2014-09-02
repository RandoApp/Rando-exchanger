var db = require("randoDB");
var config = require("config");
var async = require("async");
var exchangeModel = require("./model/exchangeModel");
var chooser = require("./engine/chooser");

var metrics = [];

function use () {
    for (var i = 0; i < arguments.length; i++) {
        metrics.push(arguments[i]);
    }
}

function run () {
    async.waterfall([
        exchageModel.fetchRandos,
        chooser.findChooser,
        calculateMetrics,
        chooseGift,
        giveGift
    ], function (err) {
        console.error("Error in Rando-echanger.main waterfall: " + err);
    });
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
