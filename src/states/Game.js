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

    this.zombies = this.game.add.group();
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 1, y: 4 }, { x: 10, y: 10 } ], this.map.getWallsPostions() ) );
  }

  update() {
    this.map.collide( this.player );
    this.map.collide( this.zombies );
    this.game.physics.arcade.collide( this.zombies );
  }
}
