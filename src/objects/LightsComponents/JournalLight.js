import RoundLight from './RoundLight';
import { RAY_LENGTH, FLICKERING_POWER, JOURNAL_LIGHT_COLOR } from '../../constants/ItemConstants';
import { transparetize } from '../../utils/LightUtils';

export default class JournalLight extends RoundLight {
  constructor( position ) {
    super( position, RAY_LENGTH );
  }
  getFillStyle( ctx, offset ) {
    const rayLength = RAY_LENGTH * ( 1 + Math.random() * FLICKERING_POWER );
    const gradient = ctx.createRadialGradient(
        this.x - offset.x, this.y - offset.y, rayLength * 0.4 * 2,
        this.x - offset.x, this.y - offset.y, rayLength * 2 );

    gradient.addColorStop( 0, transparetize( JOURNAL_LIGHT_COLOR, .5 ) );
    gradient.addColorStop( 1, transparetize( JOURNAL_LIGHT_COLOR, 0 ) );

    return gradient;
  }
}
