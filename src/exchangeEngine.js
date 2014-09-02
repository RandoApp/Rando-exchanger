var db = require("randoDB");
var config = require("config");
var async = require("async");
var exchangeModel = require("./model/exchangeModel");
var chooser = require("./engine/chooser");
var metrics = require("./engine/metrics");


function use () {
    for (var i = 0; i < arguments.length; i++) {
        metrics.push(arguments[i]);
    }
}

function run () {
    async.waterfall([
        exchageModel.fetchRandos,
        chooser.findChooser,
        metrics.calculate,
        chooseGift,
        giveGift
    ], function (err) {
        console.error("Error in Rando-echanger.main waterfall: " + err);
    });
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
