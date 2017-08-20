import Bullet from './Bullet';

export default class ShootingSystem {
  constructor( player ) {
    this.player = player;
    this.game = this.player.game;
    this.active = false;

    // weapon mock
    this.weapon = {
      fireMode: 'single',
      bulletSpeed: 200,
      /* TODO sprite, sound, frequency, kick */
    };

    this.bullets = [];
    this.canShootInSingleMode = true;
    this.game.input.activePointer.leftButton.onDown.add( this.onSingleShoot.bind( this ) );
  }
  activate() {
    this.active = true;
  }
  deactivate() {
    this.active = false;
  }
  onSingleShoot() {
    if ( !this.active ) {
      return;
    }
    this.fire();
    console.log( 'fire' );
  }
  fire() {
    const newBullet = new Bullet( this.game, this.player.x, this.player.y );
    newBullet.body.velocity.x = this.weapon.bulletSpeed * Math.sin( this.player.rotation );
    newBullet.body.velocity.y = this.weapon.bulletSpeed * -Math.cos( this.player.rotation );
    newBullet.body.angle = this.player.body.angle;
    this.bullets.push( newBullet );
  }
  update() {}
}
