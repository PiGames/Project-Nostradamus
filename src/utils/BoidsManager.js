export default class BoidsManager {
  constructor( entities, obstacles = entities ) {
    this.entities = entities;
    this.obstacles = obstacles;
  }
  update() {
    if ( this.allEntitiesInitialized ) {
      for ( const entityIndex1 in this.children ) {
        const velocity1 = this.flyTowardsMassCenterRule( this.children[ entityIndex1 ] );
        const velocity2 = this.keepSmallDistanceFromObstacleRule( this.children[ entityIndex1 ] );
        const velocity3 = this.tryMatchingOtherEnitiesVelocityRule( this.children[ entityIndex1 ] );

        this.children[ entityIndex1 ].body.velocity += velocity1 + velocity2 + velocity3;
      }
    }
  }
  flyTowardsMassCenterRule() {
    return 0;
  }
  keepSmallDistanceFromObstacleRule() {
    return 0;
  }
  tryMatchingOtherEnitiesVelocityRule() {
    return 0;
  }
}
