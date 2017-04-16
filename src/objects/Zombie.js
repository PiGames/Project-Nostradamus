import Entity from './Entity';
import ZombiePathManager from './ZombiePathManager';
import { tileToPixels } from '../utils/MapUtils';

export default class Zombie extends Entity {
  constructor( game, key, x = 0, y = 0 ) {
    super( game, x, y, key );

    this.isPathSystemInitialized = false;
    this.PM = null;

    this.state = 'not-ready';
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
      this.PM.update();
    }
  }
  onCollision( bodyA, bodyB, shapeA, shapeB ) {
    switch ( this.state ) {
    case 'walking-on-path':
      this.PM.onCollision( bodyA, bodyB, shapeA, shapeB );
    }
  }

}
