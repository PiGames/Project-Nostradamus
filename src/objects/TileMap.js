import { pixelsToTile } from '../utils/MapUtils.js';
import { TILE_SIZE } from '../constants/TileMapConstants.js';
import { getWallsPositions } from '../utils/MapUtils.js';

export default class TileMap extends Phaser.Tilemap {
  constructor( game, key, tileWidth, tileHeight ) {
    super( game, key, tileWidth, tileHeight );

    this.addTilesetImage( 'tilemap_floor' );
    this.addTilesetImage( 'tilemap_walls' );

    this.ground = this.createLayer( 'background' );
    this.walls = this.createLayer( 'walls' );
    this.lightThrough = this.createLayer( 'lightThrough' );

    this.paths = [];
    this.journals = [];

    this.setCollisionByExclusion( [], true, this.walls );
    this.setCollisionByExclusion( [], true, this.lightThrough );

    this.ground.resizeWorld();

    this.wallsBodiesArray = game.physics.p2.convertTilemap( this, this.walls );
    this.lightBodiesArray = game.physics.p2.convertTilemap( this, this.lightThrough );

    this.wallsCollisionGroup = this.game.physics.p2.createCollisionGroup();

    for ( const body of this.wallsBodiesArray ) {
      body.setCollisionGroup( this.wallsCollisionGroup );
    }

    for ( const body of this.lightBodiesArray ) {
      body.setCollisionGroup( this.wallsCollisionGroup );
    }

    this.createPathPoints();

    this.wallsData = getWallsPositions( this.walls );

    this.calculateWallsEndpoints();
  }
  collides( collisionGroup, callback ) {
    for ( const body of this.wallsBodiesArray ) {
      body.collides( collisionGroup, callback );
    }

    for ( const body of this.lightBodiesArray ) {
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
  getJournals() {
    const allJournals = this.objects[ 'Journals' ];
    const journals = [];
    allJournals.forEach( ( v ) => {
      const props = v.properties;
      journals.push(
        {
          x: v.x,
          y: v.y,
          cornerX: props.cornerX,
          cornerY: props.cornerY,
          name: v.name,
          content: props.content,
        }
      );
    } );

    return journals;
  }

  getLights() {
    return this.objects[ 'Lights' ].map( l => ( { x: l.x + TILE_SIZE / 2, y: l.y + TILE_SIZE / 2, ...l.properties } ) );
  }

  getPlayerInitialPosition() {
    const player = this.objects[ 'PlayerPos' ][ 0 ];
    const posObj = {
      x: player.x,
      y: player.y,
    };
    return posObj;
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
  calculateWallsEndpoints() {
    const flattenWallsMap = this.walls.layer.data.reduce( ( flattenArr, column ) => {
      flattenArr.push( ...column );
      return flattenArr;
    }, [] );

    const wallsEndpoints = flattenWallsMap.reduce( ( endpoints, tile ) => {
      endpoints.push( ...this.getTileEndpoints( tile ) );
      return endpoints;
    }, [] );

    this.wallsEndpoints = wallsEndpoints;
    console.log( 'wallsEndpoints', this.wallsEndpoints );
  }
  areWalls( ...tiles ) {
    for ( const tile of tiles ) {
      if ( this.wallsData[ tile.x ][ tile.y ] !== 1 ) {
        return false;
      }
    }

    return true;
  }
  isTileCorner( x, y ) {
    const m = this.wallsData;
    return this.areWalls( { x: Math.max( 0, x - 1 ), y }, { x: Math.min( x + 1, m.length ), y } )
    || this.areWalls( { x, y: Math.max( 0, y - 1 ) }, { x, y: Math.min( y + 1, m[ 0 ].length ) } );
  }
  getTileEndpoints( { x, y } ) {
    if ( !this.isTileCorner( x, y ) ) {
      return [];
    }
    return this.getCornerEndpoints( x, y );
  }
  getCornerEndpoints( x, y ) {
    const m = this.wallsData;
    const endpoints = [];
    if ( this.areWalls({x: Math.max( 0, x - 1 ), y: Math.min( y + 1, m[ 0 ].length )}) ) {
      endpoints.push({x: (x+1)*TILE_SIZE, y: (y-1)*TILE_SIZE )})
      // TODO get neighbours
    }
  }
}
