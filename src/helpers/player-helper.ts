import moment = require('moment');
import Player from '../models/Player';
import TheDark from '../models/TheDark';
import Config from '../models/Config';
import {getRandomStatus} from './statuses';
import {Op, Sequelize, WhereOptions} from 'sequelize';
import {randomChance} from './chance';
import TimelineEvent from '../models/TimelineEvent';

// Helpers
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

export function calcedWatchTime(player: Player, config: Config) {
  return moment(player.gatherAttempts > 0 ? player.latestAttempt : new Date())
    .add(
      config.cooldownTime,
      config.cooldownUnit as moment.unitOfTime.DurationConstructor,
    )
    .diff(moment(), 'milliseconds', true);
}

// Player Commands

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

export async function getRandomOtherPlayer(id: string | string[] | null) {
  let where: WhereOptions = {isDead: false};

  if (Array.isArray(id) && id !== null) {
    where = {...where, id: {[Op.notIn]: id}};
  } else {
    where = {...where, id: {[Op.ne]: id}};
  }

  const otherPlayer = await Player.findOne({
    where,
    order: Sequelize.literal('random()'),
  });

  return otherPlayer;
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

  const isLoss = candy < 0;

  if (isLoss) {
    const pos = candy * -1;

    // If current candy is less than the amount lost
    if (currentCandy < pos) {
      player.lostCandyCount = player.lostCandyCount + currentCandy;
    } else {
      // Otherwise we just add the amount
      player.lostCandyCount = player.lostCandyCount + pos;
    }

    // Add the additional amount of candy
    player.candy = currentCandy + candy;

    // Always set the candy to 0 if it goes beneath
    if (player.candy < 0) {
      player.candy = 0;
    }
  } else {
    player.candy = currentCandy + candy;
  }

  await player.save();

  return player;
}

// Undead
enum TargetChance {
  success = 90,
  messUp = 30,
  fail = 0,
}

enum TargetResult {
  success = 'success',
  messUp = 'messUp',
  fail = 'fail',
}
function canEatCheck() {
  const chance = randomChance(0, 100);

  switch (true) {
    case chance >= TargetChance.success:
      return TargetResult.success;
    case chance < TargetChance.success && chance >= TargetChance.messUp:
      return TargetResult.messUp;
    default:
      return TargetResult.fail;
  }
}

export async function eatCandy(player: Player, player2: Player) {
  let target: Player | null = player2;

  const successCheck = canEatCheck();

  player.latestAttempt = new Date();
  player.gatherAttempts += 1;

  if (successCheck === TargetResult.fail) {
    await player.save();
    return {
      eaten: 0,
      success: false,
      player,
      target,
    };
  }

  if (successCheck === TargetResult.messUp) {
    target = await getRandomOtherPlayer([player.id, player2.id]);
  }

  if (!target) {
    await player.save();
    return {
      eaten: 0,
      success: false,
      player,
      target,
    };
  }

  const eatenAmount = randomChance(0, 3);

  if (eatenAmount > target.candy) {
    player.destroyedCandy += target.candy;

    target.lostCandyCount += target.candy;
    target.candy = 0;
  } else {
    target.candy -= eatenAmount;
    target.lostCandyCount += eatenAmount;
    player.destroyedCandy += eatenAmount;
  }
  await target.save();
  await player.save();

  return {
    eaten: eatenAmount,
    success: true,
    player,
    target,
  };
}

// Leaderboard

// Admin UTILS
export async function resetAll(): Promise<boolean> {
  try {
    await TheDark.update(
      {
        target_id: null,
      },
      {
        where: {},
      },
    );

    await Player.destroy({where: {}});
    await TimelineEvent.destroy({where: {}});

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
