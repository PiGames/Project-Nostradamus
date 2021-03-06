(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
*   EasyStar.js
*   github.com/prettymuchbryce/EasyStarJS
*   Licensed under the MIT license.
*
*   Implementation By Bryce Neal (@prettymuchbryce)
**/

var EasyStar = {}
var Instance = require('./instance');
var Node = require('./node');
var Heap = require('heap');

const CLOSED_LIST = 0;
const OPEN_LIST = 1;

module.exports = EasyStar;

EasyStar.js = function() {
    var STRAIGHT_COST = 1.0;
    var DIAGONAL_COST = 1.4;
    var syncEnabled = false;
    var pointsToAvoid = {};
    var collisionGrid;
    var costMap = {};
    var pointsToCost = {};
    var directionalConditions = {};
    var allowCornerCutting = true;
    var iterationsSoFar;
    var instances = [];
    var iterationsPerCalculation = Number.MAX_VALUE;
    var acceptableTiles;
    var diagonalsEnabled = false;

    /**
    * Sets the collision grid that EasyStar uses.
    *
    * @param {Array|Number} tiles An array of numbers that represent
    * which tiles in your grid should be considered
    * acceptable, or "walkable".
    **/
    this.setAcceptableTiles = function(tiles) {
        if (tiles instanceof Array) {
            // Array
            acceptableTiles = tiles;
        } else if (!isNaN(parseFloat(tiles)) && isFinite(tiles)) {
            // Number
            acceptableTiles = [tiles];
        }
    };

    /**
    * Enables sync mode for this EasyStar instance..
    * if you're into that sort of thing.
    **/
    this.enableSync = function() {
        syncEnabled = true;
    };

    /**
    * Disables sync mode for this EasyStar instance.
    **/
    this.disableSync = function() {
        syncEnabled = false;
    };

    /**
     * Enable diagonal pathfinding.
     */
    this.enableDiagonals = function() {
        diagonalsEnabled = true;
    }

    /**
     * Disable diagonal pathfinding.
     */
    this.disableDiagonals = function() {
        diagonalsEnabled = false;
    }

    /**
    * Sets the collision grid that EasyStar uses.
    *
    * @param {Array} grid The collision grid that this EasyStar instance will read from.
    * This should be a 2D Array of Numbers.
    **/
    this.setGrid = function(grid) {
        collisionGrid = grid;

        //Setup cost map
        for (var y = 0; y < collisionGrid.length; y++) {
            for (var x = 0; x < collisionGrid[0].length; x++) {
                if (!costMap[collisionGrid[y][x]]) {
                    costMap[collisionGrid[y][x]] = 1
                }
            }
        }
    };

    /**
    * Sets the tile cost for a particular tile type.
    *
    * @param {Number} The tile type to set the cost for.
    * @param {Number} The multiplicative cost associated with the given tile.
    **/
    this.setTileCost = function(tileType, cost) {
        costMap[tileType] = cost;
    };

    /**
    * Sets the an additional cost for a particular point.
    * Overrides the cost from setTileCost.
    *
    * @param {Number} x The x value of the point to cost.
    * @param {Number} y The y value of the point to cost.
    * @param {Number} The multiplicative cost associated with the given point.
    **/
    this.setAdditionalPointCost = function(x, y, cost) {
        pointsToCost[x + '_' + y] = cost;
    };

    /**
    * Remove the additional cost for a particular point.
    *
    * @param {Number} x The x value of the point to stop costing.
    * @param {Number} y The y value of the point to stop costing.
    **/
    this.removeAdditionalPointCost = function(x, y) {
        delete pointsToCost[x + '_' + y];
    }

    /**
    * Remove all additional point costs.
    **/
    this.removeAllAdditionalPointCosts = function() {
        pointsToCost = {};
    }

    /**
    * Sets a directional condition on a tile
    *
    * @param {Number} x The x value of the point.
    * @param {Number} y The y value of the point.
    * @param {Array.<String>} allowedDirections A list of all the allowed directions that can access
    * the tile.
    **/
    this.setDirectionalCondition = function(x, y, allowedDirections) {
        directionalConditions[x + '_' + y] = allowedDirections;
    };

    /**
    * Remove all directional conditions
    **/
    this.removeAllDirectionalConditions = function() {
        directionalConditions = {};
    };

    /**
    * Sets the number of search iterations per calculation.
    * A lower number provides a slower result, but more practical if you
    * have a large tile-map and don't want to block your thread while
    * finding a path.
    *
    * @param {Number} iterations The number of searches to prefrom per calculate() call.
    **/
    this.setIterationsPerCalculation = function(iterations) {
        iterationsPerCalculation = iterations;
    };

    /**
    * Avoid a particular point on the grid,
    * regardless of whether or not it is an acceptable tile.
    *
    * @param {Number} x The x value of the point to avoid.
    * @param {Number} y The y value of the point to avoid.
    **/
    this.avoidAdditionalPoint = function(x, y) {
        pointsToAvoid[x + "_" + y] = 1;
    };

    /**
    * Stop avoiding a particular point on the grid.
    *
    * @param {Number} x The x value of the point to stop avoiding.
    * @param {Number} y The y value of the point to stop avoiding.
    **/
    this.stopAvoidingAdditionalPoint = function(x, y) {
        delete pointsToAvoid[x + "_" + y];
    };

    /**
    * Enables corner cutting in diagonal movement.
    **/
    this.enableCornerCutting = function() {
        allowCornerCutting = true;
    };

    /**
    * Disables corner cutting in diagonal movement.
    **/
    this.disableCornerCutting = function() {
        allowCornerCutting = false;
    };

    /**
    * Stop avoiding all additional points on the grid.
    **/
    this.stopAvoidingAllAdditionalPoints = function() {
        pointsToAvoid = {};
    };

    /**
    * Find a path.
    *
    * @param {Number} startX The X position of the starting point.
    * @param {Number} startY The Y position of the starting point.
    * @param {Number} endX The X position of the ending point.
    * @param {Number} endY The Y position of the ending point.
    * @param {Function} callback A function that is called when your path
    * is found, or no path is found.
    *
    **/
    this.findPath = function(startX, startY, endX, endY, callback) {
        // Wraps the callback for sync vs async logic
        var callbackWrapper = function(result) {
            if (syncEnabled) {
                callback(result);
            } else {
                setTimeout(function() {
                    callback(result);
                });
            }
        }

        // No acceptable tiles were set
        if (acceptableTiles === undefined) {
            throw new Error("You can't set a path without first calling setAcceptableTiles() on EasyStar.");
        }
        // No grid was set
        if (collisionGrid === undefined) {
            throw new Error("You can't set a path without first calling setGrid() on EasyStar.");
        }

        // Start or endpoint outside of scope.
        if (startX < 0 || startY < 0 || endX < 0 || endY < 0 ||
        startX > collisionGrid[0].length-1 || startY > collisionGrid.length-1 ||
        endX > collisionGrid[0].length-1 || endY > collisionGrid.length-1) {
            throw new Error("Your start or end point is outside the scope of your grid.");
        }

        // Start and end are the same tile.
        if (startX===endX && startY===endY) {
            callbackWrapper([]);
            return;
        }

        // End point is not an acceptable tile.
        var endTile = collisionGrid[endY][endX];
        var isAcceptable = false;
        for (var i = 0; i < acceptableTiles.length; i++) {
            if (endTile === acceptableTiles[i]) {
                isAcceptable = true;
                break;
            }
        }

        if (isAcceptable === false) {
            callbackWrapper(null);
            return;
        }

        // Create the instance
        var instance = new Instance();
        instance.openList = new Heap(function(nodeA, nodeB) {
            return nodeA.bestGuessDistance() - nodeB.bestGuessDistance();
        });
        instance.isDoneCalculating = false;
        instance.nodeHash = {};
        instance.startX = startX;
        instance.startY = startY;
        instance.endX = endX;
        instance.endY = endY;
        instance.callback = callbackWrapper;

        instance.openList.push(coordinateToNode(instance, instance.startX,
            instance.startY, null, STRAIGHT_COST));

        instances.push(instance);
    };

    /**
    * This method steps through the A* Algorithm in an attempt to
    * find your path(s). It will search 4-8 tiles (depending on diagonals) for every calculation.
    * You can change the number of calculations done in a call by using
    * easystar.setIteratonsPerCalculation().
    **/
    this.calculate = function() {
        if (instances.length === 0 || collisionGrid === undefined || acceptableTiles === undefined) {
            return;
        }
        for (iterationsSoFar = 0; iterationsSoFar < iterationsPerCalculation; iterationsSoFar++) {
            if (instances.length === 0) {
                return;
            }

            if (syncEnabled) {
                // If this is a sync instance, we want to make sure that it calculates synchronously.
                iterationsSoFar = 0;
            }

            // Couldn't find a path.
            if (instances[0].openList.size() === 0) {
                var ic = instances[0];
                ic.callback(null);
                instances.shift();
                continue;
            }

            var searchNode = instances[0].openList.pop();

            // Handles the case where we have found the destination
            if (instances[0].endX === searchNode.x && instances[0].endY === searchNode.y) {
                instances[0].isDoneCalculating = true;
                var path = [];
                path.push({x: searchNode.x, y: searchNode.y});
                var parent = searchNode.parent;
                while (parent!=null) {
                    path.push({x: parent.x, y:parent.y});
                    parent = parent.parent;
                }
                path.reverse();
                var ic = instances[0];
                var ip = path;
                ic.callback(ip);
                return
            }

            var tilesToSearch = [];
            searchNode.list = CLOSED_LIST;

            if (searchNode.y > 0) {
                tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                    x: 0, y: -1, cost: STRAIGHT_COST * getTileCost(searchNode.x, searchNode.y-1)});
            }
            if (searchNode.x < collisionGrid[0].length-1) {
                tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                    x: 1, y: 0, cost: STRAIGHT_COST * getTileCost(searchNode.x+1, searchNode.y)});
            }
            if (searchNode.y < collisionGrid.length-1) {
                tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                    x: 0, y: 1, cost: STRAIGHT_COST * getTileCost(searchNode.x, searchNode.y+1)});
            }
            if (searchNode.x > 0) {
                tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                    x: -1, y: 0, cost: STRAIGHT_COST * getTileCost(searchNode.x-1, searchNode.y)});
            }
            if (diagonalsEnabled) {
                if (searchNode.x > 0 && searchNode.y > 0) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y-1) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x-1, searchNode.y))) {

                        tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                            x: -1, y: -1, cost: DIAGONAL_COST * getTileCost(searchNode.x-1, searchNode.y-1)});
                    }
                }
                if (searchNode.x < collisionGrid[0].length-1 && searchNode.y < collisionGrid.length-1) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y+1) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x+1, searchNode.y))) {

                        tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                            x: 1, y: 1, cost: DIAGONAL_COST * getTileCost(searchNode.x+1, searchNode.y+1)});
                    }
                }
                if (searchNode.x < collisionGrid[0].length-1 && searchNode.y > 0) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y-1) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x+1, searchNode.y))) {


                        tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                            x: 1, y: -1, cost: DIAGONAL_COST * getTileCost(searchNode.x+1, searchNode.y-1)});
                    }
                }
                if (searchNode.x > 0 && searchNode.y < collisionGrid.length-1) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y+1) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x-1, searchNode.y))) {


                        tilesToSearch.push({ instance: instances[0], searchNode: searchNode,
                            x: -1, y: 1, cost: DIAGONAL_COST * getTileCost(searchNode.x-1, searchNode.y+1)});
                    }
                }
            }

            var isDoneCalculating = false;

            // Search all of the surrounding nodes
            for (var i = 0; i < tilesToSearch.length; i++) {
                checkAdjacentNode(tilesToSearch[i].instance, tilesToSearch[i].searchNode,
                    tilesToSearch[i].x, tilesToSearch[i].y, tilesToSearch[i].cost);
                if (tilesToSearch[i].instance.isDoneCalculating === true) {
                    isDoneCalculating = true;
                    break;
                }
            }

            if (isDoneCalculating) {
                instances.shift();
                continue;
            }

        }
    };

    // Private methods follow
    var checkAdjacentNode = function(instance, searchNode, x, y, cost) {
        var adjacentCoordinateX = searchNode.x+x;
        var adjacentCoordinateY = searchNode.y+y;

        if (pointsToAvoid[adjacentCoordinateX + "_" + adjacentCoordinateY] === undefined &&
            isTileWalkable(collisionGrid, acceptableTiles, adjacentCoordinateX, adjacentCoordinateY, searchNode)) {
            var node = coordinateToNode(instance, adjacentCoordinateX,
                adjacentCoordinateY, searchNode, cost);

            if (node.list === undefined) {
                node.list = OPEN_LIST;
                instance.openList.push(node);
            } else if (searchNode.costSoFar + cost < node.costSoFar) {
                node.costSoFar = searchNode.costSoFar + cost;
                node.parent = searchNode;
                instance.openList.updateItem(node);
            }
        }
    };

    // Helpers
    var isTileWalkable = function(collisionGrid, acceptableTiles, x, y, sourceNode) {
        if (directionalConditions[x + "_" + y]) {
            var direction = calculateDirection(sourceNode.x - x, sourceNode.y - y)
            var directionIncluded = function () {
                for (var i = 0; i < directionalConditions[x + "_" + y].length; i++) {
                    if (directionalConditions[x + "_" + y][i] === direction) return true
                }
                return false
            }
            if (!directionIncluded()) return false
        }
        for (var i = 0; i < acceptableTiles.length; i++) {
            if (collisionGrid[y][x] === acceptableTiles[i]) {
                return true;
            }
        }

        return false;
    };

    /**
     * -1, -1 | 0, -1  | 1, -1
     * -1,  0 | SOURCE | 1,  0
     * -1,  1 | 0,  1  | 1,  1
     */
    var calculateDirection = function (diffX, diffY) {
        if (diffX === 0, diffY === -1) return EasyStar.BOTTOM
        else if (diffX === 1, diffY === -1) return EasyStar.BOTTOM_LEFT
        else if (diffX === 1, diffY === 0) return EasyStar.LEFT
        else if (diffX === 1, diffY === 1) return EasyStar.TOP_LEFT
        else if (diffX === 0, diffY === 1) return EasyStar.TOP
        else if (diffX === -1, diffY === 1) return EasyStar.TOP_RIGHT
        else if (diffX === -1, diffY === 0) return EasyStar.RIGHT
        else if (diffX === -1, diffY === -1) return EasyStar.BOTTOM_RIGHT
        throw new Error('These differences are not valid: ' + diffX + ', ' + diffY)
    };

    var getTileCost = function(x, y) {
        return pointsToCost[x + '_' + y] || costMap[collisionGrid[y][x]]
    };

    var coordinateToNode = function(instance, x, y, parent, cost) {
        if (instance.nodeHash[x + "_" + y]!==undefined) {
            return instance.nodeHash[x + "_" + y];
        }
        var simpleDistanceToTarget = getDistance(x, y, instance.endX, instance.endY);
        if (parent!==null) {
            var costSoFar = parent.costSoFar + cost;
        } else {
            costSoFar = 0;
        }
        var node = new Node(parent,x,y,costSoFar,simpleDistanceToTarget);
        instance.nodeHash[x + "_" + y] = node;
        return node;
    };

    var getDistance = function(x1,y1,x2,y2) {
        if (diagonalsEnabled) {
            // Octile distance
            var dx = Math.abs(x1 - x2);
            var dy = Math.abs(y1 - y2);
            if (dx < dy) {
                return DIAGONAL_COST * dx + dy;
            } else {
                return DIAGONAL_COST * dy + dx;
            }
        } else {
            // Manhattan distance
            var dx = Math.abs(x1 - x2);
            var dy = Math.abs(y1 - y2);
            return (dx + dy);
        }
    };
}

