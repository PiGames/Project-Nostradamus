export default class TileMap {
  /**
  * Create the Map.
  * @param {object} game - A reference to the currently running game.
  */
  constructor( game ) {
    this.game = game;
  }

  /**
  * Draw map and set tiles that are supposed to collide with player.
  */

  createMap() {
    this.game.stage.backgroundColor = '#2d2d2d';
    this.map = this.game.add.tilemap( 'map', 64, 64 ),
    this.map.addTilesetImage( 'tilemap', 'tilemap' );

    this.ground = this.map.createLayer( 'background' );
    this.walls = this.map.createLayer( 'walls' );

    this.map.setCollisionByExclusion( [], true, this.walls );

    this.game.world.setBounds( 0, 0, 100, 100 );
    this.ground.resizeWorld();
  }

  /**
  * Add collision between entity and map.
  * @param {object} entity - A reference to entity.
  */

  createCollision( entity ) {
    this.game.physics.arcade.collide( entity, this.walls );
  }


  /**
  * Creates player.
  */
  testPlayer() {
    this.cursors = {
      up: this.game.input.keyboard.addKey( Phaser.Keyboard.W ),
      down: this.game.input.keyboard.addKey( Phaser.Keyboard.S ),
      left: this.game.input.keyboard.addKey( Phaser.Keyboard.A ),
      right: this.game.input.keyboard.addKey( Phaser.Keyboard.D ),
      sneak: this.game.input.keyboard.addKey( Phaser.Keyboard.ALT ),
      sprint: this.game.input.keyboard.addKey( Phaser.Keyboard.SHIFT ),
    };

    this.player = this.game.add.sprite( 64, 64, 'player' );
    this.game.physics.arcade.enable( this.player );
    this.player.body.collideWorldBounds = true;

    this.game.camera.follow( this.player );
  }

  /**
  * Handles movement.
  */

  handleMove() {
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    let velocity = 500;

    if ( this.cursors.sneak.isDown ) {
      velocity *= 0.25;
    }

    if ( this.cursors.sprint.isDown ) {
      velocity *= 1.75;
    }

    if ( this.cursors.up.isDown ) {
      this.player.body.velocity.y = -velocity;
    } else if ( this.cursors.down.isDown ) {
      this.player.body.velocity.y = velocity;
    }

    if ( this.cursors.left.isDown ) {
      this.player.body.velocity.x = -velocity;
    } else if ( this.cursors.right.isDown ) {
      this.player.body.velocity.x = velocity;
    }
  }

}
