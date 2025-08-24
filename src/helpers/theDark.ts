import {ActivityType, ClientUser} from 'discord.js';
import Player from '../models/Player';
import TheDark from '../models/TheDark';
import {randomChance} from './chance';
import {getRandomOtherPlayer} from './player-helper';

export async function getTheDark() {
  return await TheDark.findOne({
    include: {
      model: Player,
    },
  });
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

export function setStatus(theDark: TheDark, user: ClientUser) {
  if (!theDark.target_id || !theDark.target) {
    user.setActivity('...', {
      type: ActivityType.Custom,
    });
  } else {
    user.setActivity(`${theDark.target.name}...`, {
      type: ActivityType.Watching,
    });
  }
}