EasyStar.TOP = 'TOP'
EasyStar.TOP_RIGHT = 'TOP_RIGHT'
EasyStar.RIGHT = 'RIGHT'
EasyStar.BOTTOM_RIGHT = 'BOTTOM_RIGHT'
EasyStar.BOTTOM = 'BOTTOM'
EasyStar.BOTTOM_LEFT = 'BOTTOM_LEFT'
EasyStar.LEFT = 'LEFT'
EasyStar.TOP_LEFT = 'TOP_LEFT'

},{"./instance":2,"./node":3,"heap":4}],2:[function(require,module,exports){
/**
 * Represents a single instance of EasyStar.
 * A path that is in the queue to eventually be found.
 */
module.exports = function() {
    this.isDoneCalculating = true;
    this.pointsToAvoid = {};
    this.startX;
    this.callback;
    this.startY;
    this.endX;
    this.endY;
    this.nodeHash = {};
    this.openList;
};
},{}],3:[function(require,module,exports){
/**
* A simple Node that represents a single tile on the grid.
* @param {Object} parent The parent node.
* @param {Number} x The x position on the grid.
* @param {Number} y The y position on the grid.
* @param {Number} costSoFar How far this node is in moves*cost from the start.
* @param {Number} simpleDistanceToTarget Manhatten distance to the end point.
**/
module.exports = function(parent, x, y, costSoFar, simpleDistanceToTarget) {
    this.parent = parent;
    this.x = x;
    this.y = y;
    this.costSoFar = costSoFar;
    this.simpleDistanceToTarget = simpleDistanceToTarget;

    /**
    * @return {Number} Best guess distance of a cost using this node.
    **/
    this.bestGuessDistance = function() {
        return this.costSoFar + this.simpleDistanceToTarget;
    }
};
},{}],4:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":5}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('./filters.js');

var _Boot = require('./states/Boot');

var _Boot2 = _interopRequireDefault(_Boot);

var _Preload = require('./states/Preload');

var _Preload2 = _interopRequireDefault(_Preload);

var _Menu = require('./states/Menu');

var _Menu2 = _interopRequireDefault(_Menu);

var _Level = require('./levels/Level1');

var _Level2 = _interopRequireDefault(_Level);

var _Level3 = require('./levels/Level2');

var _Level4 = _interopRequireDefault(_Level3);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var ProjectNostradamus = function (_Phaser$Game) {
  _inherits(ProjectNostradamus, _Phaser$Game);

  function ProjectNostradamus(width, height, renderer, parent) {
    _classCallCheck(this, ProjectNostradamus);

    var _this = _possibleConstructorReturn(this, (ProjectNostradamus.__proto__ || Object.getPrototypeOf(ProjectNostradamus)).call(this, width, height, renderer, parent));

    _this.state.add('Preload', _Preload2.default);
    _this.state.add('Boot', _Boot2.default);
    _this.state.add('Preload', _Preload2.default);
    _this.state.add('Menu', _Menu2.default);

    _this.state.add('Level1', _Level2.default);
    _this.state.add('Level2', _Level4.default);

    _this.state.start('Boot');
    return _this;
  }

  return ProjectNostradamus;
}(Phaser.Game);

exports.default = ProjectNostradamus;

},{"./filters.js":15,"./levels/Level1":17,"./levels/Level2":18,"./states/Boot":38,"./states/Menu":40,"./states/Preload":41}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _UserInterfaceConstants = require('../constants/UserInterfaceConstants');

var _UserInterfaceUtils = require('../utils/UserInterfaceUtils');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var GameOverUI = function () {
  function GameOverUI(game, mainMenuCallback, restartCallback) {
    _classCallCheck(this, GameOverUI);

    this.game = game;
    this.mainMenuCallback = mainMenuCallback;
    this.restartCallback = restartCallback;
  }

  _createClass(GameOverUI, [{
    key: 'start',
    value: function start() {
      var _this = this;

      var screenCenter = (0, _UserInterfaceUtils.getScreenCenter)(this.game);

      this.backgroundLayer = (0, _UserInterfaceUtils.showBackgroundLayer)(this.game);
      this.backgroundLayer.alpha = 0;
      this.game.add.tween(this.backgroundLayer).to({ alpha: 0.5 }, _UserInterfaceConstants.END_SCREEN_FADE_IN_DURATION, 'Linear', true);

      var textStyle = {
        align: 'center',
        fill: 'white',
        font: 'bold 80px Arial'
      };

      var mainText = this.game.add.text(screenCenter.x, screenCenter.y, 'YOU DIED!', textStyle);
      mainText.anchor.setTo(0.5);
      mainText.alpha = 0;
      var fadingInTween = this.game.add.tween(mainText).to({ alpha: 1 }, _UserInterfaceConstants.END_SCREEN_FADE_IN_DURATION, 'Linear', true);
      fadingInTween.onComplete.add(function () {
        return _this.showEndScreenButtons();
      });
    }
  }, {
    key: 'showEndScreenButtons',
    value: function showEndScreenButtons() {
      var _this2 = this;

      var mainMenuButton = this.game.add.button(this.game.camera.x + 100, this.game.camera.y + this.game.camera.height - 100, 'main-menu-btn');
      mainMenuButton.anchor.setTo(0, 1);
      mainMenuButton.onInputUp.add(function () {
        return _this2.mainMenuCallback();
      });

      var restartLevelButton = this.game.add.button(this.game.camera.x + this.game.camera.width - 100, this.game.camera.y + this.game.camera.height - 100, 'restart-btn');
      restartLevelButton.anchor.setTo(1, 1);
      restartLevelButton.onInputUp.add(function () {
        return _this2.restartCallback();
      });
    }
  }]);

  return GameOverUI;
}();

