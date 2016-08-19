var config = require("config");
var db = require("randoDB");
var rosie = require("rosie").Factory;

db.connect(config.db.url);

rosie.define("rando")
.attr("email", "dimhold@gmail.com")
.attr("randoId", "123456")
.attr("strangerRandoId", null)
.attr("creation", 123)
.attr("ip", "1.2.3.4")
.attr("location", {
	latitude: 123,
	longitude: 123
})
.attr("imageURL", "url")
.attr("imageSizeURL", {
	small: "url",
	medium: "url",
	large: "url"
})
.attr("mapURL", "url")
.attr("mapSizeURL", {
	small: "url",
	medium: "url",
	large: "url" 
})
.attr("rating", 0)
.attr("delete", 0);



rosie.define("user")
.attr("email", "dimhold@gmail.com")
.attr("authToken", "123456")
.attr("facebookId", null)
.attr("googleId", null)
.attr("anonymousId", null)
.attr("password", "pas")
.attr("ban", null)
.attr("ip",  "1.3.5.6")
.attr("in", [
	rosie.build("rando", {email: "user1@mail.com", randoId: "4", creation: 4}),
	rosie.build("rando", {email: "user2@mail.com", randoId: "5", creation: 5}),
	rosie.build("rando", {email: "user1@mail.com", randoId: "6", creation: 6})
])
.attr("out", [
	rosie.build("rando", {email: "dimhold@gmail.com", randoId: "1", creation: 1}),
	rosie.build("rando", {email: "dimhold@gmail.com", randoId: "2", creation: 2}),
	rosie.build("rando", {email: "dimhold@gmail.com", randoId: "3", creation: 3}),
	rosie.build("rando", {email: "dimhold@gmail.com", randoId: "8", creation: 8})
]);

var user1 = rosie.build("user", {email: "user1@mail.com", 
	"in": [
		rosie.build("rando", {email: "dimhold@gmail.com", randoId: "1", creation: 1}),
		rosie.build("rando", {email: "dimhold@gmail.com", randoId: "3", creation: 3})
	],
	out: [
		rosie.build("rando", {email: "user1@mail.com", randoId: "4", creation: 4}),
		rosie.build("rando", {email: "user1@mail.com", randoId: "6", creation: 6}),
		rosie.build("rando", {email: "user1@mail.com", randoId: "7", creation: 7, strangerRandoId: 10})
	]});

var user2 = rosie.build("user", {email: "user2@mail.com", 
	"in": [
		rosie.build("rando", {email: "dimhold@gmail.com", randoId: "2", creation: 2})
	],
	out: [
		rosie.build("rando", {email: "user2@mail.com", randoId: "5", creation: 5}),
		rosie.build("rando", {email: "user2@mail.com", randoId: "9", creation: 9})
	]});

var user3 = rosie.build("user", {email: "user3@mail.com", 
	"in": [
		rosie.build("rando", {email: "user1@mail.com", randoId: "7", creation: 7})
	],
	out: [
		rosie.build("rando", {email: "user3@mail.com", randoId: "10", creation: 10})
	]});

db.rando.add(rosie.build("rando", {email: "dimhold@gmail.com", randoId: "8", creation: 8}));
db.rando.add(rosie.build("rando", {email: "user2@mail.com", randoId: "9", creation: 9}));
db.rando.add(rosie.build("rando", {email: "user1@mail.com", randoId: "7", creation: 7, strangerRandoId: 10}));

db.user.create(rosie.build("user"));
db.user.create(user1);
db.user.create(user2);
db.user.create(user3);

