import Entity from './Entity';
import ZombiePathManager from './ZombieComponents/ZombiePathManager';
import ZombieRotationManager from './ZombieComponents/ZombieRotationManager';
import SeekingPlayerManager from './ZombieComponents/SeekingPlayerManager';
import ChasingPlayerManager from './ZombieComponents/ChasingPlayerManager';
import { tileToPixels } from '../utils/MapUtils';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { ZOMBIE_WALK_ANIMATION_FRAMERATE } from '../constants/ZombieConstants';

/* eslint-disable no-inline-comments */

const STATES = {
  NOT_READY: 0, // zombie is created but no system is initialized
  NOT_WALKING: 1, // walking on path manager is initialized but paths are not calculated yet
  WALKING_ON_PATH: 2, // zombie is walking on precalculated paths
  CHASING_PLAYER: 3, // zombie is chasing player
};

export default class Zombie extends Entity {
  constructor( game, key, x = 0, y = 0 ) {
    super( game, x, y, key );

    this.initCollider();
    this.initAnimations();

    this.isPathSystemInitialized = false;
    this.walkingOnPathManager = null;
    this.rotationManager = new ZombieRotationManager( this );
    this.chasingPlayerManager = null;

    this.state = STATES.NOT_READY;

    this.body.onBeginContact.add( this.onCollisionEnter, this );
    this.body.onEndContact.add( this.onCollisionLeave, this );
  }
  initCollider() {
    this.body.clearShapes();

    this.body.addCircle( Math.max( TILE_WIDTH, TILE_HEIGHT ) * 0.25 );
  }
  initAnimations() {
    this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ], 0 );
    this.animations.add( 'attack', [ 6, 7, 8, 9 ], 6 );
    this.animations.play( 'walk', ZOMBIE_WALK_ANIMATION_FRAMERATE, true );
  }
  setTilePosition( tile ) {
    const pixelPosition = tileToPixels( tile );
    Object.assign( this.body, pixelPosition );
  }
  initializePathSystem( targets, walls ) {
    this.walkingOnPathManager = new ZombiePathManager( this, targets, walls );

    this.state = STATES.NOT_WALKING;
  }
  startPathSystem() {
    this.walkingOnPathManager.start( () => this.state = STATES.WALKING_ON_PATH );
  }
  initializeChasingSystem( player, walls ) {
    this.seekingPlayerManager = new SeekingPlayerManager( this, player, walls );
    this.seekingPlayerManager.chasePlayerSignal.add( this.changeStateToChasing, this );

    this.chasingPlayerManager = new ChasingPlayerManager( this, player );
    this.chasingPlayerManager.stopChasingPlayerSignal.add( this.changeStateToWalking, this );
  }
  update() {
    switch ( this.state ) {
    case STATES.WALKING_ON_PATH:
      this.handleWalkingOnPathState();
      break;
    case STATES.CHASING_PLAYER:
      this.handleChasingPlayerState();
    }
  }
  onCollisionEnter( ...args ) {
    switch ( this.state ) {
    case STATES.WALKING_ON_PATH:
      this.walkingOnPathManager.onCollisionEnter( ...args );
      this.seekingPlayerManager.onCollisionEnter( ...args );
      break;
    case STATES.CHASING_PLAYER:
      this.chasingPlayerManager.onCollisionEnter( ...args );
      break;
    }
  }
  onCollisionLeave( ...args ) {
    switch ( this.state ) {
    case STATES.WALKING_ON_PATH:
      this.seekingPlayerManager.onCollisionLeave( ...args );
      break;
    case STATES.CHASING_PLAYER:
      this.chasingPlayerManager.onCollisionLeave( ...args );
      break;
    }
  }
  handleWalkingOnPathState() {
    this.walkingOnPathManager.update();

    const currentTileTarget = this.walkingOnPathManager.getCurrentTileTarget();
    this.rotationManager.update( currentTileTarget );

    this.seekingPlayerManager.update();
  }
  handleChasingPlayerState() {
    const lastKnownPlayerPosition = this.seekingPlayerManager.getLastKnownPlayerPosition();
    this.chasingPlayerManager.update( lastKnownPlayerPosition );
  }
  changeStateToChasing() {
    this.state = STATES.CHASING_PLAYER;
  }
  startChasingByBeingNotified() {
    this.seekingPlayerManager.isNotified = true;
    this.changeStateToChasing();
  }
  changeStateToWalking() {
    this.seekingPlayerManager.onStopChasing();
    this.walkingOnPathManager.getBackOnPath();
    this.state = STATES.WALKING_ON_PATH;
  }
  isChasing() {
    return this.state === STATES.CHASING_PLAYER;
  }
  takeDamage( damage ) {
    Entity.prototype.takeDamage.call( this, [ damage ] );
    if ( this.health <= 0 ) {
      this._mask = null;
      this.destroy();
    }
  }
  onPlayerDeath() {
    this.seekingPlayerManager.stopLookingForThePlayer();

    if ( this.isChasing() ) {
      this.changeStateToWalking();
    }
  }
}
