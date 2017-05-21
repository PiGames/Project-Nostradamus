import { ZOMBIE_ROTATING_SPEED } from '../../constants/ZombieConstants';
import { tileToPixels } from '../../utils/MapUtils';

export default class ZombieRotationManager {
  constructor( zombie ) {
    this.zombie = zombie;
  }
  update( tileTarget ) {
    const lookTarget = this.getLookTarget( tileTarget );
    const targetPoint = new Phaser.Point( lookTarget.x, lookTarget.y );
    const entityCenter = new Phaser.Point( this.zombie.body.x + this.zombie.width / 2, this.zombie.body.y + this.zombie.height / 2 );

    let deltaTargetRad = this.zombie.rotation - Phaser.Math.angleBetweenPoints( targetPoint, entityCenter ) - 1.5 * Math.PI;

    deltaTargetRad = deltaTargetRad % ( Math.PI * 2 );

    if ( deltaTargetRad != deltaTargetRad % ( Math.PI ) ) {
      deltaTargetRad = deltaTargetRad + Math.PI * ( ( deltaTargetRad < 0 ) ? 2 : -2 );
    }

    this.zombie.body.rotateLeft( ZOMBIE_ROTATING_SPEED * deltaTargetRad );
  }
  getLookTarget( tile ) {
    const velocity = this.zombie.body.velocity;
    const tileCoords = tileToPixels( tile );
    const veryFarAway = 1000;

    if ( Math.abs( velocity.x ) > Math.abs( velocity.y ) ) {
      if ( velocity.x > 0 ) {
        tileCoords.x += veryFarAway;
      } else {
        tileCoords.x -= veryFarAway;
      }
    } else if ( Math.abs( velocity.x ) < Math.abs( velocity.y ) ) {
      if ( velocity.y > 0 ) {
        tileCoords.y += veryFarAway;
      } else {
        tileCoords.y -= veryFarAway;
      }
    }

    return tileCoords;
  }
}
