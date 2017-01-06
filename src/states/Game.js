import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap.js';
import WalkingEntitiesManager from '../objects/WalkingEntitiesManager';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

/**Class representing Game state */
export default class Game extends Phaser.State {
  create() {
    this.map = new TileMap( this.game, 'map', 64, 64 );

    this.player = new Player( this.game, TILE_WIDTH + TILE_WIDTH / 2, TILE_HEIGHT + TILE_HEIGHT / 2, 'player', PLAYER_INITIAL_FRAME );
    this.game.camera.follow( this.player );

    this.zombies = new WalkingEntitiesManager( this.game );
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 4, y: 2 }, { x: 4, y: 5 } ], this.map.getWallsPostions() ) );
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 2, y: 4 }, { x: 5, y: 4 } ], this.map.getWallsPostions() ) );
  }

  update() {
    this.map.collide( this.player );
    this.map.collide( this.zombies );
    this.game.physics.arcade.collide( this.zombies );
  }
}