exports.default = GameOverUI;

},{"../constants/UserInterfaceConstants":13,"../utils/UserInterfaceUtils":47}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var LIGHT_ANGLE = exports.LIGHT_ANGLE = Math.PI / 3;
var NUMBER_OF_RAYS = exports.NUMBER_OF_RAYS = 30;
var RAY_LENGTH = exports.RAY_LENGTH = 75;
var WORLD_SHADOW_ALPHA = exports.WORLD_SHADOW_ALPHA = 0.38;
var LIGHT_ALPHA = exports.LIGHT_ALPHA = 0.2;
var FLICKERING_POWER = exports.FLICKERING_POWER = 0.04;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var COMPUTER_WIDTH = exports.COMPUTER_WIDTH = 32;
var COMPUTER_HEIGHT = exports.COMPUTER_HEIGHT = 39;
var JOURNAL_TEXT_FIELD_WIDTH = exports.JOURNAL_TEXT_FIELD_WIDTH = 544;
var JOURNAL_TEXT_FIELD_HEIGHT = exports.JOURNAL_TEXT_FIELD_HEIGHT = 350;
var JOURNAL_TEXT_SCROLL_STEP = exports.JOURNAL_TEXT_SCROLL_STEP = 32;
var JOURNAL_TEXT_FONT_SIZE = exports.JOURNAL_TEXT_FONT_SIZE = 16;
var JOURNAL_SCROLL_BAR_WIDTH = exports.JOURNAL_SCROLL_BAR_WIDTH = 8;
var MAGIC_OFFSET_FIXING_VALUE = exports.MAGIC_OFFSET_FIXING_VALUE = 7;
var NUMBER_OF_RAYS = exports.NUMBER_OF_RAYS = 25;
var RAY_LENGTH = exports.RAY_LENGTH = 25;
var FLICKERING_POWER = exports.FLICKERING_POWER = 0.03;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var PLAYER_WIDTH = exports.PLAYER_WIDTH = 29;
var PLAYER_HEIGHT = exports.PLAYER_HEIGHT = 31;
var PLAYER_INITIAL_FRAME = exports.PLAYER_INITIAL_FRAME = 1;
var PLAYER_SPEED = exports.PLAYER_SPEED = 120;
var PLAYER_SNEAK_MULTIPLIER = exports.PLAYER_SNEAK_MULTIPLIER = 0.75;
var PLAYER_SPRINT_MULTIPLIER = exports.PLAYER_SPRINT_MULTIPLIER = 1.5;
var PLAYER_WALK_ANIMATION_FRAMERATE = exports.PLAYER_WALK_ANIMATION_FRAMERATE = 7;
var PLAYER_FIGHT_ANIMATION_FRAMERATE = exports.PLAYER_FIGHT_ANIMATION_FRAMERATE = 10;
var PLAYER_HAND_ATTACK_RANGE = exports.PLAYER_HAND_ATTACK_RANGE = 60;
var PLAYER_HAND_ATTACK_ANGLE = exports.PLAYER_HAND_ATTACK_ANGLE = 60;
var PLAYER_HAND_ATTACK_DAMAGE = exports.PLAYER_HAND_ATTACK_DAMAGE = 0.2;
var PLAYER_DAMAGE_COOLDOWN = exports.PLAYER_DAMAGE_COOLDOWN = 0.1;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var TILE_WIDTH = exports.TILE_WIDTH = 64;
var TILE_HEIGHT = exports.TILE_HEIGHT = 64;
var MAP_WIDTH = exports.MAP_WIDTH = 32;
var MAP_HEIGHT = exports.MAP_HEIGHT = 32;

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var RAY_LENGTH = exports.RAY_LENGTH = 120;
var FLICKERING_POWER = exports.FLICKERING_POWER = 0.04;

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var END_SCREEN_FADE_IN_DURATION = exports.END_SCREEN_FADE_IN_DURATION = 2500;

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ZOMBIE_WIDTH = exports.ZOMBIE_WIDTH = 40;
var ZOMBIE_HEIGHT = exports.ZOMBIE_HEIGHT = 31;
var ZOMBIE_INITIAL_FRAME = exports.ZOMBIE_INITIAL_FRAME = 1;
var ZOMBIE_SPEED = exports.ZOMBIE_SPEED = 50;
var ZOMBIE_SPEED_CHASING_MULTIPLIER = exports.ZOMBIE_SPEED_CHASING_MULTIPLIER = 2;
var ZOMBIE_LOOKING_OFFSET = exports.ZOMBIE_LOOKING_OFFSET = 10;
var ZOMBIE_WALK_ANIMATION_FRAMERATE = exports.ZOMBIE_WALK_ANIMATION_FRAMERATE = 6;
var ZOMBIE_FIGHT_ANIMATION_FRAMERATE = exports.ZOMBIE_FIGHT_ANIMATION_FRAMERATE = 10;
var MIN_DISTANCE_TO_TARGET = exports.MIN_DISTANCE_TO_TARGET = 10;
var ZOMBIE_SIGHT_ANGLE = exports.ZOMBIE_SIGHT_ANGLE = 45;
var ZOMBIE_SIGHT_RANGE = exports.ZOMBIE_SIGHT_RANGE = 400;
var ZOMBIE_HEARING_RANGE = exports.ZOMBIE_HEARING_RANGE = 100;
var ZOMBIE_ATTACK_RANGE = exports.ZOMBIE_ATTACK_RANGE = 50;
var ZOMBIE_ROTATING_SPEED = exports.ZOMBIE_ROTATING_SPEED = 50;
var ZOMBIE_DAMAGE_MULTIPLIER = exports.ZOMBIE_DAMAGE_MULTIPLIER = 1;
var ZOMBIE_DAMAGE_COOLDOWN = exports.ZOMBIE_DAMAGE_COOLDOWN = 0.2;
var ZOMBIE_DAMAGE_VALUE = exports.ZOMBIE_DAMAGE_VALUE = 0.1;
var ZOMBIE_NOTIFY_RANGE = exports.ZOMBIE_NOTIFY_RANGE = 500;

},{}],15:[function(require,module,exports){
'use strict';

Phaser.Filter.Glow = function (game) {
  'use strict';

  Phaser.Filter.call(this, game);
  this.uniforms.alpha = { type: '1f', value: 1.0 };
  //the shader, remove cosine/sine to make it a static glow
  this.fragmentSrc = ['precision lowp float;', 'varying vec2 vTextureCoord;', 'varying vec4 vColor;', 'uniform sampler2D uSampler;', 'uniform float alpha;', 'uniform float time;', 'void main() {', 'vec4 sum = vec4(0);', 'vec2 texcoord = vTextureCoord;', 'for(int xx = -4; xx <= 4; xx++) {', 'for(int yy = -4; yy <= 4; yy++) {', 'float dist = sqrt(float(xx*xx) + float(yy*yy));', 'float factor = 0.0;', 'if (dist == 0.0) {', 'factor = 2.0;', '} else {', 'factor = 2.0/abs(float(dist));', '}', 'sum += texture2D(uSampler, texcoord + vec2(xx, yy) * 0.002) * (0.66);', '}', '}', 'gl_FragColor = sum * 0.025 + texture2D(uSampler, texcoord)*alpha;', '}'];
};

Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;
Object.defineProperty(Phaser.Filter.Glow.prototype, 'alpha', {

  get: function get() {
    return this.uniforms.alpha.value;
  },

  set: function set(value) {
    this.uniforms.alpha.value = value;
  }

});

Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;

},{}],16:[function(require,module,exports){
'use strict';

var _ProjectNostradamus = require('./ProjectNostradamus');

var _ProjectNostradamus2 = _interopRequireDefault(_ProjectNostradamus);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

new _ProjectNostradamus2.default('100%', '100%', Phaser.AUTO, 'content');

/*
!!! This is protection against leaving page while still in game. It is commented out since it was driving me crazy that i had to confirm leavinmg every time browsersync fired. !!!
window.onbeforeunload = (e) => {
  return 'Really want to quit the game?';
};

document.onkeydown = ( e ) => {
  e = e || window.event;
  if ( e.ctrlKey ) {
    const c = e.which || e.keyCode;
    switch ( c ) {
    case 83:
    case 87:
      e.preventDefault();
      e.stopPropagation();
      break;
    }
  }
};
*/

},{"./ProjectNostradamus":6}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Game2 = require('../states/Game.js');

var _Game3 = _interopRequireDefault(_Game2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Level1 = function (_Game) {
  _inherits(Level1, _Game);

  function Level1() {
    _classCallCheck(this, Level1);

    return _possibleConstructorReturn(this, (Level1.__proto__ || Object.getPrototypeOf(Level1)).apply(this, arguments));
  }

  _createClass(Level1, [{
    key: 'preload',
    value: function preload() {
      _Game3.default.prototype.preload.call(this);

      this.load.tilemap('map', 'assets/levels/level1/map.json', null, Phaser.Tilemap.TILED_JSON);
      this.load.json('journals', 'assets/levels/level1/journals.json');
    }
  }, {
    key: 'create',
    value: function create() {
      _Game3.default.prototype.create.call(this);
      console.log('level1 loaded');
    }
  }]);

  return Level1;
}(_Game3.default);

exports.default = Level1;

},{"../states/Game.js":39}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Game2 = require('../states/Game.js');

var _Game3 = _interopRequireDefault(_Game2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Level2 = function (_Game) {
  _inherits(Level2, _Game);

  function Level2() {
    _classCallCheck(this, Level2);

    return _possibleConstructorReturn(this, (Level2.__proto__ || Object.getPrototypeOf(Level2)).apply(this, arguments));
  }

  _createClass(Level2, [{
    key: 'preload',
    value: function preload() {
      _Game3.default.prototype.preload.call(this);

      this.load.tilemap('map', 'assets/levels/level2/map2.json', null, Phaser.Tilemap.TILED_JSON);
      this.load.json('journals', 'assets/levels/level1/journals.json');
    }
  }, {
    key: 'create',
    value: function create() {
      _Game3.default.prototype.create.call(this);
      console.log('level2 loaded');
    }
  }]);

  return Level2;
}(_Game3.default);

exports.default = Level2;

},{"../states/Game.js":39}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _TileMapConstants = require('../constants/TileMapConstants');

var _MapUtils = require('../utils/MapUtils.js');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var ZombiesBoidsManager = function (_Phaser$Group) {
  _inherits(ZombiesBoidsManager, _Phaser$Group);

  function ZombiesBoidsManager(game, mapGrid) {
    var boidsDistance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Math.max(_TileMapConstants.TILE_WIDTH, _TileMapConstants.TILE_HEIGHT);
    var distanceBetweenBoidsAndWalls = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : boidsDistance;

    _classCallCheck(this, ZombiesBoidsManager);

    var _this = _possibleConstructorReturn(this, (ZombiesBoidsManager.__proto__ || Object.getPrototypeOf(ZombiesBoidsManager)).call(this, game));

    _this.entities = _this.children;
    _this.mapGrid = mapGrid;
    _this.boidsDistance = boidsDistance;
    _this.distanceBetweenBoidsAndWalls = distanceBetweenBoidsAndWalls;
    _this.game = game;
    return _this;
  }

  _createClass(ZombiesBoidsManager, [{
    key: 'update',
    value: function update() {
      Phaser.Group.prototype.update.call(this);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.entities[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var boid = _step.value;

          if (boid.isChasing() === false) {
            continue;
          }
          var velocity1 = this.flyTowardsMassCenterRule(boid);
          var velocity2 = this.keepSmallDistanceFromObstaclesRule(boid);
          var velocity3 = this.tryMatchingOtherEnitiesVelocityRule(boid);

          boid.body.velocity.x += velocity1.x + velocity2.x + velocity3.x;
          boid.body.velocity.y += velocity1.y + velocity2.y + velocity3.y;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'flyTowardsMassCenterRule',
    value: function flyTowardsMassCenterRule(boid) {
      var velocity = { x: 0, y: 0 };

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.entities[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var entity = _step2.value;

          if (entity === boid) {
            continue;
          }
          velocity.x += entity.body.x;
          velocity.y += entity.body.y;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      velocity.x = velocity.x / (this.entities.length - 1) / 100;
      velocity.y = velocity.y / (this.entities.length - 1) / 100;

      return velocity;
    }
  }, {
    key: 'keepSmallDistanceFromObstaclesRule',
    value: function keepSmallDistanceFromObstaclesRule(boid) {
      var velocity = { x: 0, y: 0 };

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.entities[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var otherBoid = _step3.value;

          if (otherBoid === boid) {
            continue;
          }
          if (this.game.physics.arcade.distanceBetween(otherBoid, boid) <= this.boidsDistance) {
            velocity.x -= otherBoid.body.x - boid.body.x;
            velocity.y -= otherBoid.body.y - boid.body.y;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var wallBodies = this.getAdjoiningWallBodies(boid);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = wallBodies[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var wallBody = _step4.value;

          if (this.game.physics.arcade.distanceBetween(wallBody, boid) <= this.distanceBetweenBoidsAndWalls) {
            velocity.x -= wallBody.x - boid.body.x;
            velocity.y -= wallBody.y - boid.body.y;
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      return velocity;
    }
  }, {
    key: 'getAdjoiningWallBodies',
    value: function getAdjoiningWallBodies(entity) {
      var _this2 = this;

      var entityTile = (0, _MapUtils.pixelsToTile)(entity);
      var adjoiningTiles = [{ x: entityTile.x - 1, y: entityTile.y - 1 }, { x: entityTile.x - 1, y: entityTile.y }, { x: entityTile.x - 1, y: entityTile.y + 1 }, { x: entityTile.x, y: entityTile.y - 1 }, { x: entityTile.x, y: entityTile.y + 1 }, { x: entityTile.x + 1, y: entityTile.y - 1 }, { x: entityTile.x + 1, y: entityTile.y }, { x: entityTile.x + 1, y: entityTile.y + 1 }];

      var adjoiningWallTiles = adjoiningTiles.filter(function (tile) {
        return _this2.mapGrid[tile.y][tile.x] === 1;
      });
      return adjoiningWallTiles.map(_MapUtils.tileToPixels);
    }
  }, {
    key: 'tryMatchingOtherEnitiesVelocityRule',
    value: function tryMatchingOtherEnitiesVelocityRule() {
      return { x: 0, y: 0 };
    }
  }]);

  return ZombiesBoidsManager;
}(Phaser.Group);

exports.default = ZombiesBoidsManager;

},{"../constants/TileMapConstants":11,"../utils/MapUtils.js":45}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Entity = function (_Phaser$Sprite) {
  _inherits(Entity, _Phaser$Sprite);

  function Entity(game, x, y, imageKey, frame) {
    _classCallCheck(this, Entity);

    var _this = _possibleConstructorReturn(this, (Entity.__proto__ || Object.getPrototypeOf(Entity)).call(this, game, x, y, imageKey, frame));

    _this.anchor.setTo(0.5, 0.5);

    _this.game.physics.p2.enable(_this);
    _this.body.collideWorldBounds = true;

    _this.game.world.add(_this);
    return _this;
  }

  _createClass(Entity, [{
    key: "lookAt",
    value: function lookAt(targetX, targetY) {
      var targetPoint = new Phaser.Point(targetX, targetY);
      var entityCenter = new Phaser.Point(this.body.x + this.width / 2, this.body.y + this.height / 2);

      var targetAngle = Phaser.Math.radToDeg(Phaser.Math.angleBetweenPoints(targetPoint, entityCenter)) - 90;

      if (targetAngle < 0) {
        targetAngle += 360;
      }

      this.body.angle = targetAngle;
    }
  }, {
    key: "normalizeVelocity",
    value: function normalizeVelocity() {
      if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
        this.body.velocity.x = this.body.velocity.x * Math.sqrt(2) * 1 / 2;
        this.body.velocity.y = this.body.velocity.y * Math.sqrt(2) * 1 / 2;
      }
    }
  }, {
    key: "resetVelocity",
    value: function resetVelocity() {
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
    }
  }, {
    key: "isMoving",
    value: function isMoving() {
      return this.body.velocity.x !== 0 || this.body.velocity.y !== 0;
    }
  }, {
    key: "isInDegreeRange",
    value: function isInDegreeRange(entity, target, sightAngle) {
      var angleDelta = Math.abs(Phaser.Math.radToDeg(Phaser.Math.angleBetween(entity.x, entity.y, target.x, target.y)) + 90 - entity.angle);

      return angleDelta <= sightAngle || angleDelta >= 360 - sightAngle;
    }
  }, {
    key: "takeDamage",
    value: function takeDamage(damage) {
      this.damage(damage);
      this.health = Math.floor(this.health * 100) / 100;
    }
  }]);

  return Entity;
}(Phaser.Sprite);

exports.default = Entity;

},{}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _TileMapConstants = require('../constants/TileMapConstants');

var _ItemConstants = require('../constants/ItemConstants');

var _JournalLight = require('./LightsComponents/JournalLight');

var _JournalLight2 = _interopRequireDefault(_JournalLight);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Journal = function (_Phaser$Sprite) {
  _inherits(Journal, _Phaser$Sprite);

  function Journal(game, content, imageKey) {
    _classCallCheck(this, Journal);

    var _this = _possibleConstructorReturn(this, (Journal.__proto__ || Object.getPrototypeOf(Journal)).call(this, game, 0, 0, imageKey));

    _this.game.world.add(_this);

    _this.hasPlayerApproached = false;

    _this.content = content;

    _this.light = null;
    return _this;
  }

  _createClass(Journal, [{
    key: 'setCorner',
    value: function setCorner(cornerX, cornerY) {
      this.cornerX = cornerX;
      this.cornerY = cornerY;
    }
  }, {
    key: 'setPosition',
    value: function setPosition(tileX, tileY) {
      var cornerX = this.cornerX || 'WEST';
      var cornerY = this.cornerY || 'NORTH';

      var offsetX = cornerX === 'WEST' ? _ItemConstants.COMPUTER_WIDTH / 2 : _TileMapConstants.TILE_WIDTH - _ItemConstants.COMPUTER_WIDTH / 2;
      var offsetY = cornerY === 'NORTH' ? _ItemConstants.COMPUTER_HEIGHT / 2 : _TileMapConstants.TILE_HEIGHT - _ItemConstants.COMPUTER_HEIGHT / 2;

      var x = tileX + offsetX;
      var y = tileY + offsetY;

      this.x = x;
      this.y = y;
    }
  }, {
    key: 'enableJournal',
    value: function enableJournal() {
      var cornerX = this.cornerX || 'WEST';
      var cornerY = this.cornerY || 'NORTH';

      this.game.physics.p2.enable(this);
      this.body.static = true;

      var sensorOffsetX = (_TileMapConstants.TILE_WIDTH - _ItemConstants.COMPUTER_WIDTH) / (cornerX === 'WEST' ? 2 : -2);
      var sensorOffsetY = (_TileMapConstants.TILE_HEIGHT - _ItemConstants.COMPUTER_HEIGHT) / (cornerY === 'NORTH' ? 2 : -2);

      if (cornerY === 'SOUTH') {
        this.body.angle = 180;
        sensorOffsetX += (_TileMapConstants.TILE_WIDTH - _ItemConstants.COMPUTER_WIDTH) * (sensorOffsetX < 0 ? 1 : -1);
        sensorOffsetY += (_TileMapConstants.TILE_HEIGHT - _ItemConstants.COMPUTER_HEIGHT) * (sensorOffsetY < 0 ? 1 : -1);
      }

      var rectangleSensor = this.body.addRectangle(_TileMapConstants.TILE_WIDTH, _TileMapConstants.TILE_HEIGHT, sensorOffsetX, sensorOffsetY);
      rectangleSensor.sensor = true;

      this.anchor.setTo(0.5);
      this.light = new _JournalLight2.default(this);
    }
  }]);

  return Journal;
}(Phaser.Sprite);

exports.default = Journal;

},{"../constants/ItemConstants":9,"../constants/TileMapConstants":11,"./LightsComponents/JournalLight":24}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _ItemConstants = require('../constants/ItemConstants');

var _UserInterfaceUtils = require('../utils/UserInterfaceUtils');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var JournalsManager = function (_Phaser$Group) {
  _inherits(JournalsManager, _Phaser$Group);

  function JournalsManager(game, player) {
    _classCallCheck(this, JournalsManager);

    var _this = _possibleConstructorReturn(this, (JournalsManager.__proto__ || Object.getPrototypeOf(JournalsManager)).call(this, game));

    var style = { font: '24px Arial', fill: '#fff' };

    _this.messageText = _this.game.add.text(0, 0, '', style);
    _this.messageText.x = 24;
    _this.messageText.y = _this.game.height - 24 - 32;
    _this.messageText.fixedToCamera = true;

    _this.player = player;

    _this.activateKey = _this.game.input.keyboard.addKey(Phaser.Keyboard.E);
    _this.activateKey.onDown.add(_this.tryToShowJournal, _this);
    _this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.E);

    _this.activateKey = _this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
    _this.activateKey.onDown.add(_this.tryToHideJournal, _this);
    _this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ESC);

    _this.isJournalOpened = false;
    return _this;
  }

  _createClass(JournalsManager, [{
    key: 'tryToShowJournal',
    value: function tryToShowJournal() {
      if (this.isJournalOpened) {
        return;
      }
      var approachedJournals = this.children.filter(function (journal) {
        return journal.hasPlayerApproached;
      });
      if (approachedJournals.length > 0) {
        this.isJournalOpened = true;
        this.game.paused = true;
        this.messageText.setText('Press \'ESC\' to close personal journal.');

        var nearestJournal = this.getJournalNearestToPlayer(approachedJournals);
        this.showJournal(nearestJournal);
      }
    }
  }, {
    key: 'getJournalNearestToPlayer',
    value: function getJournalNearestToPlayer(journals) {
      var _this2 = this;

      var nearestJournal = journals[0];

      journals.forEach(function (journal) {
        if (Phaser.Math.distance(_this2.player.x, _this2.player.y, journal.x, journal.y) < Phaser.Math.distance(_this2.player.x, _this2.player.y, nearestJournal.x, nearestJournal.y)) {
          nearestJournal = journal;
        }
      });

      return nearestJournal;
    }
  }, {
    key: 'showJournal',
    value: function showJournal(journalToShow) {
      var screenCenter = (0, _UserInterfaceUtils.getScreenCenter)(this.game);

      this.backgroundLayer = (0, _UserInterfaceUtils.showBackgroundLayer)(this.game);

      this.ui = this.game.add.sprite(screenCenter.x, screenCenter.y + _ItemConstants.MAGIC_OFFSET_FIXING_VALUE, 'journal-ui');
      this.ui.anchor.setTo(0.5);

      var textStyle = {
        align: 'left',
        fill: '#10aede',
        font: 'bold ' + _ItemConstants.JOURNAL_TEXT_FONT_SIZE + 'px Arial',
        padding: '0',
        margin: '0'
      };

      this.uiText = this.game.add.text(screenCenter.x - _ItemConstants.JOURNAL_TEXT_FIELD_WIDTH / 2, screenCenter.y - _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT / 2, journalToShow.content, textStyle);
      this.uiText.wordWrap = true;
      this.uiText.wordWrapWidth = _ItemConstants.JOURNAL_TEXT_FIELD_WIDTH;

      this.maskGraphics = this.game.add.graphics(0, 0);
      this.maskGraphics.beginFill(0xffffff);
      this.maskGraphics.drawRect(screenCenter.x - _ItemConstants.JOURNAL_TEXT_FIELD_WIDTH / 2, this.uiText.y, _ItemConstants.JOURNAL_TEXT_FIELD_WIDTH, _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT);

      this.uiText.mask = this.maskGraphics;

      this.scrollBar = this.game.add.graphics(screenCenter.x + _ItemConstants.JOURNAL_TEXT_FIELD_WIDTH / 2, this.uiText.y);
      this.scrollBar.alpha = 0.5;
      this.scrollBarHeight = this.uiText.height > _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT ? Math.pow(_ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT, 2) / this.uiText.height : _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT;
      this.scrollBarOffset = 0;
      this.scrollBarStep = _ItemConstants.JOURNAL_TEXT_SCROLL_STEP / this.uiText.height * _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT;

      this.drawScrollBar();
    }
  }, {
    key: 'tryToHideJournal',
    value: function tryToHideJournal() {
      if (this.isJournalOpened && this.game.paused) {
        this.isJournalOpened = false;
        this.game.paused = false;
        this.messageText.setText('Press \'E\' to open personal journal.');
        this.backgroundLayer.destroy();
        this.ui.destroy();
        this.uiText.destroy();
        this.maskGraphics.destroy();
        this.scrollBar.destroy();
      }
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter(bodyA, bodyB, shapeA, shapeB) {
      if (this.isItSensorArea(bodyA, shapeB)) {
        this.messageText.setText('Press \'E\' to open personal journal.');
        bodyA.sprite.hasPlayerApproached = true;
      }
    }
  }, {
    key: 'onCollisionLeave',
    value: function onCollisionLeave(bodyA, bodyB, shapeA, shapeB) {
      if (this.isItSensorArea(bodyA, shapeB)) {
        this.messageText.setText('');
        bodyA.sprite.hasPlayerApproached = false;
      }
    }
  }, {
    key: 'isItSensorArea',
    value: function isItSensorArea(body, shape) {
      if (body.sprite == null || shape.sensor == null) {
        return false;
      }
      // for now this line assume that there is only one type of computer's textures
      // TODO enable different sprite key's handling
      return body.sprite.key === 'computer' && shape.sensor;
    }
  }, {
    key: 'onMouseWheel',
    value: function onMouseWheel() {
      if (this.isJournalOpened === false) {
        return;
      }
      var directionY = this.game.input.mouse.wheelDelta;

      if (directionY === 1 && this.uiText.y < this.game.camera.y + this.game.camera.height / 2 - _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT / 2) {
        this.uiText.y += _ItemConstants.JOURNAL_TEXT_SCROLL_STEP;
        this.drawScrollBar(-this.scrollBarStep);
      } else if (directionY === -1 && this.uiText.y > this.game.camera.y + this.game.camera.height / 2 + _ItemConstants.JOURNAL_TEXT_FIELD_HEIGHT / 2 - this.uiText.height) {
        this.uiText.y -= _ItemConstants.JOURNAL_TEXT_SCROLL_STEP;
        this.drawScrollBar(this.scrollBarStep);
      }
    }
  }, {
    key: 'drawScrollBar',
    value: function drawScrollBar() {
      var y = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      this.scrollBarOffset += y;
      this.scrollBar.clear();
      this.scrollBar.beginFill(0xffffff);
      this.scrollBar.drawRect(0, this.scrollBarOffset, _ItemConstants.JOURNAL_SCROLL_BAR_WIDTH, this.scrollBarHeight);
      this.scrollBar.endFill();
    }
  }, {
    key: 'clearUI',
    value: function clearUI() {
      this.tryToHideJournal();
      this.messageText.destroy();
    }
  }]);

  return JournalsManager;
}(Phaser.Group);

exports.default = JournalsManager;

},{"../constants/ItemConstants":9,"../utils/UserInterfaceUtils":47}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _FlashlightConstants = require('../../constants/FlashlightConstants');

var _Lightable2 = require('./Lightable');

var _Lightable3 = _interopRequireDefault(_Lightable2);

var _MapUtils = require('../../utils/MapUtils');

var _LightUtils = require('../../utils/LightUtils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Flashlight = function (_Lightable) {
  _inherits(Flashlight, _Lightable);

  function Flashlight(player, walls) {
    _classCallCheck(this, Flashlight);

    var _this = _possibleConstructorReturn(this, (Flashlight.__proto__ || Object.getPrototypeOf(Flashlight)).call(this, false));

    _this.player = player;
    _this.walls = walls;
    return _this;
  }

  _createClass(Flashlight, [{
    key: 'getLightShapePoints',
    value: function getLightShapePoints() {
      var shapePoints = [];

      var mouseX = this.player.game.input.mousePointer.worldX;
      var mouseY = this.player.game.input.mousePointer.worldY;
      var mouseAngle = Math.atan2(this.player.y - mouseY, this.player.x - mouseX);

      var flashlightLength = 8;

      var minAngle = mouseAngle - _FlashlightConstants.LIGHT_ANGLE / 2;
      var flashlightStartPoint = {
        x: Math.round(this.player.x - 2 * flashlightLength * Math.cos(minAngle)),
        y: Math.round(this.player.y - 2 * flashlightLength * Math.sin(minAngle))
      };
      shapePoints.push(flashlightStartPoint);

      for (var i = 0; i < _FlashlightConstants.NUMBER_OF_RAYS; i++) {
        var rayAngle = mouseAngle - _FlashlightConstants.LIGHT_ANGLE / 2 + _FlashlightConstants.LIGHT_ANGLE / _FlashlightConstants.NUMBER_OF_RAYS * i;
        var lastX = this.player.x;
        var lastY = this.player.y;
        for (var j = 1; j <= _FlashlightConstants.RAY_LENGTH; j++) {
          var begin = this.player.position;
          var end = {
            x: Math.round(this.player.x - 2 * j * Math.cos(rayAngle)),
            y: Math.round(this.player.y - 2 * j * Math.sin(rayAngle))
          };

          if (!(0, _MapUtils.isTileBlocking)(begin, end, this.walls)) {
            lastX = end.x;
            lastY = end.y;
          } else {
            break;
          }
        }

        shapePoints.push({ x: lastX, y: lastY });
      }

      var maxAngle = mouseAngle + _FlashlightConstants.LIGHT_ANGLE / 2;
      var flashlightEndPoint = {
        x: Math.round(this.player.x - 2 * flashlightLength * Math.cos(maxAngle)),
        y: Math.round(this.player.y - 2 * flashlightLength * Math.sin(maxAngle))
      };
      shapePoints.push(flashlightEndPoint);

      return (0, _LightUtils.optimizeShape)(shapePoints);
    }
  }, {
    key: 'getFillStyle',
    value: function getFillStyle(ctx, offset) {
      var rayLength = _FlashlightConstants.RAY_LENGTH * (1 + Math.random() * _FlashlightConstants.FLICKERING_POWER);
      var gradient = ctx.createRadialGradient(this.player.x - offset.x, this.player.y - offset.y, _FlashlightConstants.RAY_LENGTH * 0.75 * 2, this.player.x - offset.x, this.player.y - offset.y, rayLength * 2);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

      return gradient;
    }
  }]);

  return Flashlight;
}(_Lightable3.default);

exports.default = Flashlight;

},{"../../constants/FlashlightConstants":8,"../../utils/LightUtils":44,"../../utils/MapUtils":45,"./Lightable":25}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _RoundLight2 = require('./RoundLight');

var _RoundLight3 = _interopRequireDefault(_RoundLight2);

var _ItemConstants = require('../../constants/ItemConstants');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var JournalLight = function (_RoundLight) {
  _inherits(JournalLight, _RoundLight);

  function JournalLight(position) {
    _classCallCheck(this, JournalLight);

    return _possibleConstructorReturn(this, (JournalLight.__proto__ || Object.getPrototypeOf(JournalLight)).call(this, position, _ItemConstants.RAY_LENGTH));
  }

  _createClass(JournalLight, [{
    key: 'getFillStyle',
    value: function getFillStyle(ctx, offset) {
      var rayLength = _ItemConstants.RAY_LENGTH * (1 + Math.random() * _ItemConstants.FLICKERING_POWER);
      var gradient = ctx.createRadialGradient(this.x - offset.x, this.y - offset.y, rayLength * 0.4 * 2, this.x - offset.x, this.y - offset.y, rayLength * 2);
      gradient.addColorStop(0, 'rgba(208, 255, 175, 1)');
      gradient.addColorStop(1, 'rgba(208, 255, 175, 0.0)');

      return gradient;
    }
  }]);

  return JournalLight;
}(_RoundLight3.default);

exports.default = JournalLight;

},{"../../constants/ItemConstants":9,"./RoundLight":27}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ID_COUNTER = 0;

