import { RAY_LENGTH, FLICKERING_POWER } from '../../constants/FlashlightConstants';
import Lightable from './Lightable';
import { isTileBlocking, getTileCornersArray } from '../../utils/MapUtils';


export default class Flashlight extends Lightable {
  constructor( player, walls ) {
    super( false );
    this.player = player;
    this.walls = walls;
    this.camera = this.player.game.camera;
    console.log( this.camera );

  }
  getLightShapePoints() {
    const shapePoints = [];


    const tilesInCameraBounds = this.walls.getTiles( this.camera.x, this.camera.y, this.camera.width, this.camera.height );

    const wallsInCameraBounds = tilesInCameraBounds.filter( ( tile ) => tile.collideDown );

    const corners = wallsInCameraBounds.reduce( ( tiles, tile ) => {
      const tileCorners = getTileCornersArray( tile );
      tiles.push( ...tileCorners );
      return tiles;
    }, [] );

    const visibleCorners = corners.filter( ( corner ) =>
    !isTileBlocking( this.player.position, corner, this.walls )
  );

    visibleCorners.sort( ( cornerA, cornerB ) => {

      const [ angleA, angleB ] = [ cornerA, cornerB ].map( ( corner ) => {
        return this.player.game.physics.arcade.angleBetween( this.player, corner );
      } );

      if ( angleA < angleB ) {
        return -1;
      } else if ( angleA === angleB ) {
        return 0;
      } else {
        return 1;
      }

    } );

    const existingAngles = [];

    const filteredVisibleCorners = visibleCorners.filter( ( corner ) => {
      const angle = this.player.game.physics.arcade.angleBetween( this.player, corner );
      if ( existingAngles.indexOf( angle ) === -1 ) {
        existingAngles.push( angle );
        return true;
      }
      return false;
    } );

    filteredVisibleCorners.forEach( ( corner ) => {
      shapePoints.push( corner );
    } );

    return shapePoints;
  }
  getFillStyle( ctx, offset ) {
    const rayLength = RAY_LENGTH * ( 1 + Math.random() * FLICKERING_POWER );
    const gradient = ctx.createRadialGradient(
        this.player.x - offset.x, this.player.y - offset.y, RAY_LENGTH * 0.75 * 2,
        this.player.x - offset.x, this.player.y - offset.y, rayLength * 2 );
    gradient.addColorStop( 0, 'rgba(255, 255, 255, 1)' );
    gradient.addColorStop( 1, 'rgba(255, 255, 255, 0)' );

    return gradient;
  }
}
