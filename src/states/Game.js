import Player from '../objects/Player';
import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import TileMap from '../objects/TileMap.js';

/**Class representing Game state */
export default class Game extends Phaser.State {
  create() {
    this.map = new TileMap( this.game );

    this.player = new Player( this.game, 100, 100, 'player', PLAYER_INITIAL_FRAME );
    this.game.camera.follow( this.player );
  }

  update() {
    this.map.collide( this.player );
  }
}
