import { pixelsToTile } from '../utils/MapUtils.js';

export default class TileMap extends Phaser.Tilemap {
  constructor( game, key, tileWidth, tileHeight ) {
    super( game, key, tileWidth, tileHeight );

    this.addTilesetImage( 'tilemap' );

    this.ground = this.createLayer( 'background' );
    this.walls = this.createLayer( 'walls' );

    this.paths = [];

    this.setCollisionByExclusion( [], true, this.walls );

    this.ground.resizeWorld();

    this.wallsBodiesArray = game.physics.p2.convertTilemap( this, this.walls );

    this.wallsCollisionGroup = this.game.physics.p2.createCollisionGroup();

    for ( const body of this.wallsBodiesArray ) {
      body.setCollisionGroup( this.wallsCollisionGroup );
    }

    this.createPathPoints();
  }
  collides( collisionGroup, callback ) {
    for ( const body of this.wallsBodiesArray ) {
      body.collides( collisionGroup, callback );
    }
  }
  createPathPoints() {
    this.objects[ 'ZombiePaths' ].forEach( ( v ) => {
      const props = v.properties;
      if ( !this.paths[ props.PathId ] ) {
        this.paths[ props.PathId ] = [];
      }

      this.paths[ props.PathId ][ props.PathIndex ] = pixelsToTile( { x: v.x, y: v.y } );
    } );

    this.normalizePaths();
  }
  normalizePaths() {
    this.paths.forEach( ( pathArr ) => {
      const tempArr = [];
      pathArr.forEach( ( v ) => {
        tempArr.push( v );
      } );

      pathArr = tempArr;
    } );
  }
  getPath( i ) {
    return this.paths[ i ];
  }
}
