class Preload extends Phaser.State {
  preload() {
    // show loading screen
    // load resources needed for game
  }
  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
