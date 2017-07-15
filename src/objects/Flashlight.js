import { RAY_LENGTH, LIGHT_ANGLE, NUMBER_OF_RAYS, WORLD_SHADOW_ALPHA, LIGHT_ALPHA, FLICKERING_ALPHA_OFFSET } from '../constants/FlashlightConstants';

export default class Flashlight {
  constructor( player, walls, zombies ) {
    this.player = player;
    this.walls = walls;

    this.flickerLayer = this.player.game.add.image( 0, 0, 'layer-background' );
    this.flickerLayer.width = RAY_LENGTH * 4.5;
    this.flickerLayer.height = RAY_LENGTH * 4.5;
    this.flickerLayer.anchor.setTo( 0.5 );

    this.glowFilter = new Phaser.Filter.Glow( this.player.game );

    this.hideMaskGraphics = this.player.game.add.graphics( 0, 0 );

    this.showMaskGraphics = this.player.game.add.graphics( 0, 0 );
    this.showMaskGraphics.filters = [ this.glowFilter ];

    this.flickerLayer.mask = this.showMaskGraphics;

    zombies.setAll( 'mask', this.showMaskGraphics );
    this.zombies = zombies;

    this.hideMaskGraphics.filters = [ this.glowFilter ];
    this.hideMaskGraphics.isMask = false;
    this.hideMaskGraphics.alpha = WORLD_SHADOW_ALPHA;
  }
  update() {
    this.updateLayersPosition();
    this.makeFlickerEffect();
    this.drawLayers();
  }
  updateLayersPosition() {
    Object.assign( this.flickerLayer, this.player.position );
  }
  drawLayers() {
    this.hideMaskGraphics.clear();
    this.hideMaskGraphics.moveTo( this.player.game.camera.x - 100, this.player.game.camera.y );
    this.hideMaskGraphics.beginFill( 0x000000, 1 );
    this.hideMaskGraphics.lineStyle( 0, 0x000000, 1 );
    this.hideMaskGraphics.lineTo( this.player.game.camera.x + this.player.game.camera.width + 100, this.player.game.camera.y );
    this.hideMaskGraphics.lineTo( this.player.game.camera.x + this.player.game.camera.width + 100, this.player.game.camera.y + this.player.game.camera.height );
    this.hideMaskGraphics.lineTo( this.player.game.camera.x - 100, this.player.game.camera.y + this.player.game.camera.height );
    this.hideMaskGraphics.lineTo( this.player.game.camera.x - 100, this.player.game.camera.y );
    this.hideMaskGraphics.lineTo( this.player.x, this.player.y );

    this.showMaskGraphics.clear();
    this.showMaskGraphics.moveTo( this.player.x, this.player.y );
    this.showMaskGraphics.beginFill();

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
      this.showMaskGraphics.lineTo( lastX, lastY );
    }
    this.hideMaskGraphics.lineTo( this.player.x, this.player.y );
    this.hideMaskGraphics.endFill();

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
    const alpha = LIGHT_ALPHA + Math.random() * FLICKERING_ALPHA_OFFSET;
    this.flickerLayer.alpha = alpha;
  }
}