// sort of a interface

var Lightable = function () {
  function Lightable() {
    var isStatic = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    _classCallCheck(this, Lightable);

    this.id = ID_COUNTER++;
    this.isStatic = isStatic;
  }

  _createClass(Lightable, [{
    key: "getLightShapePoints",
    value: function getLightShapePoints() {
      // virtual method
      // it means it should by overwritten in derived class
      return [];
    }
  }, {
    key: "getFillStyle",
    value: function getFillStyle() {
      // virtual method
      return 0xffffff;
    }
  }]);

  return Lightable;
}();

exports.default = Lightable;

},{}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Lightable = require('./Lightable');

var _Lightable2 = _interopRequireDefault(_Lightable);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var LightManager = function () {
  function LightManager(game, walls) {
    _classCallCheck(this, LightManager);

    this.game = game;
    this.walls = walls;

    this.cachedLights = [];
    this.dynamicallyRenderedLightables = [];

    this.shadowTexture = this.game.add.bitmapData(this.game.camera.width + 200, this.game.camera.height + 200);

    this.lightImage = this.game.add.image(0, 0, this.shadowTexture);
    this.lightImage.blendMode = Phaser.blendModes.MULTIPLY;
  }

  _createClass(LightManager, [{
    key: 'add',
    value: function add(lightable) {
      if (!(lightable instanceof _Lightable2.default)) {
        return;
      }

      if (lightable.isStatic) {
        var lightShape = lightable.getLightShapePoints(this.walls);
        var getFillStyle = lightable.getFillStyle.bind(lightable);
        this.cachedLights.push({ lightShape: lightShape, getFillStyle: getFillStyle });
      } else {
        this.dynamicallyRenderedLightables.push(lightable);
      }
    }
  }, {
    key: 'update',
    value: function update() {
      this.updateImagePosition();
      this.render();
    }
  }, {
    key: 'updateImagePosition',
    value: function updateImagePosition() {
      this.lightImage.x = this.game.camera.x - 100;
      this.lightImage.y = this.game.camera.y - 100;
    }
  }, {
    key: 'render',
    value: function render() {
      var _this = this;

      this.shadowTexture.dirty = true;
      this.shadowTexture.clear();

      var ctx = this.shadowTexture.ctx;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, this.game.camera.width + 200, this.game.camera.height + 200);

      this.dynamicallyRenderedLightables.forEach(function (lightable) {
        ctx.beginPath();
        ctx.fillStyle = lightable.getFillStyle(ctx, _this.lightImage.position);
        var shapePointsNotOffseted = lightable.getLightShapePoints(_this.walls);
        var shapePoints = shapePointsNotOffseted.map(function (point) {
          return { x: point.x - _this.lightImage.x, y: point.y - _this.lightImage.y };
        });

        ctx.moveTo(shapePoints[0].x, shapePoints[0].y);

        for (var i = 1; i < shapePoints.length; i++) {
          ctx.lineTo(shapePoints[i].x, shapePoints[i].y);
        }

        ctx.lineTo(shapePoints[0].x, shapePoints[0].y);
        ctx.fill();
      });

      this.cachedLights.forEach(function (light) {
        ctx.beginPath();
        ctx.fillStyle = light.getFillStyle(ctx, _this.lightImage.position);
        var shapePoints = light.lightShape.map(function (point) {
          return { x: point.x - _this.lightImage.x, y: point.y - _this.lightImage.y };
        });

        ctx.moveTo(shapePoints[0].x, shapePoints[0].y);

        for (var i = 1; i < shapePoints.length; i++) {
          ctx.lineTo(shapePoints[i].x, shapePoints[i].y);
        }

        ctx.lineTo(shapePoints[0].x, shapePoints[0].y);
        ctx.fill();
      });
    }
  }]);

  return LightManager;
}();

exports.default = LightManager;

},{"./Lightable":25}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Lightable2 = require('./Lightable');

var _Lightable3 = _interopRequireDefault(_Lightable2);

var _MapUtils = require('../../utils/MapUtils');

var _LightUtils = require('../../utils/LightUtils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var NUMBER_OF_RAYS = 80;

var JournalLight = function (_Lightable) {
  _inherits(JournalLight, _Lightable);

  function JournalLight(_ref, rayLength) {
    var x = _ref.x,
        y = _ref.y;

    _classCallCheck(this, JournalLight);

    var _this = _possibleConstructorReturn(this, (JournalLight.__proto__ || Object.getPrototypeOf(JournalLight)).call(this, true));

    _this.x = x;
    _this.y = y;
    _this.rayLength = rayLength;
    return _this;
  }

  _createClass(JournalLight, [{
    key: 'getLightShapePoints',
    value: function getLightShapePoints(walls) {
      var shapePoints = [];

      shapePoints.push({ x: this.x, y: this.y });

      for (var i = 0; i <= NUMBER_OF_RAYS; i++) {
        var rayAngle = Math.PI * 2 / NUMBER_OF_RAYS * i;
        var lastX = this.x;
        var lastY = this.y;
        for (var j = 1; j <= this.rayLength; j++) {
          var begin = { x: this.x, y: this.y };
          var end = {
            x: Math.round(this.x - 2 * j * Math.cos(rayAngle)),
            y: Math.round(this.y - 2 * j * Math.sin(rayAngle))
          };

          if (!(0, _MapUtils.isTileBlocking)(begin, end, walls)) {
            lastX = end.x;
            lastY = end.y;
          } else {
            break;
          }
        }

        shapePoints.push({ x: lastX, y: lastY });
      }
      shapePoints.push({ x: this.x, y: this.y });

      return (0, _LightUtils.optimizeShape)(shapePoints);
    }
  }, {
    key: 'getFillStyle',
    value: function getFillStyle() {
      return '0xffffff';
    }
  }]);

  return JournalLight;
}(_Lightable3.default);

exports.default = JournalLight;

},{"../../utils/LightUtils":44,"../../utils/MapUtils":45,"./Lightable":25}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _RoundLight2 = require('./RoundLight');

var _RoundLight3 = _interopRequireDefault(_RoundLight2);

var _TorchConstants = require('../../constants/TorchConstants');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var TorchlLight = function (_RoundLight) {
  _inherits(TorchlLight, _RoundLight);

  function TorchlLight(position) {
    _classCallCheck(this, TorchlLight);

    return _possibleConstructorReturn(this, (TorchlLight.__proto__ || Object.getPrototypeOf(TorchlLight)).call(this, position, _TorchConstants.RAY_LENGTH));
  }

  _createClass(TorchlLight, [{
    key: 'getFillStyle',
    value: function getFillStyle(ctx, offset) {
      var rayLength = _TorchConstants.RAY_LENGTH * (1 + Math.random() * _TorchConstants.FLICKERING_POWER);
      var gradient = ctx.createRadialGradient(this.x - offset.x, this.y - offset.y, _TorchConstants.RAY_LENGTH * 0.4 * 2, this.x - offset.x, this.y - offset.y, rayLength * 2);
      gradient.addColorStop(0, 'rgba(243,20,49, 1)');
      gradient.addColorStop(1, 'rgba(243,20,49, 0.0)');

      return gradient;
    }
  }]);

  return TorchlLight;
}(_RoundLight3.default);

exports.default = TorchlLight;

},{"../../constants/TorchConstants":12,"./RoundLight":27}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Entity2 = require('./Entity');

var _Entity3 = _interopRequireDefault(_Entity2);

var _PlayerConstants = require('../constants/PlayerConstants');

var _TileMapConstants = require('../constants/TileMapConstants');

var _Flashlight = require('./LightsComponents/Flashlight');

