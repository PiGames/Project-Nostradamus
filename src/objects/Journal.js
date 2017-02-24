import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { COMPUTER_WIDTH, COMPUTER_HEIGHT } from '../constants/ItemConstants';

export default class Journal extends Phaser.Sprite {
  constructor( game, tileX, tileY, cornerX, cornerY, imageKey ) {
    const offsetX = ( cornerX === 'WEST' ) ? ( COMPUTER_WIDTH / 2 ) : TILE_WIDTH - ( COMPUTER_WIDTH / 2 );
    const offsetY = ( cornerY === 'NORTH' ) ? ( COMPUTER_HEIGHT / 2 ) : TILE_HEIGHT - ( COMPUTER_HEIGHT / 2 );
    const x = tileX * TILE_WIDTH + offsetX;
    const y = tileY * TILE_HEIGHT + offsetY;

    super( game, x, y, imageKey );

    this.game.world.add( this );

    this.game.physics.p2.enable( this );
    this.body.static = true;

    let sensorOffsetX = ( TILE_WIDTH - COMPUTER_WIDTH ) / ( ( cornerX === 'WEST' ) ? 2 : -2 );
    let sensorOffsetY = ( TILE_HEIGHT - COMPUTER_HEIGHT ) / ( ( cornerY === 'NORTH' ) ? 2 : -2 );

    if ( cornerY === 'SOUTH' ) {
      this.body.angle = 180;
      sensorOffsetX += ( TILE_WIDTH - COMPUTER_WIDTH ) * ( ( sensorOffsetX < 0 ) ? 1 : -1 );
      sensorOffsetY += ( TILE_HEIGHT - COMPUTER_HEIGHT ) * ( ( sensorOffsetY < 0 ) ? 1 : -1 );
    }

    const rectangleSensor = this.body.addRectangle( TILE_WIDTH, TILE_HEIGHT, sensorOffsetX, sensorOffsetY );
    rectangleSensor.sensor = true;

    this.hasPlayerApproached = false;
  }
}
