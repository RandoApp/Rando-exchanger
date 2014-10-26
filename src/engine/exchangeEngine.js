var db = require("randoDB");
var config = require("config");
var async = require("async");
var exchangeModel = require("../model/exchangeModel");
var chooser = require("./chooser");
var metrics = require("./metrics");
var gifter = require("./gifter");
var splitter = require("./splitter");

function use () {
    for (var i = 0; i < arguments.length; i++) {
        metrics.push(arguments[i]);
    }
}

function canGift (randos) {
    if (randos.length > 1) {
        for (var i = 0; i < randos.length; i++) {
            if (randos[i].tryCount < 5) {
                return true;
            }
        }
    }
    return false;
}

function findFistChooser (randos) {
    //TODO: random + by hot-time choose
    return randos[0];
}

function findChooser(randos) {
    //TODO
    return randos[0];
}

function calculateMetrics(randos, randoChooser) {
    var randosWithMark = randos.slice(0);
    return metrics.calculate(randosWithMark, randoChooser);
}

function findBestRando(randos) {
    return randos.sort(function (rando1, rando2) {
        return rando1.mark - rando2.mark;
    })[0];
}

function giftRando(bestRandos, randoChooser) {
    db.giftSync(bestRando, randoChooser);
}

function deleteChooser(randos, randoChooser) {
    for (var i = 0; i < randos.length; i++) {
        return array.splice(i, 1);
    }
}

function isBestRandoOk(bestRando, randoChooser) {
    if (bestRando.mark < 0) {
        return false;
    }
    return true;
}

function increaseTryCount(randos) {
    for (var i = 0; i < randos.length; i++) {
        randos[i].tryCount++;
    }
}

function run () {
    exchageModel.fetchRandos(function (err, randos) {
        var randoChooser = findFistChooser(randos); 
        while(canGift(randos)) {
            var randosWithMark = calculateMetrics(randos, randoChooser);
            var bestRando = findBestRando(randosWithMark);
            if (isBestRandoOk(bestRando, randoChooser)) {
                giftRando(bestRando, randoChooser);
                randos = deleteChooser(randos, randoChooser);
                randoChooser = bestRando;
            } else {
                increaseTryCount(randos);
            }
        }
    });

/*        

        async.doUntil(function () {
            //waterfall
        }, function (gift) {
            //TODO: How to pass gift here:
            return metrics.isGiftOk(gift);
        }, function (err) {
            //exit with error
        });
    });

    async.waterfall([
        splitter.findChoosersAndGifts,
        splitter.checkChooser,
        chooser.findChooser,
        metrics.calculate,
        gifter.findBestGift,
        function (chooser, gift, done) {
            if (metrics.isGiftOk(gift)) {
                //next
            }
            //exit
        },
        gifter.giveGift,
    ], function (err) {
        console.error("[exchangeEngine.run] Error in waterfall: " + err);
    });
}
*/

module.exports = {
    use: use,
    run: run
};
