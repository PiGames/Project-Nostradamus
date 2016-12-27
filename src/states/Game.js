import Player from '../objects/Player';
import { PLAYER_INITIAL_FRAME } from '../constants/PlayerConstants';

class Game extends Phaser.State {
  create() {
    this.player = new Player( this.game, 100, 100, 'player', PLAYER_INITIAL_FRAME );
  }
  update() {
  }
}
export default Game;
