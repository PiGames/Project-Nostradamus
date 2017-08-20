import Entity from './Entity';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_SNEAK_MULTIPLIER, PLAYER_SPRINT_MULTIPLIER, PLAYER_WALK_ANIMATION_FRAMERATE, PLAYER_FIGHT_ANIMATION_FRAMERATE, PLAYER_HAND_ATTACK_RANGE, PLAYER_HAND_ATTACK_ANGLE, PLAYER_HAND_ATTACK_DAMAGE, PLAYER_DAMAGE_COOLDOWN } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import Flashlight from './LightsComponents/Flashlight';
import ShootingSystem from './PlayerComponents/ShootingSystem';

const ATTACK_SYSTEMS = {
  HAND_ATTACK_SYSTEM: 0,
  SHOOTING_SYSTEM: 1,
};

export default class Player extends Entity {
  constructor( game, x, y, imageKey, frame, zombies ) {
    super( game, x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2, imageKey, frame );

    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;

    this.zombies = zombies.children;

    this.godMode = false;

    this.isSneaking = false;
    this.isSprinting = false;

    this.attackRange = PLAYER_HAND_ATTACK_RANGE;
    this.dealingDamage = PLAYER_HAND_ATTACK_DAMAGE;

    this.canDealDamage = true;

    this.healthbar = this.game.add.graphics( 0, 0 );
    this.healthbar.anchor.x = 1;
    this.healthbar.anchor.y = 1;
    this.healthbar.fixedToCamera = true;

    this.zombiesInAttackRange = [];

    this.attackSensor = this.body.addCircle( PLAYER_HAND_ATTACK_RANGE );
    this.attackSensor.sensor = true;
    this.attackSensor.sensorType = 'attack';

    this.cursors = {
      up: this.game.input.keyboard.addKey( Phaser.Keyboard.W ),
      down: this.game.input.keyboard.addKey( Phaser.Keyboard.S ),
      left: this.game.input.keyboard.addKey( Phaser.Keyboard.A ),
      right: this.game.input.keyboard.addKey( Phaser.Keyboard.D ),
      sneakToggle: this.game.input.keyboard.addKey( Phaser.Keyboard.CAPS_LOCK ),
      sneak: this.game.input.keyboard.addKey( Phaser.Keyboard.ALT ),
      sprint: this.game.input.keyboard.addKey( Phaser.Keyboard.SHIFT ),
    };

    this.isSneakPressed = false;

    const style = { font: '16px Arial', fill: '#fff' };


    this.sneakText = this.game.add.text( 0, 0, 'Sneaking: off', style );
    this.sneakText.x = this.game.width - ( this.sneakText.width + 24 );
    this.sneakText.y = this.game.height - ( this.sneakText.height + 24 + 32 );
    this.sneakText.fixedToCamera = true;
    this.sneakText.stroke = '#000';
    this.sneakText.strokeThickness = 3;

    this.sprintText = this.game.add.text( 0, 0, 'Sprinting: off', style );
    this.sprintText.x = this.game.width - ( this.sprintText.width + 24 );
    this.sprintText.y = this.game.height - ( this.sprintText.height + 24 + 32 + this.sneakText.height );
    this.sprintText.fixedToCamera = true;
    this.sprintText.stroke = '#000';
    this.sprintText.strokeThickness = 3;

    this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ] );
    this.animations.add( 'fight', [ 6, 7, 8, 9, 0 ] );

    this.body.clearShapes();
    this.body.addCircle( Math.min( PLAYER_WIDTH, PLAYER_HEIGHT ) );

    this.drawHealthBar();

    this.onDeath = new Phaser.Signal();

    this.body.onBeginContact.add( this.onCollisionEnter, this );
    this.body.onEndContact.add( this.onCollisionLeave, this );

    this.flashlight = null;
    this.shootingSystem = new ShootingSystem( this );
    this.activeAttackSystem = ATTACK_SYSTEMS.SHOOTING_SYSTEM;
    this.shootingSystem.activate();
  }

  setUpFlashlight( walls ) {
    this.flashlight = new Flashlight( this, walls );
  }

  update() {
    this.handleMovement();
    this.handleAnimation();
    this.lookAtMouse();
    this.handleAttack();
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
    this.isSneaking = false;

    if ( this.cursors.sprint.isDown ) {
      this.isSprinting = true;
      this.isSneaking = false;
      specialEffectMultiplier = PLAYER_SPRINT_MULTIPLIER;
    }

    if ( this.cursors.sneak.isDown || this.cursors.sneakToggle.isDown ) {
      specialEffectMultiplier = PLAYER_SNEAK_MULTIPLIER;
      this.isSneaking = true;
    }

    this.sneakText.setText( 'Sneaking: ' + ( ( this.isSneaking ) ? 'on' : 'off' ) );
    this.sprintText.setText( 'Sprinting: ' + ( ( this.isSprinting ) ? 'on' : 'off' ) );

    this.body.velocity.x *= specialEffectMultiplier;
    this.body.velocity.y *= specialEffectMultiplier;
  }

  onCollisionEnter( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      if ( shapeB.sensorType === 'attack' && bodyA.sprite.key === 'zombie' ) {
        this.zombiesInAttackRange.push( bodyA.sprite );
      }
    }
  }

  onCollisionLeave( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      if ( shapeB.sensorType === 'attack' && bodyA.sprite.key === 'zombie' ) {
        this.zombiesInAttackRange = this.zombiesInAttackRange.filter( ( v ) => {
          return ( v !== bodyA.sprite );
        } );
      }
    }
  }

  isItSensorArea( body, shape ) {
    if ( body.sprite == null || shape.sensor == null ) {
      return false;
    }

    return shape.sensor;
  }

  handleAnimation() {
    if ( ( this.body.velocity.x !== 0 || this.body.velocity.y !== 0 ) && !this.animations.getAnimation( 'fight' ).isPlaying ) {
      this.animations.play( 'walk', PLAYER_WALK_ANIMATION_FRAMERATE, true );
    } else {
      this.animations.stop( 'walk', true );
    }
  }

  endCooldown() {
    this.canDealDamage = true;
    // this.animations.play( 'walk', ZOMBIE_WALK_ANIMATION_FRAMERATE, true );
  }

  lookAtMouse() {
    const mouseX = this.game.input.mousePointer.worldX;
    const mouseY = this.game.input.mousePointer.worldY;

    this.lookAt( mouseX, mouseY );
  }

  handleAttack() {
    switch ( this.activeAttackSystem ) {
    case ATTACK_SYSTEMS.HAND_ATTACK_SYSTEM:
      this.handleHandAttack();
      break;
    case ATTACK_SYSTEMS.SHOOTING_SYSTEM:
      this.handleShooting();
      break;
    }
  }

  handleHandAttack() {
    let didDealDamage = false;
    if ( this.game.input.activePointer.leftButton.isDown && this.canDealDamage ) {
      this.animations.play( 'fight', PLAYER_FIGHT_ANIMATION_FRAMERATE, false );

      this.zombiesInAttackRange.forEach( ( v ) => {
        if ( v.alive ) {
          if ( this.isInDegreeRange( this, v, PLAYER_HAND_ATTACK_ANGLE ) ) {
            v.takeDamage( this.dealingDamage );
            didDealDamage = true;
          }
        }
      } );

      if ( didDealDamage ) {
        this.canDealDamage = false;
        this.game.time.events.add( Phaser.Timer.SECOND * PLAYER_DAMAGE_COOLDOWN, this.endCooldown, this );
      }
    }
  }

  handleShooting() {
    this.shootingSystem.update();
  }

  takeDamage( damage ) {
    if ( !this.godMode ) {
      Entity.prototype.takeDamage.call( this, [ damage ] );
    }
    this.drawHealthBar();

    if ( this.health <= 0 ) {
      this.handleDeath();
    }
  }

  handleDeath() {
    this.onDeath.dispatch();
    this.healthbar.destroy();
    this.sneakText.destroy();
    this.sprintText.destroy();
  }

  drawHealthBar() {
    const width = 300;
    const height = 32;

    this.healthbar.clear();
    if ( this.godMode ) {
      this.healthbar.beginFill( 0xFFD700, 0.85 );
    } else {
      this.healthbar.beginFill( 0xFF0000, 0.85 );
    }
    this.healthbar.drawRect( this.game.width - ( width + 24 ), this.game.height - ( height + 24 ), width * Math.max( this.health, 0 ), height );
    this.healthbar.endFill();
    if ( this.godMode ) {
      this.healthbar.lineStyle( 2, 0xCEAD00, 1 );
    } else {
      this.healthbar.lineStyle( 2, 0x880000, 1 );
    }
    this.healthbar.drawRect( this.game.width - ( width + 24 ), this.game.height - ( height + 24 ), width, height );
    this.healthbar.lineStyle( 0 );
  }
}
