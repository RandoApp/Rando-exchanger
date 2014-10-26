var async = require("async");
var chooser = require("./chooser");

function isRandoChooser (rando, callback) {
    async.detect(rando.user.out, function (userRando, done) {
        done(userRando.randoId == rando.randoId);
    }, function (detectedRando) {
        if (detectedRando && detectedRando.strangerRandoId) {
            callback(true);
            return;
        }
        callback(false);
    });
};

function searchRandoInUserOut (user, randoId, callback) {
    async.detect(user.out, function (rando, done) {
        done(rando.randoId == randoId);
    }, function (rando) {
        callback(null, rando);
    });
};

function makeChooser (randos, callback) {
    chooser.findChooser(randos, null, function (err, chooser, gifts) {
        var gift = gifts[parseInt(Math.random()*Math.pow(10, 15)) % gifts.length];
        gift.user.in.push(chooser);
        db.user.update(gift.user);

        searchRandoInUserOut(choose.user, choose.randoId, function (err, rando) {
            rando.strangerRandoId = gift.randoId;
            rando.mapURL = gift.mapURL;
            rando.mapSizeURL = gift.mapSizerURL;
            db.user.update(chooser.user);

            callback(null, [chooser], randos);
        });
    });
};

module.exports = {
    findChoosersAndGifts: function (randos, callback) {
        var choosers = [];
        var gifts = [];
        async.each(randos, function (rando, done) {
            isRandoChooser(rando, function (isChooser) {
                if (isChooser) {
                    choosers.push(rando);
                } else {
                    gifts.push(rando);
                }
                done();
            });
        }, function (err) {
            callback(null, choosers, gifts);
        });
    },
    checkChooser: function (choosers, gifts, callback) {
        if (choosers.length == 0) {
            makeChooser(gifts, callback);
            return;
        } 
        callback(null, choosers, gifts);
    }
};
