import {ActivityType, Client} from 'discord.js';
import Player from '../models/Player';
import TheDark from '../models/TheDark';
import {randomChance} from './chance';
import {getRandomOtherPlayer} from './player-helper';

export const focusIntervalTime = 60 * 1000 * 10; // 10 minutes

export async function getTheDark() {
  const theDark = await TheDark.findOne({
    include: {
      model: Player,
    },
  });
  return theDark;
}

export async function setTarget(currentTarget: string | null) {
  const theDark = await getTheDark();

  if (!theDark) {
    throw new Error('There is no dark');
  }

  const chance = randomChance(0, 1);

  if (chance === 1) {
    theDark.target_id = null;
  } else {
    const target = await getRandomOtherPlayer(currentTarget);

    theDark.target_id = target?.id ?? null;
  }

  await theDark.save();

  return theDark;
}

export function setPreGameStatus(client: Client) {
  client.user?.setActivity('...wandering...', {
    type: ActivityType.Custom,
  });
}

export function setStatus(theDark: TheDark, client: Client) {
  if (!theDark.target_id || !theDark.target) {
    client.user?.setActivity('...', {
      type: ActivityType.Custom,
    });
  } else {
    client.user?.setActivity(`${theDark.target.name}...`, {
      type: ActivityType.Watching,
    });
  }
}
