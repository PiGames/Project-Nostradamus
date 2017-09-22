import Game from '../states/Game.js';

export default class Level3 extends Game {
  preload() {
    Game.prototype.preload.call( this );

    this.load.tilemap( 'map', 'assets/levels/level3/map3.json', null, Phaser.Tilemap.TILED_JSON );
    this.load.json( 'journals', 'assets/levels/level1/journals.json' );
  }
  create() {
    Game.prototype.create.call( this );
    console.log( 'level3 loaded' );
  }
}
