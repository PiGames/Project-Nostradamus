class Menu extends Phaser.State {
  constructor() {
    super();

    this.levels = [
      'Level1',
      'Level2',
    ];
  }

  create() {
    this.state.start( this.levels[ 0 ] );

    window.goToLevel = ( n ) => {
      if ( this.levels[ n - 1 ] ) {
        this.state.start( this.levels[ n - 1 ] );
      } else {
        return 'Level not found!';
      }
    };
  }
}

export default Menu;
