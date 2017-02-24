import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants/PlayerConstants.js';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT } from '../constants/ZombieConstants.js';

class Preload extends Phaser.State {
  preload() {
    this.load.tilemap( 'map', 'assets/tilemaps/maps/map.json', null, Phaser.Tilemap.TILED_JSON );
    this.load.image( 'tilemap', 'assets/tilemaps/tiles/tilemap.png' );

    this.game.load.spritesheet( 'player', './assets/images/player-sheet.png', PLAYER_WIDTH, PLAYER_HEIGHT );
    this.game.load.spritesheet( 'zombie', './assets/images/zombie-sheet.png', ZOMBIE_WIDTH, ZOMBIE_HEIGHT );

    this.game.load.image( 'computer', './assets/images/computer.png' );
    this.game.load.image( 'layer-background', './assets/images/bg-color.png' );
  }
  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
