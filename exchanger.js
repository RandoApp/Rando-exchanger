var config = require("config");
var db = require("randoDB");
var exchange = require("./src/engine/exchangeEngine");

db.connect(config.db.url);

exchange.use(
    require("./src/metric/randoOwner")
);

exchange.run();
