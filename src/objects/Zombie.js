import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';

import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { ZOMBIE_SPEED } from '../constants/ZombieConstants';

/** Class representing zombie in game world. It derives after Entity class. It is responsible for zombie movement, animations, attacks etc.  */
export default class Zombie extends Entity {
  /**
  * Create the Zombie Entity.
  * @param {object} game - A reference to the currently running game.
  * @param {number} x - The x coordinate to position the Sprite at.
  * @param {number} x - The y coordinate to position the Sprite at.
  * @param {string} imageKey - This is the key to image used by the Sprite during rendering.
  * @param {number} frame - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a numeric index.
  */
  constructor( game, x, y, imageKey, frame, walls ) {
    super( game, x, y, imageKey, frame );
    this.isMoving = true;
    this.bounce = 0.5;

    this.PathFinder = new PathFinder( this.game, walls );

    this.currentStepInFoundPath = 0;
    this.currentPathPoint = 0;
    this.currentPath = [];

    this.pathPoints = [
      { x: 2, y: 1 },
      { x: 2, y: 12 },
      { x: 30, y: 30 },
    ];

    this.startWalking();
  }

  startWalking() {
    this.goToNextPathPoint();
    this.game.time.events.loop( 100, () => {
      this.currentPath = this.PathFinder.getPath();
    }, this );
  }

  goToNextPathPoint() {
    const currentPos = this.pathPoints[ this.currentPathPoint ];
    let nextPos;
    if ( this.currentPathPoint + 1 !== this.pathPoints.length ) {
      nextPos = this.pathPoints[ this.currentPathPoint + 1 ];
    } else {
      nextPos = this.pathPoints[ 0 ];
    }

    this.PathFinder.createPath( currentPos.x, currentPos.y, nextPos.x, nextPos.y );

    if ( this.currentPathPoint < this.pathPoints.length - 1 ) {
      this.currentPathPoint++;
    } else {
      this.currentPathPoint = 0;
    }
  }
  /**
  * Returns current target tile of entity.
  * @return {object} The x and y value of target tile.
  */
  currentTarget() {
    const x = this.currentPath[ this.currentStepInFoundPath ].x;
    const y = this.currentPath[ this.currentStepInFoundPath ].y;
    const tileX = TILE_WIDTH * x + TILE_WIDTH / 2;
    const tileY = TILE_HEIGHT * y + TILE_HEIGHT / 2;

    return {
      x: tileX,
      y: tileY,
    };
  }

  update() {
    if ( this.currentPath.length > 0 ) {
      const target = this.currentTarget();
      const distanceBetween = this.game.physics.arcade.distanceToXY( this, target.x, target.y );

      // this.lookAt( target.x, target.y );

      if ( ( Math.round( distanceBetween ) >= -2 && Math.round( distanceBetween ) <= 2 ) || this.isMoving === false ) {
        this.resetVelocity();
        if ( this.currentStepInFoundPath < this.currentPath.length - 1 ) {
          this.currentStepInFoundPath++;
        } else {
          this.currentStepInFoundPath = 0;
          this.goToNextPathPoint();
          console.log( 1 );
          // this.isMoving = false;
        }
      } else {
        this.game.physics.arcade.moveToXY( this, target.x, target.y, ZOMBIE_SPEED );
      }
    }
  }
}
