import ProjectNostradamus from './ProjectNostradamus';

new ProjectNostradamus( '100%', '100%', Phaser.AUTO, 'content' );

/*
!!! This is protection against leaving page while still in game. It is commented out since it was driving me crazy that i had to confirm leavinmg every time browsersync fired. !!!
window.onbeforeunload = (e) => {
  return 'Really want to quit the game?';
};

document.onkeydown = ( e ) => {
  e = e || window.event;
  if ( e.ctrlKey ) {
    const c = e.which || e.keyCode;
    switch ( c ) {
    case 83:
    case 87:
      e.preventDefault();
      e.stopPropagation();
      break;
    }
  }
};
*/
