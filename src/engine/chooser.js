function sort (randos) {
    randos.sort(function (rando1, rando2) {
        return rando1.creation - rando2.creation;
    });
    return randos;
}

module.exports = {
    findChooser: function(randos, callback) {
        var chooser = null;
        if (randos.length > 0) {
            chooser = sort(randos)[0];
        }
        callback(null, chooser);
    }
};
