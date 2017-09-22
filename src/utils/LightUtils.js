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

export const transparetize = ( color, opacity ) => {
  const R = hexToR( color );
  const G = hexToG( color );
  const B = hexToB( color );

  return `rgba(${R}, ${G}, ${B}, ${opacity})`;
};

function hexToR( h ) {
  return parseInt( ( cutHex( h ) ).substring( 0, 2 ), 16 );
}
function hexToG( h ) {
  return parseInt( ( cutHex( h ) ).substring( 2, 4 ), 16 );
}
function hexToB( h ) {
  return parseInt( ( cutHex( h ) ).substring( 4, 6 ), 16 );
}
function cutHex( h ) {
  return ( h.charAt( 0 ) == '#' ) ? h.substring( 1, 7 ) : h;
}
