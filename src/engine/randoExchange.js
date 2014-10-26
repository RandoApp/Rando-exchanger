var async = require("async");

function searchRandoInUserOut (user, randoId, callback) {
    async.detect(user.out, function (rando, done) {
        done(rando.randoId == randoId);
    }, function (rando) {
        callback(null, rando);
    });
};

model.exports = {
    putRandoToInForUser: function (rando, user, callback) {
    searchRandoInUserOut(rando.randoId, user, function (err, userRando) {
        chooser.user.in.push(rando);
        db.user.update(chooser.user);

        rando.strangerRandoId = chooser.randoId;
        rando.mapURL = chooser.mapURL;
        rando.mapSizeURL = chooser.mapSizerURL;
        db.user.update(gift.user);
    });
    }
};
