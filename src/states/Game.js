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

    this.zombies = new WalkingEntitiesManager( this.game, this.map.wallsPositions );
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 2, y: 4 }, { x: 6, y: 4 } ], this.map.wallsPositions ) );
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 4, y: 2 }, { x: 4, y: 6 } ], this.map.wallsPositions ) );
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 2, y: 2 }, { x: 7, y: 7 } ], this.map.wallsPositions ) );
    this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, [ { x: 1, y: 6 }, { x: 9, y: 9 } ], this.map.wallsPositions ) );
  }

  update() {
    this.map.collide( this.player );
    this.map.collide( this.zombies, ( ...args ) => this.zombies.onCollisionWithWalls( ...args ) );
    this.game.physics.arcade.collide( this.zombies, this.zombies, ( ...args ) => this.zombies.onCollisionWihOtherEntity( ...args ) );
    this.game.physics.arcade.collide( this.zombies, this.player );
  }
}