var _Flashlight2 = _interopRequireDefault(_Flashlight);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Player = function (_Entity) {
  _inherits(Player, _Entity);

  function Player(game, x, y, imageKey, frame, zombies) {
    _classCallCheck(this, Player);

    var _this = _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this, game, x + _TileMapConstants.TILE_WIDTH / 2, y + _TileMapConstants.TILE_HEIGHT / 2, imageKey, frame));

    _this.width = _PlayerConstants.PLAYER_WIDTH;
    _this.height = _PlayerConstants.PLAYER_HEIGHT;

    _this.zombies = zombies.children;

    _this.godMode = false;

    _this.isSneaking = false;
    _this.isSprinting = false;

    _this.attackRange = _PlayerConstants.PLAYER_HAND_ATTACK_RANGE;
    _this.dealingDamage = _PlayerConstants.PLAYER_HAND_ATTACK_DAMAGE;

    _this.canDealDamage = true;

    _this.healthbar = _this.game.add.graphics(0, 0);
    _this.healthbar.anchor.x = 1;
    _this.healthbar.anchor.y = 1;
    _this.healthbar.fixedToCamera = true;

    _this.zombiesInAttackRange = [];

    _this.attackSensor = _this.body.addCircle(_PlayerConstants.PLAYER_HAND_ATTACK_RANGE);
    _this.attackSensor.sensor = true;
    _this.attackSensor.sensorType = 'attack';

    _this.cursors = {
      up: _this.game.input.keyboard.addKey(Phaser.Keyboard.W),
      down: _this.game.input.keyboard.addKey(Phaser.Keyboard.S),
      left: _this.game.input.keyboard.addKey(Phaser.Keyboard.A),
      right: _this.game.input.keyboard.addKey(Phaser.Keyboard.D),
      sneakToggle: _this.game.input.keyboard.addKey(Phaser.Keyboard.CAPS_LOCK),
      sneak: _this.game.input.keyboard.addKey(Phaser.Keyboard.ALT),
      sprint: _this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT)
    };

    _this.isSneakPressed = false;

    var style = { font: '16px Arial', fill: '#fff' };

    _this.sneakText = _this.game.add.text(0, 0, 'Sneaking: off', style);
    _this.sneakText.x = _this.game.width - (_this.sneakText.width + 24);
    _this.sneakText.y = _this.game.height - (_this.sneakText.height + 24 + 32);
    _this.sneakText.fixedToCamera = true;
    _this.sneakText.stroke = '#000';
    _this.sneakText.strokeThickness = 3;

    _this.sprintText = _this.game.add.text(0, 0, 'Sprinting: off', style);
    _this.sprintText.x = _this.game.width - (_this.sprintText.width + 24);
    _this.sprintText.y = _this.game.height - (_this.sprintText.height + 24 + 32 + _this.sneakText.height);
    _this.sprintText.fixedToCamera = true;
    _this.sprintText.stroke = '#000';
    _this.sprintText.strokeThickness = 3;

    _this.animations.add('walk', [0, 1, 2, 3, 4, 5]);
    _this.animations.add('fight', [6, 7, 8, 9, 0]);

    _this.body.clearShapes();
    _this.body.addCircle(Math.min(_PlayerConstants.PLAYER_WIDTH, _PlayerConstants.PLAYER_HEIGHT));

    _this.drawHealthBar();

    _this.onDeath = new Phaser.Signal();

    _this.body.onBeginContact.add(_this.onCollisionEnter, _this);
    _this.body.onEndContact.add(_this.onCollisionLeave, _this);

    _this.flashlight = null;

    return _this;
  }

  _createClass(Player, [{
    key: 'setUpFlashlight',
    value: function setUpFlashlight(walls) {
      this.flashlight = new _Flashlight2.default(this, walls);
    }
  }, {
    key: 'update',
    value: function update() {
      this.handleMovement();
      this.handleAnimation();
      this.lookAtMouse();
      this.handleAttack();
    }
  }, {
    key: 'handleMovement',
    value: function handleMovement() {
      this.resetVelocity();

      if (this.cursors.up.isDown) {
        this.body.velocity.y = -_PlayerConstants.PLAYER_SPEED;
      } else if (this.cursors.down.isDown) {
        this.body.velocity.y = _PlayerConstants.PLAYER_SPEED;
      }

      if (this.cursors.left.isDown) {
        this.body.velocity.x = -_PlayerConstants.PLAYER_SPEED;
      } else if (this.cursors.right.isDown) {
        this.body.velocity.x = _PlayerConstants.PLAYER_SPEED;
      }

      this.handleMovementSpecialModes();

      this.normalizeVelocity();
    }
  }, {
    key: 'handleMovementSpecialModes',
    value: function handleMovementSpecialModes() {
      var specialEffectMultiplier = 1;

      this.isSprinting = false;
      this.isSneaking = false;

      if (this.cursors.sprint.isDown) {
        this.isSprinting = true;
        this.isSneaking = false;
        specialEffectMultiplier = _PlayerConstants.PLAYER_SPRINT_MULTIPLIER;
      }

      if (this.cursors.sneak.isDown || this.cursors.sneakToggle.isDown) {
        specialEffectMultiplier = _PlayerConstants.PLAYER_SNEAK_MULTIPLIER;
        this.isSneaking = true;
      }

      this.sneakText.setText('Sneaking: ' + (this.isSneaking ? 'on' : 'off'));
      this.sprintText.setText('Sprinting: ' + (this.isSprinting ? 'on' : 'off'));

      this.body.velocity.x *= specialEffectMultiplier;
      this.body.velocity.y *= specialEffectMultiplier;
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter(bodyA, bodyB, shapeA, shapeB) {
      if (this.isItSensorArea(bodyA, shapeB)) {
        if (shapeB.sensorType === 'attack' && bodyA.sprite.key === 'zombie') {
          this.zombiesInAttackRange.push(bodyA.sprite);
        }
      }
    }
  }, {
    key: 'onCollisionLeave',
    value: function onCollisionLeave(bodyA, bodyB, shapeA, shapeB) {
      if (this.isItSensorArea(bodyA, shapeB)) {
        if (shapeB.sensorType === 'attack' && bodyA.sprite.key === 'zombie') {
          this.zombiesInAttackRange = this.zombiesInAttackRange.filter(function (v) {
            return v !== bodyA.sprite;
          });
        }
      }
    }
  }, {
    key: 'isItSensorArea',
    value: function isItSensorArea(body, shape) {
      if (body.sprite == null || shape.sensor == null) {
        return false;
      }

      return shape.sensor;
    }
  }, {
    key: 'handleAnimation',
    value: function handleAnimation() {
      if (this.game.input.activePointer.leftButton.isDown) {
        this.animations.play('fight', _PlayerConstants.PLAYER_FIGHT_ANIMATION_FRAMERATE, false);
      }
      if ((this.body.velocity.x !== 0 || this.body.velocity.y !== 0) && !this.animations.getAnimation('fight').isPlaying) {
        this.animations.play('walk', _PlayerConstants.PLAYER_WALK_ANIMATION_FRAMERATE, true);
      } else {
        this.animations.stop('walk', true);
      }
    }
  }, {
    key: 'endCooldown',
    value: function endCooldown() {
      this.canDealDamage = true;
      // this.animations.play( 'walk', ZOMBIE_WALK_ANIMATION_FRAMERATE, true );
    }
  }, {
    key: 'lookAtMouse',
    value: function lookAtMouse() {
      var mouseX = this.game.input.mousePointer.worldX;
      var mouseY = this.game.input.mousePointer.worldY;

      this.lookAt(mouseX, mouseY);
    }
  }, {
    key: 'handleAttack',
    value: function handleAttack() {
      var _this2 = this;

      var didDealDamage = false;
      if (this.game.input.activePointer.leftButton.isDown && this.canDealDamage) {
        this.zombiesInAttackRange.forEach(function (v) {
          if (v.alive) {
            if (_this2.isInDegreeRange(_this2, v, _PlayerConstants.PLAYER_HAND_ATTACK_ANGLE)) {
              v.takeDamage(_this2.dealingDamage);
              didDealDamage = true;
            }
          }
        });

        if (didDealDamage) {
          this.canDealDamage = false;
          this.game.time.events.add(Phaser.Timer.SECOND * _PlayerConstants.PLAYER_DAMAGE_COOLDOWN, this.endCooldown, this);
        }
      }
    }
  }, {
    key: 'takeDamage',
    value: function takeDamage(damage) {
      if (!this.godMode) {
        _Entity3.default.prototype.takeDamage.call(this, [damage]);
      }
      this.drawHealthBar();

      if (this.health <= 0) {
        this.handleDeath();
      }
    }
  }, {
    key: 'handleDeath',
    value: function handleDeath() {
      this.onDeath.dispatch();
      this.healthbar.destroy();
      this.sneakText.destroy();
      this.sprintText.destroy();
    }
  }, {
    key: 'drawHealthBar',
    value: function drawHealthBar() {
      var width = 300;
      var height = 32;

      this.healthbar.clear();
      if (this.godMode) {
        this.healthbar.beginFill(0xFFD700, 0.85);
      } else {
        this.healthbar.beginFill(0xFF0000, 0.85);
      }
      this.healthbar.drawRect(this.game.width - (width + 24), this.game.height - (height + 24), width * Math.max(this.health, 0), height);
      this.healthbar.endFill();
      if (this.godMode) {
        this.healthbar.lineStyle(2, 0xCEAD00, 1);
      } else {
        this.healthbar.lineStyle(2, 0x880000, 1);
      }
      this.healthbar.drawRect(this.game.width - (width + 24), this.game.height - (height + 24), width, height);
      this.healthbar.lineStyle(0);
    }
  }]);

  return Player;
}(_Entity3.default);

exports.default = Player;

},{"../constants/PlayerConstants":10,"../constants/TileMapConstants":11,"./Entity":20,"./LightsComponents/Flashlight":23}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _MapUtils = require('../utils/MapUtils.js');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var TileMap = function (_Phaser$Tilemap) {
  _inherits(TileMap, _Phaser$Tilemap);

  function TileMap(game, key, tileWidth, tileHeight) {
    _classCallCheck(this, TileMap);

    var _this = _possibleConstructorReturn(this, (TileMap.__proto__ || Object.getPrototypeOf(TileMap)).call(this, game, key, tileWidth, tileHeight));

    _this.addTilesetImage('tilemap_floor');
    _this.addTilesetImage('tilemap_walls');

    _this.ground = _this.createLayer('background');
    _this.walls = _this.createLayer('walls');

    _this.paths = [];
    _this.journals = [];

    _this.setCollisionByExclusion([], true, _this.walls);

    _this.ground.resizeWorld();

    _this.wallsBodiesArray = game.physics.p2.convertTilemap(_this, _this.walls);

    _this.wallsCollisionGroup = _this.game.physics.p2.createCollisionGroup();

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _this.wallsBodiesArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var body = _step.value;

        body.setCollisionGroup(_this.wallsCollisionGroup);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    _this.createPathPoints();
    return _this;
  }

  _createClass(TileMap, [{
    key: 'collides',
    value: function collides(collisionGroup, callback) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.wallsBodiesArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var body = _step2.value;

          body.collides(collisionGroup, callback);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'createPathPoints',
    value: function createPathPoints() {
      var _this2 = this;

      this.objects['ZombiePaths'].forEach(function (v) {
        var props = v.properties;
        if (!_this2.paths[props.PathId]) {
          _this2.paths[props.PathId] = [];
        }

        _this2.paths[props.PathId][props.PathIndex] = (0, _MapUtils.pixelsToTile)({ x: v.x, y: v.y });
      });

      this.normalizePaths();
    }
  }, {
    key: 'getJournals',
    value: function getJournals() {
      var allJournals = this.objects['Journals'];
      var journals = [];
      allJournals.forEach(function (v) {
        var props = v.properties;
        journals.push({
          x: v.x,
          y: v.y,
          cornerX: props.cornerX,
          cornerY: props.cornerY,
          name: v.name,
          content: props.content
        });
      });

      return journals;
    }
  }, {
    key: 'getPlayerInitialPosition',
    value: function getPlayerInitialPosition() {
      var player = this.objects['PlayerPos'][0];
      var posObj = {
        x: player.x,
        y: player.y
      };
      return posObj;
    }
  }, {
    key: 'normalizePaths',
    value: function normalizePaths() {
      this.paths.forEach(function (pathArr) {
        var tempArr = [];
        pathArr.forEach(function (v) {
          tempArr.push(v);
        });

        pathArr = tempArr;
      });
    }
  }, {
    key: 'getPath',
    value: function getPath(i) {
      return this.paths[i];
    }
  }]);

  return TileMap;
}(Phaser.Tilemap);

exports.default = TileMap;

},{"../utils/MapUtils.js":45}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Entity2 = require('./Entity');

var _Entity3 = _interopRequireDefault(_Entity2);

var _ZombiePathManager = require('./ZombieComponents/ZombiePathManager');

var _ZombiePathManager2 = _interopRequireDefault(_ZombiePathManager);

var _ZombieRotationManager = require('./ZombieComponents/ZombieRotationManager');

var _ZombieRotationManager2 = _interopRequireDefault(_ZombieRotationManager);

var _SeekingPlayerManager = require('./ZombieComponents/SeekingPlayerManager');

var _SeekingPlayerManager2 = _interopRequireDefault(_SeekingPlayerManager);

var _ChasingPlayerManager = require('./ZombieComponents/ChasingPlayerManager');

var _ChasingPlayerManager2 = _interopRequireDefault(_ChasingPlayerManager);

var _MapUtils = require('../utils/MapUtils');

var _TileMapConstants = require('../constants/TileMapConstants');

var _ZombieConstants = require('../constants/ZombieConstants');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/* eslint-disable no-inline-comments */

var STATES = {
  NOT_READY: 0, // zombie is created but no system is initialized
  NOT_WALKING: 1, // walking on path manager is initialized but paths are not calculated yet
  WALKING_ON_PATH: 2, // zombie is walking on precalculated paths
  CHASING_PLAYER: 3 };

