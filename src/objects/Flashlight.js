import { RAY_LENGTH, LIGHT_ANGLE, NUMBER_OF_RAYS } from '../constants/FlashlightConstants';

export default class Flashlight {
  constructor( player, walls ) {
    this.player = player;
    this.walls = walls;
    this.maskGraphics = this.player.game.add.graphics( 0, 0 );
  }
  update() {
    this.maskGraphics.clear();
    this.maskGraphics.lineStyle( 2, 0xffffff, 1 );

    const mouseX = this.player.game.input.mousePointer.worldX;
    const mouseY = this.player.game.input.mousePointer.worldY;
    const mouseAngle = Math.atan2( this.player.y - mouseY, this.player.x - mouseX );

    for ( let i = 0; i < NUMBER_OF_RAYS; i++ ) {
      this.maskGraphics.moveTo( this.player.x, this.player.y );
      const rayAngle = mouseAngle - ( LIGHT_ANGLE / 2 ) + ( LIGHT_ANGLE / NUMBER_OF_RAYS ) * i;
      let lastX = this.player.x;
      let lastY = this.player.y;
      for ( let j = 1; j <= RAY_LENGTH; j++ ) {
        const landingX = Math.round( this.player.x - ( 2 * j ) * Math.cos( rayAngle ) );
        const landingY = Math.round( this.player.y - ( 2 * j ) * Math.sin( rayAngle ) );
        if ( !this.isTileBlocking( landingX, landingY ) ) {
          lastX = landingX;
          lastY = landingY;
        } else {
          break;
        }
      }
      this.maskGraphics.lineTo( lastX, lastY );
    }
  }
  isTileBlocking( targetX, targetY ) {
    const playerSeekingRay = new Phaser.Line();
    playerSeekingRay.start.set( targetX, targetY );
    playerSeekingRay.end.set( this.player.x, this.player.y );

    const tileHits = this.walls.getRayCastTiles( playerSeekingRay, 0, false, false );

    for ( let i = 0; i < tileHits.length; i++ ) {
      if ( tileHits[ i ].index >= 0 ) {
        return true;
      }
    }

    return false;
  }
}
