import { TILE_SIZE } from '../constants/TileMapConstants';

export const areTilesTheSame = ( tile1, tile2 ) => tile1.x === tile2.x && tile1.y === tile2.y;

export const pixelsToTileX = ( coord ) => Math.floor( coord / TILE_SIZE );
export const pixelsToTileY = ( coord ) => Math.floor( coord / TILE_SIZE );

export const tileToPixels = ( tile ) => ( {
  x: ( tile.x * TILE_SIZE ) + TILE_SIZE / 2,
  y: ( tile.y * TILE_SIZE ) + TILE_SIZE / 2,
} );

export const pixelsToTile = ( coords ) => ( {
  x: Math.floor( coords.x / TILE_SIZE ),
  y: Math.floor( coords.y / TILE_SIZE ),
} );

export const getWallsPositions = ( layer ) => {
  return layer.layer.data.map( column =>
    column.map(
      tile => tile.index !== -1 ? 1 : 0
    )
  );
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

export const getTileCornersArray = ( tile ) => [
    { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE },
    { x: ( tile.x + 1 ) * TILE_SIZE, y: tile.y * TILE_SIZE },
    { x: tile.x * TILE_SIZE, y: ( tile.y + 1 ) * TILE_SIZE },
    { x: ( tile.x + 1 ) * TILE_SIZE, y: ( tile.y + 1 ) * TILE_SIZE },
];
