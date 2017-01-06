import { willEntitiesBeOnTheSameTile, isEntityTouchingTile, getEntityNextTile, areEntitiesTouchingTheSameTile } from '../utils/EntityManagerUtils';

export default class WalkingEntitiesManager extends Phaser.Group {
  constructor( game ) {
    super( game );
    this.allEntitiesInitialized = false;
    this.frozenEntities = [];
  }

  update() {
    if ( this.allEntitiesInitialized || this.areAllEntitiesInitialized() ) {
      this.manageFrozenEntities();
      this.manageMovingEntities();
    }

    Phaser.Group.prototype.update.call( this );
  }


  manageFrozenEntities() {
    for ( const frozenEntity of this.frozenEntities ) {
      let willCollide = false;

      for ( const entity of this.children ) {
        if ( entity === frozenEntity ) {
          continue;
        }
        if ( willEntitiesBeOnTheSameTile( frozenEntity, entity ) || isEntityTouchingTile( entity, getEntityNextTile( frozenEntity ) ) ) {
          willCollide = true;
        }
      }

      if ( !willCollide ) {
        frozenEntity.canMove = true;
        const frozenEntityIndex = this.frozenEntities.indexOf( frozenEntity );
        this.frozenEntities.splice( frozenEntityIndex, 1 );
      }
    }
  }

  manageMovingEntities() {
    // this is done for down for specific numver of zombies (2)

    if ( this.children[ 0 ].canMove && willEntitiesBeOnTheSameTile( this.children[ 0 ], this.children[ 1 ] ) ) {
      this.children[ 0 ].disableMovement();
      this.frozenEntities.push( this.children[ 0 ] );
      //console.log( 'willBeOnTheSameTile' );
    }
    if ( this.children[ 0 ].canMove && this.children[ 0 ].canMove && areEntitiesTouchingTheSameTile( this.children[ 0 ], this.children[ 1 ] ) ) {
      // you should disable the entity that is not passing through ( has center on it ) the shared tile
      //console.log( 'areTouchingTheSameTile' );
    }
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
