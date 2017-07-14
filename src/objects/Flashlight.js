import { RAY_LENGTH, LIGHT_ANGLE, NUMBER_OF_RAYS, WORLD_SHADOW_ALPHA, LIGHT_ALPHA } from '../constants/FlashlightConstants';

export default class Flashlight {
  constructor( player, walls, zombies ) {
    this.player = player;
    this.walls = walls;

    console.log( this.player.game );

    this.shadowLayer = this.player.game.add.image( 0, 0, 'layer-background' );
    this.shadowLayer.width = this.player.game.camera.width * 1.5;
    this.shadowLayer.height = this.player.game.camera.height * 1.5;
    this.shadowLayer.alpha = WORLD_SHADOW_ALPHA;

    this.flickerLayer = this.player.game.add.image( 0, 0, 'layer-background' );
    this.flickerLayer.width = RAY_LENGTH * 4.5;
    this.flickerLayer.height = RAY_LENGTH * 4.5;
    this.flickerLayer.anchor.setTo( 0.5 );

    this.hideMaskGraphics = this.player.game.add.graphics( 0, 0 );
    this.shadowLayer.mask = this.hideMaskGraphics;

    this.showMaskGraphics = this.player.game.add.graphics( 0, 0 );
    zombies.setAll( 'mask', this.showMaskGraphics );
    this.zombies = zombies;

    this.flickerLayer.mask = this.showMaskGraphics;
  }
  update() {
    this.updateLayersPosition();
    this.updateHidingLayer();
    this.updateShowingLayer();
    this.makeFlickerEffect();
  }
  updateLayersPosition() {
    this.shadowLayer.x = this.player.game.camera.position.x - this.player.game.camera.width * 0.2;
    this.shadowLayer.y = this.player.game.camera.position.y;

    Object.assign( this.flickerLayer, this.player.position );
  }
  updateHidingLayer() {
    this.hideMaskGraphics.clear();
    this.hideMaskGraphics.moveTo( this.shadowLayer.x, this.shadowLayer.y );
    this.hideMaskGraphics.lineStyle( 2, 0xffffff, 1 );
    this.hideMaskGraphics.beginFill( 0x00000000 );
    this.hideMaskGraphics.lineTo( this.player.x, this.player.y );

    const mouseX = this.player.game.input.mousePointer.worldX;
    const mouseY = this.player.game.input.mousePointer.worldY;
    const mouseAngle = Math.atan2( this.player.y - mouseY, this.player.x - mouseX );

    for ( let i = 0; i < NUMBER_OF_RAYS; i++ ) {
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
      this.hideMaskGraphics.lineTo( lastX, lastY );
    }
    this.hideMaskGraphics.lineTo( this.player.x, this.player.y );
    this.hideMaskGraphics.lineTo( this.shadowLayer.x, this.shadowLayer.y );
    this.hideMaskGraphics.lineTo( this.shadowLayer.x + this.shadowLayer.width, 0 );
    this.hideMaskGraphics.lineTo( this.shadowLayer.x + this.shadowLayer.width, this.shadowLayer.y + this.shadowLayer.height );
    this.hideMaskGraphics.lineTo( 0, this.shadowLayer.y + this.shadowLayer.height );
    this.hideMaskGraphics.lineTo( this.shadowLayer.x, this.shadowLayer.y );
    this.hideMaskGraphics.endFill();
  }
  updateShowingLayer() {
    this.showMaskGraphics.clear();
    this.showMaskGraphics.lineStyle( 2, 0xffffff, 1 );
    this.showMaskGraphics.beginFill( 0x00000000 );
    this.showMaskGraphics.moveTo( this.player.x, this.player.y );

    const mouseX = this.player.game.input.mousePointer.worldX;
    const mouseY = this.player.game.input.mousePointer.worldY;
    const mouseAngle = Math.atan2( this.player.y - mouseY, this.player.x - mouseX );

    for ( let i = 0; i < NUMBER_OF_RAYS; i++ ) {
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
      this.showMaskGraphics.lineTo( lastX, lastY );
    }
    this.showMaskGraphics.lineTo( this.player.x, this.player.y );
    this.showMaskGraphics.endFill();
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
  makeFlickerEffect() {
    const alpha = LIGHT_ALPHA + Math.random() * 0.1;
    this.flickerLayer.alpha = alpha;
  }
}
