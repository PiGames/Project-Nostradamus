import { pixelsToTile } from '../utils/MapUtils';

export const getEntityNextTile = ( entity ) => {
  if ( entity.isOnStandardPath ) {
    let pathIndex = entity.currentPathIndex;
    let stepIndex = entity.currentStepIndex;

    if ( entity.pathsBetweenPathTargets[ pathIndex ].path.length === stepIndex + 1 ) {
      stepIndex = 0;

      if ( entity.pathsBetweenPathTargets.length === pathIndex + 1 ) {
        pathIndex = 0;
      } else {
        pathIndex++;
      }
    } else {
      stepIndex++;
    }
    if ( entity.pathsBetweenPathTargets[ pathIndex ].path[ stepIndex ] == undefined ) {
      throw new Error( `Wrong path data: pathIndex: ${pathIndex}, stepIndex: ${stepIndex}, entity: ${entity}` );
    }
    return entity.pathsBetweenPathTargets[ pathIndex ].path[ stepIndex ];
  } else {
    let stepIndex = entity.temporaryStepIndex;
    if ( stepIndex + 1 === entity.temporaryPath.length ) {
      stepIndex = 0;
      let pathIndex = ( entity.currentPathIndex + 1 === entity.pathsBetweenPathTargets.length ) ? 0 : entity.currentPathIndex + 1;
      if ( entity.pathsBetweenPathTargets[ pathIndex ].path[ stepIndex ] == undefined ) {
        throw new Error( `Wrong path data: pathIndex: ${pathIndex}, stepIndex: ${stepIndex}, entity: ${entity}` );
      }
      return entity.pathsBetweenPathTargets[ pathIndex ].path[ stepIndex ];
    } else {
      if ( entity.temporaryPath[ stepIndex ] == undefined ) {
        console.log( entity.temporaryPath );
        throw new Error( `Wrong temporary path data: stepIndex: ${stepIndex}` );
      }
      return entity.temporaryPath[ stepIndex ];
    }
  }
};

const areTilesTheSame = ( tile1, tile2 ) => tile1.x === tile2.x && tile1.y === tile2.y;

export const getEntityCurrentStepTarget = ( entity ) => ( entity.isOnStandardPath ) ? entity.pathsBetweenPathTargets[ entity.currentPathIndex ].path[ entity.currentStepIndex ] : entity.temporaryPath[ entity.temporaryStepIndex ];

export const willEntitiesBeOnTheSameTile = ( entity1, entity2 ) => {
  const entityNextTarget1 = getEntityNextTile( entity1 );
  const entityNextTarget2 = getEntityNextTile( entity2 );
  const entityCurrentTarget1 = getEntityCurrentStepTarget( entity1 );
  const entityCurrentTarget2 = getEntityCurrentStepTarget( entity2 );

  return areTilesTheSame( entityNextTarget1, entityNextTarget2 )
  || areTilesTheSame( entityNextTarget1, entityCurrentTarget2 )
   || areTilesTheSame( entityCurrentTarget1, entityCurrentTarget2 );
};

const getDirectionBetweenTiles = ( tile1, tile2 ) => {
  if ( tile1.y === tile2.y ) {
    if ( tile1.x > tile2.x ) {
      return 'WEST';
    } else if ( tile1.x < tile2.x ) {
      return 'EAST';
    } else {
      throw new Error( `Uncorrect tiles coordinates! tile1.x: ${ tile1.x }, tile1.y: ${ tile1.y } | tile2.x: ${ tile2.x } tile2.y: ${ tile2.y }` );
    }
  } else if ( tile1.x === tile2.x ) {
    if ( tile1.y > tile2.y ) {
      return 'NORTH';
    } else if ( tile1.y < tile2.y ) {
      return 'SOUTH';
    } else {
      throw new Error( `Uncorrect tiles coordinates! tile1.x: ${ tile1.x }, tile1.y: ${ tile1.y } | tile2.x: ${ tile2.x } tile2.y: ${ tile2.y }` );
    }
  } else {
    console.warn( 'Unsafe prediction is made, collisions may not work :( ' );
    if ( tile1.y < tile2.y && tile1.x < tile2.x ) {
      return ( Math.random() > 0.5 ) ? 'SOUTH' : 'EAST';
    } else if ( tile1.y > tile2.y && tile1.x < tile2.x ) {
      return ( Math.random() > 0.5 ) ? 'NORTH' : 'EAST';
    } else if ( tile1.y < tile2.y && tile1.x > tile2.x ) {
      return ( Math.random() > 0.5 ) ? 'NORTH' : 'WEST';
    } else if ( tile1.y > tile2.y && tile1.x > tile2.x ) {
      return ( Math.random() > 0.5 ) ? 'SOUTH' : 'WEST';
    }
  }
  throw new Error( `Uncorrect tiles coordinates! tile1.x: ${ tile1.x }, tile1.y: ${ tile1.y } | tile2.x: ${ tile2.x } tile2.y: ${ tile2.y }` );
};

const getDirectionBetweenEntities = ( entity1, entity2 ) => {
  const entityTile1 = pixelsToTile( entity1 );
  const entityTile2 = pixelsToTile( entity2 );

  if ( areTilesTheSame( entityTile1, entityTile2 ) ) {
    console.warn( 'Doing somethink untested: ' );
    return getDirectionBetweenTiles( entity1, entity2 );
  } else {
    return getDirectionBetweenTiles( entityTile1, entityTile2 );
  }
};

