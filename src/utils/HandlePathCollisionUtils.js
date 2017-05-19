import { pixelsToTile, areTilesTheSame } from './MapUtils';

export function getFreeTileAroundZombieExcludingOtherZombie( zombie, zombieToExclude, mapGrid ) {
  const zombieTile = pixelsToTile( zombie );

  let collisionSide = getBodyCollisionSide( zombie, zombieToExclude );

  const tileToExclude = getTileToExcludeBaseOnCollisionSide( zombieTile, collisionSide );

  return getFreeTileAroundTileExcludingOtherTile( zombieTile, tileToExclude, mapGrid );
}

function getBodyCollisionSide( zombie1, zombie2 ) {
  const zombieOffsetX = zombie1.position.x - zombie2.position.x;
  const zombieOffsetY = zombie1.position.y - zombie2.position.y;

  const directionX = ( zombieOffsetX > 0 ) ? 'LEFT' : 'RIGHT';
  const directionY = ( zombieOffsetY > 0 ) ? 'UP' : 'DOWN';

  return ( Math.abs( zombieOffsetX ) < Math.abs( zombieOffsetY ) ) ? directionX : directionY;
}

function getTileToExcludeBaseOnCollisionSide( tile, collisionSide ) {
  const tileCandidates = getTileCandidates( tile );

  switch ( collisionSide ) {
  case 'UP':
    return tileCandidates[ 0 ];
  case 'DOWN':
    return tileCandidates[ 1 ];
  case 'LEFT':
    return tileCandidates[ 2 ];
  case 'RIGHT':
    return tileCandidates[ 3 ];
  }
}

function getFreeTileAroundTileExcludingOtherTile( tile, tileToExclude, mapGrid ) {
  const tileCandidates = getTileCandidates( tile );

  for ( const tileCandidate of tileCandidates ) {
    if ( !areTilesTheSame( tileCandidate, tileToExclude )
     && !isWall( tileCandidate, mapGrid ) ) {
      return tileCandidate;
    }
  }

  throw new Error( 'Couldn\'t find tile' );
}

function isWall( tile, mapGrid ) {
  return mapGrid[ tile.x ][ tile.y ] === 1;
}

function getTileCandidates( tile ) {
  return [
    { x: tile.x, y: tile.y - 1 },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x + 1, y: tile.y },
  ];

}
