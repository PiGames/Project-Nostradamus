import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap';
import ZombiesManager from '../objects/ZombiesManager';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

export default class Game extends Phaser.State {
  create() {
    this.map = new TileMap( this.game, 'map', 64, 64 );

    this.player = new Player( this.game, 10 * TILE_WIDTH + TILE_WIDTH / 2, 2 * TILE_HEIGHT + TILE_HEIGHT / 2, 'player', PLAYER_INITIAL_FRAME );
    this.game.camera.follow( this.player );

    this.zombies = new ZombiesManager( this.game, this.map.walls );
    for ( let i = 0; i < this.map.paths.length; i++ ) {
      this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, this.map.getPath( i ), this.map.walls, this.player ) );
    }
  }

  update() {
    this.map.collide( this.player );
    this.map.collide( this.zombies, ( ...args ) => this.zombies.onCollisionWithWalls( ...args ) );
    this.game.physics.arcade.collide( this.zombies, this.zombies, ( ...args ) => this.zombies.onCollisionWihOtherEntity( ...args ) );
    this.game.physics.arcade.collide( this.zombies, this.player );
  }
}
