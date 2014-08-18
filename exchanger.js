var db = require("randoDB");
var config = require("config");
var async = require("async");

function pair (callback) {
    db.rando.getAll(function (err, randos) {
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

        var randosWithStatus = wrapRandosWithStatusSync(randos);
        async.eachSeries(randosWithStatus, function (randoWithStatus, done) {
            var randoToPair = findRandoForUserSync(randoWithStatus, randosWithStatus);
            if (randoToPair) {
                connectRandos(randoWithStatus.rando, randoToPair, function () {
                    done();
                });
            } else {
                done();
            }
        }, function (err) {
            callback(err);
        });
    });
}

function wrapRandosWithStatusSync (randos) {
    var randosWithStatus = [];
    for (var i = 0; i < randos.length; i++) {
        randosWithStatus.push({
            status: "pairing",
            rando: randos[i]
        });
    }
    return randosWithStatus;
}

function findRandoForUserSync (randoWithStatus, randosWithStatus) {
    var PAIRED_STATUS = "paired";
    if (randoWithStatus.status != PAIRED_STATUS) {
        for (var i = 0; i < randosWithStatus.length; i++) {
            if (randoWithStatus.rando.email != randosWithStatus[i].rando.email && randosWithStatus[i].status != PAIRED_STATUS) {
                randoWithStatus.status = PAIRED_STATUS;
                randosWithStatus[i].status = PAIRED_STATUS;
                return randosWithStatus[i].rando;
            }
        }
    }
    return null;
}

function connectRandos (rando1, rando2, callback) {
    console.info("Exchanger.connectRandos: Pair:", rando1.email, "[randoId: ", rando1.randoId,"]   <-->   ", rando2.email, "[randoId: ", rando2.randoId,"]");
    async.parallel({
        rando2ToUser1: function (done) {
            randoToUser(rando1.email, rando1.randoId, rando2, done);
        },
        rando1ToUser2: function (done) {
            randoToUser(rando2.email, rando2.randoId, rando1, done);
        },
    }, function (err) {
        if (err) {
            console.warn("Exchanger.connectRandos: Can't connect randos for users ", rando1.email, " and ", rando2.email, ", because: ", err);
        }
        callback(err);
    });
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
    pair(function (err) {
        db.disconnect();
        console.log("Exchanger finish: " + new Date());
    });
}

main();
