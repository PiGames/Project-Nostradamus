import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';
import { ZOMBIE_SPEED, ZOMBIE_LOOKING_OFFSET, MIN_DISTANCE_TO_TARGET } from '../constants/ZombieConstants';
import { pixelsToTileX, pixelsToTileY, tileToPixels } from '../utils/MapUtils.js';

/** Create Entity that is supposed to walk on given path. */
export default class EntityWalkingOnPath extends Entity {
  constructor( game, x, y, imageKey, frame, path, walls ) {
    super( game, x, y, imageKey, frame );

    this.pathfinder = new PathFinder();
    this.pathfinder.setGrid( walls );

    this.pathTargets = path;

    this.pathsBetweenPathTargets = [];

    this.currentTarget = this.pathTargets[ 0 ];

    /* disable update until path is calculated */
    this.isMoving = false;

    //this.calculateStandardPaths();

    this.startMovement();
  }
  /**Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.  Recurse approach is used to handle asynchronous nature of findPath method */
  calculateStandardPaths( index = 0 ) {
    if ( this.pathsBetweenPathTargets.length === this.pathTargets.length ) {
      return;
    }

    const start = this.pathTargets[ index ];
    const target = ( index === this.pathTargets.length - 1 ) ? this.pathTargets[ 0 ] : this.pathTargets[ index + 1 ];

    this.pathfinder.findPath( start.x, start.y, target.x, target.y, ( path ) => {
      this.savePath( path, start, target );
      this.calculateStandardPaths( index + 1 );
    } );
  }
  savePath( path, start, target ) {
    this.pathsBetweenPathTargets.push( { path, start, target } );
  }
  startMovement() {
    this.calculatePath( path => this.onPathCalculatingFinish( path ) );
  }
  calculatePath( callback ) {
    this.pathfinder.findPath( pixelsToTileX( this.position.x ), pixelsToTileY( this.position.y ), this.currentTarget.x, this.currentTarget.y, callback );
  }
  onPathCalculatingFinish( path ) {
    this.pathToCurrentTarget = path;
    this.stepTarget = this.pathToCurrentTarget[ 1 ];

    /* enable update */
    this.isMoving = true;
  }
  /** Check if current target or step target is reached. Move body in stepTarget direction. */
  update() {
    if ( this.isMoving ) {
      if ( this.isReached( this.currentTarget ) ) {
        this.onCurrentTargetReach();
        return;
      }
      if ( this.isReached( this.stepTarget ) ) {
        this.onStepTargetReach();
        return;
      }
      /* This can be done better, by comparing body's distance to target in each frame, if it is greater than in previous frame, following line should be called  */
      this.game.physics.arcade.moveToObject( this, tileToPixels( this.stepTarget ), ZOMBIE_SPEED );

      this.updateLookDirection();
    }
  }
  isReached( target ) {
    const distanceToTarget = this.game.physics.arcade.distanceBetween( this, tileToPixels( target ) );
    return distanceToTarget <= MIN_DISTANCE_TO_TARGET;
  }
  onStepTargetReach() {
    this.resetVelocity();
    this.stepTarget = this.getNextStepTarget();
    this.game.physics.arcade.moveToObject( this, tileToPixels( this.stepTarget ), ZOMBIE_SPEED );
  }

  getNextStepTarget() {
    const stepTargetIndex = this.pathToCurrentTarget.indexOf( this.stepTarget );
    return this.pathToCurrentTarget[ stepTargetIndex + 1 ];
  }
  onCurrentTargetReach() {
    this.resetVelocity();
    this.currentTarget = this.getNextCurrentTarget();

    /* disable update until path is calculated */
    this.isMoving = false;

    this.startMovement();
  }
  getNextCurrentTarget() {
    const currentTargetIndex = this.pathTargets.indexOf( this.currentTarget );
    return currentTargetIndex >= this.pathTargets.length - 1 ? this.pathTargets[ 0 ] : this.pathTargets[ currentTargetIndex + 1 ];
  }
  updateLookDirection() {
    const lookTarget = tileToPixels( this.stepTarget );

    /* Not sure if this works properly */
    const lookX = lookTarget.x + ZOMBIE_LOOKING_OFFSET * ( lookTarget.x - this.position.x );
    const lookY = lookTarget.y + ZOMBIE_LOOKING_OFFSET * ( lookTarget.y - this.position.y );

    this.lookAt( lookX, lookY );
  }
}
