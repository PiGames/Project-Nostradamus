import Lightable from './Lightable';
import { isTileBlocking } from '../../utils/MapUtils';
import { optimizeShape } from '../../utils/LightUtils';

const NUMBER_OF_RAYS = 80;

export default class JournalLight extends Lightable {
  constructor( { x, y }, rayLength ) {
    super( true );
    this.x = x;
    this.y = y;
    this.rayLength = rayLength;
  }
  getLightShapePoints( walls ) {
    const shapePoints = [];

    shapePoints.push( { x: this.x, y: this.y } );

    for ( let i = 0; i <= NUMBER_OF_RAYS; i++ ) {
      const rayAngle = ( Math.PI * 2 / NUMBER_OF_RAYS ) * i;
      let lastX = this.x;
      let lastY = this.y;
      for ( let j = 1; j <= this.rayLength; j++ ) {
        const begin = { x: this.x, y: this.y };
        const end = {
          x: Math.round( this.x - ( 2 * j ) * Math.cos( rayAngle ) ),
          y: Math.round( this.y - ( 2 * j ) * Math.sin( rayAngle ) ),
        };

        if ( !isTileBlocking( begin, end, walls ) ) {
          lastX = end.x;
          lastY = end.y;
        } else {
          break;
        }
      }

      shapePoints.push( { x: lastX, y: lastY } );
    }
    shapePoints.push( { x: this.x, y: this.y } );

    return optimizeShape( shapePoints );
  }
  getFillStyle() {
    return '0xffffff';
  }
}
