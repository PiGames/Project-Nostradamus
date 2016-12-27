import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants/PlayerConstants.js';

/** Class responsible for displaying loading screen and loading resources for game.  */
class Preload extends Phaser.State {
  /**
  * Display loading screen. Load resources for game.
  */
  preload() {
    this.game.load.spritesheet( 'player', './assets/images/player-sheet.png', PLAYER_WIDTH, PLAYER_HEIGHT );
  }
  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
