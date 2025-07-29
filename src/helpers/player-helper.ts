import moment = require('moment');
import Player from '../models/Player';
import Config from '../models/Config';

export function canTot(player: Player, config: Config) {
  let canAttempt = false;

  if (
    player.gatherAttempts > 0 &&
    !moment().isSameOrAfter(
      moment(player.latestAttempt).add(
        config.cooldownTime,
        config.cooldownUnit as moment.unitOfTime.DurationConstructor,
      ),
    )
  ) {
    canAttempt = false;
  } else {
    canAttempt = true;
  }
  return canAttempt;
}

export function timeToTot(player: Player, config: Config) {
  return moment(player.latestAttempt)
    .add(
      config.cooldownTime,
      config.cooldownUnit as moment.unitOfTime.DurationConstructor,
    )
    .fromNow(true);
}
