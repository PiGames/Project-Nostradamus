import Game from '../states/Game.js';

import map from 'assets/levels/level1/map.json';
import journals from 'assets/levels/level1/journals.json';

export default class Level1 extends Game {
  preload() {
    Game.prototype.preload.call( this );

    this.load.tilemap( 'map', map, null, Phaser.Tilemap.TILED_JSON );
    this.load.json( 'journals', journals );
  }
  create() {
    Game.prototype.create.call( this );
    console.log( 'level1 loaded' );
  }
}
