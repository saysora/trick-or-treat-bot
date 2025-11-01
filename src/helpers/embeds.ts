import { ColorResolvable, EmbedBuilder, User } from 'discord.js';
import { ColorEnums, StoryCategory } from '../constants';
import Config from '../models/Config';
import { canTot, getPlayer, timeToTot } from './player-helper';
import { determineStatusType } from './statuses';
import Player from '../models/Player';
import Prompt from '../models/Prompt';

interface EmbedOptions {
  title?: string;
  thumbnail?: string;
  description?: string;
  color?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string;
}

export function createEmbed({
  title,
  thumbnail,
  description,
  color,
  fields,
  footer,
}: EmbedOptions) {
  const embed = new EmbedBuilder().setColor(ColorEnums.base);

  let embedDescription = '';

  if (title) {
    embedDescription += `## ${title}\n`;
  }

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  if (description) {
    embedDescription += `${description}\n\n`;
  }

  if (color) {
    embed.setColor(color as ColorResolvable);
  }

  if (fields) {
    embed.addFields(fields);
  }

  if (footer) {
    embed.setFooter({
      text: footer,
    });
  }

  embed.setDescription(embedDescription);

  return embed;
}

export function beginEmbed() {
  return new EmbedBuilder()
    .setTitle('You leave to trick or treat')
    .setColor(ColorEnums.loss)
    .setDescription(
      //eslint-disable-next-line
      `🏠🌲🏠🌲🏠🌲 \n🏃‍♀️  🏃 🏃‍\n🌲🏠🌲🏠🌲🏠\n\nDo be careful out there...`,
    )
    .setFooter({
      text: 'Use the /trick-or-treat command to collect candy',
    });
}

export function badEmbed() {
  return new EmbedBuilder()
    .setTitle('Something went wrong')
    .setDescription('Contact saysora');
}

export async function getBackpack(
  user: User,
  config: Config,
  darkFocus: boolean,
  active?: boolean
) {
  let title = '🎒 Backpack';
  const player = await getPlayer(user.id);

  if (!player) {
    throw new Error('Could not find player');
  }

  const canTrickOrTreat = canTot(player, config);
  const timeUntilTrickOrTreat = timeToTot(player, config);

  let embedColor = ColorEnums.base;
  const statusColor = determineStatusType(player.status ?? '');

  if (!player.isDead) {
    if (statusColor === 'positive') {
      embedColor = ColorEnums.win;
    }
    if (statusColor === 'negative') {
      embedColor = ColorEnums.loss;
    }
  }

  // Main pieces
  let footerMessage = canTrickOrTreat
    ? 'You can trick or treat again'
    : `Time until you can trick or treat again: ${timeUntilTrickOrTreat}`;

  let status = `You are feeling **${player.status}**`;

  if (darkFocus) {
    status += '\nAnd you feel an ominous gaze...';
  }

  let statFields = [
    {
      name: 'Candy',
      value: `**${player.candy}**`,
    },
    {
      name: 'Candy Lost',
      value: `**${player.lostCandyCount}**`,
      inline: true,
    },
    {
      name: 'Gather Attempts',
      value: `**${player.gatherAttempts}**`,
      inline: true,
    },
  ];

  // Edits for dedge
  if (player.isDead) {
    title = '💀 Bodybag';
    embedColor = ColorEnums.undead;

    status = '**YOU ARE DEAD**\n\n You are feeling **HUNGRY**...';

    footerMessage = canTrickOrTreat
      ? 'You can ███ again...'
      : `Time until you can ███ again: ${timeUntilTrickOrTreat}`;

    statFields = [
      {
        name: 'Candy ██ten',
        value: `**${player.destroyedCandy}**`,
      },
      ...statFields.slice(1),
    ];
  }

  if (!active) {
    footerMessage = 'You can no longer trick-or-treat'
  }

  return createEmbed({
    title,
    description: status,
    color: embedColor,
    thumbnail: user.displayAvatarURL(),
    fields: statFields,
    footer: footerMessage,
  });
}

export function displayCandy(candy: number): string {
  if (candy > 1) {
    return `**${candy} CANDIES**`;
  }
  return `**${candy} CANDY**`;
}

export function storyEmbed({
  story,
  color,
  candy,
  player,
}: {
  story: Prompt;
  color: ColorEnums;
  candy: number;
  player: Player;
}) {
  const storyContent = story.content.replace(/<AMOUNT>/, displayCandy(candy));

  const embed = createEmbed({
    title: 'Trick or Treat',
    description: storyContent,
    color,
    footer: `You now have ${player.candy} 🍬`,
  });

  if (story.category.name === StoryCategory.falseWin) {
    embed.setFooter({ text: `You have ${player.candy} 🍬` });
  }

  if (story.category.name === StoryCategory.gameover) {
    embed.setFooter({ text: 'You are DEAD' });
  }

  if (story.category.name === StoryCategory.totalLoss) {
    embed.setFooter({
      text: 'You now have 0 🍬',
    });
  }

  return embed;
}

export function totOnCooldown(player: Player, config: Config) {
  return createEmbed({
    title: 'Eager are we?',
    description: `Too bad.\nYou must wait **${timeToTot(player, config)}** before you can trick or treat again...`,
    footer: `You have ${player.candy} 🍬 • you can also check your backpack to see when you can trick or treat again`,
  });
}

export function eatOnCooldown(player: Player, config: Config) {
  return createEmbed({
    title: 'No█ y█t...',
    color: ColorEnums.undead,
    description: `You must wait **${timeToTot(player, config)}** before you can █at again.`,
    footer: `You have ██ten ${player.destroyedCandy} 🍬 • you can also check your backpack to see when you can ea█ again`,
  });
}

export function failedToEat() {
  return createEmbed({
    title: 'You ███',
    color: ColorEnums.undead,
    description: 'No█hing ███pened\n\nYou are still ███gry...',
  });
}

export function notDeadEat() {
  return createEmbed({
    title: 'Huh?',
    color: ColorEnums.undead,
    description: 'W█at d█ you █e█n?',
  });
}

export function alreadyPlaying() {
  return createEmbed({
    title: 'You are already trick or treating',
    description:
      'No need to go out again,\ninstead use the /trick-or-treat command to gather candy',
  });
}

export function notPlaying() {
  return createEmbed({
    title: 'You are not trick or treating',
    description: 'Use the go-out command to begin trick-or-treating',
  });
}

export function deadEmbed(player: Player) {
  return createEmbed({
    title: 'YOU ARE ██DEAD',
    color: ColorEnums.dead,
    description:
      'You cannot trick or treat anymore... But maybe there is something else you can do.',
    footer: `Died at ${new Date(player.latestAttempt).toLocaleString()}`,
  });
}
