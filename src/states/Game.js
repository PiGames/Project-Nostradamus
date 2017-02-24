import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap';
import ZombiesManager from '../objects/ZombiesManager';
import JournalsManager from '../objects/JournalsManager';
import Journal from '../objects/Journal';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

export default class Game extends Phaser.State {
  create() {
    this.map = new TileMap( this.game, 'map', TILE_WIDTH, TILE_HEIGHT );
    this.zombies = new ZombiesManager( this.game, this.map.walls );
    this.player = new Player( this.game, 10 * TILE_WIDTH + TILE_WIDTH / 2, 2 * TILE_HEIGHT + TILE_HEIGHT / 2, 'player', PLAYER_INITIAL_FRAME, this.zombies );
    this.journals = new JournalsManager( this.game );

    // init player
    this.game.camera.follow( this.player );
    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup( this.player );
    this.map.collides( [ this.playerCollisionGroup ] );
    this.player.body.collides( [ this.map.wallsCollisionGroup ] );

    // init zombies
    this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();
    for ( let i = 0; i < this.map.paths.length; i++ ) {
      const newZombie = this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, this.map.getPath( i ), this.map.walls, this.player ) );

      newZombie.body.setCollisionGroup( this.zombiesCollisionGroup );
      newZombie.body.collides( this.zombiesCollisionGroup, ( body1, body2 ) => this.zombies.onCollisionWihOtherEntity( body1.sprite, body2.sprite ) );
      newZombie.body.collides( this.map.wallsCollisionGroup, ( body, tileBody ) => this.zombies.onCollisionWithWalls( body.sprite, tileBody ) );
      newZombie.body.collides( this.playerCollisionGroup );
    }
    this.player.body.collides( [ this.zombiesCollisionGroup ] );
    this.map.collides( [ this.zombiesCollisionGroup ] );

    // init journals
    this.journalsCollisionGroup = this.game.physics.p2.createCollisionGroup();

    const journalsData = [ { x: 9, y: 1, cornerX: 'WEST', cornerY: 'NORTH' },
     { x: 11, y: 1, cornerX: 'EAST', cornerY: 'NORTH' },
     { x: 9, y: 3, cornerX: 'WEST', cornerY: 'SOUTH' } ];

    for ( let i = 0; i < journalsData.length; i++ ) {
      const newJournal = this.journals.add( new Journal( this.game, journalsData[ i ].x, journalsData[ i ].y, journalsData[ i ].cornerX, journalsData[ i ].cornerY, 'computer' ) );
      newJournal.body.setCollisionGroup( this.journalsCollisionGroup );
      newJournal.body.collides( [ this.playerCollisionGroup, this.zombiesCollisionGroup ] );
    }
    this.player.body.collides( this.journalsCollisionGroup );

    this.player.body.onBeginContact.add( ( ...args ) => this.journals.onCollisionEnter( ...args ) );
    this.player.body.onEndContact.add( ( ...args ) => this.journals.onCollisionLeave( ...args ) );
  }
  update() {

  }
}
