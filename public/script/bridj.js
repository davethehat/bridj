'use strict';

console.log('loading bridj')

function initialiseArray(array, valueOrFunction) {
  for (var i = 0; i < array.length; i++) {
    array[i] = typeof valueOrFunction === 'function' ? valueOrFunction() : valueOrFunction;
  }
  return array;
}

function arrayEquals(a1, a2) {
  if (a1.length !== a2.length) return false;
  if (a1.length == 0) return true;
  return a1[0] === a2[0] && arrayEquals(a1.slice(1), a2.slice(1));
}

function rotateMatrix(aSquareMatrix) {
  var size = aSquareMatrix.length;
  var cells = new Array(size);
  initialiseArray(cells, function() {
    var row = new Array(cells.length);
    return initialiseArray(row, 0);
  });

  aSquareMatrix.forEach(function(row, y) {
    row.forEach(function(value, x) {
      // NB x/y flip
      cells[x][y] = value;
    })
  });
  return cells;
}

function copyMatrix(aSquareMatrix) {
  var size = aSquareMatrix.length;
  var cells = new Array(size);
  initialiseArray(cells, function() {
    var row = new Array(cells.length);
    return initialiseArray(row, 0);
  });
  aSquareMatrix.forEach(function(row, y) {
    row.forEach(function(value, x) {
      // NB x/y flip
      cells[y][x] = value.copy();
    })
  });
  return cells;
}

function hashMatrix(cells) {
  return cells.map(function(row) {
    return row.reduce(function(accum, cell) { return accum * 5 + cell.value + 2; } ,0)
  });
}

