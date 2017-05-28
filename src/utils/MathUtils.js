export function isInDegreeRange( entity, target, sightAngle ) {
  const angleDelta = Math.abs( Phaser.Math.radToDeg( Phaser.Math.angleBetween( entity.x, entity.y, target.x, target.y ) ) + 90 - entity.angle );

  return angleDelta <= sightAngle || angleDelta >= ( 360 - sightAngle );
}
