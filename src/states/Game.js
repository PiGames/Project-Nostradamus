import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap';
import JournalsManager from '../objects/JournalsManager';
import Journal from '../objects/Journal';
import BoidsManager from '../objects/BoidsManager';
import GameOverUI from '../UI/GameOverUI';
import PlayerUI from '../UI/PlayerUI';
import LightsManager from '../objects/LightsComponents/LightsManager';
import TorchLight from '../objects/LightsComponents/TorchLight';
import StatusLight from '../objects/LightsComponents/StatusLight';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_SIZE } from '../constants/TileMapConstants';
import { getWallsPositions } from '../utils/MapUtils';

export default class Game extends Phaser.State {
  create() {
    this.drawBackground();
    this.map = new TileMap( this.game, 'map', TILE_SIZE, TILE_SIZE );
    this.zombies = [];
    this.roomlights = [];

    this.handleClick = this.handleClick.bind( this );
    this.lightsKey = this.game.input.keyboard.addKey( Phaser.Keyboard.L );
    this.lightsKey.onUp.add( this.handleClick );

    this.lightsKeyWasPressed = false;
    this.lightsKeyLast = false;

    this.initPlayer();
    this.initCollisionGroups();
    this.initZombies();
    this.initJournals();
    this.setCollisionRelations();
    this.initFlashlight();
    this.initPlayerUI();
    this.initGameOverUI();

    this.player.onDeath.add( () => this.handleGameEnd() );
  }

  drawBackground() {
    const background = this.game.add.tileSprite( 0, 0, this.game.width, this.game.height, 'background' );
    background.fixedToCamera = true;
  }

  handleClick() {
    this.roomlights.forEach( light => {
      light.toggleLight();
    } );
  }

  initCollisionGroups() {
    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup( this.player );
    this.zombiesCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.journalsCollisionGroup = this.game.physics.p2.createCollisionGroup();
  }
  initPlayer() {
    const playerPos = this.map.getPlayerInitialPosition();

    this.player = new Player( this.game, playerPos.x, playerPos.y, 'player', PLAYER_INITIAL_FRAME, this.zombies );
    this.game.camera.follow( this.player );
  }
  initZombies() {
    const wallsPositions = getWallsPositions( this.map.walls );
    this.zombies = new BoidsManager( this.game, wallsPositions );

    for ( let i = 0; i < this.map.paths.length; i++ ) {
      const newZombie = new Zombie( this.game, 'zombie' );

      newZombie.setTilePosition( this.map.paths[ i ][ 0 ] );
      newZombie.initializeChasingSystem( this.player, this.map.walls );
      newZombie.body.setCollisionGroup( this.zombiesCollisionGroup );
      newZombie.initializePathSystem( this.map.getPath( i ), wallsPositions );
      newZombie.startPathSystem();

      this.player.onDeath.add( () => newZombie.onPlayerDeath() );

      this.zombies.add( newZombie );
    }
  }
  initJournals() {
    this.journals = new JournalsManager( this.game, this.player );

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

      this.journals.add( newJournal );
    }

    this.player.body.onBeginContact.add( ( ...args ) => this.journals.onCollisionEnter( ...args ) );
    this.player.body.onEndContact.add( ( ...args ) => this.journals.onCollisionLeave( ...args ) );
  }
  setCollisionRelations() {
    this.map.collides( [ this.playerCollisionGroup, this.zombiesCollisionGroup ] );
    this.player.body.collides( [ this.map.wallsCollisionGroup, this.zombiesCollisionGroup, this.journalsCollisionGroup ] );

    this.zombies.forEach( zombie => {
      zombie.body.collides( [ this.playerCollisionGroup, this.map.wallsCollisionGroup, this.journalsCollisionGroup, this.zombiesCollisionGroup ] );
    } );

    this.journals.forEach( journal => {
      journal.body.collides( [ this.playerCollisionGroup, this.zombiesCollisionGroup ] );
    } );
  }
  initFlashlight() {
    this.lightsManager = new LightsManager( this.game, this.map.walls );
    this.player.setUpFlashlight( this.map.walls );
    this.lightsManager.add( this.player.flashlight );

    this.journals.forEach( journal => {
      this.lightsManager.add( journal.light );
    } );

    this.map.getLights().forEach( ( light ) => {
      let tl;

      if ( light.type === 'ceiling' ) {
        tl = new TorchLight( { x: light.x, y: light.y }, light );
        this.roomlights.push( tl );
      } else if ( light.type === 'status' ) {
        tl = new StatusLight( { x: light.x, y: light.y }, light );
      } else {
        tl = new TorchLight( { x: light.x, y: light.y }, light );
      }

      this.lightsManager.add( tl );
    } );
  }
  initPlayerUI() {
    this.playerUI = new PlayerUI( this.game );
    this.playerUI.setPlayerHealth( this.player.health );
    this.player.onHealthUpdate.add( this.playerUI.setPlayerHealth.bind( this.playerUI ) );
    this.player.onMovementModeUpdate.add( this.playerUI.setPlayerMovementInfo.bind( this.playerUI ) );
    this.player.onFlashlightToggle.add( this.player.flashlight.toggleLight );
  }
  initGameOverUI() {
    const mainMenuCallback = () => this.state.start( 'Menu' );
    const restartCallback = () => this.state.restart();
    this.gameOverUI = new GameOverUI( this.game, mainMenuCallback, restartCallback );
  }
  handleGameEnd() {
    this.clearScreen();
    this.gameOverUI.start();
  }
  clearScreen() {
    this.journals.clearUI();
    this.playerUI.destroy();
  }
  update() {
    if ( this.lightsManager ) {
      this.lightsManager.update();
    }
  }
  render() {
    this.playerUI.render();
  }
}
