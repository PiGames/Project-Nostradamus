import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';
import { ZOMBIE_SPEED, ZOMBIE_LOOKING_OFFSET, MIN_DISTANCE_TO_TARGET, ZOMBIE_SPEED_CHASING_MULTIPLIER, ZOMBIE_SIGHT_ANGLE, ZOMBIE_SIGHT_RANGE, ZOMBIE_HEARING_RANGE } from '../constants/ZombieConstants';
import { tileToPixels, getWallsPostions } from '../utils/MapUtils.js';

/** Create Entity that is supposed to walk on given path. Set position of entity on first given target*/
export default class EntityWalkingOnPath extends Entity {
  constructor( game, imageKey, frame, targets, walls, player ) {
    const position = tileToPixels( targets[ 0 ] );

    super( game, position.x, position.y, imageKey, frame );

    this.pathfinder = new PathFinder();
    this.wallsPositions = getWallsPostions( walls );

    this.pathfinder.setGrid( this.wallsPositions );

    this.targets = targets;

    this.pathsBetweenPathTargets = [];

    this.currentPathIndex = 0;
    this.currentStepIndex = 0;

    this.isOnStandardPath = true;
    this.temporaryPath = [];
    this.temporaryStepIndex = 0;

    this.player = player;
    this.walls = walls;
    this.line = new Phaser.Line();
    this.tileHits = [];
    this.isChasing = false;
    this.lastKnownPlayerPosition = { x: 1, y: 1 };
    this.angle = 90;

    /* disable update until paths are calculated */
    this.isInitialized = false;
    this.canMove = false;

    this.calculatePathsBetweenTargets( () => {
      this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
      this.isInitialized = true;
      this.canMove = true;
    } );
  }
  /**Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.  Recurse approach is used to handle asynchronous nature of findPath method */
  calculatePathsBetweenTargets( doneCallback, index = 0 ) {
    if ( this.pathsBetweenPathTargets.length === this.targets.length ) {
      doneCallback();
      return;
    }

    const start = this.targets[ index ];
    const target = ( index === this.targets.length - 1 ) ? this.targets[ 0 ] : this.targets[ index + 1 ];

    this.pathfinder.findPath( start.x, start.y, target.x, target.y, ( path ) => {
      this.pathsBetweenPathTargets.push( { path, start, target } );
      this.calculatePathsBetweenTargets( doneCallback, index + 1 );
    } );
  }
  update() {
    /** Check if current target or step target is reached. Move body in stepTarget direction. */
    if ( this.canMove && !this.isChasing ) {
      if ( this.isReached( this.stepTarget ) ) {
        this.onStepTargetReach();
      }
      this.game.physics.arcade.moveToObject( this, tileToPixels( this.stepTarget ), ZOMBIE_SPEED );

      this.updateLookDirection();
    }

    /** Draw line between player and zombie and check if it can see him. If yes chase him. */
    this.line.start.set( this.x, this.y );
    this.line.end.set( this.player.x, this.player.y );

    this.tileHits = this.walls.getRayCastTiles( this.line, 0, false, false );

    this.chasePlayer();
  }
  /** When current step target or temporary step target is reached, set step target to the next one.*/
  /** If current target is reached or temporary target is reached set path to the next one, or get back to standard path*/
  onStepTargetReach() {
    if ( this.isOnStandardPath ) {
      if ( this.currentStepIndex + 1 === this.pathsBetweenPathTargets[ this.currentPathIndex ].path.length ) {
        this.currentPathIndex = ( this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ) ? 0 : this.currentPathIndex + 1;
        this.currentStepIndex = 0;
      } else {
        this.currentStepIndex++;
      }
      this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
    } else {
      if ( this.temporaryStepIndex + 1 === this.temporaryPath.length ) {
        this.changePathToStandard();
      } else {
        this.temporaryStepIndex++;
        this.stepTarget = this.temporaryPath[ this.temporaryStepIndex ];
      }
    }
  }

  updateLookDirection() {
    const lookTarget = tileToPixels( this.stepTarget );

    /* Not sure if this works properly */
    const lookX = lookTarget.x + ZOMBIE_LOOKING_OFFSET * ( lookTarget.x - this.position.x );
    const lookY = lookTarget.y + ZOMBIE_LOOKING_OFFSET * ( lookTarget.y - this.position.y );

    this.lookAt( lookX, lookY );
  }
  isReached( target ) {
    const distanceToTarget = this.game.physics.arcade.distanceBetween( this, tileToPixels( target ) );
    return distanceToTarget <= MIN_DISTANCE_TO_TARGET;
  }
  calculateTemporaryPath( start, target, callback ) {
    this.pathfinder.findPath( start.x, start.y, target.x, target.y, callback );
  }
  /**Change path to temporary and automatically get back to standard path, after reaching temporary target ( it is recommended to set the target as current path target) */
  changePathToTemporary( start, target ) {
    this.canMove = false;
    this.calculateTemporaryPath( start, target, ( path ) => {
      if ( path.length === 0 ) {
        this.changePathToStandard();
        return;
      }
      this.temporaryPath = path;
      this.temporaryStepIndex = 0;
      this.stepTarget = path[ this.temporaryStepIndex ];
      this.isOnStandardPath = false;
      this.canMove = true;
    } );
  }
  changePathToStandard() {
    this.currentPathIndex = ( this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ) ? 0 : this.currentPathIndex + 1;
    this.currentStepIndex = 0;
    this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
    this.isOnStandardPath = true;
  }
  disableMovement() {
    this.canMove = false;
    this.resetVelocity();
  }
  enableMovement() {
    this.canMove = true;
  }

  /* Reacting to player */
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
    this.canSeePlayer();
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
