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
    const playerPos = this.map.getPlayerInitialPosition();
    this.player = new Player( this.game, playerPos.x, playerPos.y, 'player', PLAYER_INITIAL_FRAME, this.zombies );

    const style = { font: '24px Arial', fill: '#fff' };

    this.messageText = this.game.add.text( 0, 0, '', style );
    this.messageText.x = 24;
    this.messageText.y = this.game.height - 24 - 32;
    this.messageText.fixedToCamera = true;

    this.journals = new JournalsManager( this.game, this.messageText );

    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup( this.player );
    this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.journalsCollisionGroup = this.game.physics.p2.createCollisionGroup();

    // init player
    this.game.camera.follow( this.player );

    this.map.collides( [ this.playerCollisionGroup ] );
    this.player.body.collides( [ this.map.wallsCollisionGroup ] );

    // init zombies
    for ( let i = 0; i < this.map.paths.length; i++ ) {
      const newZombie = this.zombies.add( new Zombie( this.game, 'zombie', PLAYER_INITIAL_FRAME, this.map.getPath( i ), this.map.walls, this.player ) );

      newZombie.body.setCollisionGroup( this.zombiesCollisionGroup );
      newZombie.body.collides( this.zombiesCollisionGroup, ( body1, body2 ) => this.zombies.onCollisionWihOtherEntity( body1.sprite, body2.sprite ) );
      newZombie.body.collides( this.map.wallsCollisionGroup, ( body, tileBody ) => this.zombies.onCollisionWithWalls( body.sprite, tileBody ) );
      newZombie.body.collides( [ this.playerCollisionGroup, this.journalsCollisionGroup ] );
      this.player.onDeath.add( () => newZombie.onPlayerDeath() );
    }
    this.player.body.collides( [ this.zombiesCollisionGroup ] );
    this.map.collides( [ this.zombiesCollisionGroup ] );

    // init journals
    const journalsData = this.map.getJournals();

    this.game.input.mouse.mouseWheelCallback = () => this.journals.onMouseWheel();

    for ( let i = 0; i < journalsData.length; i++ ) {
      const newJournal = new Journal( this.game, journalsData[ i ].x, journalsData[ i ].y, journalsData[ i ].cornerX, journalsData[ i ].cornerY, journalsData[ i ].content, 'computer' );
      this.journals.add( newJournal );
      newJournal.body.setCollisionGroup( this.journalsCollisionGroup );
      newJournal.body.collides( [ this.playerCollisionGroup, this.zombiesCollisionGroup ] );
    }
    this.player.body.collides( this.journalsCollisionGroup );

    this.player.body.onBeginContact.add( ( ...args ) => this.journals.onCollisionEnter( ...args ) );
    this.player.body.onEndContact.add( ( ...args ) => this.journals.onCollisionLeave( ...args ) );
  }
}
