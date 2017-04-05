import Game from '../states/Game.js';

export default class Level2 extends Game {
  preload() {
    Game.prototype.preload.call( this );

    this.load.tilemap( 'map', 'assets/levels/level2/map2.json', null, Phaser.Tilemap.TILED_JSON );
    this.load.json( 'journals', 'assets/levels/level1/journals.json' );
  }
  create() {
    Game.prototype.create.call( this );
    console.log( 'level2 loaded' );
  }
}
