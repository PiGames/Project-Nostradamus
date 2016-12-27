/** Class responsible for loading resources to show on loading screen in Preload state. */
class Boot extends Phaser.State {
  /**
  * Load resources for loading screen
  */
  preload() {
  }
  create() {
    // this.game.stage.disableVisibilityChange = true;

    // this.game.scale.maxWidth = 800;
    // this.game.scale.maxHeight = 600;
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.updateLayout();

    this.state.start( 'Preload' );
  }
}

export default Boot;
