import EntityWalkingOnPath from './EntityWalkingOnPath';
import { ZOMBIE_SPEED, MIN_DISTANCE_TO_TARGET, ZOMBIE_SPEED_CHASING_MULTIPLIER, ZOMBIE_SIGHT_ANGLE, ZOMBIE_SIGHT_RANGE, ZOMBIE_HEARING_RANGE } from '../constants/ZombieConstants';

export default class EntityReactsToPlayer extends EntityWalkingOnPath {
  constructor( game, imageKey, frame, targets, walls, player ) {
    super( game, imageKey, frame, targets, walls );
    this.player = player;
    this.line = new Phaser.Line();
    this.walls = walls;
    this.tileHits = [];
    this.isChasing = false;
    this.lastKnownPlayerPoistion = { x: 1, y: 1 };
    this.angle = 90;
  }

  update() {
    this.line.start.set( this.x, this.y );
    this.line.end.set( this.player.x, this.player.y );

    this.tileHits = this.walls.getRayCastTiles( this.line, 0, false, false );
    this.debug();

    this.chasePlayer();
  }

  debug() {
    if ( this.canSeePlayer() ) {
      this.game.debug.geom( this.line, 'rgb(255, 0, 0)' );
    } else if ( this.line.length < ZOMBIE_HEARING_RANGE ) {
      this.game.debug.geom( this.line, 'rgb(255, 255, 0)' );
    } else {
      this.game.debug.geom( this.line, 'rgb(0, 255, 0)' );
    }
  }

  canSeePlayer() {
    if ( this.tileHits.length > 0 ) {
      for ( let i = 0; i < this.tileHits.length; i++ ) {
        if ( this.tileHits[ i ].index >= 0 ) {
          return false;
        }
      }
    }

    const angleDelta = Math.abs( Phaser.Math.radToDeg( Phaser.Math.angleBetween( this.x, this.y, this.player.x, this.player.y ) ) + 90 - this.angle );

    if ( ( ( angleDelta <= ZOMBIE_SIGHT_ANGLE || angleDelta >= ( 360 - ZOMBIE_SIGHT_ANGLE ) ) && ( this.isChasing || this.line.length < ZOMBIE_SIGHT_RANGE ) ) || ( this.line.length < ZOMBIE_HEARING_RANGE && !this.player.isSneaking && this.player.isMoving() ) ) {
      this.isChasing = true;
      this.lastKnownPlayerPoistion = { x: this.player.x, y: this.player.y };
      return true;
    }

    return false;
  }

  chasePlayer() {
    // console.log( this.isChasing );
    if ( this.isChasing ) {
      this.game.physics.arcade.moveToObject( this, this.lastKnownPlayerPoistion, ZOMBIE_SPEED * ZOMBIE_SPEED_CHASING_MULTIPLIER );
      this.lookAt( this.lastKnownPlayerPoistion.x, this.lastKnownPlayerPoistion.y );

      const distanceToTarget = this.game.physics.arcade.distanceBetween( this, this.lastKnownPlayerPoistion );
      if ( !this.canSeePlayer() && ( distanceToTarget <= MIN_DISTANCE_TO_TARGET ) ) {
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.isChasing = false;
      }
    }
  }
}
