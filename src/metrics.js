var fs = require("fs");

module.exports = {
	metrics: [
		require("./metrics/owner")
	],
	add: function (metric) {
		this.metrics.push(metric);
	},
	reset: function () {
		this.metrics = [];
	},
	calculate: function (randoChooser, randos) {
		for (var i = 0; i  < randos.length; i++) {
			var mark = 0;
			for (var j = 0; j < this.metrics.length; j++) {
				mark += this.metrics[j](randoChooser, randos[i], randos);
			}
			randos[i].mark = mark;
		}
	}
};
