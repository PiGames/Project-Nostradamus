class Boot extends Phaser.State {
  preload() {
    // load resources for loading screen
  }
  create() {
    this.state.start( 'Preload' );
  }
}

export default Boot;
