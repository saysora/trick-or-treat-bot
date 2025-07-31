import moment = require('moment');
import Player from '../models/Player';
import Config from '../models/Config';
import {getRandomStatus} from './statuses';

export async function createPlayer({
  id,
  serverId,
}: {
  id: string;
  serverId: string;
}) {
  const newPlayer = Player.build({
    id,
    serverId,
    status: getRandomStatus(),
  });

  await newPlayer.save();

  return newPlayer;
}

export async function getPlayer(id: string) {
  const player = await Player.findByPk(id);

  return player;
}

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
