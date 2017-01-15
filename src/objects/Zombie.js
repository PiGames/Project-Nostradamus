import EntityWalkingOnPath from './EntityWalkingOnPath';

/** Class representing zombie in game world. It derives after Entity class. It is responsible for zombie movement, animations, attacks etc.  */
export default class Zombie extends EntityWalkingOnPath {
  /**
  * Create the Zombie Entity.
  * @param {object} game - A reference to the currently running game.
  * @param {number} x - The x coordinate to position the Sprite at.
  * @param {number} x - The y coordinate to position the Sprite at.
  * @param {string} imageKey - This is the key to image used by the Sprite during rendering.
  * @param {number} frame - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a numeric index.
  */
  constructor( game, x, y, imageKey, frame, path, walls, player ) {
    super( game, x, y, imageKey, frame, path, walls, player );
  }
}
