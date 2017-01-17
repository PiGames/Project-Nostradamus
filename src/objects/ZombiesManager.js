import WalkingEntitiesManager from '../objects/WalkingEntitiesManager';

export default class ZombieManager extends WalkingEntitiesManager {
  constructor( game, grid ) {
    super( game, grid );
  }

  update() {
    WalkingEntitiesManager.prototype.update.call( this );
  }

}
