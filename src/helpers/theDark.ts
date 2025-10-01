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
  await theDark.reload({include: {model: Player}});

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

export function randomFocusMessage(target: string) {
  const statuses = [
    // Feels
    '<TARGET> feels a chill run down their spine.',
    '<TARGET> feels an unsettling silence fall.',
    '<TARGET> feels all sounds fade away.',
    '<TARGET> feels something watching them.',
    '<TARGET> feels a sense of utter dread.',
    '<TARGET> feels a presence.',
    '<TARGET> feels a prickling sensation across their skin.',
    '<TARGET> feels an ominous gaze.',
    '<TARGET> feels utterly alone.',
    '<TARGET> feels a sense of impending doom.',
    '<TARGET> feels something behind them.',
    // Notices
    '<TARGET> notices the air around them grow still and cold.',
    '<TARGET> notices the shadows grow.',
    '<TARGET> notices a faint, oppressive humming sound.',

    // possessive
    "<TARGET>'s heart begins to race.",
    "<TARGET>'s vision begins to dim.",
    // Is
    '<TARGET> is being followed.',
    '<TARGET> is being watched.',
    // Hears
    '<TARGET> hears a whispered name, just a breath away.',
    '<TARGET> hears a voice.',
    '<TARGET> hears faint crying in the distance.',
    '<TARGET> hears a shriek behind them.',
  ];

  return statuses[Math.floor(Math.random() * statuses.length)].replace(
    '<TARGET>',
    `<@${target}>`,
  );
}
