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

var _Boot = require('./states/Boot');

var _Boot2 = _interopRequireDefault(_Boot);

var _Preload = require('./states/Preload');

var _Preload2 = _interopRequireDefault(_Preload);

var _Menu = require('./states/Menu');

var _Menu2 = _interopRequireDefault(_Menu);

var _Game = require('./states/Game');

var _Game2 = _interopRequireDefault(_Game);

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
    _this.state.add('Game', _Game2.default);

    _this.state.start('Boot');
    return _this;
  }

  return ProjectNostradamus;
}(Phaser.Game);

exports.default = ProjectNostradamus;

},{"./states/Boot":19,"./states/Game":20,"./states/Menu":21,"./states/Preload":22}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var PLAYER_WIDTH = exports.PLAYER_WIDTH = 30;
var PLAYER_HEIGHT = exports.PLAYER_HEIGHT = 24;
var PLAYER_INITIAL_FRAME = exports.PLAYER_INITIAL_FRAME = 1;
var PLAYER_SPEED = exports.PLAYER_SPEED = 200;
var PLAYER_SNEAK_MULTIPLIER = exports.PLAYER_SNEAK_MULTIPLIER = 0.75;
var PLAYER_SPRINT_MULTIPLIER = exports.PLAYER_SPRINT_MULTIPLIER = 2.5;
var PLAYER_WALK_ANIMATION_FRAMERATE = exports.PLAYER_WALK_ANIMATION_FRAMERATE = 5;
var PLAYER_FIGHT_ANIMATION_FRAMERATE = exports.PLAYER_FIGHT_ANIMATION_FRAMERATE = 10;

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var TILE_WIDTH = exports.TILE_WIDTH = 64;
var TILE_HEIGHT = exports.TILE_HEIGHT = 64;
var MAP_WIDTH = exports.MAP_WIDTH = 32;
var MAP_HEIGHT = exports.MAP_HEIGHT = 32;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ZOMBIE_WIDTH = exports.ZOMBIE_WIDTH = 30;
var ZOMBIE_HEIGHT = exports.ZOMBIE_HEIGHT = 24;
var ZOMBIE_INITIAL_FRAME = exports.ZOMBIE_INITIAL_FRAME = 1;
var ZOMBIE_SPEED = exports.ZOMBIE_SPEED = 100;
var ZOMBIE_SPEED_CHASING_MULTIPLIER = exports.ZOMBIE_SPEED_CHASING_MULTIPLIER = 2;
var ZOMBIE_LOOKING_OFFSET = exports.ZOMBIE_LOOKING_OFFSET = 10;
var ZOMBIE_WALK_ANIMATION_FRAMERATE = exports.ZOMBIE_WALK_ANIMATION_FRAMERATE = 5;
var ZOMBIE_FIGHT_ANIMATION_FRAMERATE = exports.ZOMBIE_FIGHT_ANIMATION_FRAMERATE = 10;
var MIN_DISTANCE_TO_TARGET = exports.MIN_DISTANCE_TO_TARGET = 10;
var ZOMBIE_SIGHT_ANGLE = exports.ZOMBIE_SIGHT_ANGLE = 45;
var ZOMBIE_SIGHT_RANGE = exports.ZOMBIE_SIGHT_RANGE = 500;
var ZOMBIE_HEARING_RANGE = exports.ZOMBIE_HEARING_RANGE = 100;
var ZOMBIE_ROTATING_SPEED = exports.ZOMBIE_ROTATING_SPEED = 50;

},{}],10:[function(require,module,exports){
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

},{"./ProjectNostradamus":6}],11:[function(require,module,exports){
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
  }]);

  return Entity;
}(Phaser.Sprite);

