/** Class representing any entity in game world. It derives after Phaser.Sprite.*/
class Entity extends Phaser.Sprite {
  /**
  * Create a Entity. Set its anchor to center, enable arcade physics on it add entity to existing game world.
  * @param {object} game - A reference to the currently running game.
  * @param {number} x - The x coordinate (in world space) to position the Sprite at.
  * @param {number} x - The y coordinate (in world space) to position the Sprite at.
  * @param {string} imageKey - This is the key to image used by the Sprite during rendering.
  * @param {number} frame - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a numeric index.
  */
  constructor( game, x, y, imageKey, frame ) {
    super( game, x, y, imageKey, frame )

    this.anchor.setTo( 0.5, 0.5 );

    this.game.physics.enable( this, Phaser.Physics.ARCADE );
    this.game.world.add( this );
  }
  /**
  * Rotate a Entity to look at given target.
  * @param {number} targetX - The target x coordintate.
  * @param {number} targetY - The target y coordintate.
  */
  lookAt( targetX, targetY ) {
    const targetPoint = new Phaser.Point( targetX, targetY ),
      entityCenter = new Phaser.Point( this.body.x, this.body.y );
    let targetAngle = ( 360 / ( 2 * Math.PI ) ) * this.game.math.angleBetweenPoints( targetPoint, entityCenter ) - 90;

    if ( targetAngle < 0 ) {
      targetAngle += 360;
    }
    this.angle = targetAngle;
  }
}

export default Entity;
