import Entity from './Entity';
import ZombiePathManager from './ZombiePathManager';
import { tileToPixels } from '../utils/MapUtils';
import { ZOMBIE_WALK_ANIMATION_FRAMERATE } from '../constants/ZombieConstants';
import ZombieRotationManager from './ZombieComponents/ZombieRotationManager';

export default class Zombie extends Entity {
  constructor( game, key, x = 0, y = 0 ) {
    super( game, x, y, key );

    this.isPathSystemInitialized = false;
    this.PM = null;

    this.state = 'not-ready';

    this.rotationManager = new ZombieRotationManager( this );

    this.initAnimations();
  }
  initAnimations() {
    this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ], 0 );
    this.animations.add( 'attack', [ 6, 7, 8, 9 ], 6 );
    this.animations.play( 'walk', ZOMBIE_WALK_ANIMATION_FRAMERATE, true );
  }
  setTilePosition( tile ) {
    const pixelPosition = tileToPixels( tile );
    Object.assign( this.body, pixelPosition );
  }
  initializePathSystem( targets, walls ) {
    this.PM = new ZombiePathManager( this, targets, walls );

    this.state = 'not-walking';
  }
  startPathSystem() {
    this.PM.start( () => this.state = 'walking-on-path' );
  }
  update() {
    switch ( this.state ) {
    case 'walking-on-path':
      this.handleWalkingOnPathState();
    }
  }
  onCollision( bodyA, bodyB, shapeA, shapeB ) {
    switch ( this.state ) {
    case 'walking-on-path':
      this.PM.onCollision( bodyA, bodyB, shapeA, shapeB );
    }
  }
  handleWalkingOnPathState() {
    this.PM.update();

    const currentTileTarget = this.PM.getCurrentTileTarget();
    this.rotationManager.update( currentTileTarget );
  }

}
