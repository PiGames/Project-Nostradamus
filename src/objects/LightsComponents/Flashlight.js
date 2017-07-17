import { RAY_LENGTH, LIGHT_ANGLE, NUMBER_OF_RAYS, FLICKERING_POWER } from '../../constants/FlashlightConstants';
import Lightable from './Lightable';
import { isTileBlocking } from '../../utils/MapUtils';
import { optimizeShape } from '../../utils/LightUtils';


export default class Flashlight extends Lightable {
  constructor( player, walls ) {
    super( false );
    this.player = player;
    this.walls = walls;
  }
  getLightShapePoints() {
    const shapePoints = [];

    const mouseX = this.player.game.input.mousePointer.worldX;
    const mouseY = this.player.game.input.mousePointer.worldY;
    const mouseAngle = Math.atan2( this.player.y - mouseY, this.player.x - mouseX );

    const flashlightLength = 8;

    const minAngle = mouseAngle - ( LIGHT_ANGLE / 2 );
    const flashlightStartPoint = {
      x: Math.round( this.player.x - ( 2 * flashlightLength ) * Math.cos( minAngle ) ),
      y: Math.round( this.player.y - ( 2 * flashlightLength ) * Math.sin( minAngle ) ),
    };
    shapePoints.push( flashlightStartPoint );

    for ( let i = 0; i < NUMBER_OF_RAYS; i++ ) {
      const rayAngle = mouseAngle - ( LIGHT_ANGLE / 2 ) + ( LIGHT_ANGLE / NUMBER_OF_RAYS ) * i;
      let lastX = this.player.x;
      let lastY = this.player.y;
      for ( let j = 1; j <= RAY_LENGTH; j++ ) {
        const begin = this.player.position;
        const end = {
          x: Math.round( this.player.x - ( 2 * j ) * Math.cos( rayAngle ) ),
          y: Math.round( this.player.y - ( 2 * j ) * Math.sin( rayAngle ) ),
        };

        if ( !isTileBlocking( begin, end, this.walls ) ) {
          lastX = end.x;
          lastY = end.y;
        } else {
          break;
        }
      }

      shapePoints.push( { x: lastX, y: lastY } );
    }

    const maxAngle = mouseAngle + ( LIGHT_ANGLE / 2 );
    const flashlightEndPoint = {
      x: Math.round( this.player.x - ( 2 * flashlightLength ) * Math.cos( maxAngle ) ),
      y: Math.round( this.player.y - ( 2 * flashlightLength ) * Math.sin( maxAngle ) ),
    };
    shapePoints.push( flashlightEndPoint );

    return optimizeShape( shapePoints );
  }
  getFillStyle( ctx, offset ) {
    const rayLength = RAY_LENGTH * ( 1 + Math.random() * FLICKERING_POWER );
    const gradient = ctx.createRadialGradient(
        this.player.x - offset.x, this.player.y - offset.y, RAY_LENGTH * 0.75 * 2,
        this.player.x - offset.x, this.player.y - offset.y, rayLength * 2 );
    gradient.addColorStop( 0, 'rgba(255, 255, 255, 1.0)' );
    gradient.addColorStop( 1, 'rgba(255, 255, 255, 0.0)' );

    return gradient;
  }
}