exports.default = Entity;

},{}],12:[function(require,module,exports){
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

var _PathFinder = require('../objects/PathFinder.js');

var _PathFinder2 = _interopRequireDefault(_PathFinder);

var _ZombieConstants = require('../constants/ZombieConstants');

var _MapUtils = require('../utils/MapUtils.js');

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

/** Create Entity that is supposed to walk on given path. Set position of entity on first given target*/
var EntityWalkingOnPath = function (_Entity) {
  _inherits(EntityWalkingOnPath, _Entity);

  function EntityWalkingOnPath(game, imageKey, frame, targets, walls) {
    _classCallCheck(this, EntityWalkingOnPath);

    var position = (0, _MapUtils.tileToPixels)(targets[0]);

    var _this = _possibleConstructorReturn(this, (EntityWalkingOnPath.__proto__ || Object.getPrototypeOf(EntityWalkingOnPath)).call(this, game, position.x, position.y, imageKey, frame));

    _this.pathfinder = new _PathFinder2.default();
    _this.wallsPositions = (0, _MapUtils.getWallsPostions)(walls);

    _this.pathfinder.setGrid(_this.wallsPositions);

    _this.targets = targets;

    _this.pathsBetweenPathTargets = [];

    _this.currentPathIndex = 0;
    _this.currentStepIndex = 0;

    _this.isOnStandardPath = true;
    _this.temporaryPath = [];
    _this.temporaryStepIndex = 0;

    /* disable update until paths are calculated */
    _this.isInitialized = false;
    _this.canMove = false;

    _this.calculatePathsBetweenTargets(function () {
      _this.stepTarget = _this.pathsBetweenPathTargets[_this.currentPathIndex].path[_this.currentStepIndex];
      _this.isInitialized = true;
      _this.canMove = true;
    });
    return _this;
  }
  /**Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.  Recurse approach is used to handle asynchronous nature of findPath method */

  _createClass(EntityWalkingOnPath, [{
    key: 'calculatePathsBetweenTargets',
    value: function calculatePathsBetweenTargets(doneCallback) {
      var _this2 = this;

      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (this.pathsBetweenPathTargets.length === this.targets.length) {
        doneCallback();
        return;
      }

      var start = this.targets[index];
      var target = index === this.targets.length - 1 ? this.targets[0] : this.targets[index + 1];

      this.pathfinder.findPath(start.x, start.y, target.x, target.y, function (path) {
        _this2.pathsBetweenPathTargets.push({ path: path, start: start, target: target });
        _this2.calculatePathsBetweenTargets(doneCallback, index + 1);
      });
    }
  }, {
    key: 'update',
    value: function update() {
      /** Check if current target or step target is reached. Move body in stepTarget direction. */
      if (this.canMove) {
        if (this.isReached(this.stepTarget)) {
          this.onStepTargetReach();
        }
        this.game.physics.arcade.moveToObject(this, (0, _MapUtils.tileToPixels)(this.stepTarget), _ZombieConstants.ZOMBIE_SPEED);

        this.updateLookDirection();
      }
    }
    /** When current step target or temporary step target is reached, set step target to the next one.*/
    /** If current target is reached or temporary target is reached set path to the next one, or get back to standard path*/

  }, {
    key: 'onStepTargetReach',
    value: function onStepTargetReach() {
      if (this.isOnStandardPath) {
        if (this.currentStepIndex + 1 === this.pathsBetweenPathTargets[this.currentPathIndex].path.length) {
          this.currentPathIndex = this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ? 0 : this.currentPathIndex + 1;
          this.currentStepIndex = 0;
        } else {
          this.currentStepIndex++;
        }
        this.stepTarget = this.pathsBetweenPathTargets[this.currentPathIndex].path[this.currentStepIndex];
      } else {
        if (this.temporaryStepIndex + 1 === this.temporaryPath.length) {
          this.changePathToStandard();
        } else {
          this.temporaryStepIndex++;
          this.stepTarget = this.temporaryPath[this.temporaryStepIndex];
        }
      }
    }
  }, {
    key: 'updateLookDirection',
    value: function updateLookDirection() {
      var lookTarget = (0, _MapUtils.tileToPixels)(this.stepTarget);
      //TODO make target point be the end of target tile
      var targetPoint = new Phaser.Point(lookTarget.x, lookTarget.y);
      var entityCenter = new Phaser.Point(this.body.x + this.width / 2, this.body.y + this.height / 2);

      var deltaTargetRad = this.rotation - Phaser.Math.angleBetweenPoints(targetPoint, entityCenter) - Math.PI / 2 - Math.PI;

      deltaTargetRad = deltaTargetRad % (Math.PI * 2);

      if (deltaTargetRad != deltaTargetRad % Math.PI) {
        deltaTargetRad = deltaTargetRad < 0 ? deltaTargetRad + Math.PI * 2 : deltaTargetRad - Math.PI * 2;
      }

      this.body.rotateLeft(_ZombieConstants.ZOMBIE_ROTATING_SPEED * deltaTargetRad);
    }
  }, {
    key: 'isReached',
    value: function isReached(target) {
      var distanceToTarget = this.game.physics.arcade.distanceBetween(this, (0, _MapUtils.tileToPixels)(target));
      return distanceToTarget <= _ZombieConstants.MIN_DISTANCE_TO_TARGET;
    }
  }, {
    key: 'calculateTemporaryPath',
    value: function calculateTemporaryPath(start, target, callback) {
      this.pathfinder.findPath(start.x, start.y, target.x, target.y, callback);
    }
    /**
    * Change path to temporary and automatically get back to standard path, after reaching temporary target.
    * @param {tile} start - start tile coordinates, if this tile is different that entity's tile then it goes straight to this tile.
    * @param {tile} target - target tile coordinates, this should be initialized with current path target otherwise some unpredictable things may happen.
    */

  }, {
    key: 'changePathToTemporary',
    value: function changePathToTemporary(start) {
      var _this3 = this;

      var currentTarget = this.pathsBetweenPathTargets[this.currentPathIndex].target;

      this.canMove = false;
      this.calculateTemporaryPath(start, currentTarget, function (path) {
        if (path.length === 0) {
          _this3.changePathToStandard();
          return;
        }
        _this3.temporaryPath = path;
        _this3.temporaryStepIndex = 0;
        _this3.stepTarget = path[_this3.temporaryStepIndex];
        _this3.isOnStandardPath = false;
        _this3.canMove = true;
      });
    }
  }, {
    key: 'changePathToStandard',
    value: function changePathToStandard() {
      this.currentPathIndex = this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ? 0 : this.currentPathIndex + 1;
      this.currentStepIndex = 0;
      this.stepTarget = this.pathsBetweenPathTargets[this.currentPathIndex].path[this.currentStepIndex];
      this.isOnStandardPath = true;
    }
  }, {
    key: 'disableMovement',
    value: function disableMovement() {
      this.canMove = false;
      this.resetVelocity();
    }
  }, {
    key: 'enableMovement',
    value: function enableMovement() {
      this.canMove = true;
    }
  }]);

  return EntityWalkingOnPath;
}(_Entity3.default);

exports.default = EntityWalkingOnPath;

},{"../constants/ZombieConstants":9,"../objects/PathFinder.js":13,"../utils/MapUtils.js":24,"./Entity":11}],13:[function(require,module,exports){
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

},{"easystarjs":1}],14:[function(require,module,exports){
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

  function Player(game, x, y, imageKey, frame) {
    _classCallCheck(this, Player);

    var _this = _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this, game, x, y, imageKey, frame));

    _this.width = _PlayerConstants.PLAYER_WIDTH;
    _this.height = _PlayerConstants.PLAYER_HEIGHT;

    _this.isSneaking = false;
    _this.isSprinting = false;

    _this.cursors = {
      up: _this.game.input.keyboard.addKey(Phaser.Keyboard.W),
      down: _this.game.input.keyboard.addKey(Phaser.Keyboard.S),
      left: _this.game.input.keyboard.addKey(Phaser.Keyboard.A),
      right: _this.game.input.keyboard.addKey(Phaser.Keyboard.D),
      sneak: _this.game.input.keyboard.addKey(Phaser.Keyboard.ALT),
      sprint: _this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT)
    };

    _this.animations.add('walk', [1, 2, 1, 0], 1);
    _this.animations.add('fight', [3, 5, 4], 3);

    _this.body.addCircle(Math.max(_PlayerConstants.PLAYER_WIDTH, _PlayerConstants.PLAYER_HEIGHT));
    return _this;
  }

  _createClass(Player, [{
    key: 'update',
    value: function update() {
      this.handleMovement();
      this.handleAnimation();
      this.lookAtMouse();
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

      this.isSneaking = false;
      this.isSprinting = false;

      if (this.cursors.sneak.isDown) {
        specialEffectMultiplier = _PlayerConstants.PLAYER_SNEAK_MULTIPLIER;
        this.isSneaking = true;
      } else if (this.cursors.sprint.isDown) {
        specialEffectMultiplier = _PlayerConstants.PLAYER_SPRINT_MULTIPLIER;
        this.isSprinting = true;
      }

      this.body.velocity.x *= specialEffectMultiplier;
      this.body.velocity.y *= specialEffectMultiplier;
    }
  }, {
    key: 'handleAnimation',
    value: function handleAnimation() {
      if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
        this.animations.play('walk', _PlayerConstants.PLAYER_WALK_ANIMATION_FRAMERATE, true);
      } else {
        this.animations.stop('walk', true);
      }
      if (this.game.input.activePointer.leftButton.isDown) {
        this.animations.play('fight', _PlayerConstants.PLAYER_FIGHT_ANIMATION_FRAMERATE, false);
      }
    }
  }, {
    key: 'lookAtMouse',
    value: function lookAtMouse() {
      var mouseX = this.game.input.mousePointer.worldX;
      var mouseY = this.game.input.mousePointer.worldY;

      this.lookAt(mouseX, mouseY);
    }
  }]);

  return Player;
}(_Entity3.default);

