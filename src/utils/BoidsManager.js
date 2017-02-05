import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

export default class BoidsManager {
  constructor( game, entities, obstacles = entities, boidsDistance = Math.max( TILE_WIDTH, TILE_HEIGHT ) ) {
    this.entities = entities;
    this.obstacles = obstacles;
    this.boidsDistance = boidsDistance;
    this.game = game;
  }
  update() {
    for ( const boid of this.entities ) {
      if ( boid.isChasing === false ) {
        continue;
      }
      const velocity1 = this.flyTowardsMassCenterRule( boid );
      const velocity2 = this.keepSmallDistanceFromObstaclesRule( boid );
      const velocity3 = this.tryMatchingOtherEnitiesVelocityRule( boid );

      boid.body.velocity.x += velocity1.x + velocity2.x + velocity3.x;
      boid.body.velocity.y += velocity1.y + velocity2.y + velocity3.y;
    }
  }
  flyTowardsMassCenterRule( boid ) {
    const velocity = { x: 0, y: 0 };

    for ( const entity of this.entities ) {
      if ( entity === boid ) {
        continue;
      }
      velocity.x += entity.body.x;
      velocity.y += entity.body.y;
    }

    velocity.x = ( velocity.x / ( this.entities.length - 1 ) ) / 100;
    velocity.y = ( velocity.y / ( this.entities.length - 1 ) ) / 100;

    return velocity;
  }
  keepSmallDistanceFromObstaclesRule( boid ) {
    const velocity = { x: 0, y: 0 };

    for ( const obstacle of this.obstacles ) {
      if ( obstacle === boid ) {
        continue;
      }
      if ( this.game.physics.arcade.distanceBetween( obstacle, boid ) <= this.boidsDistance ) {
        velocity.x -= obstacle.body.x - boid.body.x;
        velocity.x -= obstacle.body.y - boid.body.y;
      }
    }

    return velocity;
  }
  tryMatchingOtherEnitiesVelocityRule() {
    return { x: 0, y: 0 };
  }
}
