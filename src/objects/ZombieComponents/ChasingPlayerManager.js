import { ZOMBIE_SPEED, ZOMBIE_SPEED_CHASING_MULTIPLIER, MIN_DISTANCE_TO_TARGET } from '../../constants/ZombieConstants';

export default class ChasingPlayerManager {
  constructor( zombie, player ) {
    this.zombie = zombie;
    this.player = player;

    this.stopChasingPlayerSignal = new Phaser.Signal();
  }
  update( lastKnownPlayerPosition ) {
    this.zombie.game.physics.arcade.moveToObject( this.zombie, lastKnownPlayerPosition, ZOMBIE_SPEED * ZOMBIE_SPEED_CHASING_MULTIPLIER );
    this.zombie.lookAt( lastKnownPlayerPosition.x, lastKnownPlayerPosition.y );

    if ( this.shouldZombieStopChasingPlayer( lastKnownPlayerPosition ) ) {
      this.stopChasingPlayer();
    }
  }
  shouldZombieStopChasingPlayer( lastKnownPlayerPosition ) {
    const distanceToTarget = this.zombie.game.physics.arcade.distanceBetween( this.zombie, lastKnownPlayerPosition );
    return ( this.player.x !== lastKnownPlayerPosition.x || this.player.y !== lastKnownPlayerPosition.y )
     && distanceToTarget <= MIN_DISTANCE_TO_TARGET;
  }
  stopChasingPlayer() {
    this.stopChasingPlayerSignal.dispatch();
  }
  onCollisionEnter( bodyA ) {
    console.log( 'colliision', bodyA );
  }
}
