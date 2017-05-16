import { pixelsToTile, areTilesTheSame } from './MapUtils';


export function getFreeTileAroundZombieExcludingOtherZombie( zombie, zombieToExclude, mapGrid ) {
  const zombieTile = pixelsToTile( zombie );
  const zombieToExcludeTile = pixelsToTile( zombieToExclude );

  let collisionSide;

  if ( areTilesTheSame( zombieTile, zombieToExcludeTile ) ) {
    collisionSide = getBodyCollisionSide( zombie, zombieToExclude );
  } else {
    collisionSide = getTileCollisionSide( zombieTile, zombieToExcludeTile );
  }

  switch ( collisionSide ) {

  }
}

function getBodyCollisionSide() {
  //TODO
}

function getTileCollisionSide() {
  //TODO
}
