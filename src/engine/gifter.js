var async = require("async");

function sort(randos) {
    randos.sort(function (randos1, rando2) {
        return rando1.mark - rando2.mark;
    });
    return randos;
};

function chooseGift (randos, callback) {
    var gift = null;
    if (randos.length > 0) {
        gift = sort(randos)[0];
    }
    callback(null, gift);
};

function give (chooser, gift) {
    searchRandoInUserOut(gift.user, gift.randoId, function (err, rando) {
        chooser.user.in.push(rando);
        db.user.update(chooser.user);

        rando.strangerRandoId = chooser.randoId;
        rando.mapURL = chooser.mapURL;
        rando.mapSizeURL = chooser.mapSizerURL;
        db.user.update(gift.user);
    });
};


module.exports = {
    findBestGift: function (chooser, randos, callback) {
        chooseGift(randos, function (err, gift) {
            callback(chooser, gift);
        });
    },
    giveGift: function (choser, randos, callback) {
        async.waterfall([
            function (callback) {callback(null, randos)},
            chooseGift,
            give
        ]);
    }
};
