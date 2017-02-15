import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap';
import ZombiesManager from '../objects/ZombiesManager';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

export default class Game extends Phaser.State {
  create() {
    this.map = new TileMap( this.game, 'map', TILE_WIDTH, TILE_HEIGHT );

    this.zombies = new ZombiesManager( this.game, this.map.walls );

    this.player = new Player( this.game, 10 * TILE_WIDTH + TILE_WIDTH / 2, 2 * TILE_HEIGHT + TILE_HEIGHT / 2, 'player', PLAYER_INITIAL_FRAME, this.zombies );
    this.game.camera.follow( this.player );

    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup( this.player );
    this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();

    for ( let i = 0; i < this.map.paths.length; i++ ) {
      const newZombie = this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, this.map.getPath( i ), this.map.walls, this.player ) );

      newZombie.body.setCollisionGroup( this.zombiesCollisionGroup );
      newZombie.body.collides( this.zombiesCollisionGroup, ( body1, body2 ) => this.zombies.onCollisionWihOtherEntity( body1.sprite, body2.sprite ) );
      newZombie.body.collides( this.map.wallsCollisionGroup, ( body, tileBody ) => this.zombies.onCollisionWithWalls( body.sprite, tileBody ) );
      newZombie.body.collides( this.playerCollisionGroup );
    }
    this.player.body.collides( [ this.zombiesCollisionGroup, this.map.wallsCollisionGroup ] );

    this.map.collides( [ this.zombiesCollisionGroup, this.playerCollisionGroup ] );
  }
  update() {
  }
}
