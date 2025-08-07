import moment = require('moment');
import Player from '../models/Player';
import Config from '../models/Config';
import {getRandomStatus} from './statuses';
import {Op, Sequelize} from 'sequelize';

export async function createPlayer({
  id,
  serverId,
  name,
}: {
  id: string;
  serverId: string;
  name: string;
}) {
  const newPlayer = Player.build({
    id,
    serverId,
    status: getRandomStatus(),
    name,
  });

  await newPlayer.save();

  return newPlayer;
}

export async function getPlayer(id: string) {
  const player = await Player.findByPk(id);

  return player;
}

export async function getRandomOtherPlayer(id: string) {
  const otherPlayer = await Player.findOne({
    where: {
      id: {
        [Op.ne]: id,
      },
      isDead: false,
    },
    order: Sequelize.literal('random()'),
  });

  return otherPlayer;
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

export async function playerLoseAllCandy(player: Player) {
  player.latestAttempt = new Date();
  player.gatherAttempts += 1;
  player.lostCandyCount += player.candy;
  player.candy = 0;
  player.allCandyLostCount += 1;

  await player.save();
  return player;
}

export async function killPlayer(player: Player) {
  player.latestAttempt = new Date();
  player.gatherAttempts += 1;
  player.lostCandyCount += player.candy;
  player.candy = 0;
  player.allCandyLostCount += 1;
  player.isDead = true;

  await player.save();
  return player;
}

export async function updatePlayerCandy(player: Player, candy: number) {
  player.latestAttempt = new Date();
  player.gatherAttempts += 1;

  const currentCandy = player.candy;

  if (currentCandy + candy < 0) {
    player.candy = 0;
  } else {
    player.candy = currentCandy + candy;
  }

  await player.save();

  return player;
}

export function timeToTot(player: Player, config: Config) {
  return moment(player.latestAttempt)
    .add(
      config.cooldownTime,
      config.cooldownUnit as moment.unitOfTime.DurationConstructor,
    )
    .fromNow(true);
}
