import Entity from './Entity';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_SNEAK_MULTIPLIER, PLAYER_SPRINT_MULTIPLIER, PLAYER_WALK_ANIMATION_FRAMERATE, PLAYER_FIGHT_ANIMATION_FRAMERATE, PLAYER_HAND_ATTACK_RANGE, PLAYER_HAND_ATTACK_ANGLE, PLAYER_HAND_ATTACK_DAMAGE } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

export default class Player extends Entity {
  constructor( game, x, y, imageKey, frame, zombies ) {
    super( game, x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2, imageKey, frame );

    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;

    this.zombies = zombies.children;

    this.isSneaking = false;
    this.isSprinting = false;

    this.attackRange = PLAYER_HAND_ATTACK_RANGE;
    this.dealingDamage = PLAYER_HAND_ATTACK_DAMAGE;

    this.healthbar = this.game.add.graphics( 0, 0 );
    this.healthbar.anchor.x = 1;
    this.healthbar.anchor.y = 1;
    this.healthbar.fixedToCamera = true;

    this.cursors = {
      up: this.game.input.keyboard.addKey( Phaser.Keyboard.W ),
      down: this.game.input.keyboard.addKey( Phaser.Keyboard.S ),
      left: this.game.input.keyboard.addKey( Phaser.Keyboard.A ),
      right: this.game.input.keyboard.addKey( Phaser.Keyboard.D ),
      sneak: this.game.input.keyboard.addKey( Phaser.Keyboard.CAPS_LOCK ),
      sprint: this.game.input.keyboard.addKey( Phaser.Keyboard.SHIFT ),
    };

    this.isSneakPressed = false;

    const style = { font: '16px Arial', fill: '#fff' };

    this.sneakText = this.game.add.text( 0, 0, 'Sneaking: off', style );
    this.sneakText.x = this.game.width - ( this.sneakText.width + 24 );
    this.sneakText.y = this.game.height - ( this.sneakText.height + 24 + 32 );
    this.sneakText.fixedToCamera = true;

    this.sprintText = this.game.add.text( 0, 0, 'Sprinting: off', style );
    this.sprintText.x = this.game.width - ( this.sprintText.width + 24 );
    this.sprintText.y = this.game.height - ( this.sprintText.height + 24 + 32 + this.sneakText.height );
    this.sprintText.fixedToCamera = true;

    this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ] );
    this.animations.add( 'fight', [ 6, 7, 8, 9, 0 ] );

    this.body.clearShapes();
    this.body.addCircle( Math.min( PLAYER_WIDTH, PLAYER_HEIGHT ) );

    this.drawHealthBar();
  }

  update() {
    this.handleMovement();
    this.handleAnimation();
    this.lookAtMouse();
    this.handleAttack();
    // console.log( this.zombies.children );
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

    this.isSprinting = false;

    if ( this.cursors.sneak.isDown ) {
      this.isSneakPressed = true;
    } else if ( this.isSneakPressed ) {
      this.isSneaking = !this.isSneaking;
      this.isSneakPressed = false;
    }

    if ( this.cursors.sprint.isDown ) {
      this.isSprinting = true;
      this.isSneaking = false;
      specialEffectMultiplier = PLAYER_SPRINT_MULTIPLIER;
    }

    if ( this.isSneaking ) {
      specialEffectMultiplier = PLAYER_SNEAK_MULTIPLIER;
    }

    this.sneakText.setText( 'Sneaking: ' + ( ( this.isSneaking ) ? 'on' : 'off' ) );
    this.sprintText.setText( 'Sprinting: ' + ( ( this.isSprinting ) ? 'on' : 'off' ) );

    this.body.velocity.x *= specialEffectMultiplier;
    this.body.velocity.y *= specialEffectMultiplier;
  }
  handleAnimation() {
    if ( this.game.input.activePointer.leftButton.isDown ) {
      this.animations.play( 'fight', PLAYER_FIGHT_ANIMATION_FRAMERATE, false );
    }
    if ( ( this.body.velocity.x !== 0 || this.body.velocity.y !== 0 ) && !this.animations.getAnimation( 'fight' ).isPlaying ) {
      this.animations.play( 'walk', PLAYER_WALK_ANIMATION_FRAMERATE, true );
    } else {
      this.animations.stop( 'walk', true );
    }
  }

  lookAtMouse() {
    const mouseX = this.game.input.mousePointer.worldX;
    const mouseY = this.game.input.mousePointer.worldY;

    this.lookAt( mouseX, mouseY );
  }

  handleAttack() {
    if ( this.game.input.activePointer.leftButton.isDown ) {
      this.zombies.forEach( ( v ) => {
        if ( v.alive ) {
          const distanceToZombie = this.game.physics.arcade.distanceBetween( this, v );
          if ( distanceToZombie < this.attackRange && this.isInDegreeRange( this, v, PLAYER_HAND_ATTACK_ANGLE ) ) {
            v.takeDamage( this.dealingDamage );
          }
        }
      } );
    }
  }

  takeDamage( damage ) {
    this.damage( damage );
    this.drawHealthBar();
  }

  drawHealthBar() {
    const width = 300;
    const height = 32;

    this.healthbar.clear();
    this.healthbar.beginFill( 0xFF0000, 0.85 );
    this.healthbar.drawRect( this.game.width - ( width + 24 ), this.game.height - ( height + 24 ), width * Math.max( this.health, 0 ), height );
    this.healthbar.endFill();
    this.healthbar.lineStyle( 2, 0x880000, 1 );
    this.healthbar.drawRect( this.game.width - ( width + 24 ), this.game.height - ( height + 24 ), width, height );
    this.healthbar.lineStyle( 0 );
  }
}
