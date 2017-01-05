import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';
import { ZOMBIE_SPEED, ZOMBIE_LOOKING_OFFSET, MIN_DISTANCE_TO_TARGET } from '../constants/ZombieConstants';
import { pixelsToTileX, pixelsToTileY, tileToPixels } from '../utils/MapUtils.js';

/** Create Entity that is supposed to walk on given path. Set position of entity on first given target*/
export default class EntityWalkingOnPath extends Entity {
  constructor( game, imageKey, frame, targets, walls ) {
    const position = tileToPixels( targets[ 0 ] );

    super( game, position.x, position.y, imageKey, frame );

    this.pathfinder = new PathFinder();
    this.pathfinder.setGrid( walls );

    this.targets = targets;

    this.pathsBetweenPathTargets = [];

    /* disable update until path is calculated */
    this.isMoving = false;

    this.currentPathIndex = 0;
    this.currentStepIndex = 0;

    this.calculateStandardPaths( () => {
      this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
      this.enableMovement = true;
    } );
  }
  /**Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.  Recurse approach is used to handle asynchronous nature of findPath method */
  calculateStandardPaths( doneCallback, index = 0 ) {
    if ( this.pathsBetweenPathTargets.length === this.targets.length ) {
      doneCallback();
      return;
    }

    const start = this.targets[ index ];
    const target = ( index === this.targets.length - 1 ) ? this.targets[ 0 ] : this.targets[ index + 1 ];

    this.pathfinder.findPath( start.x, start.y, target.x, target.y, ( path ) => {
      this.pathsBetweenPathTargets.push( { path, start, target } );
      this.calculateStandardPaths( doneCallback, index + 1 );
    } );
  }
  /** Check if current target or step target is reached. Move body in stepTarget direction. */
  update() {
    if ( this.enableMovement ) {
      if ( this.isReached( this.stepTarget ) ) {
        this.onStepTargetReach();
      }
      this.game.physics.arcade.moveToObject( this, tileToPixels( this.stepTarget ), ZOMBIE_SPEED );

      this.updateLookDirection();
    }
  }
  onStepTargetReach() {
    this.currentStepIndex++;
    if ( this.currentStepIndex === this.pathsBetweenPathTargets[ this.currentPathIndex ].path.length ) {
      this.currentPathIndex = ( this.currentPathIndex + 1 === this.pathsBetweenPathTargets.length ) ? 0 : this.currentPathIndex + 1;
      this.currentStepIndex = 0;
    }
    this.stepTarget = this.pathsBetweenPathTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
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
}