export const getFreeTileAroundEntityExcludingOtherEntity = ( entity, entityToExclude, mapGrid ) => {
  const entityTile = pixelsToTile( entity );
  const tileToExclude = getEntityNextTile( entityToExclude );

  let directionToExclude;

  if ( ( entityTile.x === tileToExclude.x && entityTile.y === tileToExclude.y ) || ( entityTile.x !== tileToExclude.x && entityTile.y !== tileToExclude.y ) ) {
    directionToExclude = getDirectionBetweenEntities( entity, entityToExclude );
  } else {
    directionToExclude = getDirectionBetweenTiles( entityTile, tileToExclude );
  }

  switch ( directionToExclude ) {
  case 'NORTH':
    return getFreeTileExcludingNorth( entityTile, mapGrid );
  case 'SOUTH':
    return getFreeTileExcludingSouth( entityTile, mapGrid );
  case 'WEST':
    return getFreeTileExcludingWest( entityTile, mapGrid );
  case 'EAST':
    return getFreeTileExcludingEast( entityTile, mapGrid );
  }

  throw new Error( `Couldn't find free tile entityTile: ${entityTile}, directionToExclude: ${directionToExclude}` );
};

function getFreeTileExcludingNorth( entityTile, mapGrid ) {
  let freeTile = { x: -1, y: entityTile.y };
  if ( mapGrid[ entityTile.x - 1 ][ entityTile.y ] === 0 && mapGrid[ entityTile.x + 1 ][ entityTile.y ] === 0 ) {
    freeTile.x = ( Math.random() > 0.5 ) ? entityTile.x - 1 : entityTile.x + 1;
  } else if ( mapGrid[ entityTile.x - 1 ][ entityTile.y ] === 0 ) {
    freeTile.x = entityTile.x - 1;
  } else if ( mapGrid[ entityTile.x + 1 ][ entityTile.y ] === 0 ) {
    freeTile.x = entityTile.x + 1;
  } else if ( mapGrid[ entityTile.x ][ entityTile.y + 1 ] === 0 ) {
    freeTile = { x: entityTile.x, y: entityTile.y + 1 };
  }
  return freeTile;
}
function getFreeTileExcludingSouth( entityTile, mapGrid ) {
  let freeTile = { x: -1, y: entityTile.y };
  if ( mapGrid[ entityTile.x - 1 ][ entityTile.y ] === 0 && mapGrid[ entityTile.x + 1 ][ entityTile.y ] === 0 ) {
    freeTile.x = ( Math.random() > 0.5 ) ? entityTile.x - 1 : entityTile.x + 1;
  } else if ( mapGrid[ entityTile.x - 1 ][ entityTile.y ] === 0 ) {
    freeTile.x = entityTile.x - 1;
  } else if ( mapGrid[ entityTile.x + 1 ][ entityTile.y ] === 0 ) {
    freeTile.x = entityTile.x + 1;
  } else if ( mapGrid[ entityTile.x ][ entityTile.y - 1 ] === 0 ) {
    freeTile = { x: entityTile.x, y: entityTile.y - 1 };
  }
  return freeTile;
}
function getFreeTileExcludingWest( entityTile, mapGrid ) {
  let freeTile = { x: entityTile.x, y: -1 };
  if ( mapGrid[ entityTile.x ][ entityTile.y - 1 ] === 0 && mapGrid[ entityTile.x ][ entityTile.y + 1 ] === 0 ) {
    freeTile.y = ( Math.random() > 0.5 ) ? entityTile.y - 1 : entityTile.y + 1;
  } else if ( mapGrid[ entityTile.x ][ entityTile.y - 1 ] === 0 ) {
    freeTile.y = entityTile.y - 1;
  } else if ( mapGrid[ entityTile.x ][ entityTile.y + 1 ] === 0 ) {
    freeTile.y = entityTile.y + 1;
  } else if ( mapGrid[ entityTile.x + 1 ][ entityTile.y ] === 0 ) {
    freeTile = { x: entityTile.x + 1, y: entityTile.y };
  }
  return freeTile;
}
function getFreeTileExcludingEast( entityTile, mapGrid ) {
  let freeTile = { x: entityTile.x, y: -1 };
  if ( mapGrid[ entityTile.x ][ entityTile.y - 1 ] === 0 && mapGrid[ entityTile.x ][ entityTile.y + 1 ] === 0 ) {
    freeTile.y = ( Math.random() > 0.5 ) ? entityTile.y - 1 : entityTile.y + 1;
  } else if ( mapGrid[ entityTile.x ][ entityTile.y - 1 ] === 0 ) {
    freeTile.y = entityTile.y - 1;
  } else if ( mapGrid[ entityTile.x ][ entityTile.y + 1 ] === 0 ) {
    freeTile.y = entityTile.y + 1;
  } else if ( mapGrid[ entityTile.x - 1 ][ entityTile.y ] === 0 ) {
    freeTile = { x: entityTile.x - 1, y: entityTile.y };
  }
  return freeTile;
}
