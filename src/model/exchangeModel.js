var db = require("randoDB");
var config = require("config");
var async = require("async");

function fetchRandos (callback) {
    db.rando.getFirstN(config.exch.fetchRandosNumber, callback);
}

function appendUserToRando (randos, callback) {
    async.each(randos, function (rando, done) {
        db.user.getByEmail(rando.email, function (err, user) {
            if (!user) {
                console.warn("User not found");
            }
            rando.user = user;
            done(err);
        });
    }, function (err) {
        callback(err, randos);
    });
}

module.exports = {
    fetchRandos: function (callback) {
        async.waterfall([
            fetchRandos,
            appendUserToRando
        ], function (err, randos) {
            if (err) {
                console.error("[exchangeModel.fetchRandos] Error in waterfall: " + err);
            }
            callback(err, randos);
        });
    }
};
