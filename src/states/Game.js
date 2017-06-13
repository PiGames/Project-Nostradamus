import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap';
import JournalsManager from '../objects/JournalsManager';
import Journal from '../objects/Journal';
import BoidsManager from '../objects/BoidsManager';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { END_SCREEN_FADE_IN_DURATION } from '../constants/UserInterfaceConstants';

import { getScreenCenter, showBackgroundLayer } from '../utils/UserInterfaceUtils';
import { getWallsPositions } from '../utils/MapUtils';

export default class Game extends Phaser.State {
  create() {

    this.map = new TileMap( this.game, 'map', TILE_WIDTH, TILE_HEIGHT );
    const wallsPositions = getWallsPositions( this.map.walls );
    this.zombies = new BoidsManager( this.game, wallsPositions );
    const playerPos = this.map.getPlayerInitialPosition();
    this.player = new Player( this.game, playerPos.x, playerPos.y, 'player', PLAYER_INITIAL_FRAME, this.zombies );

    const style = { font: '24px Arial', fill: '#fff' };

    this.messageText = this.game.add.text( 0, 0, '', style );
    this.messageText.x = 24;
    this.messageText.y = this.game.height - 24 - 32;
    this.messageText.fixedToCamera = true;

    this.journals = new JournalsManager( this.game, this.messageText, this.player );

    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup( this.player );
    this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.journalsCollisionGroup = this.game.physics.p2.createCollisionGroup();

    // init player
    this.game.camera.follow( this.player );

    this.map.collides( [ this.playerCollisionGroup ] );
    this.player.body.collides( [ this.map.wallsCollisionGroup ] );

    // init zombies
    for ( let i = 0; i < this.map.paths.length; i++ ) {
      const newZombie = new Zombie( this.game, 'zombie' );

      newZombie.setTilePosition( this.map.paths[ i ][ 0 ] );
      newZombie.initializeChasingSystem( this.player, this.map.walls );
      // ^^ watch out this must be over 'collides'
      newZombie.body.setCollisionGroup( this.zombiesCollisionGroup );
      newZombie.body.collides( [ this.playerCollisionGroup, this.map.wallsCollisionGroup, this.journalsCollisionGroup, this.zombiesCollisionGroup ] );
      newZombie.initializePathSystem( this.map.getPath( i ), wallsPositions );
      newZombie.startPathSystem();

      this.zombies.add( newZombie );
    }

    this.player.body.collides( [ this.zombiesCollisionGroup ] );
    this.map.collides( [ this.zombiesCollisionGroup ] );

    // init journals
    const journalsData = this.map.getJournals();
    const journalsContent = this.game.cache.getJSON( 'journals' );

    this.game.input.mouse.mouseWheelCallback = () => this.journals.onMouseWheel();

    for ( let i = 0; i < journalsData.length; i++ ) {
      const content = journalsContent[ journalsData[ i ].name ];
      const newJournal = new Journal( this.game, content, 'computer' );
      newJournal.setCorner( journalsData[ i ].cornerX, journalsData[ i ].cornerY );
      newJournal.setPosition( journalsData[ i ].x, journalsData[ i ].y );
      newJournal.enableJournal();

      newJournal.body.setCollisionGroup( this.journalsCollisionGroup );
      newJournal.body.collides( [ this.playerCollisionGroup, this.zombiesCollisionGroup ] );

      this.journals.add( newJournal );
    }
    this.player.body.collides( this.journalsCollisionGroup );

    this.player.body.onBeginContact.add( ( ...args ) => this.journals.onCollisionEnter( ...args ) );
    this.player.body.onEndContact.add( ( ...args ) => this.journals.onCollisionLeave( ...args ) );

    this.player.body.onBeginContact.add( ( ...args ) => this.player.onCollisionEnter( ...args ) );
    this.player.body.onEndContact.add( ( ...args ) => this.player.onCollisionLeave( ...args ) );

    this.player.onDeath.add( () => this.handleGameEnd() );
  }
  handleGameEnd() {
    this.clearScreen();
    this.showEndScreen();
  }
  clearScreen() {
    this.messageText.destroy();
  }
  showEndScreen() {
    const screenCenter = getScreenCenter( this.game );

    this.backgroundLayer = showBackgroundLayer( this.game );
    this.backgroundLayer.alpha = 0;
    this.game.add.tween( this.backgroundLayer ).to( { alpha: 0.5 }, END_SCREEN_FADE_IN_DURATION, 'Linear', true );

    const textStyle = {
      align: 'center',
      fill: 'white',
      font: 'bold 80px Arial',
    };

    const mainText = this.game.add.text( screenCenter.x, screenCenter.y, 'YOU DIED!', textStyle );
    mainText.anchor.setTo( 0.5 );
    mainText.alpha = 0;
    const fadingInTween = this.game.add.tween( mainText ).to( { alpha: 1 }, END_SCREEN_FADE_IN_DURATION, 'Linear', true );
    fadingInTween.onComplete.add( () => this.showEndScreenButtons() );
  }
  showEndScreenButtons() {
    const mainMenuButton = this.game.add.button( this.game.camera.x + 100, this.game.camera.y + this.game.camera.height - 100, 'main-menu-btn' );
    mainMenuButton.anchor.setTo( 0, 1 );
    mainMenuButton.onInputUp.add( () => this.state.start( 'Menu' ) );

    const restartLevelButton = this.game.add.button( this.game.camera.x + this.game.camera.width - 100, this.game.camera.y + this.game.camera.height - 100, 'restart-btn' );
    restartLevelButton.anchor.setTo( 1, 1 );
    restartLevelButton.onInputUp.add( () => this.state.restart() );
  }
}
