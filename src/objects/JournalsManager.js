import { JOURNAL_TEXT_FIELD_WIDTH, JOURNAL_TEXT_FIELD_HEIGHT, JOURNAL_TEXT_SCROLL_STEP, JOURNAL_TEXT_FONT_SIZE } from '../constants/ItemConstants';
import { showBackgroundLayer, getScreenCenter } from '../utils/UserInterfaceUtils';

export default class JournalsManager extends Phaser.Group {
  constructor( game, messageText ) {
    super( game );

    this.messageText = messageText;

    this.activateKey = this.game.input.keyboard.addKey( Phaser.Keyboard.E );
    this.activateKey.onDown.add( this.tryToShowJournal, this );
    this.game.input.keyboard.removeKeyCapture( Phaser.Keyboard.E );

    this.activateKey = this.game.input.keyboard.addKey( Phaser.Keyboard.ESC );
    this.activateKey.onDown.add( this.tryToHideJournal, this );
    this.game.input.keyboard.removeKeyCapture( Phaser.Keyboard.ESC );

    this.isJournalOpened = false;
  }
  tryToShowJournal() {
    if ( this.isJournalOpened ) {
      return;
    }
    const approachedJournals = this.children.filter( journal => journal.hasPlayerApproached );
    if ( approachedJournals.length > 0 ) {
      this.isJournalOpened = true;
      this.game.paused = true;
      this.messageText.setText( 'Press \'ESC\' to close personal journal.' );
      this.showJournal( approachedJournals[ 0 ] );
    }
  }
  showJournal( journalToShow ) {
    const screenCenter = getScreenCenter( this.game );

    this.backgroundLayer = showBackgroundLayer( this.game );

    this.ui = this.game.add.sprite( screenCenter.x, screenCenter.y, 'journal-ui' );
    this.ui.anchor.setTo( 0.5 );

    const textStyle = {
      align: 'left',
      fill: '#10aede',
      font: `bold ${JOURNAL_TEXT_FONT_SIZE}px Arial`,
    };

    // TODO make text an internal property of journal object
    this.uiText = this.game.add.text( screenCenter.x, screenCenter.y, journalToShow.content, textStyle );
    this.uiText.wordWrap = true;
    this.uiText.wordWrapWidth = JOURNAL_TEXT_FIELD_WIDTH;
    this.uiText.setTextBounds( -JOURNAL_TEXT_FIELD_WIDTH / 2, -JOURNAL_TEXT_FIELD_HEIGHT / 2, JOURNAL_TEXT_FIELD_WIDTH, JOURNAL_TEXT_FIELD_HEIGHT );

    this.maskGraphics = this.game.add.graphics( 0, 0 );
    this.maskGraphics.beginFill( 0xffffff );
    this.maskGraphics.drawRect( screenCenter.x - JOURNAL_TEXT_FIELD_WIDTH / 2, screenCenter.y - JOURNAL_TEXT_FIELD_HEIGHT / 2, JOURNAL_TEXT_FIELD_WIDTH, JOURNAL_TEXT_FIELD_HEIGHT );

    this.uiText.mask = this.maskGraphics;
  }
  tryToHideJournal() {
    if ( this.isJournalOpened && this.game.paused ) {
      this.isJournalOpened = false;
      this.game.paused = false;
      this.messageText.setText( 'Press \'E\' to open personal journal.' );
      this.backgroundLayer.destroy();
      this.ui.destroy();
      this.uiText.destroy();
      this.maskGraphics.destroy();
    }
  }
  onCollisionEnter( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      this.messageText.setText( 'Press \'E\' to open personal journal.' );
      bodyA.sprite.hasPlayerApproached = true;
    }
  }
  onCollisionLeave( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      this.messageText.setText( '' );
      bodyA.sprite.hasPlayerApproached = false;
    }
  }
  isItSensorArea( body, shape ) {
    if ( body.sprite == null || shape.sensor == null ) {
      return false;
    }
    // for now this line assume that there is only one type of computer's textures
    // TODO enable different sprite key's handling
    return body.sprite.key === 'computer' && shape.sensor;
  }
  onMouseWheel( ) {
    if ( this.isJournalOpened === false ) {
      return;
    }

    const directionY = this.game.input.mouse.wheelDelta;
    if ( directionY === 1 && !( this.uiText.y >= this.game.camera.y + this.game.camera.height / 2 ) ) {
      this.uiText.y += JOURNAL_TEXT_SCROLL_STEP;
    } else if ( directionY === -1 && !( this.uiText.y <= this.game.camera.y + this.game.camera.height / 2 + JOURNAL_TEXT_FIELD_HEIGHT - this.uiText.height ) ) {
      this.uiText.y -= JOURNAL_TEXT_SCROLL_STEP;
    }
  }
}
