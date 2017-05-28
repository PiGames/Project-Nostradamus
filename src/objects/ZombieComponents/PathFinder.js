import EasyStar from 'easystarjs';

export default class PathFinder {
  constructor( ) {
    this.easystar = new EasyStar.js();

    this.easystar.setAcceptableTiles( [ 0 ] );
  }
  setGrid( grid ) {
    this.easystar.setGrid( grid );
  }
  findPath( startX, startY, endX, endY, callback ) {
    this.easystar.findPath( startX, startY, endX, endY, callback );
    this.easystar.calculate();
  }
}
