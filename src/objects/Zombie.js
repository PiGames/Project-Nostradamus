import EntityWalkingOnPath from './EntityWalkingOnPath';
import { ZOMBIE_SPEED, MIN_DISTANCE_TO_TARGET, ZOMBIE_SPEED_CHASING_MULTIPLIER, ZOMBIE_SIGHT_ANGLE, ZOMBIE_SIGHT_RANGE, ZOMBIE_HEARING_RANGE, ZOMBIE_DAMAGE_TAKEN, ZOMBIE_DAMAGE_COOLDOWN, ZOMBIE_DAMAGE_MULTIPLIER } from '../constants/ZombieConstants';
import { pixelsToTile } from '../utils/MapUtils.js';

export default class Zombie extends EntityWalkingOnPath {
  constructor( game, imageKey, frame, targets, walls, player ) {
    super( game, imageKey, frame, targets, walls );

    this.player = player;
    this.walls = walls;
    this.playerSeekingRay = new Phaser.Line();
    this.tileHits = [];
    this.isChasing = false;
    this.lastKnownPlayerPosition = { x: 1, y: 1 };
    this.canDealDamage = true;

    this.damageTaken = ZOMBIE_DAMAGE_TAKEN;
  }
  update() {
    if ( this.canSeePlayer() ) {
      this.isChasing = true;
      this.lastKnownPlayerPosition = { x: this.player.x, y: this.player.y };
      if ( this.alive ) {
        this.dealDamage();
      }
    }

    if ( !this.isChasing ) {
      EntityWalkingOnPath.prototype.update.call( this );
    } else {
      this.chasePlayer();
    }
  }
  canSeePlayer() {
    /** Draw line between player and zombie and check if it can see him. If yes, chase him. */
    this.playerSeekingRay.start.set( this.x, this.y );
    this.playerSeekingRay.end.set( this.player.x, this.player.y );

    this.tileHits = this.walls.getRayCastTiles( this.playerSeekingRay, 0, false, false );

    if ( this.tileHits.length > 0 ) {
      for ( let i = 0; i < this.tileHits.length; i++ ) {
        if ( this.tileHits[ i ].index >= 0 ) {
          return false;
        }
      }
    }

    return ( this.isInDegreeRange( this, this.player, ZOMBIE_SIGHT_ANGLE )
    && ( this.isChasing || this.playerSeekingRay.length < ZOMBIE_SIGHT_RANGE ) )
    || ( this.playerSeekingRay.length < ZOMBIE_HEARING_RANGE && !this.player.isSneaking && this.player.isMoving() );
  }

  chasePlayer() {
    this.game.physics.arcade.moveToObject( this, this.lastKnownPlayerPosition, ZOMBIE_SPEED * ZOMBIE_SPEED_CHASING_MULTIPLIER );
    this.lookAt( this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y );

    const distanceToTarget = this.game.physics.arcade.distanceBetween( this, this.lastKnownPlayerPosition );
    if ( !this.canSeePlayer() && ( distanceToTarget <= MIN_DISTANCE_TO_TARGET ) ) {
      this.stopChasingPlayer();
    }
  }

  dealDamage() {
    if ( this.canDealDamage ) {
      const distanceToPlayer = this.game.physics.arcade.distanceBetween( this, this.player );
      if ( distanceToPlayer < 50 ) {
        this.player.takeDamage( 0.1 );
        this.canDealDamage = false;
        this.game.time.events.add( Phaser.Timer.SECOND * ZOMBIE_DAMAGE_COOLDOWN, this.endCooldown, this );
      }
    }
  }

  takeDamage( damage ) {
    this.damage( damage * ZOMBIE_DAMAGE_MULTIPLIER );
  }

  endCooldown() {
    this.canDealDamage = true;
  }

  stopChasingPlayer() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.isChasing = false;
    this.changePathToTemporary( pixelsToTile( this ) );
  }

}
