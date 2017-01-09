import { willEntitiesBeOnTheSameTile, getFreeTileAroundEntityExcludingOtherEntity, getEntityNextTile } from '../utils/EntityManagerUtils';
import { pixelsToTile } from '../utils/MapUtils';

export default class WalkingEntitiesManager extends Phaser.Group {
  constructor( game, grid ) {
    super( game );
    this.mapGrid = grid;
    this.allEntitiesInitialized = false;
  }

  update() {
    if ( this.allEntitiesInitialized || this.areAllEntitiesInitialized() ) {
      this.manageMovingEntities();
    }

    Phaser.Group.prototype.update.call( this );
  }
  manageMovingEntities() {
    for ( const entityIndex1 in this.children ) {
      for ( const entityIndex2 in this.children ) {
        if ( entityIndex1 === entityIndex2 ) {
          continue;
        }
        const currentHandledEntity = this.children[ Math.min( entityIndex1, entityIndex2 ) ];
        const otherEntity = this.children[ Math.max( entityIndex1, entityIndex2 ) ];

        if ( currentHandledEntity.canMove && otherEntity.canMove && willEntitiesBeOnTheSameTile( currentHandledEntity, otherEntity ) ) {
          const freeTile = getFreeTileAroundEntityExcludingOtherEntity( currentHandledEntity, otherEntity, this.mapGrid );
          const currentTarget = currentHandledEntity.pathsBetweenPathTargets[ currentHandledEntity.currentPathIndex ].target;

          currentHandledEntity.changePathToTemporary( freeTile, currentTarget );
        }
      }
    }
  }
  onCollisionWihOtherEntity( entity1, entity2 ) {
    const freeTile1 = getFreeTileAroundEntityExcludingOtherEntity( entity1, entity2, this.mapGrid );
    const freeTile2 = getFreeTileAroundEntityExcludingOtherEntity( entity2, entity1, this.mapGrid );

    const currentTarget1 = entity1.pathsBetweenPathTargets[ entity1.currentPathIndex ].target;
    const currentTarget2 = entity2.pathsBetweenPathTargets[ entity2.currentPathIndex ].target;

    entity1.changePathToTemporary( freeTile1, currentTarget1 );
    entity1.changePathToTemporary( freeTile2, currentTarget2 );
  }

  onCollisionWithWalls( entity, tile ) {
    const entityTile = pixelsToTile( entity );
    let freeTile;

    if ( entityTile.x > tile.x ) {
      freeTile = { x: entityTile.x + 1, y: entityTile.y };
    } else if ( entityTile.x < tile.x ) {
      freeTile = { x: entityTile.x - 1, y: entityTile.y };
    } else if ( entityTile.y < tile.y ) {
      freeTile = { x: entityTile.x, y: entityTile.y - 1 };
    } else if ( entityTile.y > tile.y ) {
      freeTile = { x: entityTile.x, y: entityTile.y + 1 };
    }

    const currentTarget = entity.pathsBetweenPathTargets[ entity.currentPathIndex ].target;

    entity.changePathToTemporary( freeTile, currentTarget );
  }

  areAllEntitiesInitialized() {
    for ( const entity of this.children ) {
      if ( !entity.isInitialized ) {
        return false;
      }
    }
    this.allEntitiesInitialized = true;
    return true;
  }

}
