import {ColorResolvable, EmbedBuilder, User} from 'discord.js';
import {ColorEnums} from '../constants';
import Config from '../models/Config';
import {canTot, getPlayer, timeToTot} from './player-helper';
import {determineStatusType} from './statuses';
import Player from '../models/Player';

interface EmbedOptions {
  title?: string;
  thumbnail?: string;
  description?: string;
  color?: string;
  fields?: {name: string; value: string; inline?: boolean}[];
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

export async function getBackpack(user: User, config: Config) {
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
    embedColor = ColorEnums.dead;

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

  return createEmbed({
    title: 'Backpack',
    description: status,
    color: embedColor,
    thumbnail: user.displayAvatarURL(),
    fields: statFields,
    footer: footerMessage,
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