exports.default = Player;

},{"../constants/PlayerConstants":7,"./Entity":11}],15:[function(require,module,exports){
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

    _this.addTilesetImage('tilemap');

    _this.ground = _this.createLayer('background');
    _this.walls = _this.createLayer('walls');

    _this.paths = [];

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

},{"../utils/MapUtils.js":24}],16:[function(require,module,exports){
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

var _EntityManagerUtils = require('../utils/EntityManagerUtils');

var _MapUtils = require('../utils/MapUtils.js');

var _TileMapConstants = require('../constants/TileMapConstants');

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

var WalkingEntitiesManager = function (_Phaser$Group) {
  _inherits(WalkingEntitiesManager, _Phaser$Group);

  function WalkingEntitiesManager(game, grid) {
    _classCallCheck(this, WalkingEntitiesManager);

    var _this = _possibleConstructorReturn(this, (WalkingEntitiesManager.__proto__ || Object.getPrototypeOf(WalkingEntitiesManager)).call(this, game));

    _this.mapGrid = (0, _MapUtils.getWallsPostions)(grid);
    _this.allEntitiesInitialized = false;
    return _this;
  }

  _createClass(WalkingEntitiesManager, [{
    key: 'update',
    value: function update() {
      if (this.allEntitiesInitialized || this.areAllEntitiesInitialized()) {
        this.manageMovingEntities();
      }

      Phaser.Group.prototype.update.call(this);
    }
  }, {
    key: 'manageMovingEntities',
    value: function manageMovingEntities() {
      for (var entityIndex1 in this.children) {
        for (var entityIndex2 in this.children) {
          if (entityIndex1 === entityIndex2) {
            continue;
          }
          var currentHandledEntity = this.children[Math.min(entityIndex1, entityIndex2)];
          var otherEntity = this.children[Math.max(entityIndex1, entityIndex2)];

          if (currentHandledEntity.canMove && otherEntity.canMove && (0, _EntityManagerUtils.willEntitiesBeOnTheSameTile)(currentHandledEntity, otherEntity)) {
            var freeTile = (0, _EntityManagerUtils.getFreeTileAroundEntityExcludingOtherEntity)(currentHandledEntity, otherEntity, this.mapGrid);
            var currentTarget = currentHandledEntity.pathsBetweenPathTargets[currentHandledEntity.currentPathIndex].target;

            currentHandledEntity.changePathToTemporary(freeTile, currentTarget);
          }
        }
      }
    }
  }, {
    key: 'onCollisionWihOtherEntity',
    value: function onCollisionWihOtherEntity(entity1, entity2) {
      var freeTile1 = (0, _EntityManagerUtils.getFreeTileAroundEntityExcludingOtherEntity)(entity1, entity2, this.mapGrid);
      var freeTile2 = (0, _EntityManagerUtils.getFreeTileAroundEntityExcludingOtherEntity)(entity2, entity1, this.mapGrid);

      entity1.changePathToTemporary(freeTile1);
      entity1.changePathToTemporary(freeTile2);
    }
  }, {
    key: 'onCollisionWithWalls',
    value: function onCollisionWithWalls(entity, tileBody) {
      var entityTile = (0, _MapUtils.pixelsToTile)(entity);
      var tile = (0, _MapUtils.pixelsToTile)({ x: tileBody.x + _TileMapConstants.TILE_WIDTH / 2, y: tileBody.y + _TileMapConstants.TILE_HEIGHT / 2 });
      var freeTile = void 0;

      if (entityTile.x > tile.x) {
        freeTile = { x: entityTile.x + 1, y: entityTile.y };
      } else if (entityTile.x < tile.x) {
        freeTile = { x: entityTile.x - 1, y: entityTile.y };
      } else if (entityTile.y < tile.y) {
        freeTile = { x: entityTile.x, y: entityTile.y - 1 };
      } else if (entityTile.y > tile.y) {
        freeTile = { x: entityTile.x, y: entityTile.y + 1 };
      }

      entity.changePathToTemporary(freeTile);
    }
  }, {
    key: 'areAllEntitiesInitialized',
    value: function areAllEntitiesInitialized() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var entity = _step.value;

          if (!entity.isInitialized) {
            return false;
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

      this.allEntitiesInitialized = true;
      return true;
    }
  }]);

  return WalkingEntitiesManager;
}(Phaser.Group);

exports.default = WalkingEntitiesManager;

},{"../constants/TileMapConstants":8,"../utils/EntityManagerUtils":23,"../utils/MapUtils.js":24}],17:[function(require,module,exports){
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

var _EntityWalkingOnPath2 = require('./EntityWalkingOnPath');

var _EntityWalkingOnPath3 = _interopRequireDefault(_EntityWalkingOnPath2);

var _ZombieConstants = require('../constants/ZombieConstants');

var _MapUtils = require('../utils/MapUtils.js');

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

var Zombie = function (_EntityWalkingOnPath) {
  _inherits(Zombie, _EntityWalkingOnPath);

  function Zombie(game, imageKey, frame, targets, walls, player) {
    _classCallCheck(this, Zombie);

    var _this = _possibleConstructorReturn(this, (Zombie.__proto__ || Object.getPrototypeOf(Zombie)).call(this, game, imageKey, frame, targets, walls));

    _this.player = player;
    _this.walls = walls;
    _this.playerSeekingRay = new Phaser.Line();
    _this.tileHits = [];
    _this.isChasing = false;
    _this.lastKnownPlayerPosition = { x: 1, y: 1 };
    return _this;
  }

  _createClass(Zombie, [{
    key: 'update',
    value: function update() {
      if (this.canSeePlayer()) {
        this.isChasing = true;
        this.lastKnownPlayerPosition = { x: this.player.x, y: this.player.y };
      }

      if (!this.isChasing) {
        _EntityWalkingOnPath3.default.prototype.update.call(this);
      } else {
        this.chasePlayer();
      }
    }
  }, {
    key: 'canSeePlayer',
    value: function canSeePlayer() {
      /** Draw line between player and zombie and check if it can see him. If yes, chase him. */
      this.playerSeekingRay.start.set(this.x, this.y);
      this.playerSeekingRay.end.set(this.player.x, this.player.y);

      this.tileHits = this.walls.getRayCastTiles(this.playerSeekingRay, 0, false, false);

      if (this.tileHits.length > 0) {
        for (var i = 0; i < this.tileHits.length; i++) {
          if (this.tileHits[i].index >= 0) {
            return false;
          }
        }
      }

      var angleDelta = Math.abs(Phaser.Math.radToDeg(Phaser.Math.angleBetween(this.x, this.y, this.player.x, this.player.y)) + 90 - this.angle);

      return (angleDelta <= _ZombieConstants.ZOMBIE_SIGHT_ANGLE || angleDelta >= 360 - _ZombieConstants.ZOMBIE_SIGHT_ANGLE) && (this.isChasing || this.playerSeekingRay.length < _ZombieConstants.ZOMBIE_SIGHT_RANGE) || this.playerSeekingRay.length < _ZombieConstants.ZOMBIE_HEARING_RANGE && !this.player.isSneaking && this.player.isMoving();
    }
  }, {
    key: 'chasePlayer',
    value: function chasePlayer() {
      this.game.physics.arcade.moveToObject(this, this.lastKnownPlayerPosition, _ZombieConstants.ZOMBIE_SPEED * _ZombieConstants.ZOMBIE_SPEED_CHASING_MULTIPLIER);
      this.lookAt(this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y);

      var distanceToTarget = this.game.physics.arcade.distanceBetween(this, this.lastKnownPlayerPosition);
      if (!this.canSeePlayer() && distanceToTarget <= _ZombieConstants.MIN_DISTANCE_TO_TARGET) {
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.isChasing = false;
        this.changePathToTemporary((0, _MapUtils.pixelsToTile)(this));
      }
    }
  }]);

  return Zombie;
}(_EntityWalkingOnPath3.default);

exports.default = Zombie;

},{"../constants/ZombieConstants":9,"../utils/MapUtils.js":24,"./EntityWalkingOnPath":12}],18:[function(require,module,exports){
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

var _WalkingEntitiesManager = require('../objects/WalkingEntitiesManager');

var _WalkingEntitiesManager2 = _interopRequireDefault(_WalkingEntitiesManager);

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

var ZombieManager = function (_WalkingEntitiesManag) {
  _inherits(ZombieManager, _WalkingEntitiesManag);

  function ZombieManager(game, grid) {
    _classCallCheck(this, ZombieManager);

    return _possibleConstructorReturn(this, (ZombieManager.__proto__ || Object.getPrototypeOf(ZombieManager)).call(this, game, grid));
  }

  _createClass(ZombieManager, [{
    key: 'update',
    value: function update() {
      _WalkingEntitiesManager2.default.prototype.update.call(this);
    }
  }]);

  return ZombieManager;
}(_WalkingEntitiesManager2.default);

exports.default = ZombieManager;

},{"../objects/WalkingEntitiesManager":16}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

var _ZombiesManager = require('../objects/ZombiesManager');

var _ZombiesManager2 = _interopRequireDefault(_ZombiesManager);

var _PlayerConstants = require('../constants/PlayerConstants');

var _TileMapConstants = require('../constants/TileMapConstants');

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

      this.map = new _TileMap2.default(this.game, 'map', 64, 64);

      this.player = new _Player2.default(this.game, 10 * _TileMapConstants.TILE_WIDTH + _TileMapConstants.TILE_WIDTH / 2, 2 * _TileMapConstants.TILE_HEIGHT + _TileMapConstants.TILE_HEIGHT / 2, 'player', _PlayerConstants.PLAYER_INITIAL_FRAME);
      this.game.camera.follow(this.player);

      //  Create our collision groups. One for the player, one for the pandas
      this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup(this.player);
      this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();

      this.zombies = new _ZombiesManager2.default(this.game, this.map.walls);
      for (var i = 0; i < this.map.paths.length; i++) {
        var newZombie = this.zombies.add(new _Zombie2.default(this.game, 'zombie', _PlayerConstants.PLAYER_INITIAL_FRAME, this.map.getPath(i), this.map.walls, this.player));

        newZombie.body.setCollisionGroup(this.zombiesCollisionGroup);
        newZombie.body.collides(this.zombiesCollisionGroup, function (body1, body2) {
          return _this2.zombies.onCollisionWihOtherEntity(body1.sprite, body2.sprite);
        });
        newZombie.body.collides(this.map.wallsCollisionGroup, function (body, tileBody) {
          return _this2.zombies.onCollisionWithWalls(body.sprite, tileBody);
        });
        newZombie.body.collides(this.playerCollisionGroup);
      }
      this.player.body.collides([this.zombiesCollisionGroup, this.map.wallsCollisionGroup]);

      this.map.collides(this.zombiesCollisionGroup);
      this.map.collides(this.playerCollisionGroup);
    }
  }, {
    key: 'update',
    value: function update() {}
  }]);

  return Game;
}(Phaser.State);

