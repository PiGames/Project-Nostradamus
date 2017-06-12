import { ZOMBIE_SPEED, ZOMBIE_SPEED_CHASING_MULTIPLIER } from '../../constants/ZombieConstants';

export default class ChasingPlayerManager {
  constructor( zombie, player ) {
    this.zombie = zombie;
    this.player = player;
  }
  update( lastKnownPlayerPosition ) {
    this.zombie.game.physics.arcade.moveToObject( this.zombie, lastKnownPlayerPosition, ZOMBIE_SPEED * ZOMBIE_SPEED_CHASING_MULTIPLIER );
    this.zombie.lookAt( lastKnownPlayerPosition.x, lastKnownPlayerPosition.y );

    //TODO make zombie get back on path if it lose track of players position
  }
  onCollisionEnter( bodyA ) {
    console.log( 'colliision', bodyA );
  }
}
