export default class PlayerUI {
  constructor( game ) {
    this.game = game;
    this.healthbar = this.game.add.graphics( 0, 0 );
    this.healthbar.anchor.x = 1;
    this.healthbar.anchor.y = 1;
    this.healthbar.fixedToCamera = true;

    const style = { font: '16px Arial', fill: '#fff' };

    this.sneakText = this.game.add.text( 0, 0, 'Sneaking: off', style );
    this.sneakText.x = this.game.width - ( this.sneakText.width + 24 );
    this.sneakText.y = this.game.height - ( this.sneakText.height + 24 + 32 );
    this.sneakText.fixedToCamera = true;
    this.sneakText.stroke = '#000';
    this.sneakText.strokeThickness = 3;

    this.sprintText = this.game.add.text( 0, 0, 'Sprinting: off', style );
    this.sprintText.x = this.game.width - ( this.sprintText.width + 24 );
    this.sprintText.y = this.game.height - ( this.sprintText.height + 24 + 32 + this.sneakText.height );
    this.sprintText.fixedToCamera = true;
    this.sprintText.stroke = '#000';
    this.sprintText.strokeThickness = 3;
  }
  setPlayerHealth( health ) {
    this.health = health;
  }
  setPlayerMovementInfo( isSneaking, isSprinting ) {
    Object.assign( this, { isSneaking, isSprinting } );
  }
  render() {
    this.drawPlayerMovementInfo();
    this.drawHealthBar();
  }
  drawPlayerMovementInfo() {
    this.sneakText.setText( 'Sneaking: ' + ( ( this.isSneaking ) ? 'on' : 'off' ) );
    this.sprintText.setText( 'Sprinting: ' + ( ( this.isSprinting ) ? 'on' : 'off' ) );
  }
  drawHealthBar() {
    const width = 300;
    const height = 32;

    this.healthbar.clear();
    this.healthbar.beginFill( 0xFF0000, 0.85 );

    this.healthbar.drawRect( this.game.width - ( width + 24 ), this.game.height - ( height + 24 ), width * Math.max( this.health, 0 ), height );
    this.healthbar.endFill();
    if ( this.godMode ) {
      this.healthbar.lineStyle( 2, 0xCEAD00, 1 );
    } else {
      this.healthbar.lineStyle( 2, 0x880000, 1 );
    }
    this.healthbar.drawRect( this.game.width - ( width + 24 ), this.game.height - ( height + 24 ), width, height );
    this.healthbar.lineStyle( 0 );
  }
  destroy() {
    this.healthbar.destroy();
    this.sneakText.destroy();
    this.sprintText.destroy();
  }
}
