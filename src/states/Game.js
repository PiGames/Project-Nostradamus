import Player from '../objects/Player';
import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';
import TileMap from '../objects/TileMap.js';

class Game extends Phaser.State {
  create() {
    console.log( 'Starting Game state...' ); // eslint-disable-line no-console
    this.map = new TileMap( this.game );

    this.map.createMap();
    this.map.testPlayer();
    this.player = new Player( this.game, 100, 100, 'player', PLAYER_INITIAL_FRAME );
  }

  update() {
    this.map.createCollision( this.map.player );
    this.map.handleMove();
  }
}
export default Game;
