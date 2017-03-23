import Game from '../states/Game.js';

export default class Level1 extends Game {
  preload() {
    Game.prototype.preload.call( this );

    this.load.tilemap( 'map', 'assets/levels/level1/map.json', null, Phaser.Tilemap.TILED_JSON );
  }
  create() {
    Game.prototype.create.call( this );
    console.log( 'level1 loaded' );
  }
}
