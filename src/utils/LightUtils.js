export const optimizeShape = shape => shape.filter( ( point, index ) => {
  if ( index === 0 || index === shape.length - 1 ) {
    return true;
  }
  if ( ( point.x === shape[ index - 1 ].x && point.x === shape[ index + 1 ].x )
   || ( point.y === shape[ index - 1 ].y && point.y === shape[ index + 1 ].y ) ) {
    return false;
  }
  return true;
}
);
