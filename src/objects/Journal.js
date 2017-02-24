import p2 from 'p2';

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

    if ( cornerY === 'SOUTH' ) {
      this.body.angle = 180;
    }

    const pixelsToP2UnitsMultiplier = 1 / 20;

    const rectangleSensor = new p2.Box( { width: TILE_WIDTH * pixelsToP2UnitsMultiplier, height: TILE_HEIGHT * pixelsToP2UnitsMultiplier } );
    rectangleSensor.sensor = true;

    const sensorOffsetX = ( TILE_WIDTH / 2 - COMPUTER_WIDTH ) * ( ( cornerX === 'WEST' ) ? 1 : -1 );
    const sensorOffsetY = ( TILE_HEIGHT / 2 - COMPUTER_HEIGHT ) * ( ( cornerY === 'NORTH' ) ? 1 : -1 );

    this.body.addShape( rectangleSensor, sensorOffsetX, sensorOffsetY );
  }
}
