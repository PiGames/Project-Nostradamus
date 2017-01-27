import Entity from './Entity';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_SNEAK_MULTIPLIER, PLAYER_SPRINT_MULTIPLIER, PLAYER_WALK_ANIMATION_FRAMERATE, PLAYER_FIGHT_ANIMATION_FRAMERATE } from '../constants/PlayerConstants';

export default class Player extends Entity {
  constructor( game, x, y, imageKey, frame ) {
    super( game, x, y, imageKey, frame );

    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;

    this.isSneaking = false;
    this.isSprinting = false;

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

    this.body.addCircle( Math.max( PLAYER_WIDTH, PLAYER_HEIGHT ) );
  }
  update() {
    this.handleMovement();
    this.handleAnimation();
    this.lookAtMouse();
  }
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
  handleMovementSpecialModes() {
    let specialEffectMultiplier = 1;

    this.isSneaking = false;
    this.isSprinting = false;

    if ( this.cursors.sneak.isDown ) {
      specialEffectMultiplier = PLAYER_SNEAK_MULTIPLIER;
      this.isSneaking = true;
    } else if ( this.cursors.sprint.isDown ) {
      specialEffectMultiplier = PLAYER_SPRINT_MULTIPLIER;
      this.isSprinting = true;
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
