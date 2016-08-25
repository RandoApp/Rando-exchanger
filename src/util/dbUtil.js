var db = require("randoDB");
var logger = require("../log/logger");

module.exports = {
  fetchUserByEmail (email, callback) {
    db.user.getByEmail(email, function (err, user) {
      if (err) {
        logger.warn("[exchanger.putRandoToUserAsync.fetchUserByEmail]", "Data base error when getByEmail:", email);
        callback(err);
        return;
      }

      if (!user) {
        logger.warn("[exchanger.putRandoToUserAsync.fetchUserByEmail]", "User not found:", email);
        callback(new Error("User not found"));
        return;
      }

      callback(null, user);
    });
  }
};
