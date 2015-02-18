var fs = require("fs");

module.exports = {
	metrics: [
		require("./metrics/excludeRandosThatAlreadyHasStrangerRando"),
		require("./metrics/excludeThemselves"),
		require("./metrics/timeWaitingCorrection")
	],
	add: function (metric) {
		this.metrics.push(metric);
	},
	reset: function () {
		this.metrics = [];
	},
	calculate: function (randoChooser, randos) {
		var allMarks = [];
		for (var i = 0; i < this.metrics.length; i++) {
			var marks =	this.calculateForMetric(this.metrics[i], randoChooser, randos);
			console.log("Metric " + this.metrics[i].name + " result: " + JSON.stringify(marks));
			allMarks.push(marks);
		}
		var marks = this.reduceMarks(allMarks);
		console.log("All metric final result: " + JSON.stringify(marks));
		this.applyMarks(marks, randos);
	},
	calculateForMetric: function (metric, randoChooser, randos) {
		var marks = {};
		for (var i = 0; i < randos.length; i++) {
			marks[randos[i].randoId] = metric.calculate(randoChooser, randos[i], randos);
		}
		return marks;
	},
	reduceMarks: function (marks) {
		var finalMarks = {};
		for (var id in marks[0]) {
			finalMarks[id] = 0;
		}

		for (var i = 0; i < marks.length; i++) {
			for (var id in marks[0]) {
				finalMarks[id] += marks[i][id];
			}
		}
		return finalMarks;
	},
	applyMarks: function (marks, randos) {
		this.resetMarksForRandos(randos);

		for (var i = 0; i < randos.length; i++) {
			randos[i].mark += marks[randos[i].randoId];
		}
	},
	resetMarksForRandos: function (randos) {
		for (var i = 0; i < randos.length; i++) {
			randos[i].mark = 0;
		}
	}
};
