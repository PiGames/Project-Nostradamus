export default class TileMap {
  /**
  * Create the Map. Draw map and set tiles that are supposed to collide with player.
  * @param {object} game - A reference to the currently running game.
  */
  constructor( game ) {
    this.game = game;

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
  collide( entity ) {
    this.game.physics.arcade.collide( entity, this.walls );
  }
}
