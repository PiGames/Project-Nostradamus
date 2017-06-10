import Entity from './Entity';
import ZombiePathManager from './ZombieComponents/ZombiePathManager';
import ZombieRotationManager from './ZombieComponents/ZombieRotationManager';
import SeekingPlayerManager from './ZombieComponents/SeekingPlayerManager';
import ChasingPlayerManager from './ZombieComponents/ChasingPlayerManager';
import { tileToPixels } from '../utils/MapUtils';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { ZOMBIE_WALK_ANIMATION_FRAMERATE } from '../constants/ZombieConstants';

export default class Zombie extends Entity {
  constructor( game, key, x = 0, y = 0 ) {
    super( game, x, y, key );

    this.initCollider();
    this.initAnimations();

    this.isPathSystemInitialized = false;
    this.walkingOnPathManager = null;
    this.rotationManager = new ZombieRotationManager( this );
    this.chasingPlayerManager = null;

    this.state = 'not-ready';

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

    this.state = 'not-walking';
  }
  startPathSystem() {
    this.walkingOnPathManager.start( () => this.state = 'walking-on-path' );
  }
  initializeChasingSystem( player, walls ) {
    this.seekingPlayerManager = new SeekingPlayerManager( this, player, walls );
    this.seekingPlayerManager.chasePlayerSignal.add( this.changeStateToChasing, this );

    this.chasingPlayerManager = new ChasingPlayerManager( this, player );
  }
  update() {
    switch ( this.state ) {
    case 'walking-on-path':
      this.handleWalkingOnPathState();
      break;
    }
  }
  onCollisionEnter( ...args ) {
    switch ( this.state ) {
    case 'walking-on-path':
      this.walkingOnPathManager.onCollisionEnter( ...args );
      this.seekingPlayerManager.onCollisionEnter( ...args );
    }
  }
  onCollisionLeave( ...args ) {
    switch ( this.state ) {
    case 'walking-on-path':
      this.seekingPlayerManager.onCollisionLeave( ...args );
    }
  }
  handleWalkingOnPathState() {
    this.walkingOnPathManager.update();

    const currentTileTarget = this.walkingOnPathManager.getCurrentTileTarget();
    this.rotationManager.update( currentTileTarget );

    this.seekingPlayerManager.update();
  }
  changeStateToChasing() {
    console.log( 'chase!' );
  }
}
