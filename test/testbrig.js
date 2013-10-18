'use strict';

var assert = {
  equal : function(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message + ' actual [' + actual + '] expected [' + expected + ']');
    }
  },
  true : function(value, message) {
    this.equal(value, true, message)
  },
  false : function(value, message) {
    this.equal(value, false, message)
  },
  null : function(value, message) {
    this.equal(value, null, message)
  }
};


var suite = {};

suite.setup = function(f) {
  this._setup = f;
};

suite.test = function(f) {
  this.tests = this.tests || {};
  this.tests[f.name] = f;
};


suite.run = function(scope) {

  scope(this);

  var testnames = process.argv.slice(2);

  var tests = (testnames[0] ? testnames : Object.keys(this.tests)).map(function(n) {return this.tests[n]}, this);

  tests.forEach(function(test) {
    if (!test) {
      console.error('No such test!');
      return;
    }
    console.log(test.name);
    var now = new Date();
    (this._setup || function() {})();
    try {
      test();
      console.log(test.name + ' OK   ' + (new Date() - now) + 'ms');
    } catch (e) {
      console.log(e.stack);
      console.log(test.name + ' FAIL ' + (new Date() - now) + 'ms');
    }
  },this);
};

var Bridj = require('../public/script/bridj');

function testScope(suite) {
  var size;
  var game;

  suite.setup(function() {
    size = 5;
    game = Bridj.newGame(size);
  });

  suite.test(testEmptyBoard);
  suite.test(testAgentPlayingInCellPreventsOtherAgent);
  suite.test(testAgentPlayingInCellSetsAdjacentCells);
  suite.test(testOwnedAndMarkedCellsWhenOtherAgentPlaysNearby);
  suite.test(testSimpleWinByRed);
  suite.test(testLateralWinForBlue);
  suite.test(testWonkyWinForRed);

  function testWonkyWinForRed() {
    game.play(game.agents.RED, 3,0);
    game.play(game.agents.RED, 4,2);
    game.play(game.agents.RED, 3,4);

    assert.equal(game.won(), game.agents.RED, 'Expecteed Itssssssssawinnnnahhhhh');
  }


  function testLateralWinForBlue() {
    game.play(game.agents.BLUE, 0,2);
    assert.null(game.won(), 'Expected no winner yet...');
    game.play(game.agents.BLUE, 2,2);
    assert.null(game.won(), 'Still expected no winner...');
    game.play(game.agents.BLUE, 4,2);
    assert.equal(game.won(), game.agents.BLUE, 'Expecteed Itssssssssawinnnnahhhhh');
  }



  function testSimpleWinByRed() {
    game.play(game.agents.RED, 2,0);
    assert.null(game.won(), 'Expected no winner yet...');
    game.play(game.agents.RED, 2,2);
    assert.null(game.won(), 'Still expected no winner...');
    game.play(game.agents.RED, 2,4);

    assert.equal(game.won(), game.agents.RED, 'Expecteed Itssssssssawinnnnahhhhh');
  }



  function testOwnedAndMarkedCellsWhenOtherAgentPlaysNearby() {
    game.play(game.agents.RED, 2,2);
    game.play(game.agents.BLUE,3,3);

    var expected = [
      [ 0, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 0 ],
      [ 0, 1, 1, 0,-1 ],
      [ 0, 1, 0,-1,-1 ],
      [ 0, 0,-1,-1,-1 ]
    ];

    expected.forEach(function(row, y) {
      row.forEach(function(value, x) {
        assert.equal(game.valueAt(x,y), expected[x][y],'After 2 plays the board is as expected')
      })
    });
  }

  function testAgentPlayingInCellSetsAdjacentCells() {
    game.play(game.agents.RED,2,2);

    assert.equal(game.valueAt(2,2), game.agents.RED.OWNED, 'Expect cell played to be owned by agent');
    for (var x = 1; x < 4; x++) {
      for (var y = 1; y < 4; y++) {
        if (x !== y) {
          assert.equal(game.valueAt(x,y), game.agents.RED.MARKED, 'Expect adjacent cell to be marked by agent');
        }
      }
    }
  }

  function testAgentPlayingInCellPreventsOtherAgent() {
    assert.true(game.canPlay(game.agents.RED,  2,2), "Red can play on an empty cell");
    assert.true(game.canPlay(game.agents.BLUE, 2,2), "Blue can play on an empty cell");

    game.play(game.agents.RED,2,2);

    assert.false(game.canPlay(game.agents.RED,  2,2));
    assert.false(game.canPlay(game.agents.BLUE, 2,2));

  }

  function testEmptyBoard() {
    var found = [];

    game.everyCell(function(value, x, y) {
      assert.equal(value, 0, 'All cell values zero in initial field');
      found[x * size + y] = 1;
    });

    assert.equal(found.length, size * size, "All cells visited in traversal")
  }
}

suite.run(testScope);


