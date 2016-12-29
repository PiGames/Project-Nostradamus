import EasyStar from 'easystarjs';

export default class PathFinder {
  constructor( game, level ) {
    this.game = game;
    this.path = [];
    this.easystar = new EasyStar.js();

    this.easystar.setGrid( level );
    this.easystar.setAcceptableTiles( [ 0 ] );
    // this.easystar.enableDiagonals();
    // this.easystar.enableCornerCutting();
  }

  createPath( x1, y1, x2, y2, ax, ay ) {
    if ( ax ) {
      this.easystar.avoidAdditionalPoint( ax, ay );
    }

    this.path = [];
    this.easystar.findPath( x1, y1, x2, y2, ( path ) => {
      if ( path === null ) {
        console.log( 'The path to the destination was not found.' );
      } else {
        path.forEach( ( v ) => {
          this.path.push(
            {
              x: v.x,
              y: v.y,
            }
          );
        } );
      }
    } );
  }

  getPath() {
    this.easystar.calculate();
    return this.path;
  }
}