var Zombie = function (_Entity) {
  _inherits(Zombie, _Entity);

  function Zombie(game, key) {
    var x = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var y = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

    _classCallCheck(this, Zombie);

    var _this = _possibleConstructorReturn(this, (Zombie.__proto__ || Object.getPrototypeOf(Zombie)).call(this, game, x, y, key));

    _this.initCollider();
    _this.initAnimations();

    _this.isPathSystemInitialized = false;
    _this.walkingOnPathManager = null;
    _this.rotationManager = new _ZombieRotationManager2.default(_this);
    _this.chasingPlayerManager = null;

    _this.state = STATES.NOT_READY;

    _this.body.onBeginContact.add(_this.onCollisionEnter, _this);
    _this.body.onEndContact.add(_this.onCollisionLeave, _this);
    return _this;
  }

  _createClass(Zombie, [{
    key: 'initCollider',
    value: function initCollider() {
      this.body.clearShapes();

      this.body.addCircle(Math.max(_TileMapConstants.TILE_WIDTH, _TileMapConstants.TILE_HEIGHT) * 0.25);
    }
  }, {
    key: 'initAnimations',
    value: function initAnimations() {
      this.animations.add('walk', [0, 1, 2, 3, 4, 5], 0);
      this.animations.add('attack', [6, 7, 8, 9], 6);
      this.animations.play('walk', _ZombieConstants.ZOMBIE_WALK_ANIMATION_FRAMERATE, true);
    }
  }, {
    key: 'setTilePosition',
    value: function setTilePosition(tile) {
      var pixelPosition = (0, _MapUtils.tileToPixels)(tile);
      Object.assign(this.body, pixelPosition);
    }
  }, {
    key: 'initializePathSystem',
    value: function initializePathSystem(targets, walls) {
      this.walkingOnPathManager = new _ZombiePathManager2.default(this, targets, walls);

      this.state = STATES.NOT_WALKING;
    }
  }, {
    key: 'startPathSystem',
    value: function startPathSystem() {
      var _this2 = this;

      this.walkingOnPathManager.start(function () {
        return _this2.state = STATES.WALKING_ON_PATH;
      });
    }
  }, {
    key: 'initializeChasingSystem',
    value: function initializeChasingSystem(player, walls) {
      this.seekingPlayerManager = new _SeekingPlayerManager2.default(this, player, walls);
      this.seekingPlayerManager.chasePlayerSignal.add(this.changeStateToChasing, this);

      this.chasingPlayerManager = new _ChasingPlayerManager2.default(this, player);
      this.chasingPlayerManager.stopChasingPlayerSignal.add(this.changeStateToWalking, this);
    }
  }, {
    key: 'update',
    value: function update() {
      switch (this.state) {
        case STATES.WALKING_ON_PATH:
          this.handleWalkingOnPathState();
          break;
        case STATES.CHASING_PLAYER:
          this.handleChasingPlayerState();
      }
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter() {
      var _walkingOnPathManager, _seekingPlayerManager, _chasingPlayerManager;

      switch (this.state) {
        case STATES.WALKING_ON_PATH:
          (_walkingOnPathManager = this.walkingOnPathManager).onCollisionEnter.apply(_walkingOnPathManager, arguments);
          (_seekingPlayerManager = this.seekingPlayerManager).onCollisionEnter.apply(_seekingPlayerManager, arguments);
          break;
        case STATES.CHASING_PLAYER:
          (_chasingPlayerManager = this.chasingPlayerManager).onCollisionEnter.apply(_chasingPlayerManager, arguments);
          break;
      }
    }
  }, {
    key: 'onCollisionLeave',
    value: function onCollisionLeave() {
      var _seekingPlayerManager2, _chasingPlayerManager2;

      switch (this.state) {
        case STATES.WALKING_ON_PATH:
          (_seekingPlayerManager2 = this.seekingPlayerManager).onCollisionLeave.apply(_seekingPlayerManager2, arguments);
          break;
        case STATES.CHASING_PLAYER:
          (_chasingPlayerManager2 = this.chasingPlayerManager).onCollisionLeave.apply(_chasingPlayerManager2, arguments);
          break;
      }
    }
  }, {
    key: 'handleWalkingOnPathState',
    value: function handleWalkingOnPathState() {
      this.walkingOnPathManager.update();

      var currentTileTarget = this.walkingOnPathManager.getCurrentTileTarget();
      this.rotationManager.update(currentTileTarget);

      this.seekingPlayerManager.update();
    }
  }, {
    key: 'handleChasingPlayerState',
    value: function handleChasingPlayerState() {
      var lastKnownPlayerPosition = this.seekingPlayerManager.getLastKnownPlayerPosition();
      this.chasingPlayerManager.update(lastKnownPlayerPosition);
    }
  }, {
    key: 'changeStateToChasing',
    value: function changeStateToChasing() {
      this.state = STATES.CHASING_PLAYER;
    }
  }, {
    key: 'startChasingByBeingNotified',
    value: function startChasingByBeingNotified() {
      this.seekingPlayerManager.isNotified = true;
      this.changeStateToChasing();
    }
  }, {
    key: 'changeStateToWalking',
    value: function changeStateToWalking() {
      this.seekingPlayerManager.onStopChasing();
      this.walkingOnPathManager.getBackOnPath();
      this.state = STATES.WALKING_ON_PATH;
    }
  }, {
    key: 'isChasing',
    value: function isChasing() {
      return this.state === STATES.CHASING_PLAYER;
    }
  }, {
    key: 'takeDamage',
    value: function takeDamage(damage) {
      _Entity3.default.prototype.takeDamage.call(this, [damage]);
      if (this.health <= 0) {
        this._mask = null;
        this.destroy();
      }
    }
  }, {
    key: 'onPlayerDeath',
    value: function onPlayerDeath() {
      this.seekingPlayerManager.stopLookingForThePlayer();

      if (this.isChasing()) {
        this.changeStateToWalking();
      }
    }
  }]);

  return Zombie;
}(_Entity3.default);

exports.default = Zombie;

},{"../constants/TileMapConstants":11,"../constants/ZombieConstants":14,"../utils/MapUtils":45,"./Entity":20,"./ZombieComponents/ChasingPlayerManager":32,"./ZombieComponents/SeekingPlayerManager":35,"./ZombieComponents/ZombiePathManager":36,"./ZombieComponents/ZombieRotationManager":37}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _ZombieConstants = require('../../constants/ZombieConstants');

var CONSTANTS = _interopRequireWildcard(_ZombieConstants);

var _NotificationsManager = require('./NotificationsManager');

var _NotificationsManager2 = _interopRequireDefault(_NotificationsManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ChasingPlayerManager = function () {
  function ChasingPlayerManager(zombie, player) {
    _classCallCheck(this, ChasingPlayerManager);

    this.zombie = zombie;
    this.player = player;

    this.stopChasingPlayerSignal = new Phaser.Signal();

    // attack system init
    this.canDealDamage = true;
    this.isInAttackRange = false;

    var attackSensor = this.zombie.body.addCircle(CONSTANTS.ZOMBIE_ATTACK_RANGE);
    attackSensor.sensor = true;
    attackSensor.sensorType = 'attack';

    this.notificationsManager = new _NotificationsManager2.default(this.zombie);

    this.lastKnownPlayerPosition = Object.assign({}, this.player.position);
  }

  _createClass(ChasingPlayerManager, [{
    key: 'update',
    value: function update(lastKnownPlayerPosition) {
      this.lastKnownPlayerPosition = lastKnownPlayerPosition;
      this.zombie.game.physics.arcade.moveToObject(this.zombie, lastKnownPlayerPosition, CONSTANTS.ZOMBIE_SPEED * CONSTANTS.ZOMBIE_SPEED_CHASING_MULTIPLIER);
      this.zombie.lookAt(lastKnownPlayerPosition.x, lastKnownPlayerPosition.y);

      this.notificationsManager.update();

      if (this.shouldZombieStopChasingPlayer(lastKnownPlayerPosition)) {
        this.stopChasingPlayer();
      }

      if (this.shouldAttack()) {
        this.handleAttack();
      }
    }
  }, {
    key: 'shouldZombieStopChasingPlayer',
    value: function shouldZombieStopChasingPlayer(lastKnownPlayerPosition) {
      var distanceToTarget = this.zombie.game.physics.arcade.distanceBetween(this.zombie, lastKnownPlayerPosition);
      return (this.player.x !== lastKnownPlayerPosition.x || this.player.y !== lastKnownPlayerPosition.y) && distanceToTarget <= CONSTANTS.MIN_DISTANCE_TO_TARGET;
    }
  }, {
    key: 'stopChasingPlayer',
    value: function stopChasingPlayer() {
      this.stopChasingPlayerSignal.dispatch();
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter(bodyA, bodyB, shapeA) {
      if (bodyA == null || bodyA.sprite == null) {
        return;
      }
      if (shapeA.sensorType === 'attack' && bodyA.sprite.key === 'player') {
        this.isInAttackRange = true;
      }
      this.notificationsManager.onCollisionEnter(bodyA, bodyB, shapeA);
    }
  }, {
    key: 'onCollisionLeave',
    value: function onCollisionLeave(bodyA, bodyB, shapeA) {
      if (bodyA == null || bodyA.sprite == null) {
        return;
      }
      if (shapeA.sensorType === 'attack' && bodyA.sprite.key === 'player') {
        this.isInAttackRange = false;
      }

      this.notificationsManager.onCollisionLeave(bodyA, bodyB, shapeA);
    }
  }, {
    key: 'shouldAttack',
    value: function shouldAttack() {
      return this.zombie.alive && this.canDealDamage && this.isInAttackRange;
    }
  }, {
    key: 'handleAttack',
    value: function handleAttack() {
      this.zombie.animations.play('attack', CONSTANTS.ZOMBIE_FIGHT_ANIMATION_FRAMERATE, false);
      this.player.takeDamage(CONSTANTS.ZOMBIE_DAMAGE_VALUE);
      this.canDealDamage = false;
      this.zombie.game.time.events.add(Phaser.Timer.SECOND * CONSTANTS.ZOMBIE_DAMAGE_COOLDOWN, this.endCooldown, this);
      this.zombie.game.camera.shake(0.005, 100, false);
    }
  }, {
    key: 'endCooldown',
    value: function endCooldown() {
      this.canDealDamage = true;
      this.zombie.animations.play('walk', CONSTANTS.ZOMBIE_WALK_ANIMATION_FRAMERATE, true);
    }
  }]);

  return ChasingPlayerManager;
}();

exports.default = ChasingPlayerManager;

},{"../../constants/ZombieConstants":14,"./NotificationsManager":33}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _ZombieConstants = require('../../constants/ZombieConstants');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var NotificationsManager = function () {
  function NotificationsManager(zombie) {
    _classCallCheck(this, NotificationsManager);

    this.zombie = zombie;

    var notifySensor = zombie.body.addCircle(_ZombieConstants.ZOMBIE_NOTIFY_RANGE);
    notifySensor.sensor = true;
    notifySensor.sensorType = 'notify';

    this.zombiesToNotify = new Set();
  }

  _createClass(NotificationsManager, [{
    key: 'isItNotifySensor',
    value: function isItNotifySensor(shape, body) {
      if (!body || !body.sprite) {
        return false;
      }
      return shape.sensorType === 'notify' && body.sprite.key === 'zombie';
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter(bodyA, bodyB, shapeA) {
      if (this.isItNotifySensor(shapeA, bodyA)) {
        this.zombiesToNotify.add(bodyA.sprite);
      }
    }
  }, {
    key: 'onCollisionLeave',
    value: function onCollisionLeave(bodyA, bodyB, shapeA) {
      if (this.isItNotifySensor(shapeA, bodyA)) {
        this.zombiesToNotify.delete(bodyA.sprite);
      }
    }
  }, {
    key: 'update',
    value: function update() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.zombiesToNotify[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var zombieToNotify = _step.value;

          this.handleNotificationTry(zombieToNotify);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'handleNotificationTry',
    value: function handleNotificationTry(zombieToNotify) {
      if (zombieToNotify.isChasing() === false) {
        this.notify(zombieToNotify);
      }
    }
  }, {
    key: 'notify',
    value: function notify(zombieToNotify) {
      console.log('try');
      if (!zombieToNotify.seekingPlayerManager.isPlayerSeparatedFromZombie(this.zombie.chasingPlayerManager.lastKnownPlayerPosition)) {
        console.log('chase', this.zombie.chasingPlayerManager.lastKnownPlayerPosition);
        zombieToNotify.startChasingByBeingNotified(this.zombie.chasingPlayerManager.lastKnownPlayerPosition);
      }
    }
  }]);

  return NotificationsManager;
}();

exports.default = NotificationsManager;

},{"../../constants/ZombieConstants":14}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _easystarjs = require('easystarjs');

var _easystarjs2 = _interopRequireDefault(_easystarjs);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var PathFinder = function () {
  function PathFinder() {
    _classCallCheck(this, PathFinder);

    this.easystar = new _easystarjs2.default.js();

    this.easystar.setAcceptableTiles([0]);
  }

  _createClass(PathFinder, [{
    key: 'setGrid',
    value: function setGrid(grid) {
      this.easystar.setGrid(grid);
    }
  }, {
    key: 'findPath',
    value: function findPath(startX, startY, endX, endY, callback) {
      this.easystar.findPath(startX, startY, endX, endY, callback);
      this.easystar.calculate();
    }
  }]);

  return PathFinder;
}();

exports.default = PathFinder;

},{"easystarjs":1}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _ZombieConstants = require('../../constants/ZombieConstants');

var _MathUtils = require('../../utils/MathUtils');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var SeekingPlayerManager = function () {
  function SeekingPlayerManager(zombie, player, walls) {
    _classCallCheck(this, SeekingPlayerManager);

    this.zombie = zombie;
    this.player = player;
    this.walls = walls;

    this.state = 'searching';

    this.isPlayerInViewRange = false;
    this.isPlayerInHearingRange = false;

    var body = zombie.body;

    var viewSensor = body.addCircle(_ZombieConstants.ZOMBIE_SIGHT_RANGE);
    viewSensor.sensor = true;
    viewSensor.sensorType = 'view';

    var hearSensor = body.addCircle(_ZombieConstants.ZOMBIE_HEARING_RANGE);
    hearSensor.sensor = true;
    hearSensor.sensorType = 'hear';

    this.chasePlayerSignal = new Phaser.Signal();

    this.shouldLookForThePlayer = true;

    this.isNotified = false;
  }

  _createClass(SeekingPlayerManager, [{
    key: 'update',
    value: function update() {

      if (this.shouldLookForThePlayer && this.canDetectPlayer()) {
        this.changeStateToChasing();
      }
    }
  }, {
    key: 'canDetectPlayer',
    value: function canDetectPlayer() {
      if (this.isPlayerDead || this.isPlayerSeparatedFromZombie(this.player.position)) {
        return false;
      }

      if (this.isNotified === true) {
        return true;
      }

      return this.canSeePlayer() || this.canHearPlayer();
    }
  }, {
    key: 'isPlayerSeparatedFromZombie',
    value: function isPlayerSeparatedFromZombie(playerPosition) {
      /** Draw line between player and zombie and check if it can see him. If yes, chase him. */
      var playerSeekingRay = new Phaser.Line();
      playerSeekingRay.start.set(this.zombie.x, this.zombie.y);
      playerSeekingRay.end.set(playerPosition.x, playerPosition.y);

      var tileHits = this.walls.getRayCastTiles(playerSeekingRay, 0, false, false);

      for (var i = 0; i < tileHits.length; i++) {
        if (tileHits[i].index >= 0) {
          return true;
        }
      }

      return false;
    }
  }, {
    key: 'canSeePlayer',
    value: function canSeePlayer() {
      return this.isPlayerInViewRange && (0, _MathUtils.isInDegreeRange)(this.zombie, this.player, _ZombieConstants.ZOMBIE_SIGHT_ANGLE);
    }
  }, {
    key: 'canHearPlayer',
    value: function canHearPlayer() {
      return this.isPlayerInHearingRange && !this.player.isSneaking && this.player.isMoving();
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter(bodyA, bodyB, shapeA) {
      if (this.isItSensorArea(bodyA, shapeA)) {
        if (shapeA.sensorType === 'view' && bodyA.sprite.key === 'player') {
          this.isPlayerInViewRange = true;
        } else if (shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player') {
          this.isPlayerInHearingRange = true;
        }
      }
    }
  }, {
    key: 'onCollisionLeave',
    value: function onCollisionLeave(bodyA, bodyB, shapeA) {
      if (this.isItSensorArea(bodyA, shapeA)) {
        if (shapeA.sensorType === 'view' && bodyA.sprite.key === 'player') {
          this.isPlayerInViewRange = false;
        } else if (shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player') {
          this.isPlayerInHearingRange = false;
        }
      }
    }
  }, {
    key: 'isItSensorArea',
    value: function isItSensorArea(body, shape) {
      if (body == null || body.sprite == null || shape.sensor == null) {
        return false;
      }

      return shape.sensor;
    }
  }, {
    key: 'changeStateToChasing',
    value: function changeStateToChasing() {
      this.lastKnownPlayerPosition = Object.assign({}, this.player.position);
      this.chasePlayerSignal.dispatch();
    }
  }, {
    key: 'getLastKnownPlayerPosition',
    value: function getLastKnownPlayerPosition() {
      if (this.canDetectPlayer()) {
        this.lastKnownPlayerPosition = Object.assign({}, this.player.position);
      }
      return this.lastKnownPlayerPosition;
    }
  }, {
    key: 'stopLookingForThePlayer',
    value: function stopLookingForThePlayer() {
      this.shouldLookForThePlayer = false;
    }
  }, {
    key: 'onStopChasing',
    value: function onStopChasing() {
      this.isNotified = false;
    }
  }]);

  return SeekingPlayerManager;
}();

exports.default = SeekingPlayerManager;

},{"../../constants/ZombieConstants":14,"../../utils/MathUtils":46}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STATES = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _PathFinder = require('./PathFinder');

var _PathFinder2 = _interopRequireDefault(_PathFinder);

var _DeterminePathCollisionUtils = require('../../utils/DeterminePathCollisionUtils');

var _HandlePathCollisionUtils = require('../../utils/HandlePathCollisionUtils');

var _MapUtils = require('../../utils/MapUtils');

var _ZombieConstants = require('../../constants/ZombieConstants');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var STATES = exports.STATES = {
  NOT_STARTED: 0,
  ON_STANDARD_PATH: 1,
  ON_TEMPORARY_PATH: 2,
  CALCULATING_PATH: 3
};

var ZombiePathManager = function () {
  function ZombiePathManager(zombie, targets, walls) {
    _classCallCheck(this, ZombiePathManager);

    this.zombie = zombie;
    this.targets = targets;
    this.walls = walls;

    this.pathFinder = new _PathFinder2.default();
    this.pathFinder.setGrid(walls);

    this.pathsBetweenTargets = [];

    this.currentPathIndex = 0;
    this.currentStepIndex = 0;

    this.temporaryPath = [];
    this.temporaryStepIndex = 0;

    this.state = STATES.NOT_STARTED;
  }

  _createClass(ZombiePathManager, [{
    key: 'start',
    value: function start(callback) {
      var _this = this;

      // for now it assumes that zombie is placed on first path target
      this.calculatePathsBetweenTargets(function () {
        _this.state = STATES.ON_STANDARD_PATH;
        callback();
      });
    }
    // Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.
    // Recurse approach is used to handle asynchronous nature of findPath method.

  }, {
    key: 'calculatePathsBetweenTargets',
    value: function calculatePathsBetweenTargets(doneCallback) {
      var _this2 = this;

      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (this.pathsBetweenTargets.length === this.targets.length) {
        doneCallback();
        return;
      }

      var start = this.targets[index];
      var target = index === this.targets.length - 1 ? this.targets[0] : this.targets[index + 1];

      this.pathFinder.findPath(start.x, start.y, target.x, target.y, function (path) {
        _this2.pathsBetweenTargets.push({ path: path, start: start, target: target });
        _this2.calculatePathsBetweenTargets(doneCallback, index + 1);
      });
    }
  }, {
    key: 'update',
    value: function update() {
      switch (this.state) {
        case STATES.ON_STANDARD_PATH:
          this.moveOnStandardPath();
          break;
        case STATES.ON_TEMPORARY_PATH:
          this.moveOnTemporaryPath();
          break;
        case STATES.CALCULATING_PATH:
          this.zombie.body.velocity.x = 0;
          this.zombie.body.velocity.y = 0;
          break;
      }
    }
  }, {
    key: 'moveOnStandardPath',
    value: function moveOnStandardPath() {
      var stepTarget = this.getCurrentStepTarget();

      if (this.isReached(stepTarget)) {
        this.onStepTargetReach();
      }
      this.zombie.game.physics.arcade.moveToObject(this.zombie, (0, _MapUtils.tileToPixels)(stepTarget));
    }
  }, {
    key: 'isReached',
    value: function isReached(target) {
      var distanceToTarget = this.zombie.game.physics.arcade.distanceBetween(this.zombie, (0, _MapUtils.tileToPixels)(target));
      return distanceToTarget <= _ZombieConstants.MIN_DISTANCE_TO_TARGET;
    }
  }, {
    key: 'onStepTargetReach',
    value: function onStepTargetReach() {
      this.currentStepIndex++;

      if (this.currentStepIndex === this.pathsBetweenTargets[this.currentPathIndex].path.length) {
        this.currentStepIndex = 0;
        this.currentPathIndex++;

        if (this.currentPathIndex === this.pathsBetweenTargets.length) {
          this.currentPathIndex = 0;
        }
      }
    }
  }, {
    key: 'getCurrentStepTarget',
    value: function getCurrentStepTarget() {
      return this.pathsBetweenTargets[this.currentPathIndex].path[this.currentStepIndex];
    }
  }, {
    key: 'changePathToTemporary',
    value: function changePathToTemporary(startTile) {
      var _this3 = this;

      this.state = STATES.CALCULATING_PATH;

      var currentTarget = this.pathsBetweenTargets[this.currentPathIndex].target;

      this.pathFinder.findPath(startTile.x, startTile.y, currentTarget.x, currentTarget.y, function (path) {
        if (path.length === 0) {
          _this3.changePathToStandard();
          return;
        }
        _this3.temporaryPath = path;
        _this3.temporaryStepIndex = 0;

        _this3.state = STATES.ON_TEMPORARY_PATH;
      });
    }
  }, {
    key: 'getTemporaryStepTarget',
    value: function getTemporaryStepTarget() {
      return this.temporaryPath[this.temporaryStepIndex];
    }
  }, {
    key: 'changePathToStandard',
    value: function changePathToStandard() {
      this.currentPathIndex = this.currentPathIndex + 1 === this.pathsBetweenTargets.length ? 0 : this.currentPathIndex + 1;
      this.currentStepIndex = 0;
      this.state = STATES.ON_STANDARD_PATH;
    }
  }, {
    key: 'moveOnTemporaryPath',
    value: function moveOnTemporaryPath() {
      var temporaryStepTarget = this.getTemporaryStepTarget();
      if (this.isReached(temporaryStepTarget)) {
        this.onTemporaryStepTargetReach();
      }
      this.zombie.game.physics.arcade.moveToObject(this.zombie, (0, _MapUtils.tileToPixels)(temporaryStepTarget));
    }
  }, {
    key: 'onTemporaryStepTargetReach',
    value: function onTemporaryStepTargetReach() {
      this.temporaryStepIndex++;
      if (this.temporaryStepIndex === this.temporaryPath.length) {
        this.changePathToStandard();
      }
    }
  }, {
    key: 'onCollisionEnter',
    value: function onCollisionEnter(bodyA) {
      if (bodyA == null || bodyA.sprite == null) {
        return;
      }

      if (bodyA.sprite.key === 'zombie') {
        this.checkForCollisionPossibility(bodyA.sprite);
      }
    }
  }, {
    key: 'checkForCollisionPossibility',
    value: function checkForCollisionPossibility(zombieToCollideWith) {
      if ((0, _DeterminePathCollisionUtils.willZombiesPathsInterfere)(this, zombieToCollideWith.walkingOnPathManager)) {
        var newTemporaryTarget = (0, _HandlePathCollisionUtils.getFreeTileAroundZombieExcludingOtherZombie)(this.zombie, zombieToCollideWith, this.walls);
        this.changePathToTemporary(newTemporaryTarget);
      }
    }
  }, {
    key: 'getCurrentTileTarget',
    value: function getCurrentTileTarget() {
      if (this.state === STATES.ON_STANDARD_PATH) {
        return this.getCurrentStepTarget();
      } else if (this.state === STATES.ON_TEMPORARY_PATH) {
        return this.getTemporaryStepTarget();
      }
      return (0, _MapUtils.pixelsToTile)(this.zombie);
    }
  }, {
    key: 'getBackOnPath',
    value: function getBackOnPath() {
      var zombieTile = (0, _MapUtils.pixelsToTile)(this.zombie);
      this.changePathToTemporary(zombieTile);
    }
  }]);

  return ZombiePathManager;
}();

exports.default = ZombiePathManager;

},{"../../constants/ZombieConstants":14,"../../utils/DeterminePathCollisionUtils":42,"../../utils/HandlePathCollisionUtils":43,"../../utils/MapUtils":45,"./PathFinder":34}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _ZombieConstants = require('../../constants/ZombieConstants');

