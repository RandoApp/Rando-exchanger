require('why-is-node-running')()
var should = require("should");
var sinon = require("sinon");
var db = require("@rando4.me/db");
var randoService = require("../../src/service/randoService");

describe("RandoService.", function () {
  describe("findAllChoosers.", function () {
    it("Should find all choosers when all is ok", function (done) {
      var randos = [
        { randoId: 1 },
        { randoId: 2, strangerRandoId: 3 },
        { randoId: 3, chosenRandoId: 2, strangerRandoId: 4 },
        { randoId: 4, chosenRandoId: 3}
      ];

      var expected = [
        { randoId: 1 },
        { randoId: 2, strangerRandoId: 3 }
      ];

      var choosers = randoService.findAllChoosers(randos);

      expected.should.be.eql(choosers);

      done();
    });

    it("Should find empty choosers when randos is empty array or undefined", function (done) {
      randoService.findAllChoosers([]).should.be.empty();
      randoService.findAllChoosers().should.be.empty();
      done();
    });

    it("Should find empty choosers when randos doesn't have choosers", function (done) {
      var randos = [
        { randoId: 1, chosenRandoId: 3, strangerRandoId: 2  },
        { randoId: 2, chosenRandoId: 1, strangerRandoId: 3 },
        { randoId: 3, chosenRandoId: 2, strangerRandoId: 1 }
      ];

      randoService.findAllChoosers(randos).should.be.empty();
      done();
    });
  });

  describe("isRandoFullyExchanged.", function () {
    it("Should return true when all is ok", function (done) {
      var randos = [
        { randoId: 1 },
        { randoId: 2, strangerRandoId: 3 },
        { randoId: 3, chosenRandoId: 2, strangerRandoId: 4 },
        { randoId: 4, chosenRandoId: 3 }
      ];

      randoService.isRandoFullyExchanged({randoId: 3, strangerRandoId: 4}, randos).should.be.false;

      done();
    });

    it("Should return false when randos is empty array or undefined", function (done) {
      randoService.isRandoFullyExchanged({randoId: 1}, []).should.be.false;
      randoService.isRandoFullyExchanged(null, [{randoId: 1}]).should.be.false;
      randoService.isRandoFullyExchanged().should.be.false;
      done();
    });

    it("Should return false when randos doesn't have fully exchanged randos", function (done) {
      var randos = [
        { randoId: 1, chosenRandoId: 3, strangerRandoId: 2 },
        { randoId: 2, chosenRandoId: 1, strangerRandoId: 3 },
        { randoId: 3, chosenRandoId: 2, strangerRandoId: 1 }
      ];

      randoService.isRandoFullyExchanged(randos).should.be.false;
      done();
    });
  });

  describe("findFullyExchangedRandos.", function () {
    it("Should return fullyExchangedRandos when all is ok", function (done) {
      var randos = [
        { randoId: 1 },
        { randoId: 2, strangerRandoId: 3 },
        { randoId: 3, chosenRandoId: 2, strangerRandoId: 4 },
        { randoId: 4, chosenRandoId: 3}
      ];

      var expected = [{randoId: 3, chosenRandoId: 2, strangerRandoId: 4}];
      var actual = randoService.findFullyExchangedRandos(randos);

      expected.should.be.eql(actual);

      done();
    });

    it("Should return empty array when randos is empty or undefined", function (done) {
      randoService.findFullyExchangedRandos().should.be.empty();
      randoService.findFullyExchangedRandos([]).should.be.empty();
      done();
    });

    it("Should return empty array randos doesn't have fully exchanged randos", function (done) {
      var randos = [
        { randoId: 1, chosenRandoId: 3, strangerRandoId: 2 },
        { randoId: 2, chosenRandoId: 1, strangerRandoId: 3 },
        { randoId: 3, chosenRandoId: 2, strangerRandoId: 1 }
      ];

      randoService.findFullyExchangedRandos(randos).should.have.length(3);
      done();
    });
  });

  describe("buildRando.", function () {
    it("Should return clean rando when arg is a big rando", function (done) {
      var bigRando = {
        creation: 123,
        randoId: 12345,
        imageURL: "http://rando4.me/image/1.png",
        imageSizeURL: {
          small: "http://rando4.me/image/small/1.png"
        },
        mapURL: "http://rando4.me/map/1.png",
        mapSizeURL: {
          small: "http://rando4.me/map/small/1.png"
        },
        detected: [],
        delete: 1,
        rating: 3,
        someMoreField: "12345"
      };

      var expected = {
        creation: 123,
        randoId: 12345,
        imageURL: "http://rando4.me/image/1.png",
        imageSizeURL: {
          small: "http://rando4.me/image/small/1.png"
        },
        mapURL: "http://rando4.me/map/1.png",
        mapSizeURL: {
          small: "http://rando4.me/map/small/1.png"
        },
        detected: []
      };

      var actual = randoService.buildRando(bigRando);
      expected.should.be.eql(actual);

      done();
    });

    it("Should return {} when arg is undefined", function (done) {
      randoService.buildRando().should.be.empty();
      done();
    });
  });

  describe("buildLandedRando.", function () {
    it("Should return clean rando when arg is a big rando", function (done) {
      var bigRando = {
        creation: 123,
        randoId: 12345,
        imageURL: "http://rando4.me/image/1.png",
        imageSizeURL: {
          small: "http://rando4.me/image/small/1.png"
        },
        mapURL: "http://rando4.me/map/1.png",
        mapSizeURL: {
          small: "http://rando4.me/map/small/1.png"
        },
        strangerMapURL: "http://rando4.me/map/2.png",
        strangerMapSizeURL: {
          small: "http://rando4.me/map/small/2.png"
        },

        delete: 1,
        rating: 3,
        someMoreField: "12345"
      };

      var expected = {
        creation: 123,
        randoId: 12345,
        imageURL: "http://rando4.me/image/1.png",
        imageSizeURL: {
          small: "http://rando4.me/image/small/1.png"
        },
        mapURL: "http://rando4.me/map/2.png",
        mapSizeURL: {
          small: "http://rando4.me/map/small/2.png"
        },
      };

      var actual = randoService.buildLandedRando(bigRando);
      expected.should.be.eql(actual);

      done();
    });

    it("Should return {} when arg is undefined", function (done) {
      randoService.buildLandedRando().should.be.empty();
      done();
    });
  });

  describe("selectBestRando.", function () {
    it("Should return rando with max of mark when all is ok", function (done) {
      var randos = [
        {randoId: 1, mark: 3},
        {randoId: 2, mark: -3},
        {randoId: 3, mark: 4},
        {randoId: 4, mark: 6},
        {randoId: 5, mark: 0}
      ];

      var actual = randoService.selectBestRando(randos);
      var expected = {randoId: 4, mark: 6};
      expected.should.be.eql(actual);

      done();
    });

    it("Should return {} when arg is undefined", function (done) {
      randoService.selectBestRando().should.be.empty();
      done();
    });

    it("Should return first rando when randos has one rando", function (done) {
      var randos = [
        {randoId: 1, mark: -3}
      ];

      var actual = randoService.selectBestRando(randos);
      var expected = {randoId: 1, mark: -3};
      expected.should.be.eql(actual);

      done();
    });

    it("Should return first rando with max of mark when all is ok", function (done) {
      var randos = [
        {randoId: 1, mark: 3},
        {randoId: 2, mark: 3},
        {randoId: 3, mark: 3}
      ];

      var actual = randoService.selectBestRando(randos);
      var expected = {randoId: 1, mark: 3};
      expected.should.be.eql(actual);

      done();
    });
  });


  describe("removeByRandoId.", function () {
    it("Should return removed rando and remove from randos array when all is ok", function (done) {
      var randos = [
        {randoId: 1},
        {randoId: 2},
        {randoId: 3},
        {randoId: 4},
        {randoId: 5}
      ];

      var actual = randoService.removeByRandoId(2, randos);
      var expected = {randoId: 2};

      expected.should.be.eql(actual);
      randos.should.have.length(4);

      done();
    });

    it("Should return {} when arg is undefined", function (done) {
      randoService.removeByRandoId().should.be.empty();
      done();
    });

    it("Should return {} and do nothing when randos doesn't have randoId", function (done) {
      var randos = [
        {randoId: 1}
      ];

      var actual = randoService.removeByRandoId(2, randos);

      actual.should.be.empty();
      randos.should.have.length(1);

      done();
    });
  });

  describe("findRandoByRandoId.", function () {
    it("Should return rando when all is ok", function (done) {
      var randos = [
        {randoId: 1},
        {randoId: 2},
        {randoId: 3},
        {randoId: 4},
        {randoId: 5}
      ];

      var actual = randoService.findRandoByRandoId(2, randos);
      var expected = {randoId: 2};

      expected.should.be.eql(actual);

      done();
    });

    it("Should return {} when arg is undefined", function (done) {
      randoService.findRandoByRandoId().should.be.empty();
      done();
    });

    it("Should return {} when randos doesn't have randoId", function (done) {
      var randos = [
        {randoId: 1}
      ];

      var actual = randoService.findRandoByRandoId(2, randos);

      actual.should.be.empty();

      done();
    });
  });

});
