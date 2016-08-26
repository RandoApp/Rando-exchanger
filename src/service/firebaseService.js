var firebase = require("unirest");
var logger = require("../log/logger");
var config = require("config");
var async = require("async");

function buildMessage (message, deviceFirebaseId) {
  return {
    data: message,
    to: deviceFirebaseId
  };
}

module.exports = {
  findActiveFirabseIds (user) {
    if (!user) {
      logger.warn("[firebaseService.findActiveFirabseIds] user is empty!");
      return [];
    }

    logger.trace("[firebaseService.findActiveFirabseIds] Find firebase ids for user: ", user.email);
    var firebaseIds = [];
    if (user.firebaseInstanceIds) {
      for (var i = 0; i < user.firebaseInstanceIds.length; i++) {
        if (user.firebaseInstanceIds[i].active) {
          firebaseIds.push(user.firebaseInstanceIds[i].instanceId);
        }
      }
    }
    logger.trace("[firebaseService.findActiveFirabseIds] Found firebase ids: ", firebaseIds, " for user: ", user.email);
    return firebaseIds;
  },
  sendMessageToSingleDevice (message, deviceFirebaseId, callback) {
    logger.trace("[firebase.sendMessageToSingleDevice]", "Start sending message");
    firebase.post("https://fcm.googleapis.com/fcm/send")
      .headers({
        Authorization: "key=" + config.firebase.key,
        "Content-Type": "application/json"
      })
      .send(buildMessage(message, deviceFirebaseId))
      .end(function (response) {
        logger.trace("[firebase] response body:", response.body);
        callback(null, response.body);
      });
  },
  sendMessageToDevices (message, deviceFirebaseIds, callback) {
    logger.trace("[firebase.sendMessageToDevices]", "Start sending messages");
    var self = this;
    async.eachLimit(deviceFirebaseIds, 1000, (firebaseId, done) => {
      self.sendMessageToSingleDevice(message, firebaseId, done);
    }, callback);
  }
};
