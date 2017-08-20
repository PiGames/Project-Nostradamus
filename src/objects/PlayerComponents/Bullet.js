export default class Bullet extends Phaser.Sprite {
  constructor( game, x, y ) {
    super( game, x, y, 'bullet' );

    this.scale.setTo( 0.3 );
    this.anchor.setTo( 0.5, 0.5 );

    this.game.physics.p2.enable( this );
    this.body.collideWorldBounds = true;

    this.game.world.add( this );
  }
}