var Bridj = {
  newGame: function (size, magicInset) {
    magicInset = magicInset || 1;
    var RED = {
      OWNED: 2,
      MARKED: 1,
      won: function(cells) {return _winFor(this, cells) ? this : null;},
      name: 'RED'
    };
    var BLUE = {
      OWNED: -2,
      MARKED: -1,
      won: function(cells) {return _winFor(this, cells) ? this : null;},
      name: 'BLUE'
    };

    function _winFor(agent, cells) {
      // find a marked path from one edge to the opposite for the given agent

      return _topToBottomPathExists(agent, cells) || _topToBottomPathExists(agent, rotateMatrix(cells));

      function _topToBottomPathExists(agent, cells) {
        var _visited = {};
        var won = false;
        cells[0].forEach(function(cell,x) {
          if (!won && cell.value === agent.OWNED && !visited(x,0)) {
            won = search(x,0,cell.value);
          }
        });
        return won;

        function visit(x,y) {
          _visited[x + ':' + y] = cells[y][x].value || '-';
        }

        function visited(x,y) {
          return _visited[x + ':' + y];
        }

        function valid(x,y) {
          return (x >= 0 && y >= 0 && x < size && y < size);
        }


        function search(x,y,value) {
          visit(x,y);

          if (cells[y][x].value !== value) return false;
          if (y === size-1) return true;

          var won = false;

          [x-1, x+1].forEach(function(newx) {
            [y-1, y+1].forEach(function (newy) {
              if (valid(newx,y) && !visited(newx,y) && !won) {
                won = search(newx, y, value);
              }
              if (valid(x,newy) && !visited(x,newy) && !won) {
                won = search(x, newy, value);
              }
            });
          });
          return won;
        }
      }
    }

    function playAt(agent, x, y, cells) {
      var size = cells.length;
      var startX = Math.max(0, x - 1);
      var endX   = Math.min(size, x + 2);
      var startY = Math.max(0, y - 1);
      var endY   = Math.min(size, y + 2);

      for (var xx = startX; xx < endX; xx++) {
        for (var yy = startY; yy < endY; yy++) {
          var cell = cells[yy][xx];
          if (xx === x && yy === y) {
            cell.own(agent);
          } else {
            cell.mark(agent);
          }
        }
      }
    }

    function positionAppearsTwiceInMoves(lastpos, moves) {
      var hash = hashMatrix(lastpos);
      var repeats = moves.filter(function(move) {
        return arrayEquals(move.hash, hash);
      });
      return repeats.length === 2;
    }


    function Cell() {
      this.value = 0;
    }

    Cell.prototype.constructor = Cell;


    Cell.prototype.own = function(agent) {
      this.value += agent.OWNED;
      this.adjust();
    }

    Cell.prototype.mark = function(agent) {
      this.value += agent.MARKED;
      this.adjust();
    }

    Cell.prototype.adjust = function() {
      this.value = Math.min(RED.OWNED, Math.max(BLUE.OWNED, this.value));
    }

    Cell.prototype.canPlay = function() {
      return this.value > BLUE.OWNED && this.value < RED.OWNED;
    }

    Cell.prototype.kind = 'cell';

    Cell.prototype.copy = function() {
      var copy = new this.constructor();
      copy.value = this.value;
      return copy;
    }


    function MagicCell() {}

    MagicCell.prototype = new Cell();
    MagicCell.prototype.constructor = MagicCell;
    MagicCell.prototype.canPlay = function() {return false;};
    MagicCell.prototype.own = function() {}
    MagicCell.prototype.mark = function(agent) {
      if (this.value > BLUE.OWNED && this.value < RED.OWNED) {
        Cell.prototype.mark.call(this, agent);
      }
    }
    MagicCell.prototype.kind = 'magic';

    function BlackHoleCell() {}

    BlackHoleCell.prototype = new Cell();
    BlackHoleCell.prototype.constructor = BlackHoleCell;
    BlackHoleCell.prototype.canPlay = function() {return false;};
    BlackHoleCell.prototype.own = function() {}
    BlackHoleCell.prototype.mark = function() {}
    BlackHoleCell.prototype.kind = 'blackhole';

    var cells = new Array(size);
    initialiseArray(cells, function() {
      var row = new Array(cells.length);
      return initialiseArray(row, function() {return new Cell()});
    });

    cells[magicInset][magicInset] = new MagicCell();
    cells[magicInset][size - magicInset - 1] = new MagicCell();
    cells[size - magicInset - 1][magicInset] = new MagicCell();
    cells[size - magicInset - 1][size - magicInset - 1] = new MagicCell();
    cells[Math.floor(size/2)][Math.floor(size/2)] = new BlackHoleCell();

    //noinspection JSUnusedGlobalSymbols
    return {
      agents: {RED: RED, BLUE: BLUE},
      currentAgent: RED,
      moves: [],

      currentMoveNumber: function() {
        return this.moves.length + 1;
      },

      endTurn: function() {
          return (this.currentAgent = this.currentAgent === RED ? BLUE : RED);
      },

      canPlay: function (agent, x, y) {
        return cells[y][x].canPlay();
      },

      play: function(agent, x, y) {
        playAt(agent, x, y, cells);
        this.recordMove(agent, x,y);
      },

      hash: function() {
        return hashMatrix(cells);
      },

      testThreeTimeRule: function(agent, x, y) {
        var copy = copyMatrix(cells);
        playAt(agent, x, y, copy);
        return positionAppearsTwiceInMoves(copy, this.moves);
      },

      recordMove: function(agent, x, y) {
        this.moves.push({
          agent: agent,
          x: x,
          y: y,
          hash: this.hash()
        });
      },

      valueAt: function(x,y) {
        return cells[y][x].value;
      },

      kindAt: function(x,y) {
        return cells[y][x].kind;
      },

      everyCell: function(f) {
        cells.forEach(function(row, y) {
          row.forEach(function(cell, x) {
            f(cell.value, x, y);
          })
        });
      },

      won: function() {
        var winningAgent = null;
        if (positionAppearsTwiceInMoves(cells, this.moves.slice(0,-1))) {
          winningAgent = this.moves.slice(-2)[0].agent;
          winningAgent.win='repeat position';
        } else {
          var winningAgent = this.agents.RED.won(cells) || this.agents.BLUE.won(cells);
          if (winningAgent) {
            winningAgent.win = 'path'
          }
        }
        return  winningAgent;
      },

      dump: function() {
        cells.forEach(function(row) {
          console.log(row.map(function(cell) {var v = cell.value; return v < 0 ? v : ' ' + v}).join(','));
        })
      }
    }
  }
};

var module = module || {};
module.exports = Bridj;

