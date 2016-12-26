/** Class responsible for displaying loading screen and loading resources for game.  */
class Preload extends Phaser.State {
  /**
  * Display loading screen. Load resources for game.
  */
  preload() {
  }
  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
