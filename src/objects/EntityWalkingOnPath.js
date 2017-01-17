import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';
import { ZOMBIE_SPEED, ZOMBIE_LOOKING_OFFSET, MIN_DISTANCE_TO_TARGET } from '../constants/ZombieConstants';
import { tileToPixels, getWallsPostions } from '../utils/MapUtils.js';

/** Create Entity that is supposed to walk on given path. Set position of entity on first given target*/
export default class EntityWalkingOnPath extends Entity {
  constructor( game, imageKey, frame, targets, walls ) {
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
    if ( this.canMove ) {
      if ( this.isReached( this.stepTarget ) ) {
        this.onStepTargetReach();
      }
      this.game.physics.arcade.moveToObject( this, tileToPixels( this.stepTarget ), ZOMBIE_SPEED );

      this.updateLookDirection();
    }
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
  /**
  * Change path to temporary and automatically get back to standard path, after reaching temporary target.
  * @param {tile} start - start tile coordinates, if this tile is different that entity's tile then it goes straight to this tile.
  * @param {tile} target - target tile coordinates, this should be initialized with current path target otherwise some unpredictable things may happen.
  */
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
}
