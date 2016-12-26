/** Class responsible for loading resources to show on loading screen in Preload state. */
class Boot extends Phaser.State {
  /**
  * Load resources for loading screen
  */
  preload() {
  }
  create() {
    this.state.start( 'Preload' );
  }
}

export default Boot;
