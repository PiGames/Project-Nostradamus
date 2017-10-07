import { ZOMBIE_SIGHT_ANGLE, ZOMBIE_SIGHT_RANGE, ZOMBIE_HEARING_RANGE } from '../../constants/ZombieConstants';
import { isInDegreeRange } from '../../utils/MathUtils';
import EventsManager from '../EventsManager';

export default class SeekingPlayerManager {
  constructor( zombie, player, walls ) {
    this.zombie = zombie;
    this.player = player;
    this.walls = walls;

    this.state = 'searching';

    this.isPlayerInViewRange = false;
    this.isPlayerInHearingRange = false;

    const body = zombie.body;

    const viewSensor = body.addCircle( ZOMBIE_SIGHT_RANGE );
    viewSensor.sensor = true;
    viewSensor.sensorType = 'view';

    const hearSensor = body.addCircle( ZOMBIE_HEARING_RANGE );
    hearSensor.sensor = true;
    hearSensor.sensorType = 'hear';

    EventsManager.create( `chasePlayer-${ zombie.id }` );

    this.shouldLookForThePlayer = true;

    this.isNotified = false;
  }
  update() {

    if ( this.shouldLookForThePlayer && this.canDetectPlayer() ) {
      this.changeStateToChasing();
    }
  }

  canDetectPlayer() {
    if ( this.isPlayerDead || this.isPlayerSeparatedFromZombie( this.player.position ) ) {
      return false;
    }

    if ( this.isNotified === true ) {
      return true;
    }

    return this.canSeePlayer() || this.canHearPlayer();
  }
  isPlayerSeparatedFromZombie( playerPosition ) {
       /** Draw line between player and zombie and check if it can see him. If yes, chase him. */
    const playerSeekingRay = new Phaser.Line();
    playerSeekingRay.start.set( this.zombie.x, this.zombie.y );
    playerSeekingRay.end.set( playerPosition.x, playerPosition.y );

    const tileHits = this.walls.getRayCastTiles( playerSeekingRay, 0, false, false );

    for ( let i = 0; i < tileHits.length; i++ ) {
      if ( tileHits[ i ].index >= 0 ) {
        return true;
      }
    }

    return false;
  }
  canSeePlayer() {
    return ( this.isPlayerInViewRange && isInDegreeRange( this.zombie, this.player, ZOMBIE_SIGHT_ANGLE ) );
  }
  canHearPlayer() {
    return ( this.isPlayerInHearingRange && !this.player.isSneaking && this.player.isMoving() );
  }
  onCollisionEnter( bodyA, bodyB, shapeA ) {
    if ( this.isItSensorArea( bodyA, shapeA ) ) {
      if ( shapeA.sensorType === 'view' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInViewRange = true;
      } else if ( shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInHearingRange = true;
      }
    }
  }
  onCollisionLeave( bodyA, bodyB, shapeA ) {
    if ( this.isItSensorArea( bodyA, shapeA ) ) {
      if ( shapeA.sensorType === 'view' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInViewRange = false;
      } else if ( shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInHearingRange = false;
      }
    }
  }
  isItSensorArea( body, shape ) {
    if ( body == null || body.sprite == null || shape.sensor == null ) {
      return false;
    }

    return shape.sensor;
  }
  changeStateToChasing() {
    this.lastKnownPlayerPosition = Object.assign( {}, this.player.position );
    EventsManager.dispatch( `chasePlayer-${this.zombie.id}` );
  }
  getLastKnownPlayerPosition() {
    if ( this.canDetectPlayer() ) {
      this.lastKnownPlayerPosition = Object.assign( {}, this.player.position );
    }
    return this.lastKnownPlayerPosition;
  }
  stopLookingForThePlayer() {
    this.shouldLookForThePlayer = false;
  }
  onStopChasing() {
    this.isNotified = false;
  }
}
