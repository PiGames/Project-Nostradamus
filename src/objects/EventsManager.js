class EventsManager {
  constructor() {
    this.signals = {};
    this.debug = true;
  }

  isNameUsed( name ) {
    const keys = Object.keys( this.signals );
    return keys.indexOf( name ) >= 0;
  }

  checkForExistance( name, cb ) {
    if ( this.isNameUsed( name ) ) {
      cb();
    } else {
      throw new Error( `Event with this name does not exist [${name}]` );
    }
  }

  create( name, ...args ) {
    if ( !this.isNameUsed( name ) ) {
      const newSignal = new Phaser.Signal( ...args );
      this.signals[ name ] = newSignal;

      if ( this.debug ) {
        this.on( name, () => {
          console.log( `Dispatched [%c${name}%c]`, 'font-weight: bold; color: #da0', 'font-weight: normal; color: #000' );
        } );
      }

      return newSignal;
    } else {
      throw new Error( `Event with this name has already been created [${name}]` );
    }
  }

  get( name ) {
    this.checkForExistance( name, () => {
      return this.signals[ name ];
    } );
  }

  /*
    * @url https://phaser.io/docs/2.6.2/Phaser.Signal.html#add
  */
  on( name, ...args ) {
    this.checkForExistance( name, () => {
      this.signals[ name ].add( ...args );
    } );
  }

  /*
    * @url https://phaser.io/docs/2.6.2/Phaser.Signal.html#addOnce
  */
  onOnce( name, ...args ) {
    this.checkForExistance( name, () => {
      this.signals[ name ].addOnce( ...args );
    } );
  }

  /*
    * @url https://phaser.io/docs/2.6.2/Phaser.Signal.html#remove
  */
  off( name, ...args ) {
    this.checkForExistance( name, () => {
      this.signals[ name ].remove( ...args );
    } );
  }

  /*
    * @url https://phaser.io/docs/2.6.2/Phaser.Signal.html#removeAll
  */
  offAll() {
    this.checkForExistance( name, () => {
      this.signals[ name ].removeAll();
    } );
  }

  /*
    * @url https://phaser.io/docs/2.6.2/Phaser.Signal.html#dispatch
  */
  dispatch( name, ...args ) {
    this.checkForExistance( name, () => {
      this.signals[ name ].dispatch( ...args );
    } );
  }
}

const eventsManager = new EventsManager();
export default eventsManager;
