function sort (randos) {
    randos.sort(function (rando1, rando2) {
        return rando1.creation - rando2.creation;
    });
    return randos;
}

module.exports = {
    findChooser: function(choosers, gifts, callback) {
        var chooser = null;
        if (choosers.length > 0) {
            chooser = sort(choosers)[0];
        }
        callback(null, chooser, gifts);
    }
};
