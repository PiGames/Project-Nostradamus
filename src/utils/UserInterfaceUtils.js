export const getScreenCenter = ( game ) => ( {
  x: game.camera.x + game.camera.width / 2,
  y: game.camera.y + game.camera.height / 2,
} );

export function showBackgroundLayer( game ) {
  const screenCenter = getScreenCenter( game );

  const backgroundLayer = game.add.sprite( screenCenter.x, screenCenter.y, 'layer-background' );
  backgroundLayer.width = game.width + 100;
  backgroundLayer.height = game.height + 100;
  backgroundLayer.anchor.setTo( 0.5 );
  backgroundLayer.alpha = 0.2;

  return backgroundLayer;
}
