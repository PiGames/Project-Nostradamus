import Entity from './Entity';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_SNEAK_MULTIPLIER, PLAYER_SPRINT_MULTIPLIER, PLAYER_WALK_ANIMATION_FRAMERATE, PLAYER_FIGHT_ANIMATION_FRAMERATE } from '../constants/PlayerConstants';

/** Class representing player in game world. It derives after Entity class. It is responsible for player movement, animations, attacks etc.  */
export default class Player extends Entity {
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

    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;

    this.cursors = {
      up: this.game.input.keyboard.addKey( Phaser.Keyboard.W ),
      down: this.game.input.keyboard.addKey( Phaser.Keyboard.S ),
      left: this.game.input.keyboard.addKey( Phaser.Keyboard.A ),
      right: this.game.input.keyboard.addKey( Phaser.Keyboard.D ),
      sneak: this.game.input.keyboard.addKey( Phaser.Keyboard.ALT ),
      sprint: this.game.input.keyboard.addKey( Phaser.Keyboard.SHIFT ),
    };

    this.animations.add( 'walk', [ 1, 2, 1, 0 ], 1 );
    this.animations.add( 'fight', [ 3, 5, 4 ], 3 );
  }
  /**
  * Update Player's properties, called every frame, such as: rotation angle.
  */
  update() {
    this.handleMovement();
    this.handleAnimation();
    this.lookAtMouse();
  }
  /**
  * Handle player's movement. Handle movement special modes and normalize movement vector.
  */
  handleMovement() {
    this.resetVelocity();

    if ( this.cursors.up.isDown ) {
      this.body.velocity.y = -PLAYER_SPEED;
    } else if ( this.cursors.down.isDown ) {
      this.body.velocity.y = PLAYER_SPEED;
    }

    if ( this.cursors.left.isDown ) {
      this.body.velocity.x = -PLAYER_SPEED;
    } else if ( this.cursors.right.isDown ) {
      this.body.velocity.x = PLAYER_SPEED;
    }

    this.handleMovementSpecialModes();

    this.normalizeVelocity();
  }
  /**
  * Check for special keys pressed, if so make player move slower or faster.
  */
  handleMovementSpecialModes() {
    let specialEffectMultiplier = 1;

    if ( this.cursors.sneak.isDown ) {
      specialEffectMultiplier = PLAYER_SNEAK_MULTIPLIER;
    } else if ( this.cursors.sprint.isDown ) {
      specialEffectMultiplier = PLAYER_SPRINT_MULTIPLIER;
    }

    this.body.velocity.x *= specialEffectMultiplier;
    this.body.velocity.y *= specialEffectMultiplier;
  }
  handleAnimation() {
    if ( this.body.velocity.x !== 0 || this.body.velocity.y !== 0 ) {
      this.animations.play( 'walk', PLAYER_WALK_ANIMATION_FRAMERATE, true );
    } else {
      this.animations.stop( 'walk', true );
    }
    if ( this.game.input.activePointer.leftButton.isDown ) {
      this.animations.play( 'fight', PLAYER_FIGHT_ANIMATION_FRAMERATE, false );
    }
  }
  lookAtMouse() {
    const mouseX = this.game.input.mousePointer.worldX;
    const mouseY = this.game.input.mousePointer.worldY;

    this.lookAt( mouseX, mouseY );
  }

}
