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
  showJournal( ) {
    console.log( this.game.camera );
    this.backgroundLayer = this.game.add.sprite( this.game.camera.x + this.game.camera.width / 2, this.game.camera.y + this.game.camera.height / 2, 'layer-background' );
    this.backgroundLayer.width = this.game.width + 100;
    this.backgroundLayer.height = this.game.height + 100;
    this.backgroundLayer.anchor.setTo( 0.5 );
    this.backgroundLayer.alpha = 0.4;
  }
  tryToHideJournal() {
    if ( this.isJournalOpened && this.game.paused ) {
      this.isJournalOpened = false;
      this.game.paused = false;
      this.messageText.setText( 'Press \'E\' to open personal journal.' );
      this.backgroundLayer.destroy();
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
}
