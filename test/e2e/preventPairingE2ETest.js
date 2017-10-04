const config = require("config");
const async = require("async");
const should = require("should");
const sinon = require("sinon");
const db = require("randoDB");
const exchanger = require("../../exchanger");

describe("E2E.", function() {
  describe("PreventPairing.", function() {
    // Use case:
    // 1. 3 users take a 1 rando (all users are equivalent)
    // 2. All 3 randos in a list for exchange
    // 3. Exchanger should be max of entropy: rando1 -> rando2; rando2 -> rando3; rando3 -> rando1;
    it("Should exchange 3 randos without pairing", (done) => {
      async.waterfall([
        (waterfallDone) => {
          db.connect(config.test.db.url, waterfallDone);
        },
        (waterfallDone) => {
          db.user.removeAll(waterfallDone);
        },
        (err, waterfallDone) => {
          async.parallel([
            (parallelDone) => {
              db.user.create({
                email: "user1@rando4.me",
                in: [],
                out: []
              }, parallelDone);
            },
            (parallelDone) => {
              db.user.create({
                email: "user2@rando4.me",
                in: [],
                out: []
              }, parallelDone);
            },
            (parallelDone) => {
              db.user.create({
                email: "user3@rando4.me",
                in: [],
                out: []
              }, parallelDone);
            }
          ], waterfallDone);
        },
        (err, waterfallDone) => {
          db.disconnect(waterfallDone);
        },
        (waterfallDone) => {
          config.db.url = config.test.db.url;
          exchanger(waterfallDone);
        }
      ], (err) => {
        let testDone = done;
        console.log("YYY");
        db.connect(config.test.db.url, (err) => {
          db.user.removeAll(testDone);
        });
      });
    }).timeout(8000);
  });
});
