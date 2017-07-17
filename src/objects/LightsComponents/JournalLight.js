import RoundLight from './RoundLight';
import { RAY_LENGTH, FLICKERING_POWER } from '../../constants/ItemConstants';
export default class JournalLight extends RoundLight {
  constructor( position ) {
    super( position, RAY_LENGTH );
  }
  getFillStyle( ctx, offset ) {
    const rayLength = RAY_LENGTH * ( 1 + Math.random() * FLICKERING_POWER );
    const gradient = ctx.createRadialGradient(
        this.x - offset.x, this.y - offset.y, rayLength * 0.4 * 2,
        this.x - offset.x, this.y - offset.y, rayLength * 2 );
    gradient.addColorStop( 0, 'rgba(208, 255, 175, 1)' );
    gradient.addColorStop( 1, 'rgba(208, 255, 175, 0.0)' );

    return gradient;
  }
}
