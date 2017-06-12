export default class ChasingPlayerManager {
  constructor( zombie, player ) {
    this.zombie = zombie;
    this.player = player;
  }
  onCollisionEnter( bodyA ) {
    console.log( 'colliision', bodyA );
  }
}
