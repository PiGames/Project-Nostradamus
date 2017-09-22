let ID_COUNTER = 0;

// sort of a interface
export default class Lightable {
  constructor( isStatic = true ) {
    this.id = ID_COUNTER++;
    this.isStatic = isStatic;
    this.disabled = false;
    this.toggleLight = this.toggleLight.bind( this );
  }

  toggleLight() {
    this.disabled = !this.disabled;
  }

  isDisabled() {
    return this.disabled;
  }

  getLightShapePoints() {
    // virtual method
    // it means it should by overwritten in derived class
    return [];
  }
  getFillStyle() {
    // virtual method
    return 0xffffff;
  }
}
