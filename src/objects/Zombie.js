import Entity from './Entity';
import PathFinder from '../objects/PathFinder.js';

import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { ZOMBIE_SPEED, ZOMBIE_LOOKING_OFFSET } from '../constants/ZombieConstants';

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
    this.body.bounce.setTo( 1.2, 1.2 );

    this.PathFinder = new PathFinder( this.game, walls );

    this.currentStepInFoundPath = 0;
    this.currentPathPoint = 0;
    this.currentPath = [];

    this.error = 0;

    this.pathPoints = [
      { x: 1, y: 1 },
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

  goToNextPathPoint( ax ) {
    const currentPos = this.pathPoints[ this.currentPathPoint ];
    let nextPos;
    if ( this.currentPathPoint + 1 !== this.pathPoints.length ) {
      nextPos = this.pathPoints[ this.currentPathPoint + 1 ];
    } else {
      nextPos = this.pathPoints[ 0 ];
    }

    this.PathFinder.createPath( currentPos.x, currentPos.y, nextPos.x, nextPos.y, ax );

    if ( this.currentPathPoint < this.pathPoints.length - 1 ) {
      this.currentPathPoint++;
    } else {
      this.currentPathPoint = 0;
    }
  }

  errorMoveX() {
    let currentPos = this.pathPoints[ this.currentPathPoint - 1 ];

    if ( this.currentPathPoint - 1 < 0 ) {
      currentPos = { x: this.pixToTile( this.position.x ), y: this.pixToTile( this.position.y ) };
    }
    const nextPos = this.pathPoints[ this.currentPathPoint ];

    this.PathFinder.createPath( currentPos.x, currentPos.y, nextPos.x, nextPos.y, this.pixToTile( this.position.x ) + 1, this.pixToTile( this.position.y ) );
  }

  errorMoveY() {
    let currentPos = this.pathPoints[ this.currentPathPoint - 1 ];

    if ( this.currentPathPoint - 1 < 0 ) {
      currentPos = { x: this.pixToTile( this.position.x ), y: this.pixToTile( this.position.y ) };
    }

    const nextPos = this.pathPoints[ this.currentPathPoint ];

    this.PathFinder.createPath( currentPos.x, currentPos.y, nextPos.x, nextPos.y, this.pixToTile( this.position.x ), this.pixToTile( this.position.y ) - 1 );
  }

  pixToTile( a ) {
    return Math.floor( a / TILE_WIDTH );
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

      if ( ( Math.round( distanceBetween ) >= -2 && Math.round( distanceBetween ) <= 2 ) || this.isMoving === false ) {
        this.resetVelocity();
        if ( this.currentStepInFoundPath < this.currentPath.length - 1 ) {
          this.currentStepInFoundPath++;
        } else {
          this.currentStepInFoundPath = 0;
          this.goToNextPathPoint();
        }
      } else {
        let lookX = target.x;
        let lookY = target.y;

        lookX += ZOMBIE_LOOKING_OFFSET * ( lookX - this.position.x );
        lookY += ZOMBIE_LOOKING_OFFSET * ( lookY - this.position.y );

        if ( this.deltaX === 0 && this.deltaY === 0 ) {
          this.error++;
        } else {
          this.error = 0;
        }

        if ( this.error > 5 ) {
          if ( this.body.touching.up ) {
            this.errorMoveY();
            this.error = 0;
          }

          if ( this.body.touching.right ) {
            this.errorMoveX();
            this.error = 0;
          }
        }

        this.lookAt( lookX, lookY );
        this.game.physics.arcade.moveToXY( this, target.x, target.y, ZOMBIE_SPEED );
      }
    }
  }
}
