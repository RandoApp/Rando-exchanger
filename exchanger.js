var db = require("randoDB");
var config = require("config");
var async = require("async");
var metrics = require("./src/metrics");

var lonelyBucket = [];
var halfPairBucket = [];
var fullPairBucker = [];

function fetchAllRandos (callback) {
    db.rando.getFirstN(config.exch.fetchRandosNumber, function (err, randos) {
        if (err) {
            console.warn("Exchanger.pair: Can't get all randos: ", err);
            callback(err);
            return;
        }

        if (!randos) {
            callback(new Error("Randos not found"));
            return;
        }

        console.info("Exchanger.pair: Get " + randos.length + " randos");

        async.eachLimit(randos, 30, function (rando, callback) {
            attachUserToRando(rando, function (err) {
                callback(err);
            })
        }, function (err) {
            done(err, randos);
        });
    });
}

function attachUserToRando (rando, callback) {
    db.user.getByEmail(rando.email, function (err, user) {
        rando.user = user;
        callback(err);
    });
}



function exchangeRandos(randos) {
    fillBaskets(randos);
    do {
        var chooser = selectChooser(lonelyBucket);
        applyMetrics(chooser, randos, metrics);
        var bestRando = selectBestRando(randos);
        randoToUser()

    } while (lonelyBucket.length >= 2);
}



function fillBaskets (randos) {
    for (var i = 0; i < randos.length; i++) {
        if (randos[i].user.in.length == randos[j].user.out.length) {
            fullPairBucker.push(randos[i]);
            continue;
        }

        for (var j = 0; j < randos.length; j++) {
            if (i == j) continue;

            if (hasUserRando(randos[i], randos[j].user)) {
                halfPairBucket.push(randos[i]);
            } else {
                lonelyBucket.push(randos[i]);
            }
        }
    }
}

function hasUserRando (rando, user) {
    for (var i = 0; i < user.in.length; i++) {
        if (user.in[i].randoId == rando.randoId) {
            return true;
        }
    }
    return false;
}

function selectChooser (randos) {
    var oldRando = randos[0];
    for (var i = 1; i < randos.length; i++) {
        if (oldRando.creation > randos[i]) {
            oldRando = randos[i];
        }
    }
    return oldRando;
}

function makeMetrics(randos) {


}

function randoToUser (email, userRandoId, rando, callback) {
    db.user.getByEmail(email, function (err, user) {
        if (err) {
            console.warn("Exchanger.randoToUser: Data base error when getByEmail: ", email);
            callback(err);
            return;
        }

        if (!user) {
            console.warn("Exchanger.randoToUser: User not found: ", email);
            callback(new Error("User not found"));
            return;
        }

        async.detect(user.randos, function (userRando, detectDone) {
            detectDone(userRando.user.randoId == userRandoId && !userRando.stranger.email);
        }, function (userRando) {
            if (userRando) {
                userRando.stranger = rando;
                updateModels(user, rando, callback);
            } else {
                console.warn("Exchanger.randoToUser: Not found empty rando for pairing for user: ", email);
                callback();
            }
        });
    });
}
function updateModels (user, rando, callback) {
    async.parallel({
        rmRando: function (done) {
            db.rando.remove(rando, done);
        },
        updateUser: function (done) {
            db.user.update(user, done);
        }
    }, function (err) {
        if (err) {
            console.warn("Exchanger.updateModels: Can't remove rando or/and update user, because: ", err);
        } 
        callback(err);
    });
}

function main () {
    console.log("Exchanger start: " + new Date());
    db.connect(config.db.url);
    fetchAllRandos(function (err, randos) {
        if (!err && randos && randos.length > 1) {
            exchangeRandos(randos);
        }

        db.disconnect();
        console.log("Exchanger finish: " + new Date());
    });
}

main();
    