var _MapUtils = require('../../utils/MapUtils');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ZombieRotationManager = function () {
  function ZombieRotationManager(zombie) {
    _classCallCheck(this, ZombieRotationManager);

    this.zombie = zombie;
  }

  _createClass(ZombieRotationManager, [{
    key: 'update',
    value: function update(tileTarget) {
      var lookTarget = this.getLookTarget(tileTarget);
      var targetPoint = new Phaser.Point(lookTarget.x, lookTarget.y);
      var entityCenter = new Phaser.Point(this.zombie.body.x + this.zombie.width / 2, this.zombie.body.y + this.zombie.height / 2);

      var deltaTargetRad = this.zombie.rotation - Phaser.Math.angleBetweenPoints(targetPoint, entityCenter) - 1.5 * Math.PI;

      deltaTargetRad = deltaTargetRad % (Math.PI * 2);

      if (deltaTargetRad != deltaTargetRad % Math.PI) {
        deltaTargetRad = deltaTargetRad + Math.PI * (deltaTargetRad < 0 ? 2 : -2);
      }

      this.zombie.body.rotateLeft(_ZombieConstants.ZOMBIE_ROTATING_SPEED * deltaTargetRad);
    }
  }, {
    key: 'getLookTarget',
    value: function getLookTarget(tile) {
      var velocity = this.zombie.body.velocity;
      var tileCoords = (0, _MapUtils.tileToPixels)(tile);
      var veryFarAway = 1000;

      if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
        if (velocity.x > 0) {
          tileCoords.x += veryFarAway;
        } else {
          tileCoords.x -= veryFarAway;
        }
      } else if (Math.abs(velocity.x) < Math.abs(velocity.y)) {
        if (velocity.y > 0) {
          tileCoords.y += veryFarAway;
        } else {
          tileCoords.y -= veryFarAway;
        }
      }

      return tileCoords;
    }
  }]);

  return ZombieRotationManager;
}();

exports.default = ZombieRotationManager;

},{"../../constants/ZombieConstants":14,"../../utils/MapUtils":45}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Boot = function (_Phaser$State) {
  _inherits(Boot, _Phaser$State);

  function Boot() {
    _classCallCheck(this, Boot);

    return _possibleConstructorReturn(this, (Boot.__proto__ || Object.getPrototypeOf(Boot)).apply(this, arguments));
  }

  _createClass(Boot, [{
    key: 'preload',
    value: function preload() {}
  }, {
    key: 'create',
    value: function create() {
      // this.game.stage.disableVisibilityChange = true;

      // this.game.scale.maxWidth = 800;
      // this.game.scale.maxHeight = 600;

      this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.game.scale.updateLayout();

      this.game.physics.startSystem(Phaser.Physics.P2JS);
      this.game.physics.p2.setImpactEvents(true);
      this.state.start('Preload');
    }
  }]);

  return Boot;
}(Phaser.State);

exports.default = Boot;

},{}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _Player = require('../objects/Player');

var _Player2 = _interopRequireDefault(_Player);

var _Zombie = require('../objects/Zombie');

var _Zombie2 = _interopRequireDefault(_Zombie);

var _TileMap = require('../objects/TileMap');

var _TileMap2 = _interopRequireDefault(_TileMap);

var _JournalsManager = require('../objects/JournalsManager');

var _JournalsManager2 = _interopRequireDefault(_JournalsManager);

var _Journal = require('../objects/Journal');

var _Journal2 = _interopRequireDefault(_Journal);

var _BoidsManager = require('../objects/BoidsManager');

var _BoidsManager2 = _interopRequireDefault(_BoidsManager);

var _GameOverUI = require('../UI/GameOverUI');

var _GameOverUI2 = _interopRequireDefault(_GameOverUI);

var _LightsManager = require('../objects/LightsComponents/LightsManager');

var _LightsManager2 = _interopRequireDefault(_LightsManager);

var _TorchLight = require('../objects/LightsComponents/TorchLight');

var _TorchLight2 = _interopRequireDefault(_TorchLight);

var _PlayerConstants = require('../constants/PlayerConstants');

var _TileMapConstants = require('../constants/TileMapConstants');

