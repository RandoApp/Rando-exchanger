var config = require("config");
var db = require("randoDB");
var exchanger = require("./src/exchanger");

db.connect(config.db.url);

exchanger.use(
    require("./src/metric/randoOwner")
);

exchanger.run();
