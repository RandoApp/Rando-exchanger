var firebase = require('unirest');
var logger = require("../log/logger");
var config = require("config");
var async = require("async");

module.exports = {
  sendMessageToSingleDevice: function (message, deviceFirebaseId, callback) {
    logger.trace("[firebase.sendMessageToSingleDevice]", "Start sending message");
    firebase.post('https://fcm.googleapis.com/fcm/send')
      .headers({
        Authorization: 'key=' + config.firebase.key,
        'Content-Type': 'application/json'
      })
      .send(buildMessage(message, deviceFirebaseId))
      .end(function (response) {
        logger.trace("[firebase] response body:", response.body);
        callback(null, response.body);
      });
  },
  sendMessageToDevices: function (message, deviceFirebaseIds, callback) {
    logger.trace("[firebase.sendMessageToDevices]", "Start sending messages");
    var self = this;
    async.eachLimit(deviceFirebaseIds, 1000, function (firebaseId, done) {
      self.sendMessageToSingleDevice(message, firebaseId, done);
    }, callback);
  }
}

function buildMessage (message, deviceFirebaseId) {
  return {
    data: message,
    to: deviceFirebaseId
  }
}
