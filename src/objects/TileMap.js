export default class TileMap extends Phaser.Tilemap {
  /**
  * Create the Map. Draw map and set tiles that are supposed to collide with player.
  * @param {object} game - A reference to the currently running game.
  * @param {string} key - A key to tilemap data.
  * @param {number} tileWidth - Width of single tile.
  * @param {number} tileHeight - Height of single tile.
  */
  constructor( game, key, tileWidth, tileHeight ) {
    super( game, key, tileWidth, tileHeight );

    this.addTilesetImage( 'tilemap', 'tilemap' );

    this.ground = this.createLayer( 'background' );
    this.walls = this.createLayer( 'walls' );

    this.setCollisionByExclusion( [], true, this.walls );

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
