import Boot from './states/Boot';
import Preload from './states/Preload';
import Menu from './states/Menu';
import Game from './states/Game';

/** Class representing whole game. Once created it displays game in defined container. */
class ProjectNostradamus extends Phaser.Game {
  /**
   * Create a game.
   * @param {number | string } width - The width of game in pixels. If given as a string the value must be between - and 100 and will be used as percentage width.
   * @param {number | string } height - The height of game in pixels. If given as a string the value must be between - and 100 and will be used as percentage height.
   * @param {number} renderer - Which renderer to use: Phaser.AUTO will auto-detect, Phaser.WEBGL, Phaser.CANVAS or Phaser.HEADLESS (no rendering at all).
   * @param {string | HTMLElement} - The DOM element into which this games canvas will be injected. Either a DOM ID (string) or the element itself.
  */
  constructor( width, height, renderer, parent ) {
    super( width, height, renderer, parent );
    this.state.add( 'Preload', Preload );
    this.state.add( 'Boot', Boot );
    this.state.add( 'Preload', Preload );
    this.state.add( 'Menu', Menu );
    this.state.add( 'Game', Game );

    this.state.start( 'Boot' );
  }

  resize() {
    console.log( 1 );
  }
}
export default ProjectNostradamus;
