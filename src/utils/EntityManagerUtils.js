import { pixelsToTile } from '../utils/MapUtils';

export const getEntityNextTile = ( entity ) => {
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

  return entity.pathsBetweenPathTargets[ pathIndex ].path[ stepIndex ];
};

export const getEntityCurrentTiles = ( entity ) => ( {
  top: pixelsToTile( { x: entity.position.x, y: entity.top } ),
  right: pixelsToTile( { x: entity.right, y: entity.position.y } ),
  bottom: pixelsToTile( { x: entity.position.x, y: entity.bottom } ),
  left: pixelsToTile( { x: entity.left, y: entity.position.y } ),
} );

export const areEntitiesTouchingTheSameTile = ( entity1, entity2 ) => {
  const entityTiles1 = getEntityCurrentTiles( entity1 );
  const entityTiles2 = getEntityCurrentTiles( entity2 );

  for ( const tileCoord in entityTiles1 ) {
    if ( entityTiles1[ tileCoord ].x === entityTiles2[ tileCoord ].x && entityTiles1[ tileCoord ].y === entityTiles2[ tileCoord ].y ) {
      return true;
    }
  }
  return false;
};

export const willEntitiesBeOnTheSameTile = ( entity1, entity2 ) => {
  const entityNextTile1 = getEntityNextTile( entity1 );
  const entityNextTile2 = getEntityNextTile( entity2 );

  return entityNextTile1.x === entityNextTile2.x && entityNextTile1.y === entityNextTile2.y;
};

export const isEntityTouchingTile = ( entity, tile ) => {
  const entityTiles = getEntityCurrentTiles( entity );

  for ( const tileCoord in entityTiles ) {
    if ( tile.x === entityTiles[ tileCoord ].x && tile.y === entityTiles[ tileCoord ].y ) {
      return true;
    }
  }
  return false;
};
