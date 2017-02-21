import Player from '../objects/Player';
import Zombie from '../objects/Zombie';
import TileMap from '../objects/TileMap';
import ZombiesManager from '../objects/ZombiesManager';
import p2 from 'p2';

import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { COMPUTER_WIDTH, COMPUTER_HEIGHT } from '../constants/ItemConstants';

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

    this.computer = this.game.add.sprite( 9 * TILE_WIDTH + COMPUTER_WIDTH / 2, TILE_HEIGHT + COMPUTER_HEIGHT / 2, 'computer' );
    this.game.physics.p2.enable( this.computer );
    this.computer.body.static = true;

    const rectangleSensor = new p2.Box( { width: TILE_WIDTH / 20, height: TILE_HEIGHT / 20 } );
    rectangleSensor.sensor = true;

    this.computer.body.addShape( rectangleSensor, COMPUTER_WIDTH / 2, COMPUTER_HEIGHT / 2 );

    this.computersCollisionGroup = this.game.physics.p2.createCollisionGroup( this.computer );

    this.computer.body.collides( this.playerCollisionGroup );
    this.player.body.collides( this.computersCollisionGroup );

    const style = { font: '16px Arial', fill: '#fff' };

    this.pressToOpenTerminalText = this.game.add.text( 0, 0, '', style );
    this.pressToOpenTerminalText.x = 24;
    this.pressToOpenTerminalText.y = this.game.height - 24 - 32;
    this.pressToOpenTerminalText .fixedToCamera = true;

    this.player.body.onBeginContact.add( ( body, bodyB, shapeA, shapeB ) => {
      if ( this.isItComputerArea( body, shapeB ) ) {
        this.pressToOpenTerminalText.setText( 'Press \'E\' to open terminal.' );
      }
    } );
    this.player.body.onEndContact.add( ( body, bodyB, shapeA, shapeB ) => {
      if ( this.isItComputerArea( body, shapeB ) ) {
        this.pressToOpenTerminalText.setText( '' );
      }
    } );
  }
  isItComputerArea( body, shape ) {
    if ( body.sprite == null || shape.sensor == null ) {
      return false;
    }
    return body.sprite.key === 'computer' && shape.sensor;
  }
  update() {

  }
}
