var config = require("config");
var db = require("randoDB");
var rosie = require("rosie").Factory;

db.connect(config.db.url);

// db.rando.getAll(function (err, randos) {
// 	for (var i = 0; i < randos.length; i++) {
// 		db.rando.remove(randos[i]);
// 	}
// });

rosie.define('rando')
.attr('email', 'dimhold@gmail.com')
.attr('randoId', "123456")
.attr('strangerRandoId', null)
.attr('creation', 123)
.attr('ip', "1.2.3.4")
.attr('location', {
	latitude: 123,
	longitude: 123
})
.attr('imageURL', "url")
.attr('imageSizeURL', {
	small: "url",
	medium: "url",
	large: "url"
})
.attr('mapURL', "url")
.attr('mapSizeURL', {
	small: "url",
	medium: "url",
	large: "url" 
})
.attr('rating', 0)
.attr('delete', 0);



rosie.define('user')
.attr("email", "dimhold@gmail.com")
.attr("authToken", "123456")
.attr("facebookId", null)
.attr("googleId", null)
.attr("anonymousId", null)
.attr("password", "pas")
.attr("ban", null)
.attr("ip",  "1.3.5.6")
.attr("in", [
	rosie.build('rando', {randoId: '9991', creation: 115}),
	rosie.build('rando', {randoId: '9991', creation: 116})
])
.attr("out", [
	rosie.build('rando', {email: "user1@mail.com", randoId: '9991', creation: 113}),
	rosie.build('rando', {email: "user2@mail.com", randoId: '9991', creation: 118})
]);



db.rando.add(rosie.build('rando'));
db.rando.add(rosie.build('rando', {randoId: '1', creation: 81}));
db.rando.add(rosie.build('rando', {randoId: '2', creation: 82}));
db.rando.add(rosie.build('rando', {randoId: '3', creation: 83}));
db.rando.add(rosie.build('rando', {randoId: '4', creation: 84}));
db.rando.add(rosie.build('rando', {randoId: '5', creation: 85}));
db.rando.add(rosie.build('rando', {randoId: '6', creation: 86}));
db.rando.add(rosie.build('rando', {randoId: '7', creation: 87}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '11', creation: 111}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '12', creation: 112}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '13', creation: 113}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '14', creation: 114}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '15', creation: 115}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '16', creation: 116}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '17', creation: 117}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '18', creation: 118}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '19', creation: 119}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '20', creation: 120}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '21', creation: 121}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '22', creation: 122}));
db.rando.add(rosie.build('rando', {email: 'user@mail.com', randoId: '23', creation: 123}));

db.user.create(rosie.build('user', {email: "user@mail.com"}));
db.user.create(rosie.build('user'));



