import tilemap_floor from 'assets/tilemaps/tilemap_floor.png';
import tilemap_walls from 'assets/tilemaps/tilemap_walls.png';

import player from 'assets/images/player-sheet.png';
import zombie from 'assets/images/zombie-sheet.png';

import computer from 'assets/images/computer.png';
import layer_background from 'assets/images/bg-color.png';
import journal_ui from 'assets/images/journal-ui.png';

import main_menu_btn from 'assets/images/main-menu-btn.png';
import restart_btn from 'assets/images/restart-btn.png';


import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants/PlayerConstants.js';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT } from '../constants/ZombieConstants.js';

class Preload extends Phaser.State {
  preload() {
    this.load.image( 'tilemap_floor', tilemap_floor );
    this.load.image( 'tilemap_walls', tilemap_walls );

    this.game.load.spritesheet( 'player', player, PLAYER_WIDTH, PLAYER_HEIGHT );
    this.game.load.spritesheet( 'zombie', zombie, ZOMBIE_WIDTH, ZOMBIE_HEIGHT );

    this.game.load.image( 'computer', computer );
    this.game.load.image( 'layer-background', layer_background );
    this.game.load.image( 'journal-ui', journal_ui );

    this.game.load.image( 'main-menu-btn', main_menu_btn );
    this.game.load.image( 'restart-btn', restart_btn );
  }
  create() {
    this.state.start( 'Menu' );
  }
}

export default Preload;
