import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { COMPUTER_WIDTH, COMPUTER_HEIGHT } from '../constants/ItemConstants';
import JournalLight from './LightsComponents/JournalLight';

export default class Journal extends Phaser.Sprite {
  constructor( game, content, imageKey ) {

    super( game, 0, 0, imageKey );

    this.game.world.add( this );

    this.hasPlayerApproached = false;

    this.content = content;

    this.light = null;
  }
  setCorner( cornerX, cornerY ) {
    this.cornerX = cornerX;
    this.cornerY = cornerY;
  }
  setPosition( tileX, tileY ) {
    const cornerX = this.cornerX || 'WEST';
    const cornerY = this.cornerY || 'NORTH';

    const offsetX = ( cornerX === 'WEST' ) ? ( COMPUTER_WIDTH / 2 ) : TILE_WIDTH - ( COMPUTER_WIDTH / 2 );
    const offsetY = ( cornerY === 'NORTH' ) ? ( COMPUTER_HEIGHT / 2 ) : TILE_HEIGHT - ( COMPUTER_HEIGHT / 2 );

    const x = tileX + offsetX;
    const y = tileY + offsetY;

    this.x = x;
    this.y = y;
  }
  enableJournal() {
    const cornerX = this.cornerX || 'WEST';
    const cornerY = this.cornerY || 'NORTH';

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

    this.anchor.setTo( 0.5 );
    this.light = new JournalLight( this );
  }
}