exports.default = Game;

},{"../constants/PlayerConstants":7,"../constants/TileMapConstants":8,"../objects/Player":14,"../objects/TileMap":15,"../objects/Zombie":17,"../objects/ZombiesManager":18}],21:[function(require,module,exports){
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

    return _possibleConstructorReturn(this, (Menu.__proto__ || Object.getPrototypeOf(Menu)).apply(this, arguments));
  }

  _createClass(Menu, [{
    key: 'create',
    value: function create() {
      this.state.start('Game');
    }
  }]);

  return Menu;
}(Phaser.State);

exports.default = Menu;

},{}],22:[function(require,module,exports){
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
      this.load.tilemap('map', 'assets/tilemaps/maps/map.json', null, Phaser.Tilemap.TILED_JSON);
      this.load.image('tilemap', 'assets/tilemaps/tiles/tilemap.png');

      this.game.load.spritesheet('player', './assets/images/player-sheet.png', _PlayerConstants.PLAYER_WIDTH, _PlayerConstants.PLAYER_HEIGHT);
      this.game.load.spritesheet('zombie', './assets/images/zombie-sheet.png', _ZombieConstants.ZOMBIE_WIDTH, _ZombieConstants.ZOMBIE_HEIGHT);
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

},{"../constants/PlayerConstants.js":7,"../constants/ZombieConstants.js":9}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFreeTileAroundEntityExcludingOtherEntity = exports.willEntitiesBeOnTheSameTile = exports.getEntityCurrentStepTarget = exports.getEntityNextTile = undefined;

var _MapUtils = require('../utils/MapUtils');

var getEntityNextTile = exports.getEntityNextTile = function getEntityNextTile(entity) {
  if (entity.isOnStandardPath) {
    var pathIndex = entity.currentPathIndex;
    var stepIndex = entity.currentStepIndex;

    if (entity.pathsBetweenPathTargets[pathIndex].path.length === stepIndex + 1) {
      stepIndex = 0;

      if (entity.pathsBetweenPathTargets.length === pathIndex + 1) {
        pathIndex = 0;
      } else {
        pathIndex++;
      }
    } else {
      stepIndex++;
    }
    if (entity.pathsBetweenPathTargets[pathIndex].path[stepIndex] == undefined) {
      throw new Error('Wrong path data: pathIndex: ' + pathIndex + ', stepIndex: ' + stepIndex + ', entity: ' + entity);
    }
    return entity.pathsBetweenPathTargets[pathIndex].path[stepIndex];
  } else {
    var _stepIndex = entity.temporaryStepIndex;
    if (_stepIndex + 1 === entity.temporaryPath.length) {
      _stepIndex = 0;
      var _pathIndex = entity.currentPathIndex + 1 === entity.pathsBetweenPathTargets.length ? 0 : entity.currentPathIndex + 1;
      if (entity.pathsBetweenPathTargets[_pathIndex].path[_stepIndex] == undefined) {
        throw new Error('Wrong path data: pathIndex: ' + _pathIndex + ', stepIndex: ' + _stepIndex + ', entity: ' + entity);
      }
      return entity.pathsBetweenPathTargets[_pathIndex].path[_stepIndex];
    } else {
      if (entity.temporaryPath[_stepIndex] == undefined) {
        throw new Error('Wrong temporary path data: stepIndex: ' + _stepIndex);
      }
      return entity.temporaryPath[_stepIndex];
    }
  }
};

var areTilesTheSame = function areTilesTheSame(tile1, tile2) {
  return tile1.x === tile2.x && tile1.y === tile2.y;
};

var getEntityCurrentStepTarget = exports.getEntityCurrentStepTarget = function getEntityCurrentStepTarget(entity) {
  return entity.isOnStandardPath ? entity.pathsBetweenPathTargets[entity.currentPathIndex].path[entity.currentStepIndex] : entity.temporaryPath[entity.temporaryStepIndex];
};

var willEntitiesBeOnTheSameTile = exports.willEntitiesBeOnTheSameTile = function willEntitiesBeOnTheSameTile(entity1, entity2) {
  var entityNextTarget1 = getEntityNextTile(entity1);
  var entityNextTarget2 = getEntityNextTile(entity2);
  var entityCurrentTarget1 = getEntityCurrentStepTarget(entity1);
  var entityCurrentTarget2 = getEntityCurrentStepTarget(entity2);

  return areTilesTheSame(entityNextTarget1, entityNextTarget2) || areTilesTheSame(entityNextTarget1, entityCurrentTarget2) || areTilesTheSame(entityCurrentTarget1, entityCurrentTarget2);
};

var getDirectionBetweenTiles = function getDirectionBetweenTiles(tile1, tile2) {
  if (tile1.y === tile2.y) {
    if (tile1.x > tile2.x) {
      return 'WEST';
    } else if (tile1.x < tile2.x) {
      return 'EAST';
    } else {
      throw new Error('Uncorrect tiles coordinates! tile1.x: ' + tile1.x + ', tile1.y: ' + tile1.y + ' | tile2.x: ' + tile2.x + ' tile2.y: ' + tile2.y);
    }
  } else if (tile1.x === tile2.x) {
    if (tile1.y > tile2.y) {
      return 'NORTH';
    } else if (tile1.y < tile2.y) {
      return 'SOUTH';
    } else {
      throw new Error('Uncorrect tiles coordinates! tile1.x: ' + tile1.x + ', tile1.y: ' + tile1.y + ' | tile2.x: ' + tile2.x + ' tile2.y: ' + tile2.y);
    }
  } else {
    if (tile1.y < tile2.y && tile1.x < tile2.x) {
      return Math.random() > 0.5 ? 'SOUTH' : 'EAST';
    } else if (tile1.y > tile2.y && tile1.x < tile2.x) {
      return Math.random() > 0.5 ? 'NORTH' : 'EAST';
    } else if (tile1.y < tile2.y && tile1.x > tile2.x) {
      return Math.random() > 0.5 ? 'NORTH' : 'WEST';
    } else if (tile1.y > tile2.y && tile1.x > tile2.x) {
      return Math.random() > 0.5 ? 'SOUTH' : 'WEST';
    }
  }
  throw new Error('Uncorrect tiles coordinates! tile1.x: ' + tile1.x + ', tile1.y: ' + tile1.y + ' | tile2.x: ' + tile2.x + ' tile2.y: ' + tile2.y);
};

var getDirectionBetweenEntities = function getDirectionBetweenEntities(entity1, entity2) {
  var entityTile1 = (0, _MapUtils.pixelsToTile)(entity1);
  var entityTile2 = (0, _MapUtils.pixelsToTile)(entity2);

  if (areTilesTheSame(entityTile1, entityTile2)) {
    console.warn('Doing somethink untested: ');
    return getDirectionBetweenTiles(entity1, entity2);
  } else {
    return getDirectionBetweenTiles(entityTile1, entityTile2);
  }
};

var getFreeTileAroundEntityExcludingOtherEntity = exports.getFreeTileAroundEntityExcludingOtherEntity = function getFreeTileAroundEntityExcludingOtherEntity(entity, entityToExclude, mapGrid) {
  var entityTile = (0, _MapUtils.pixelsToTile)(entity);
  var tileToExclude = getEntityNextTile(entityToExclude);

  var directionToExclude = void 0;

  if (entityTile.x === tileToExclude.x && entityTile.y === tileToExclude.y || entityTile.x !== tileToExclude.x && entityTile.y !== tileToExclude.y) {
    directionToExclude = getDirectionBetweenEntities(entity, entityToExclude);
  } else {
    directionToExclude = getDirectionBetweenTiles(entityTile, tileToExclude);
  }

  switch (directionToExclude) {
    case 'NORTH':
      return getFreeTileExcludingNorth(entityTile, mapGrid);
    case 'SOUTH':
      return getFreeTileExcludingSouth(entityTile, mapGrid);
    case 'WEST':
      return getFreeTileExcludingWest(entityTile, mapGrid);
    case 'EAST':
      return getFreeTileExcludingEast(entityTile, mapGrid);
  }

  throw new Error('Couldn\'t find free tile entityTile: ' + entityTile + ', directionToExclude: ' + directionToExclude);
};

function getFreeTileExcludingNorth(entityTile, mapGrid) {
  var freeTile = { x: -1, y: entityTile.y };
  if (mapGrid[entityTile.x - 1][entityTile.y] === 0 && mapGrid[entityTile.x + 1][entityTile.y] === 0) {
    freeTile.x = Math.random() > 0.5 ? entityTile.x - 1 : entityTile.x + 1;
  } else if (mapGrid[entityTile.x - 1][entityTile.y] === 0) {
    freeTile.x = entityTile.x - 1;
  } else if (mapGrid[entityTile.x + 1][entityTile.y] === 0) {
    freeTile.x = entityTile.x + 1;
  } else if (mapGrid[entityTile.x][entityTile.y + 1] === 0) {
    freeTile = { x: entityTile.x, y: entityTile.y + 1 };
  }
  return freeTile;
}
function getFreeTileExcludingSouth(entityTile, mapGrid) {
  var freeTile = { x: -1, y: entityTile.y };
  if (mapGrid[entityTile.x - 1][entityTile.y] === 0 && mapGrid[entityTile.x + 1][entityTile.y] === 0) {
    freeTile.x = Math.random() > 0.5 ? entityTile.x - 1 : entityTile.x + 1;
  } else if (mapGrid[entityTile.x - 1][entityTile.y] === 0) {
    freeTile.x = entityTile.x - 1;
  } else if (mapGrid[entityTile.x + 1][entityTile.y] === 0) {
    freeTile.x = entityTile.x + 1;
  } else if (mapGrid[entityTile.x][entityTile.y - 1] === 0) {
    freeTile = { x: entityTile.x, y: entityTile.y - 1 };
  }
  return freeTile;
}
function getFreeTileExcludingWest(entityTile, mapGrid) {
  var freeTile = { x: entityTile.x, y: -1 };
  if (mapGrid[entityTile.x][entityTile.y - 1] === 0 && mapGrid[entityTile.x][entityTile.y + 1] === 0) {
    freeTile.y = Math.random() > 0.5 ? entityTile.y - 1 : entityTile.y + 1;
  } else if (mapGrid[entityTile.x][entityTile.y - 1] === 0) {
    freeTile.y = entityTile.y - 1;
  } else if (mapGrid[entityTile.x][entityTile.y + 1] === 0) {
    freeTile.y = entityTile.y + 1;
  } else if (mapGrid[entityTile.x + 1][entityTile.y] === 0) {
    freeTile = { x: entityTile.x + 1, y: entityTile.y };
  }
  return freeTile;
}
function getFreeTileExcludingEast(entityTile, mapGrid) {
  var freeTile = { x: entityTile.x, y: -1 };
  if (mapGrid[entityTile.x][entityTile.y - 1] === 0 && mapGrid[entityTile.x][entityTile.y + 1] === 0) {
    freeTile.y = Math.random() > 0.5 ? entityTile.y - 1 : entityTile.y + 1;
  } else if (mapGrid[entityTile.x][entityTile.y - 1] === 0) {
    freeTile.y = entityTile.y - 1;
  } else if (mapGrid[entityTile.x][entityTile.y + 1] === 0) {
    freeTile.y = entityTile.y + 1;
  } else if (mapGrid[entityTile.x - 1][entityTile.y] === 0) {
    freeTile = { x: entityTile.x - 1, y: entityTile.y };
  }
  return freeTile;
}

},{"../utils/MapUtils":24}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWallsPostions = exports.pixelsToTile = exports.tileToPixels = exports.pixelsToTileY = exports.pixelsToTileX = undefined;

var _TileMapConstants = require('../constants/TileMapConstants');

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

var getWallsPostions = exports.getWallsPostions = function getWallsPostions(layer) {
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

},{"../constants/TileMapConstants":8}]},{},[10])
//# sourceMappingURL=game.js.map
