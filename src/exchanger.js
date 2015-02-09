var db = require("randoDB");
var config = require("config");
var async = require("async");
var metrics = require("./metrics");

var lonelyBucket = [];
var halfPairBucket = [];

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
            });
        }, function (err) {
            callback(err, randos);
        });
    });
}

function attachUserToRando (rando, callback) {
    db.user.getByEmail(rando.email, function (err, user) {
		if (err) {
			console.log("Error on attachUserToRando: " + err);
			callback(err);
			return;
		}

		if (user) {
			rando.user = user;
			callback(err);
		} else {
			console.log("User with email: " + rando.email + " not found");
			callback(new Error("not found"));
		}
    });
}


function printRandos(randos) {
	for (var i = 0; i < randos.length; i++) {
		var userIn = [];
		for (var j = 0; j < randos[i].user.in.length; j++) {
			userIn.push(randos[i].user.in[j].randoId);
		}
		var userOut = [];
		for (var j = 0; j < randos[i].user.out.length; j++) {
			userOut.push(randos[i].user.out[j].randoId);
		}
		console.log("rando: " + randos[i].randoId + " has user: " + randos[i].user.email + " in: " + userIn + " out: " + userOut);
	}
}

function exchangeRandos (randos) {
	printRandos(randos);


    fillBuckets(randos);
    // do {
        var chooser = selectChooser(lonelyBucket);
        console.log("Chooser: " + chooser.randoId);

        metrics.calculate(chooser, randos);
        var bestRando = selectBestRando(randos);

        console.log("Best rando: " + bestRando.randoId);
        
        if (bestRando.mark < 0) return ;//continue;

        randoToUser(bestRando, chooser.user);
    // } while (lonelyBucket.length >= 2);
}



function fillBuckets (randos) {
	console.log("Start fill buckets");
    for (var i = 0; i < randos.length; i++) {
        for (var j = 0; j < randos.length; j++) {
            if (i == j) continue;

            if (hasUserRando(randos[i], randos[j].user)) {
                halfPairBucket.push(randos[i]);
            } else {
                lonelyBucket.push(randos[i]);
            }
        }
    }

    var lonelyBucketStr = "";
    for (var i = 0; i < lonelyBucket.length; i++) {
        lonelyBucketStr = ", " + lonelyBucket[i].randoId;
    }

    var halfPairBucketStr = "";
    for (var i = 0; i < halfPairBucket.length; i++) {
        halfPairBucketStr = ", " + halfPairBucket[i].randoId;
    }
    
    console.log("lonelyBucket: [" + lonelyBucketStr + "]");
    console.log("halfPairBucket: [" + halfPairBucketStr + "]");
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

function selectBestRando(randos) {
    var bestRando = randos[0];
    for (var i = 1; i < randos.length; i++) {
        if (bestRando.mark < randos[i]) {
            bestRando = randos[i];
        }
    }
    return bestRando;
}

function randoToUser (chooser, rando) {
    for (var i = 0; i < lonelyBucket.length; i++) {
        if (lonelyBucket[i].randoId == chooser.randoId) {
            lonelyBucket.splice(i, 1);
            halfPairBucket.push(chooser);
        }
    }

    for (var i = 0; halfPairBucket.length; i++) {
        if (halfPairBucket[i].randoId == randoId) {
            halfPairBucket.splice(i, 1);
        }
    }

    db.user.getByEmail(chooser.email, function (err, user) {
        if (err) {
            console.warn("Exchanger.randoToUser: Data base error when getByEmail: ", chooser.email);
            callback(err);
            return;
        }

        if (!user) {
            console.warn("Exchanger.randoToUser: User not found: ", chooser.email);
            callback(new Error("User not found"));
            return;
        }

        user.in.push(rando);
        db.user.update(user, done);

        db.user.getByEmail(rando.email, function (err, user) {
            for (var i = 0; i < user.out.length; i++) {
                if (user.out[i].randoId == rando.randoId) {
                    user.out[i].strangerRandoId = chooser.randoId;
                    break;
                }
            }
            db.user.update(user, done);
        });
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

module.exports = main;

