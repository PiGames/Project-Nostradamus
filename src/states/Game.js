import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap.js';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

/**Class representing Game state */
export default class Game extends Phaser.State {
  create() {
    this.map = new TileMap( this.game, 'map', 64, 64 );

    this.player = new Player( this.game, TILE_WIDTH + TILE_WIDTH / 2, TILE_HEIGHT + TILE_HEIGHT / 2, 'player', PLAYER_INITIAL_FRAME );
    this.game.camera.follow( this.player );

    this.zombie = new Zombie( this.game, TILE_WIDTH * 2 + TILE_WIDTH / 2, TILE_HEIGHT + TILE_HEIGHT / 2, 'zombie', PLAYER_INITIAL_FRAME );
  }

  update() {
    this.map.collide( this.player );
  }
}
