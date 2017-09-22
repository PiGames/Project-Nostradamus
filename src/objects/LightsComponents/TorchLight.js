import RoundLight from './RoundLight';
import { RAY_LENGTH, FLICKERING_POWER } from '../../constants/TorchConstants';
import { transparetize } from '../../utils/LightUtils';

export default class TorchLight extends RoundLight {
  constructor( position, args = {} ) {
    super( position, args.size || RAY_LENGTH );
    this.args = args;
    this.disabled = args.disabled || false;
  }

  getFillStyle( ctx, offset ) {
    const color = this.args.color || '#FFFFFF';
    const raySize = this.args.size || RAY_LENGTH;

    let rayLength;
    if ( !this.args.flicker ) {
      rayLength = raySize;
    } else {
      const flicker = this.args.flickerPower || FLICKERING_POWER;
      rayLength = raySize * ( 1 + Math.random() * flicker );
    }

    const gradient = ctx.createRadialGradient(
      this.x - offset.x, this.y - offset.y, raySize * 0.4 * 2,
      this.x - offset.x, this.y - offset.y, rayLength * 2
    );

    gradient.addColorStop( 0, transparetize( color, 1 ) );
    gradient.addColorStop( 1, transparetize( color, 0 ) );

    return gradient;
  }
}
