//every hour: +10 to mark
module.exports = {
	name: module.id.match(/^.*\/([^\\\/]+).js$/)[1],
	calculate: function (randoChooser, randoToMark, randos) { 
		var hoursWaiting = Math.abs(Date.now() - randoToMark.creation) / (1000 * 60 * 60);
		return hoursWaiting * 10;
	}
};

