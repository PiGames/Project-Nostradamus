import { TILE_WIDTH, TILE_HEIGHT, MAP_WIDTH } from '../constants/TileMapConstants';

export const areTilesTheSame = ( tile1, tile2 ) => tile1.x === tile2.x && tile1.y === tile2.y;

export const pixelsToTileX = ( coord ) => Math.floor( coord / TILE_WIDTH );
export const pixelsToTileY = ( coord ) => Math.floor( coord / TILE_HEIGHT );

export const tileToPixels = ( tile ) => ( {
  x: ( tile.x * TILE_WIDTH ) + TILE_WIDTH / 2,
  y: ( tile.y * TILE_HEIGHT ) + TILE_HEIGHT / 2,
} );

export const pixelsToTile = ( coords ) => ( {
  x: Math.floor( coords.x / TILE_WIDTH ),
  y: Math.floor( coords.y / TILE_HEIGHT ),
} );

export const getWallsPositions = ( layer ) => {
  const walls = layer.getTiles( 0, 0, 2048, 2048 );
  const wallsArr = [];

  let currentY = [];

  walls.forEach( ( v, i ) => {
    if ( v.index !== -1 ) {
      currentY.push( 1 );
    } else {
      currentY.push( 0 );
    }

    if ( i % MAP_WIDTH === ( MAP_WIDTH - 1 ) ) {
      wallsArr.push( currentY );
      currentY = [];
    }
  } );

  return wallsArr;
};

export function isTileBlocking( begin, end, walls ) {
  const ray = new Phaser.Line();
  ray.start.set( begin.x, begin.y );
  ray.end.set( end.x, end.y );

  const tileHits = walls.getRayCastTiles( ray, 0, false, false );

  for ( let i = 0; i < tileHits.length; i++ ) {
    if ( tileHits[ i ].index >= 0 ) {
      return true;
    }
  }

  return false;
}
