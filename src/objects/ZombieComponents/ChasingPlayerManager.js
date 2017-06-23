import * as CONSTANTS from '../../constants/ZombieConstants';
import NotificationsManager from './NotificationsManager';

export default class ChasingPlayerManager {
  constructor( zombie, player ) {
    this.zombie = zombie;
    this.player = player;

    this.stopChasingPlayerSignal = new Phaser.Signal();

    // attack system init
    this.canDealDamage = true;
    this.isInAttackRange = false;

    const attackSensor = this.zombie.body.addCircle( CONSTANTS.ZOMBIE_ATTACK_RANGE );
    attackSensor.sensor = true;
    attackSensor.sensorType = 'attack';

    this.notificationsManager = new NotificationsManager( this.zombie );

    this.lastKnownPlayerPosition = Object.assign( {}, this.player.position );
  }
  update( lastKnownPlayerPosition ) {
    this.lastKnownPlayerPosition = lastKnownPlayerPosition;
    this.zombie.game.physics.arcade.moveToObject( this.zombie, lastKnownPlayerPosition, CONSTANTS.ZOMBIE_SPEED * CONSTANTS.ZOMBIE_SPEED_CHASING_MULTIPLIER );
    this.zombie.lookAt( lastKnownPlayerPosition.x, lastKnownPlayerPosition.y );

    this.notificationsManager.update();

    if ( this.shouldZombieStopChasingPlayer( lastKnownPlayerPosition ) ) {
      this.stopChasingPlayer();
    }

    if ( this.shouldAttack() ) {
      this.handleAttack();
    }
  }
  shouldZombieStopChasingPlayer( lastKnownPlayerPosition ) {
    const distanceToTarget = this.zombie.game.physics.arcade.distanceBetween( this.zombie, lastKnownPlayerPosition );
    return ( this.player.x !== lastKnownPlayerPosition.x || this.player.y !== lastKnownPlayerPosition.y )
     && distanceToTarget <= CONSTANTS.MIN_DISTANCE_TO_TARGET;
  }
  stopChasingPlayer() {
    this.stopChasingPlayerSignal.dispatch();
  }
  onCollisionEnter( bodyA, bodyB, shapeA ) {
    if ( bodyA == null || bodyA.sprite == null ) {
      return;
    }
    if ( shapeA.sensorType === 'attack' && bodyA.sprite.key === 'player' ) {
      this.isInAttackRange = true;
    }
    this.notificationsManager.onCollisionEnter( bodyA, bodyB, shapeA );
  }
  onCollisionLeave( bodyA, bodyB, shapeA ) {
    if ( bodyA == null || bodyA.sprite == null ) {
      return;
    }
    if ( shapeA.sensorType === 'attack' && bodyA.sprite.key === 'player' ) {
      this.isInAttackRange = false;
    }

    this.notificationsManager.onCollisionLeave( bodyA, bodyB, shapeA );
  }
  shouldAttack() {
    return this.zombie.alive && this.canDealDamage && this.isInAttackRange;
  }
  handleAttack() {
    this.zombie.animations.play( 'attack', CONSTANTS.ZOMBIE_FIGHT_ANIMATION_FRAMERATE, false );
    this.player.takeDamage( CONSTANTS.ZOMBIE_DAMAGE_VALUE );
    this.canDealDamage = false;
    this.zombie.game.time.events.add( Phaser.Timer.SECOND * CONSTANTS.ZOMBIE_DAMAGE_COOLDOWN, this.endCooldown, this );
    this.zombie.game.camera.shake( 0.005, 100, false );
  }
  endCooldown() {
    this.canDealDamage = true;
    this.zombie.animations.play( 'walk', CONSTANTS.ZOMBIE_WALK_ANIMATION_FRAMERATE, true );
  }
}
