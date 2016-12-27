import Entity from './Entity';

/** Class representing player in game world. It derives after Entity class. It is responsible for player movement, animations, attacks etc.  */
class Player extends Entity {
  /**
  * Create the Player Entity.
  * @param {object} game - A reference to the currently running game.
  * @param {number} x - The x coordinate to position the Sprite at.
  * @param {number} x - The y coordinate to position the Sprite at.
  * @param {string} imageKey - This is the key to image used by the Sprite during rendering.
  * @param {number} frame - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a numeric index.
  */
  constructor( game, x, y, imageKey, frame ) {
    super( game, x, y, imageKey, frame );
  }
  /**
  * Update Player's properties, called every frame, such as: rotation angle.
  */
  update() {
    this.lookAtMouse();
  }
  lookAtMouse() {
    const mouseX = this.game.input.mousePointer.worldX,
      mouseY = this.game.input.mousePointer.worldY;

    this.lookAt( mouseX, mouseY );
  }

}
export default Player;