var _MapUtils = require('../utils/MapUtils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Game = function (_Phaser$State) {
  _inherits(Game, _Phaser$State);

  function Game() {
    _classCallCheck(this, Game);

    return _possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).apply(this, arguments));
  }

  _createClass(Game, [{
    key: 'create',
    value: function create() {
      var _this2 = this;

      this.map = new _TileMap2.default(this.game, 'map', _TileMapConstants.TILE_WIDTH, _TileMapConstants.TILE_HEIGHT);
      this.zombies = [];

      this.initPlayer();
      this.initCollisionGroups();
      this.initZombies();
      this.initJournals();
      this.setCollisionRelations();
      this.initFlashlight();
      this.initGameOverUI();

      this.player.onDeath.add(function () {
        return _this2.handleGameEnd();
      });
    }
  }, {
    key: 'initCollisionGroups',
    value: function initCollisionGroups() {
      this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup(this.player);
      this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();
      this.journalsCollisionGroup = this.game.physics.p2.createCollisionGroup();
    }
  }, {
    key: 'initPlayer',
    value: function initPlayer() {
      var playerPos = this.map.getPlayerInitialPosition();

      this.player = new _Player2.default(this.game, playerPos.x, playerPos.y, 'player', _PlayerConstants.PLAYER_INITIAL_FRAME, this.zombies);
      this.game.camera.follow(this.player);
    }
  }, {
    key: 'initZombies',
    value: function initZombies() {
      var _this3 = this;

      var wallsPositions = (0, _MapUtils.getWallsPositions)(this.map.walls);
      this.zombies = new _BoidsManager2.default(this.game, wallsPositions);

      var _loop = function _loop(i) {
        var newZombie = new _Zombie2.default(_this3.game, 'zombie');

        newZombie.setTilePosition(_this3.map.paths[i][0]);
        newZombie.initializeChasingSystem(_this3.player, _this3.map.walls);
        newZombie.body.setCollisionGroup(_this3.zombiesCollisionGroup);
        newZombie.initializePathSystem(_this3.map.getPath(i), wallsPositions);
        newZombie.startPathSystem();

        _this3.player.onDeath.add(function () {
          return newZombie.onPlayerDeath();
        });

        _this3.zombies.add(newZombie);
      };

      for (var i = 0; i < this.map.paths.length; i++) {
        _loop(i);
      }
    }
  }, {
    key: 'initJournals',
    value: function initJournals() {
      var _this4 = this;

      this.journals = new _JournalsManager2.default(this.game, this.player);

      var journalsData = this.map.getJournals();
      var journalsContent = this.game.cache.getJSON('journals');

      this.game.input.mouse.mouseWheelCallback = function () {
        return _this4.journals.onMouseWheel();
      };

      for (var i = 0; i < journalsData.length; i++) {
        var content = journalsContent[journalsData[i].name];
        var newJournal = new _Journal2.default(this.game, content, 'computer');
        newJournal.setCorner(journalsData[i].cornerX, journalsData[i].cornerY);
        newJournal.setPosition(journalsData[i].x, journalsData[i].y);
        newJournal.enableJournal();

        newJournal.body.setCollisionGroup(this.journalsCollisionGroup);

        this.journals.add(newJournal);
      }

      this.player.body.onBeginContact.add(function () {
        var _journals;

        return (_journals = _this4.journals).onCollisionEnter.apply(_journals, arguments);
      });
      this.player.body.onEndContact.add(function () {
        var _journals2;

        return (_journals2 = _this4.journals).onCollisionLeave.apply(_journals2, arguments);
      });
    }
  }, {
    key: 'setCollisionRelations',
    value: function setCollisionRelations() {
      var _this5 = this;

      this.map.collides([this.playerCollisionGroup, this.zombiesCollisionGroup]);
      this.player.body.collides([this.map.wallsCollisionGroup, this.zombiesCollisionGroup, this.journalsCollisionGroup]);

      this.zombies.forEach(function (zombie) {
        zombie.body.collides([_this5.playerCollisionGroup, _this5.map.wallsCollisionGroup, _this5.journalsCollisionGroup, _this5.zombiesCollisionGroup]);
      });

      this.journals.forEach(function (journal) {
        journal.body.collides([_this5.playerCollisionGroup, _this5.zombiesCollisionGroup]);
      });
    }
  }, {
    key: 'initFlashlight',
    value: function initFlashlight() {
      var _this6 = this;

      this.lightsManager = new _LightsManager2.default(this.game, this.map.walls);
      this.player.setUpFlashlight(this.map.walls);
      this.lightsManager.add(this.player.flashlight);

      this.journals.forEach(function (journal) {
        _this6.lightsManager.add(journal.light);
      });

      this.lightsManager.add(new _TorchLight2.default({ x: 64 + 32, y: 6 * 64 + 32 }));
    }
  }, {
    key: 'initGameOverUI',
    value: function initGameOverUI() {
      var _this7 = this;

      var mainMenuCallback = function mainMenuCallback() {
        return _this7.state.start('Menu');
      };
      var restartCallback = function restartCallback() {
        return _this7.state.restart();
      };
      this.gameOverUI = new _GameOverUI2.default(this.game, mainMenuCallback, restartCallback);
    }
  }, {
    key: 'handleGameEnd',
    value: function handleGameEnd() {
      this.clearScreen();
      this.gameOverUI.start();
    }
  }, {
    key: 'clearScreen',
    value: function clearScreen() {
      this.journals.clearUI();
    }
  }, {
    key: 'update',
    value: function update() {
      if (this.lightsManager) {
        this.lightsManager.update();
      }
    }
  }]);

  return Game;
}(Phaser.State);

exports.default = Game;

},{"../UI/GameOverUI":7,"../constants/PlayerConstants":10,"../constants/TileMapConstants":11,"../objects/BoidsManager":19,"../objects/Journal":21,"../objects/JournalsManager":22,"../objects/LightsComponents/LightsManager":26,"../objects/LightsComponents/TorchLight":28,"../objects/Player":29,"../objects/TileMap":30,"../objects/Zombie":31,"../utils/MapUtils":45}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Menu = function (_Phaser$State) {
  _inherits(Menu, _Phaser$State);

  function Menu() {
    _classCallCheck(this, Menu);

    var _this = _possibleConstructorReturn(this, (Menu.__proto__ || Object.getPrototypeOf(Menu)).call(this));

    _this.levels = ['Level1', 'Level2'];
    return _this;
  }

  _createClass(Menu, [{
    key: 'create',
    value: function create() {
      var _this2 = this;

      this.state.start(this.levels[0]);

      window.goToLevel = function (n) {
        if (_this2.levels[n - 1]) {
          _this2.state.start(_this2.levels[n - 1]);
        } else {
          return 'Level not found!';
        }
      };
    }
  }]);

  return Menu;
}(Phaser.State);

exports.default = Menu;

},{}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _PlayerConstants = require('../constants/PlayerConstants.js');

var _ZombieConstants = require('../constants/ZombieConstants.js');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Preload = function (_Phaser$State) {
  _inherits(Preload, _Phaser$State);

  function Preload() {
    _classCallCheck(this, Preload);

    return _possibleConstructorReturn(this, (Preload.__proto__ || Object.getPrototypeOf(Preload)).apply(this, arguments));
  }

  _createClass(Preload, [{
    key: 'preload',
    value: function preload() {
      this.load.image('tilemap_floor', 'assets/tilemaps/tilemap_floor.png');
      this.load.image('tilemap_walls', 'assets/tilemaps/tilemap_walls.png');

      this.game.load.spritesheet('player', './assets/images/player-sheet.png', _PlayerConstants.PLAYER_WIDTH, _PlayerConstants.PLAYER_HEIGHT);
      this.game.load.spritesheet('zombie', './assets/images/zombie-sheet.png', _ZombieConstants.ZOMBIE_WIDTH, _ZombieConstants.ZOMBIE_HEIGHT);

      this.game.load.image('computer', './assets/images/computer.png');
      this.game.load.image('layer-background', './assets/images/bg-color.png');
      this.game.load.image('journal-ui', './assets/images/journal-ui.png');

      this.game.load.image('main-menu-btn', './assets/images/main-menu-btn.png');
      this.game.load.image('restart-btn', './assets/images/restart-btn.png');
    }
  }, {
    key: 'create',
    value: function create() {
      this.state.start('Menu');
    }
  }]);

  return Preload;
}(Phaser.State);

exports.default = Preload;

},{"../constants/PlayerConstants.js":10,"../constants/ZombieConstants.js":14}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.willZombiesPathsInterfere = willZombiesPathsInterfere;

var _MapUtils = require('./MapUtils');

var _ZombiePathManager = require('../objects/ZombieComponents/ZombiePathManager');

function willZombiesPathsInterfere(zombie1, zombie2) {
  if (!isZombieInMovement(zombie1) || !isZombieInMovement(zombie2)) {
    return false;
  }

  var zombie1NextTile = getZombieNextStepTarget(zombie1);
  var zombie2NextTile = getZombieNextStepTarget(zombie2);
  var zombie1CurrentTile = getZombieCurrentStepTarget(zombie1);
  var zombie2CurrentTile = getZombieCurrentStepTarget(zombie2);

  return (0, _MapUtils.areTilesTheSame)(zombie1NextTile, zombie2NextTile) || (0, _MapUtils.areTilesTheSame)(zombie1NextTile, zombie2CurrentTile) || (0, _MapUtils.areTilesTheSame)(zombie1CurrentTile, zombie2CurrentTile) || (0, _MapUtils.areTilesTheSame)(zombie2CurrentTile, zombie2CurrentTile);
}

function getZombieNextStepTarget(zombie) {
  var nextStepTarget = void 0;
  switch (zombie.state) {
    case _ZombiePathManager.STATES.ON_STANDARD_PATH:
      nextStepTarget = getZombieNextStandardStepTarget(zombie);
      break;
    case _ZombiePathManager.STATES.ON_TEMPORARY_PATH:
      nextStepTarget = getZombieNextTemporaryStepTarget(zombie);
  }
  return nextStepTarget;
}

function getZombieNextStandardStepTarget(zombie) {
  var nextStepTargetIndex = zombie.currentStepIndex + 1;
  var nextStepTargetPathIndex = zombie.currentPathIndex;

  if (nextStepTargetIndex === zombie.pathsBetweenTargets[zombie.currentPathIndex].path.length) {
    nextStepTargetIndex = 0;
    nextStepTargetPathIndex++;

    if (nextStepTargetPathIndex === zombie.pathsBetweenTargets.length) {
      nextStepTargetPathIndex = 0;
    }
  }

  return zombie.pathsBetweenTargets[nextStepTargetPathIndex].path[nextStepTargetIndex];
}

function getZombieNextTemporaryStepTarget(zombie) {
  var nextTemporaryStepTargetIndex = zombie.temporaryStepIndex + 1;

  if (nextTemporaryStepTargetIndex === zombie.temporaryPath.length) {
    var nextPathIndex = zombie.currentPathIndex + 1;

    if (nextPathIndex === zombie.pathsBetweenTargets.length) {
      return zombie.pathsBetweenTargets[0].path[1];
    }
    return zombie.pathsBetweenTargets[nextPathIndex].path[1];
  }
  return zombie.temporaryPath[nextTemporaryStepTargetIndex];
}

function getZombieCurrentStepTarget(zombie) {
  switch (zombie.state) {
    case _ZombiePathManager.STATES.ON_STANDARD_PATH:
      return zombie.getCurrentStepTarget();
    case _ZombiePathManager.STATES.ON_TEMPORARY_PATH:
      return zombie.getTemporaryStepTarget();
  }
}

function isZombieInMovement(zombie) {
  return zombie.state !== _ZombiePathManager.STATES.CALCULATING_PATH && zombie.state !== _ZombiePathManager.STATES.NOT_STARTED;
}

},{"../objects/ZombieComponents/ZombiePathManager":36,"./MapUtils":45}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFreeTileAroundZombieExcludingOtherZombie = getFreeTileAroundZombieExcludingOtherZombie;

var _MapUtils = require('./MapUtils');

function getFreeTileAroundZombieExcludingOtherZombie(zombie, zombieToExclude, mapGrid) {
  var zombieTile = (0, _MapUtils.pixelsToTile)(zombie);

  var collisionSide = getBodyCollisionSide(zombie, zombieToExclude);

  var tileToExclude = getTileToExcludeBaseOnCollisionSide(zombieTile, collisionSide);

  return getFreeTileAroundTileExcludingOtherTile(zombieTile, tileToExclude, mapGrid);
}

function getBodyCollisionSide(zombie1, zombie2) {
  var zombieOffsetX = zombie1.position.x - zombie2.position.x;
  var zombieOffsetY = zombie1.position.y - zombie2.position.y;

  var directionX = zombieOffsetX > 0 ? 'LEFT' : 'RIGHT';
  var directionY = zombieOffsetY > 0 ? 'UP' : 'DOWN';

  return Math.abs(zombieOffsetX) < Math.abs(zombieOffsetY) ? directionX : directionY;
}

function getTileToExcludeBaseOnCollisionSide(tile, collisionSide) {
  var tileCandidates = getTileCandidates(tile);

  switch (collisionSide) {
    case 'UP':
      return tileCandidates[0];
    case 'DOWN':
      return tileCandidates[1];
    case 'LEFT':
      return tileCandidates[2];
    case 'RIGHT':
      return tileCandidates[3];
  }
}

function getFreeTileAroundTileExcludingOtherTile(tile, tileToExclude, mapGrid) {
  var tileCandidates = getTileCandidates(tile);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = tileCandidates[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var tileCandidate = _step.value;

      if (!(0, _MapUtils.areTilesTheSame)(tileCandidate, tileToExclude) && !isWall(tileCandidate, mapGrid)) {
        return tileCandidate;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  throw new Error('Couldn\'t find tile');
}

function isWall(tile, mapGrid) {
  return mapGrid[tile.x][tile.y] === 1;
}

function getTileCandidates(tile) {
  return [{ x: tile.x, y: tile.y - 1 }, { x: tile.x, y: tile.y + 1 }, { x: tile.x - 1, y: tile.y }, { x: tile.x + 1, y: tile.y }];
}

},{"./MapUtils":45}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var optimizeShape = exports.optimizeShape = function optimizeShape(shape) {
  return shape.filter(function (point, index) {
    if (index === 0 || index === shape.length - 1) {
      return true;
    }
    if (point.x === shape[index - 1].x && point.x === shape[index + 1].x || point.y === shape[index - 1].y && point.y === shape[index + 1].y) {
      return false;
    }
    return true;
  });
};

},{}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWallsPositions = exports.pixelsToTile = exports.tileToPixels = exports.pixelsToTileY = exports.pixelsToTileX = exports.areTilesTheSame = undefined;
exports.isTileBlocking = isTileBlocking;

var _TileMapConstants = require('../constants/TileMapConstants');

var areTilesTheSame = exports.areTilesTheSame = function areTilesTheSame(tile1, tile2) {
  return tile1.x === tile2.x && tile1.y === tile2.y;
};

var pixelsToTileX = exports.pixelsToTileX = function pixelsToTileX(coord) {
  return Math.floor(coord / _TileMapConstants.TILE_WIDTH);
};
var pixelsToTileY = exports.pixelsToTileY = function pixelsToTileY(coord) {
  return Math.floor(coord / _TileMapConstants.TILE_HEIGHT);
};

var tileToPixels = exports.tileToPixels = function tileToPixels(tile) {
  return {
    x: tile.x * _TileMapConstants.TILE_WIDTH + _TileMapConstants.TILE_WIDTH / 2,
    y: tile.y * _TileMapConstants.TILE_HEIGHT + _TileMapConstants.TILE_HEIGHT / 2
  };
};

var pixelsToTile = exports.pixelsToTile = function pixelsToTile(coords) {
  return {
    x: Math.floor(coords.x / _TileMapConstants.TILE_WIDTH),
    y: Math.floor(coords.y / _TileMapConstants.TILE_HEIGHT)
  };
};

var getWallsPositions = exports.getWallsPositions = function getWallsPositions(layer) {
  var walls = layer.getTiles(0, 0, 2048, 2048);
  var wallsArr = [];

  var currentY = [];

  walls.forEach(function (v, i) {
    if (v.index !== -1) {
      currentY.push(1);
    } else {
      currentY.push(0);
    }

    if (i % _TileMapConstants.MAP_WIDTH === _TileMapConstants.MAP_WIDTH - 1) {
      wallsArr.push(currentY);
      currentY = [];
    }
  });

  return wallsArr;
};

function isTileBlocking(begin, end, walls) {
  var ray = new Phaser.Line();
  ray.start.set(begin.x, begin.y);
  ray.end.set(end.x, end.y);

  var tileHits = walls.getRayCastTiles(ray, 0, false, false);

  for (var i = 0; i < tileHits.length; i++) {
    if (tileHits[i].index >= 0) {
      return true;
    }
  }

  return false;
}

},{"../constants/TileMapConstants":11}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isInDegreeRange = isInDegreeRange;
function isInDegreeRange(entity, target, sightAngle) {
  var angleDelta = Math.abs(Phaser.Math.radToDeg(Phaser.Math.angleBetween(entity.x, entity.y, target.x, target.y)) + 90 - entity.angle);

  return angleDelta <= sightAngle || angleDelta >= 360 - sightAngle;
}

},{}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.showBackgroundLayer = showBackgroundLayer;
var getScreenCenter = exports.getScreenCenter = function getScreenCenter(game) {
  return {
    x: game.camera.x + game.camera.width / 2,
    y: game.camera.y + game.camera.height / 2
  };
};

function showBackgroundLayer(game) {
  var screenCenter = getScreenCenter(game);

  var backgroundLayer = game.add.sprite(screenCenter.x, screenCenter.y, 'layer-background');
  backgroundLayer.width = game.width + 100;
  backgroundLayer.height = game.height + 100;
  backgroundLayer.anchor.setTo(0.5);
  backgroundLayer.alpha = 0.2;

  return backgroundLayer;
}

},{}]},{},[16])
//# sourceMappingURL=game.js.map
