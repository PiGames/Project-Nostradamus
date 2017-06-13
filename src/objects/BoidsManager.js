import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';
import { pixelsToTile, tileToPixels } from '../utils/MapUtils.js';

export default class ZombiesBoidsManager extends Phaser.Group {
  constructor( game, mapGrid, boidsDistance = Math.max( TILE_WIDTH, TILE_HEIGHT ), distanceBetweenBoidsAndWalls = boidsDistance ) {
    super( game );
    this.entities = this.children;
    this.mapGrid = mapGrid;
    this.boidsDistance = boidsDistance;
    this.distanceBetweenBoidsAndWalls = distanceBetweenBoidsAndWalls;
    this.game = game;
  }
  update() {
    Phaser.Group.prototype.update.call( this );

    for ( const boid of this.entities ) {
      if ( boid.isChasing() === false ) {
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

    for ( const otherBoid of this.entities ) {
      if ( otherBoid === boid ) {
        continue;
      }
      if ( this.game.physics.arcade.distanceBetween( otherBoid, boid ) <= this.boidsDistance ) {
        velocity.x -= otherBoid.body.x - boid.body.x;
        velocity.y -= otherBoid.body.y - boid.body.y;
      }
    }

    const wallBodies = this.getAdjoiningWallBodies( boid );
    for ( const wallBody of wallBodies ) {
      if ( this.game.physics.arcade.distanceBetween( wallBody, boid ) <= this.distanceBetweenBoidsAndWalls ) {
        velocity.x -= wallBody.x - boid.body.x;
        velocity.y -= wallBody.y - boid.body.y;
      }
    }

    return velocity;
  }
  getAdjoiningWallBodies( entity ) {
    const entityTile = pixelsToTile( entity );
    const adjoiningTiles = [
      { x: entityTile.x - 1, y: entityTile.y - 1 },
      { x: entityTile.x - 1, y: entityTile.y },
      { x: entityTile.x - 1, y: entityTile.y + 1 },
      { x: entityTile.x, y: entityTile.y - 1 },
      { x: entityTile.x, y: entityTile.y + 1 },
      { x: entityTile.x + 1, y: entityTile.y - 1 },
      { x: entityTile.x + 1, y: entityTile.y },
      { x: entityTile.x + 1, y: entityTile.y + 1 },
    ];

    const adjoiningWallTiles = adjoiningTiles.filter( ( tile ) => this.mapGrid[ tile.y ][ tile.x ] === 1 );
    return adjoiningWallTiles.map( tileToPixels );
  }
  tryMatchingOtherEnitiesVelocityRule() {
    return { x: 0, y: 0 };
  }
}
