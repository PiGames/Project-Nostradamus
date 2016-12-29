import Entity from './Entity';
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
  constructor( game, x, y, imageKey, frame ) {
    super( game, x, y, imageKey, frame );

    this.tween = this.game.add.tween( this );
    this.i = 0;
    this.pathPoints = [
      { x: 3, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 6 },
      { x: 10, y: 6 },
      { x: 10, y: 5 },
      { x: 7, y: 5 },
    ]

    this.followPath();
  }
  /**
  * Update ZOMBIE's properties, called every frame, such as: rotation angle.
  */
  moveZombieToTile( x, y ) {
    const
      tileX = TILE_WIDTH * x + TILE_WIDTH / 2,
      tileY = TILE_HEIGHT * y + TILE_HEIGHT / 2,
      distanceBetween = Phaser.Math.distance( this.x, this.y, tileX, tileY );

    this.lookAt( tileX, tileY );
    this.tween.to( { x: tileX, y: tileY }, distanceBetween * 1000 / ZOMBIE_SPEED, null, true );
  }

  nextPathStep( i ) {
    this.moveZombieToTile( this.pathPoints[ i ].x, this.pathPoints[ i ].y );
  }

  followPath() {
    if ( this.i < this.pathPoints.length - 1 ) {
      this.i++;
    } else {
      this.i = 0;
    }
    this.nextPathStep( this.i );

    this.tween.onComplete.add( () => {
      this.game.tweens.remove( this.tween );
      this.tween = this.game.add.tween( this );
      this.followPath();
    }, this );
  }
}
