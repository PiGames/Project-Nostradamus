import TorchLight from './TorchLight';
import { STATUS_LIGHT_SIZE, STATUS_LIGHT_FLICKERING_POWER, STATUS_LIGHT_COLOR_ON, STATUS_LIGHT_COLOR_OFF } from '../../constants/ItemConstants';

export default class StatusLight extends TorchLight {
  constructor( position, args = {} ) {
    super( position, { color: args.enabled ? STATUS_LIGHT_COLOR_ON : STATUS_LIGHT_COLOR_OFF, size: STATUS_LIGHT_SIZE, flicker: true, flickerPower: STATUS_LIGHT_FLICKERING_POWER, ...args } );
  }
}
