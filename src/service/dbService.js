var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var config = require("config");

module.exports = {
  fetchUserByEmail (email, callback) {
    if (!email) {
      return callback(new Error("Incorrect email arg"));
    }

    db.user.getByEmail(email, function (err, user) {
      if (err) {
        logger.warn("[exchanger.putRandoToUserAsync.fetchUserByEmail]", "Data base error when getByEmail:", email);
        return callback(err);
      }

      if (!user) {
        logger.warn("[exchanger.putRandoToUserAsync.fetchUserByEmail]", "User not found:", email);
        return callback(new Error("User not found"));
      }

      return callback(null, user);
    });
  },
  fetchRandos (callback) {
    db.rando.getFirstN(config.exch.fetchRandosNumber, function (err, randos) {
      if (err) {
        logger.warn("[dbUtil.fetchRandos]", "Exchanger.pair: Can't get all randos: ", err);
        return callback(err);
      }

      logger.trace("[dbUtil.fetchRandos]", "Is randos null?");
      if (!randos) {
        logger.debug("[dbUtil.fetchRandos]", "Randos are null. Throw Randos not found error");
        return callback(new Error("Randos not found"));
      }

      return callback(null, randos);
    });
  },
  fetchUsersForRandos (randos, callback) {
    var users = {};
    var self = this;
    async.eachLimit(randos, 30, function (rando, callback) {
      logger.trace("[dbUtil.fetchUsersForRandos]", " Process rando: ", rando.randoId);
      self.fetchUser(rando, users, callback);
    }, function (err) {
      if (err) {
        logger.warn("[dbUtil.fetchUsersForRandos]", "Each done with error: ", err);
      } else {
        logger.warn("[dbUtil.fetchUsersForRandos]", "Each done successfully");
      }
      callback(err, users);
    });
  },
  fetchUser (rando, users, callback) {
    if (users[rando.email]) {
      logger.debug("[exchanger.fetchUser]", "User already in cache");
      return callback();
    }

    db.user.getByEmail(rando.email, function (err, user) {
      if (err) {
        logger.debug("[exchanger.fetchUser] ", "Error on fetchUser:", err);
        return callback(err);
      }

      if (user) {
        logger.trace("[exchanger.fetchUser] ", "Fetched user with email:", user.email);
        users[user.email] = user;
        return callback();
      } else {
        logger.debug("[exchanger.fetchUser] ", "User with email:", rando.email, "not found");
        return callback(new Error("User not found"));
      }
    });
  },
};
