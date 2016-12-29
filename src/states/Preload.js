import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants/PlayerConstants.js';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT } from '../constants/ZombieConstants.js';

/** Class responsible for displaying loading screen and loading resources for game.  */
class Preload extends Phaser.State {
  /**
  * Display loading screen. Load resources for game.
  */
  preload() {
    this.load.tilemap( 'map', 'assets/tilemaps/maps/map.json', null, Phaser.Tilemap.TILED_JSON );
    this.load.image( 'tilemap', 'assets/tilemaps/tiles/tilemap.png' );

    this.game.load.spritesheet( 'player', './assets/images/player-sheet.png', PLAYER_WIDTH, PLAYER_HEIGHT );
    this.game.load.spritesheet( 'zombie', './assets/images/zombie-sheet.png', ZOMBIE_WIDTH, ZOMBIE_HEIGHT );
  }

  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
