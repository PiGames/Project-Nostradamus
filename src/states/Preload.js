import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants/PlayerConstants.js';

/** Class responsible for displaying loading screen and loading resources for game.  */
class Preload extends Phaser.State {
  /**
  * Display loading screen. Load resources for game.
  */
  preload() {
    this.load.tilemap( 'map', 'assets/tilemaps/maps/map.json', null, Phaser.Tilemap.TILED_JSON );
    this.load.image( 'tilemap', 'assets/tilemaps/tiles/tilemap.png' );

    this.game.load.spritesheet( 'player', './assets/images/player-sheet-small.png', PLAYER_WIDTH, PLAYER_HEIGHT );
  }

  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
