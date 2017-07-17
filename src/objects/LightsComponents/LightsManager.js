import Lightable from './Lightable';

export default class LightManager {
  constructor( game, walls ) {
    this.game = game;
    this.walls = walls;

    this.cachedLights = [];
    this.dynamicallyRenderedLightables = [];

    this.shadowTexture = this.game.add.bitmapData( this.game.camera.width + 200, this.game.camera.height + 200 );

    this.lightImage = this.game.add.image( 0, 0, this.shadowTexture );
    this.lightImage.blendMode = Phaser.blendModes.MULTIPLY;
  }
  add( lightable ) {
    if ( !( lightable instanceof Lightable ) ) {
      return;
    }

    if ( lightable.isStatic ) {
      const lightShape = lightable.getLightShapePoints( this.walls );
      const getFillStyle = lightable.getFillStyle.bind( lightable );
      this.cachedLights.push( { lightShape, getFillStyle } );
    } else {
      this.dynamicallyRenderedLightables.push( lightable );
    }
  }
  update() {
    this.updateImagePosition();
    this.render();
  }
  updateImagePosition() {
    this.lightImage.x = this.game.camera.x - 100;
    this.lightImage.y = this.game.camera.y - 100;
  }
  render() {
    this.shadowTexture.dirty = true;
    this.shadowTexture.clear();

    const ctx = this.shadowTexture.ctx;
    ctx.fillStyle = '#050505';
    ctx.fillRect( 0, 0, this.game.camera.width + 200, this.game.camera.height + 200 );

    this.dynamicallyRenderedLightables.forEach( lightable => {
      ctx.beginPath();
      ctx.fillStyle = lightable.getFillStyle( ctx, this.lightImage.position );
      const shapePointsNotOffseted = lightable.getLightShapePoints( this.walls );
      const shapePoints = shapePointsNotOffseted.map( point => (
        { x: point.x - this.lightImage.x, y: point.y - this.lightImage.y }
      ) );


      ctx.moveTo( shapePoints[ 0 ].x, shapePoints[ 0 ].y );

      for ( let i = 1; i < shapePoints.length; i++ ) {
        ctx.lineTo( shapePoints[ i ].x, shapePoints[ i ].y );
      }

      ctx.lineTo( shapePoints[ 0 ].x, shapePoints[ 0 ].y );
      ctx.fill();
    } );

    this.cachedLights.forEach( light => {
      ctx.beginPath();
      ctx.fillStyle = light.getFillStyle( ctx, this.lightImage.position );
      const shapePoints = light.lightShape.map( point => (
        { x: point.x - this.lightImage.x, y: point.y - this.lightImage.y }
      ) );

      ctx.moveTo( shapePoints[ 0 ].x, shapePoints[ 0 ].y );

      for ( let i = 1; i < shapePoints.length; i++ ) {
        ctx.lineTo( shapePoints[ i ].x, shapePoints[ i ].y );
      }

      ctx.lineTo( shapePoints[ 0 ].x, shapePoints[ 0 ].y );
      ctx.fill();
    } );
  }
}
