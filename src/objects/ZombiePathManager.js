import PathFinder from './PathFinder';
import { tileToPixels } from '../utils/MapUtils';
import { MIN_DISTANCE_TO_TARGET } from '../constants/ZombieConstants';

export default class ZombiePathManager {
  constructor( zombie, targets, walls ) {
    this.zombie = zombie;
    this.targets = targets;
    this.walls = walls;

    this.pathFinder = new PathFinder();
    this.pathFinder.setGrid( walls );

    this.pathsBetweenTargets = [];

    this.currentPathIndex = 0;
    this.currentStepIndex = 0;

    this.temporaryPath = [];
    this.temporaryStepIndex = 0;
  }
  start( callback ) {
    // for now it assumes that zombie is placed on first path target
    this.calculatePathsBetweenTargets( callback );
  }
  // Recursive function that calculates standard paths and save them into pathsBetweenPathTargets container.
  // Recurse approach is used to handle asynchronous nature of findPath method.
  calculatePathsBetweenTargets( doneCallback, index = 0 ) {
    if ( this.pathsBetweenTargets.length === this.targets.length ) {
      doneCallback();
      return;
    }

    const start = this.targets[ index ];
    const target = ( index === this.targets.length - 1 ) ? this.targets[ 0 ] : this.targets[ index + 1 ];

    this.pathFinder.findPath( start.x, start.y, target.x, target.y, ( path ) => {
      this.pathsBetweenTargets.push( { path, start, target } );
      this.calculatePathsBetweenTargets( doneCallback, index + 1 );
    } );
  }
  update() {
    const stepTarget = this.getCurrentStepTarget();

    if ( this.isReached( stepTarget ) ) {
      this.onStepTargetReach();
    }
    this.zombie.game.physics.arcade.moveToObject( this.zombie, tileToPixels( stepTarget ) );
  }
  isReached( target ) {
    const distanceToTarget = this.zombie.game.physics.arcade.distanceBetween( this.zombie, tileToPixels( target ) );
    return distanceToTarget <= MIN_DISTANCE_TO_TARGET;
  }
  onStepTargetReach() {
    this.currentStepIndex++;

    if ( this.currentStepIndex === this.pathsBetweenTargets[ this.currentPathIndex ].path.length ) {
      this.currentStepIndex = 0;
      this.currentPathIndex++;

      if ( this.currentPathIndex === this.pathsBetweenTargets.length ) {
        this.currentPathIndex = 0;
      }
    }
  }
  getCurrentStepTarget() {
    return this.pathsBetweenTargets[ this.currentPathIndex ].path[ this.currentStepIndex ];
  }
}
