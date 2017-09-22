class Entity extends Phaser.Sprite {
  constructor( game, x, y, imageKey, frame, debug ) {
    super( game, x, y, imageKey, frame );

    this.anchor.setTo( 0.5, 0.5 );
    this.debug = debug;

    this.game.physics.p2.enable( this, this.debug );
    this.body.collideWorldBounds = true;

    this.game.world.add( this );
  }
  lookAt( targetX, targetY ) {
    const targetPoint = new Phaser.Point( targetX, targetY );
    const entityCenter = new Phaser.Point( this.body.x + this.width / 2, this.body.y + this.height / 2 );

    let targetAngle = Phaser.Math.radToDeg( Phaser.Math.angleBetweenPoints( targetPoint, entityCenter ) ) - 90;

    if ( targetAngle < 0 ) {
      targetAngle += 360;
    }

    this.body.angle = targetAngle;
  }
  normalizeVelocity() {
    if ( this.body.velocity.x !== 0 && this.body.velocity.y !== 0 ) {
      this.body.velocity.x = this.body.velocity.x * Math.sqrt( 2 ) * 1 / 2;
      this.body.velocity.y = this.body.velocity.y * Math.sqrt( 2 ) * 1 / 2;
    }
  }
  resetVelocity() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
  }
  isMoving() {
    return this.body.velocity.x !== 0 || this.body.velocity.y !== 0;
  }
  isInDegreeRange( entity, target, sightAngle ) {
    const angleDelta = Math.abs( Phaser.Math.radToDeg( Phaser.Math.angleBetween( entity.x, entity.y, target.x, target.y ) ) + 90 - entity.angle );

    return angleDelta <= sightAngle || angleDelta >= ( 360 - sightAngle );
  }
  takeDamage( damage ) {
    this.damage( damage );
    this.health = Math.floor( this.health * 100 ) / 100;
  }
}

export default Entity;
