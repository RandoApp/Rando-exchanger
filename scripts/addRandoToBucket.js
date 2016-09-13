var config = require("config");
var db = require("randoDB");

db.connect(config.db.url);

var user = "user" + parseInt(Math.random() * 10) + "@mail.com";

db.user.create({email:user}, function () {

var rando = {
	randoId: parseInt(Math.random() * 1000),
	email: user,
	creation: Date.now(),
    ip: "1.2.3.4",
    location: {
      latitude: 123,
      longitude: 123
    },
    imageURL: "http://imageUrl",
    imageSizeURL: {
      small: "http://imageUrl/small",
      medium: "http://imageUrl/medium",
      large: "http://imageUrl/large"
    },
    mapURL: "http://mapUrl",
    mapSizeURL: {
      small: "http://mapUrl/small",
      medium: "http://mapUrl/medium",
      large: "http://mapUrl/large",
    },
    strangerRandoId: 999,
    strangerMapURL: "http://strangerMapUrl",
    strangerMapSizeURL: {
      small: "http://strangerMapUrl/small",
      medium: "http://strangerMapUrl/medium",
      large: "http://strangerMapUrl/large",
    },
    rating: 999,
    delete: 0
};

console.info("Rando: " + JSON.stringify(rando));

db.rando.add(rando, function () {
	db.disconnect();
});

});