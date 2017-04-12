import EntityWalkingOnPath from './EntityWalkingOnPath';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT, ZOMBIE_SPEED, MIN_DISTANCE_TO_TARGET, ZOMBIE_SPEED_CHASING_MULTIPLIER, ZOMBIE_SIGHT_ANGLE, ZOMBIE_SIGHT_RANGE, ZOMBIE_HEARING_RANGE, ZOMBIE_DAMAGE_TAKEN, ZOMBIE_DAMAGE_COOLDOWN, ZOMBIE_DAMAGE_MULTIPLIER, ZOMBIE_WALK_ANIMATION_FRAMERATE, ZOMBIE_FIGHT_ANIMATION_FRAMERATE, ZOMBIE_WARN_RANGE } from '../constants/ZombieConstants';
import { pixelsToTile } from '../utils/MapUtils.js';

export default class Zombie extends EntityWalkingOnPath {
  constructor( game, imageKey, frame, targets, walls, player ) {
    super( game, imageKey, frame, targets, walls );

    this.player = player;
    this.walls = walls;
    this.isPlayerInViewRange = false;
    this.isPlayerInHearingRange = false;
    this.isInAttackRange = false;
    this.isChasing = false;
    this.lastKnownPlayerPosition = { x: 1, y: 1 };
    this.canDealDamage = true;
    this.zombiesInShoutRange = [];
    this.foundOnHisOwn = false;

    this.damageTaken = ZOMBIE_DAMAGE_TAKEN;

    this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ], 0 );
    this.animations.add( 'attack', [ 6, 7, 8, 9 ], 6 );
    this.animations.play( 'walk', ZOMBIE_WALK_ANIMATION_FRAMERATE, true );

    this.isPlayerDead = false;

    this.body.clearShapes();

    this.warnSensor = this.body.addCircle( ZOMBIE_WARN_RANGE );
    this.warnSensor.sensor = true;
    this.warnSensor.sensorType = 'warn';

    this.viewSensor = this.body.addCircle( ZOMBIE_SIGHT_RANGE );
    this.viewSensor.sensor = true;
    this.viewSensor.sensorType = 'view';

    this.viewSensor = this.body.addCircle( ZOMBIE_HEARING_RANGE );
    this.viewSensor.sensor = true;
    this.viewSensor.sensorType = 'hear';

    this.attackSensor = this.body.addCircle( 50 );
    this.attackSensor.sensor = true;
    this.attackSensor.sensorType = 'attack';

    // this is a little bit hard coded so if it works don't bother but if it doesn't, well try changing this line
    this.body.addCapsule( ZOMBIE_WIDTH / 4, ZOMBIE_HEIGHT / 2 );

    // this.body.debug = true;
  }
  update() {
    if ( this.canDetectPlayer() ) {
      this.warnZombies();
      this.foundOnHisOwn = true;
      this.isChasing = true;
      this.lastKnownPlayerPosition = { x: this.player.x, y: this.player.y };
      if ( this.shouldAttack() ) {
        this.handleAttack();
      }
    }

    if ( this.isChasing && this.foundOnHisOwn ) {
      this.chasePlayer();
    } else {
      EntityWalkingOnPath.prototype.update.call( this );
    }
  }

  warnZombies() {
    this.zombiesInShoutRange.forEach( ( zombie ) => {
      if ( !zombie.canDetectPlayer() && this.canWarnZombie( zombie ) ) {
        zombie.isChasing = true;
        zombie.lastKnownPlayerPosition = Object.assign( {}, this.lastKnownPlayerPosition );
        zombie.changePathToTemporary( pixelsToTile( zombie ), pixelsToTile( zombie.lastKnownPlayerPosition ) );
      }
    } );
  }

  canDetectPlayer() {
    if ( this.isPlayerDead ) {
      return false;
    }

    /** Draw line between player and zombie and check if it can see him. If yes, chase him. */
    const playerSeekingRay = new Phaser.Line();
    playerSeekingRay.start.set( this.x, this.y );
    playerSeekingRay.end.set( this.player.x, this.player.y );

    const tileHits = this.walls.getRayCastTiles( playerSeekingRay, 0, false, false );

    if ( tileHits.length > 0 ) {
      for ( let i = 0; i < tileHits.length; i++ ) {
        if ( tileHits[ i ].index >= 0 ) {
          return false;
        }
      }
    }

    return this.canSeePlayer() || this.canHearPlayer();
  }

  canWarnZombie( zombie ) {
    const zombieRay = new Phaser.Line();
    zombieRay.start.set( this.x, this.y );
    zombieRay.end.set( zombie.x, zombie.y );

    const tileHits = this.walls.getRayCastTiles( zombieRay, 0, false, false );

    if ( tileHits.length > 0 ) {
      for ( let i = 0; i < tileHits.length; i++ ) {
        if ( tileHits[ i ].index >= 0 ) {
          return false;
        }
      }
    }

    return true;
  }

  canSeePlayer() {
    return ( this.isPlayerInViewRange && this.isInDegreeRange( this, this.player, ZOMBIE_SIGHT_ANGLE ) );
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
      } else if ( shapeA.sensorType === 'attack' && bodyA.sprite.key === 'player' ) {
        this.isInAttackRange = true;
      } else if ( shapeA.sensorType === 'warn' && bodyA.sprite.key === 'zombie' ) {
        this.zombiesInShoutRange.push( bodyA.sprite );
      }
    }
  }

  onCollisionLeave( bodyA, bodyB, shapeA ) {
    if ( this.isItSensorArea( bodyA, shapeA ) ) {
      if ( shapeA.sensorType === 'view' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInViewRange = false;
      } else if ( shapeA.sensorType === 'hear' && bodyA.sprite.key === 'player' ) {
        this.isPlayerInHearingRange = false;
      } else if ( shapeA.sensorType === 'attack' && bodyA.sprite.key === 'player' ) {
        this.isInAttackRange = false;
      } else if ( shapeA.sensorType === 'warn' && bodyA.sprite.key === 'zombie' ) {
        this.zombiesInShoutRange = this.zombiesInShoutRange.filter( ( v ) => {
          return ( v !== bodyA.sprite );
        } );
      }
    }
  }

  isItSensorArea( body, shape ) {
    if ( body.sprite == null || shape.sensor == null ) {
      return false;
    }

    return shape.sensor;
  }

  chasePlayer() {
    this.game.physics.arcade.moveToObject( this, this.lastKnownPlayerPosition, ZOMBIE_SPEED * ZOMBIE_SPEED_CHASING_MULTIPLIER );
    this.lookAt( this.lastKnownPlayerPosition.x, this.lastKnownPlayerPosition.y );

    const distanceToTarget = this.game.physics.arcade.distanceBetween( this, this.lastKnownPlayerPosition );
    if ( !this.canDetectPlayer() && ( distanceToTarget <= MIN_DISTANCE_TO_TARGET ) ) {
      this.stopChasingPlayer();
    }
  }

  takeDamage( damage ) {
    this.damage( damage * ZOMBIE_DAMAGE_MULTIPLIER );
    this.health = Math.floor( this.health * 100 ) / 100;
  }

  endCooldown() {
    this.canDealDamage = true;
    this.animations.play( 'walk', ZOMBIE_WALK_ANIMATION_FRAMERATE, true );
  }

  stopChasingPlayer() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.isChasing = false;
    this.foundOnHisOwn = false;
    this.changePathToTemporary( pixelsToTile( this ) );
  }

  shouldAttack() {
    return this.alive && this.canDealDamage && this.isInAttackRange;
  }

  handleAttack() {
    this.animations.play( 'attack', ZOMBIE_FIGHT_ANIMATION_FRAMERATE, false );
    this.player.takeDamage( 0.1 );
    this.canDealDamage = false;
    this.game.time.events.add( Phaser.Timer.SECOND * ZOMBIE_DAMAGE_COOLDOWN, this.endCooldown, this );
    this.game.camera.shake( 0.005, 100, false );
  }

  onPlayerDeath() {
    this.isPlayerDead = true;
    if ( this.isChasing ) {
      this.stopChasingPlayer();
    }
  }
}
