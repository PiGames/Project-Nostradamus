import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

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
