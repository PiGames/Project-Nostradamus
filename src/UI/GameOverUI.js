import { END_SCREEN_FADE_IN_DURATION } from '../constants/UserInterfaceConstants';

import { getScreenCenter, showBackgroundLayer } from '../utils/UserInterfaceUtils';

export default class GameOverUI {
  constructor( game, mainMenuCallback, restartCallback ) {
    this.game = game;
    this.mainMenuCallback = mainMenuCallback;
    this.restartCallback = restartCallback;
  }
  start() {
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
    mainMenuButton.onInputUp.add( () => this.mainMenuCallback() );

    const restartLevelButton = this.game.add.button( this.game.camera.x + this.game.camera.width - 100, this.game.camera.y + this.game.camera.height - 100, 'restart-btn' );
    restartLevelButton.anchor.setTo( 1, 1 );
    restartLevelButton.onInputUp.add( () => this.restartCallback() );
  }
}
