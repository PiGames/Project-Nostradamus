import Entity from './Entity';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_SNEAK_MULTIPLIER, PLAYER_SPRINT_MULTIPLIER, PLAYER_WALK_ANIMATION_FRAMERATE, PLAYER_FIGHT_ANIMATION_FRAMERATE, PLAYER_HAND_ATTACK_RANGE, PLAYER_HAND_ATTACK_ANGLE, PLAYER_HAND_ATTACK_DAMAGE, PLAYER_DAMAGE_COOLDOWN } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import Flashlight from './LightsComponents/Flashlight';
import EventsManager from './EventsManager';

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

    this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ] );
    this.animations.add( 'fight', [ 6, 7, 8, 9, 0 ] );

    this.body.clearShapes();
    this.body.addCircle( Math.min( PLAYER_WIDTH, PLAYER_HEIGHT ) );

    EventsManager.create( 'playerDeath' );
    EventsManager.create( 'movementModeUpdate' );
    EventsManager.create( 'healthUpdate' );

    this.body.onBeginContact.add( this.onCollisionEnter, this );
    this.body.onEndContact.add( this.onCollisionLeave, this );

    this.flashlight = null;
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

    const wasKeyPressed = Object.keys( this.cursors ).find( key => this.cursors[ key ].isDown );

    if ( wasKeyPressed !== undefined ) {
      this.handleMovementSpecialModes();
    }

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

    EventsManager.dispatch( 'movementModeUpdate', this.isSneaking, this.isSprinting );

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
    if ( this.game.input.activePointer.leftButton.isDown ) {
      this.animations.play( 'fight', PLAYER_FIGHT_ANIMATION_FRAMERATE, false );
    }
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
    let didDealDamage = false;
    if ( this.game.input.activePointer.leftButton.isDown && this.canDealDamage ) {
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

  takeDamage( damage ) {
    if ( !this.godMode ) {
      Entity.prototype.takeDamage.call( this, [ damage ] );
    }

    EventsManager.dispatch( 'healthUpdate', this.health );

    if ( this.health <= 0 ) {
      this.handleDeath();
    }
  }

  handleDeath() {
    EventsManager.dispatch( 'playerDeath' );
  }
}
