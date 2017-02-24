export default class JournalsManager extends Phaser.Group {
  constructor( game ) {
    super( game );

    const style = { font: '24px Arial', fill: '#fff' };

    this.pressToOpenTerminalText = this.game.add.text( 0, 0, '', style );
    this.pressToOpenTerminalText.x = 24;
    this.pressToOpenTerminalText.y = this.game.height - 24 - 32;
    this.pressToOpenTerminalText.fixedToCamera = true;
  }
  onCollisionEnter( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      this.pressToOpenTerminalText.setText( 'Press \'E\' to open personal journal.' );
    }
  }
  onCollisionLeave( bodyA, bodyB, shapeA, shapeB ) {
    if ( this.isItSensorArea( bodyA, shapeB ) ) {
      this.pressToOpenTerminalText.setText( '' );
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
