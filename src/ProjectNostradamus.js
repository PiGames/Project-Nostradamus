import Boot from './states/Boot';
import Preload from './states/Preload';
import Menu from './states/Menu';
import Level1 from './levels/Level1';

class ProjectNostradamus extends Phaser.Game {
  constructor( width, height, renderer, parent ) {
    super( width, height, renderer, parent );
    this.state.add( 'Preload', Preload );
    this.state.add( 'Boot', Boot );
    this.state.add( 'Preload', Preload );
    this.state.add( 'Menu', Menu );

    this.state.add( 'Level1', Level1 );

    this.state.start( 'Boot' );
  }
}
export default ProjectNostradamus;
