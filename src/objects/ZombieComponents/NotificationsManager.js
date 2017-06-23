import { ZOMBIE_NOTIFY_RANGE } from '../../constants/ZombieConstants';

export default class NotificationsManager {
  constructor( zombie ) {
    this.zombie = zombie;

    const notifySensor = zombie.body.addCircle( ZOMBIE_NOTIFY_RANGE );
    notifySensor.sensor = true;
    notifySensor.sensorType = 'notify';

    this.zombiesToNotify = new Set();
  }
  isItNotifySensor( shape, body ) {
    if ( !body || !body.sprite ) {
      return false;
    }
    return shape.sensorType === 'notify' && body.sprite.key === 'zombie';
  }
  onCollisionEnter( bodyA, bodyB, shapeA ) {
    if ( this.isItNotifySensor( shapeA, bodyA ) ) {
      this.zombiesToNotify.add( bodyA.sprite );
    }
  }
  onCollisionLeave( bodyA, bodyB, shapeA ) {
    if ( this.isItNotifySensor( shapeA, bodyA ) ) {
      this.zombiesToNotify.delete( bodyA.sprite );
    }
  }
  update() {
    for ( const zombieToNotify of this.zombiesToNotify ) {
      this.handleNotificationTry( zombieToNotify );
    }
  }
  handleNotificationTry( zombieToNotify ) {
    if ( zombieToNotify.isChasing() === false ) {
      this.notify( zombieToNotify );
    }
  }
  notify( zombieToNotify ) {
    console.log( 'try' );
    if ( !zombieToNotify.seekingPlayerManager.isPlayerSeparatedFromZombie( this.zombie.chasingPlayerManager.lastKnownPlayerPosition ) ) {
      console.log( 'chase', this.zombie.chasingPlayerManager.lastKnownPlayerPosition );
      zombieToNotify.startChasingByBeingNotified( this.zombie.chasingPlayerManager.lastKnownPlayerPosition );
    }
  }
}
