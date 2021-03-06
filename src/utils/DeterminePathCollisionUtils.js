import { areTilesTheSame } from './MapUtils';
import { STATES } from '../objects/ZombieComponents/ZombiePathManager';

export function willZombiesPathsInterfere( zombie1, zombie2 ) {
  if ( !isZombieInMovement( zombie1 ) || !isZombieInMovement( zombie2 ) ) {
    return false;
  }

  const zombie1NextTile = getZombieNextStepTarget( zombie1 );
  const zombie2NextTile = getZombieNextStepTarget( zombie2 );
  const zombie1CurrentTile = getZombieCurrentStepTarget( zombie1 );
  const zombie2CurrentTile = getZombieCurrentStepTarget( zombie2 );

  return areTilesTheSame( zombie1NextTile, zombie2NextTile )
   || areTilesTheSame( zombie1NextTile, zombie2CurrentTile )
   || areTilesTheSame( zombie1CurrentTile, zombie2CurrentTile )
   || areTilesTheSame( zombie2CurrentTile, zombie2CurrentTile );
}

function getZombieNextStepTarget( zombie ) {
  let nextStepTarget;
  switch ( zombie.state ) {
  case STATES.ON_STANDARD_PATH:
    nextStepTarget = getZombieNextStandardStepTarget( zombie );
    break;
  case STATES.ON_TEMPORARY_PATH:
    nextStepTarget = getZombieNextTemporaryStepTarget( zombie );
  }
  return nextStepTarget;
}

function getZombieNextStandardStepTarget( zombie ) {
  let nextStepTargetIndex = zombie.currentStepIndex + 1;
  let nextStepTargetPathIndex = zombie.currentPathIndex;

  if ( nextStepTargetIndex === zombie.pathsBetweenTargets[ zombie.currentPathIndex ].path.length ) {
    nextStepTargetIndex = 0;
    nextStepTargetPathIndex++;

    if ( nextStepTargetPathIndex === zombie.pathsBetweenTargets.length ) {
      nextStepTargetPathIndex = 0;
    }
  }

  return zombie.pathsBetweenTargets[ nextStepTargetPathIndex ].path[ nextStepTargetIndex ];
}

function getZombieNextTemporaryStepTarget( zombie ) {
  let nextTemporaryStepTargetIndex = zombie.temporaryStepIndex + 1;

  if ( nextTemporaryStepTargetIndex === zombie.temporaryPath.length ) {
    let nextPathIndex = zombie.currentPathIndex + 1;

    if ( nextPathIndex === zombie.pathsBetweenTargets.length ) {
      return zombie.pathsBetweenTargets[ 0 ].path[ 1 ];
    }
    return zombie.pathsBetweenTargets[ nextPathIndex ].path[ 1 ];
  }
  return zombie.temporaryPath[ nextTemporaryStepTargetIndex ];
}

function getZombieCurrentStepTarget( zombie ) {
  switch ( zombie.state ) {
  case STATES.ON_STANDARD_PATH:
    return zombie.getCurrentStepTarget();
  case STATES.ON_TEMPORARY_PATH:
    return zombie.getTemporaryStepTarget();
  }
}

function isZombieInMovement( zombie ) {
  return zombie.state !== STATES.CALCULATING_PATH && zombie.state !== STATES.NOT_STARTED;
}
