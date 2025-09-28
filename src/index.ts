import 'dotenv/config';
import {db} from './classes/database';
import {
  ActivityType,
  ChannelType,
  Client,
  ClientUser,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  NewsChannel,
  Partials,
  REST,
  Routes,
  TextChannel,
} from 'discord.js';
import commands from './commands';
import {
  candyPlur,
  ColorEnums,
  commandList,
  StoryCategory,
  TIMELINE_EVENT,
} from './constants';
import Player from './models/Player';
import StoryTeller from './classes/StoryTeller';
import moment = require('moment');
import Config from './models/Config';
import {getConfig, updateConfig} from './classes/ConfigManager';
import {
  canTot,
  createPlayer,
  eatCandy,
  getPlayer,
  killPlayer,
  playerLoseAllCandy,
  resetAll,
  updatePlayerCandy,
} from './helpers/player-helper';
import {
  alreadyPlaying,
  badEmbed,
  beginEmbed,
  createEmbed,
  deadEmbed,
  eatOnCooldown,
  failedToEat,
  getBackpack,
  notDeadEat,
  notPlaying,
  storyEmbed,
  totOnCooldown,
} from './helpers/embeds';
import TimelineEvent from './models/TimelineEvent';
import {isGameActive} from './helpers/configcheck';
import {randomChance} from './helpers/chance';
import {storyByCategory, storyCategory} from './helpers/story';
import {
  getRandomStatus,
  NEGATIVE_STATUS,
  POSITIVE_STATUS,
} from './helpers/statuses';
import {
  focusIntervalTime,
  getTheDark,
  setPreGameStatus,
  setStatus,
  setTarget,
} from './helpers/theDark';
import {isAfterDate, isBeforeDate} from './helpers/time';
import {getLeaderBoard} from './helpers/leaderboard';
import {Channel} from 'node:diagnostics_channel';
import {StartMessage} from './constants/messages';

// Setup
let configCache: Config;

const {TOKEN, CLIENTID} = process.env;
const DISC_VARS = [TOKEN, CLIENTID];

DISC_VARS.forEach(discVar => {
  if (!discVar) {
    throw new Error(`Missing ${discVar}`);
  }
});

let focusInterval: NodeJS.Timeout;

// Game funcs
const setFocus = async () => {
  if (!configCache.enabled) {
    return;
  }

  if (configCache.startDate && isBeforeDate(configCache.startDate)) {
    setPreGameStatus(client);
    return;
  }

  if (configCache.endDate && isAfterDate(configCache.endDate)) {
    setPreGameStatus(client);
    return;
  }

  let theDark = await getTheDark();

  if (!theDark) {
    return;
  }

  theDark = await setTarget(theDark.target_id ?? null);

  setStatus(theDark, client);
};

// Should move this somewhere else to clean it up
// but yolo

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
  ],
});

const rest = new REST({version: '10'}).setToken(process.env.TOKEN!);

void (async () => {
  try {
    console.info(`Refreshing ${Object.keys(commands).length} commands.`);
    const data = (await rest.put(Routes.applicationCommands(CLIENTID!), {
      body: commands.map(command => command.toJSON()),
    })) as string[];
    console.info(`Successfully reloaded ${data.length} (/) commands`);
  } catch (e) {
    console.error(e);
  }
})();

let botUser: ClientUser;

client.once(Events.ClientReady, async readyClient => {
  botUser = readyClient.user;
  console.info(`Online as ${botUser.tag}`);
  await db.authenticate();

  try {
    configCache = await getConfig();
  } catch (e) {
    console.error('Could not get a config');
  }

  let theDark = await getTheDark();

  if (theDark) {
    theDark = await setTarget(null);
    setStatus(theDark, client);
  }

  const halloweenTimer = setInterval(() => {
    if (configCache.endDate) {
      const timeUntilHalloween = moment(configCache.endDate).fromNow(true);

      const minutesUntilHalloween = moment(configCache.endDate).diff(
        moment(),
        'minutes',
      );

      if (minutesUntilHalloween < 0) {
        clearInterval(halloweenTimer);

        readyClient.user.setActivity('Trick Or Treat or you DIE', {
          type: ActivityType.Custom,
        });

        return;
      }

      readyClient.user.setActivity(`${timeUntilHalloween} until Halloween`, {
        type: ActivityType.Custom,
      });
    }
  }, 60 * 1000);

  // Every 10 minutes we reset the focus
  // or after the focused user takes their turn
  focusInterval = setInterval(async () => setFocus, focusIntervalTime);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.bot) return;

  const eventEmbed = new EmbedBuilder().setColor(ColorEnums.base);

  if (interaction.commandName === 'config-get') {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    eventEmbed.setTitle('Game Config');
    eventEmbed.setFields([
      {
        name: 'Enabled',
        value: `${configCache.enabled}`,
      },
      {
        name: 'Cooldown Enabled',
        value: `${configCache.cooldownEnabled}`,
      },
      {
        name: 'Cooldown Time',
        value: `${configCache.cooldownTime}`,
      },
      {
        name: 'Cooldown Time Unit',
        value: `${configCache.cooldownUnit}`,
      },
      {
        name: 'Game Start Date ',
        value: `${configCache.startDate}`,
      },
      {
        name: 'Game End Date',
        value: `${configCache.endDate}`,
      },
    ]);

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (interaction.commandName === 'config-update') {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const item = interaction.options.getString('item');
    const value = interaction.options.getString('value');

    if (!item && !value) {
      eventEmbed.setTitle('Could not update');
      eventEmbed.setDescription('Could not find item or value');
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    configCache = await updateConfig({
      [item as keyof Config]: value === 'null' ? null : value,
    });

    eventEmbed.setTitle('Game Config Updated');
    eventEmbed.setFields([
      {
        name: 'Enabled',
        value: `${configCache.enabled}`,
      },
      {
        name: 'Cooldown Enabled',
        value: `${configCache.cooldownEnabled}`,
      },
      {
        name: 'Cooldown Time',
        value: `${configCache.cooldownTime}`,
      },
      {
        name: 'Cooldown Time Unit',
        value: `${configCache.cooldownUnit}`,
      },
      {
        name: 'Game Start Date ',
        value: `${configCache.startDate}`,
      },
      {
        name: 'Game End Date',
        value: `${configCache.endDate}`,
      },
    ]);

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (interaction.commandName === 'go-out') {
    const {content, active} = isGameActive(configCache, interaction.channelId);

    if (!active) {
      await interaction.reply({
        content: content ?? 'Something went wrong',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const isCurrentPlayer = await getPlayer(interaction.user.id);

    let embed = eventEmbed;

    if (!isCurrentPlayer) {
      try {
        await createPlayer({
          id: interaction.user.id,
          serverId: interaction.guildId!,
          name: interaction.user.username,
        });

        embed = beginEmbed();
        // This is the moment they began
        await TimelineEvent.create({
          playerId: interaction.user.id,
          eventType: TIMELINE_EVENT.START,
          roll: 0,
          candyAmount: 0,
        });
      } catch (e) {
        embed = badEmbed();
        console.error(e);
      } finally {
        await interaction.editReply({
          embeds: [embed],
        });
      }
      return;
    } else {
      await interaction.editReply({
        embeds: [alreadyPlaying()],
      });
    }
    return;
  }

  if (
    interaction.commandName === 'trick-or-treat' ||
    interaction.commandName === 'tot'
  ) {
    const {content, active} = isGameActive(configCache, interaction.channelId);

    if (!active) {
      await interaction.reply({
        content: content ?? 'Something went wrong',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    eventEmbed.setTitle('Trick or Treat');

    const currentPlayer = await getPlayer(interaction.user.id);

    if (!currentPlayer) {
      await interaction.editReply({
        embeds: [notPlaying()],
      });
      return;
    }

    if (currentPlayer.isDead) {
      await interaction.editReply({
        embeds: [deadEmbed(currentPlayer)],
      });
      return;
    }

    if (configCache.cooldownEnabled) {
      if (!canTot(currentPlayer, configCache)) {
        await interaction.editReply({
          embeds: [totOnCooldown(currentPlayer, configCache)],
        });
        return;
      }
    }

    let chance = randomChance(1, 1000);

    // Depending on the player status or the evils focus
    // we fuck with their roll

    if (NEGATIVE_STATUS.includes(currentPlayer.status ?? '')) {
      chance -= randomChance(15, 100);
      if (chance < 1) {
        chance = 2; // Hard save someone if their status got them killed
      }
    }

    if (POSITIVE_STATUS.includes(currentPlayer.status ?? '')) {
      chance += randomChance(1, 100);
    }

    let darkFocus = await getTheDark();

    if (darkFocus?.target_id === currentPlayer.id) {
      const chanceWithDark = chance - randomChance(1, 200);

      // Save them from the dark being an immediate kill
      if (chanceWithDark > 0) {
        chance = chanceWithDark;
      }
      clearInterval(focusInterval);
      darkFocus = await setTarget(currentPlayer.id);
      setStatus(darkFocus, client);
      focusInterval = setInterval(async () => setFocus, focusIntervalTime);
    }

    currentPlayer.status = getRandomStatus();
    const {category, candy, color} = storyCategory(chance);
    const story = await storyByCategory(category);

    if (!story) {
      throw new Error('Could not get a story');
    }

    let updatedPlayer: Player = currentPlayer;
    let awardCandy = true;
    let event: TIMELINE_EVENT = TIMELINE_EVENT.LOST;

    if (category === StoryCategory.gameover) {
      updatedPlayer = await killPlayer(currentPlayer);
      awardCandy = false;
      event = TIMELINE_EVENT.DIED;
    }

    if (category === StoryCategory.totalLoss) {
      updatedPlayer = await playerLoseAllCandy(currentPlayer);
      awardCandy = false;
      event = TIMELINE_EVENT.LOST_ALL;
    }

    if (awardCandy) {
      updatedPlayer = await updatePlayerCandy(
        currentPlayer,
        category === StoryCategory.loss ? candy * -1 : candy,
      );
      if (category === StoryCategory.loss) {
        event = TIMELINE_EVENT.LOST;
      } else if (category === StoryCategory.falseWin) {
        event = TIMELINE_EVENT.NOTHING;
      } else {
        event = TIMELINE_EVENT.GAIN;
      }
    }

    await TimelineEvent.create({
      playerId: currentPlayer.id,
      promptId: story.id,
      eventType: event,
      roll: category === StoryCategory.loss ? candy * -1 : candy,
      candyAmount: currentPlayer.candy,
      date: new Date(),
    });

    await interaction.editReply({
      embeds: [
        storyEmbed({
          story,
          candy,
          color,
          player: updatedPlayer,
        }),
      ],
    });
    return;
  }

  if (interaction.commandName === 'backpack') {
    const {content, active} = isGameActive(configCache, interaction.channelId);

    if (!active) {
      await interaction.reply({
        content: content ?? 'Something went wrong',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const pub = interaction.options.getBoolean('public');

    await interaction.deferReply({
      flags: !pub ? MessageFlags.Ephemeral : undefined,
    });

    const currentPlayer = await getPlayer(interaction.user.id);

    if (!currentPlayer) {
      await interaction.editReply({
        content:
          'You aren not trick-or-treating yet! Use the /go-out command to start',
      });
      return;
    }

    const currentDark = await getTheDark();
    const backpack = await getBackpack(
      interaction.user,
      configCache,
      currentDark?.target_id === interaction.user.id,
    );

    await interaction.editReply({
      embeds: [backpack],
    });

    return;
  }

  if (interaction.commandName === 'leaderboard') {
    const {content, active} = isGameActive(configCache, interaction.channelId);

    if (!active) {
      await interaction.reply({
        content: content ?? 'Something went wrong',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const wantedPage = Number(interaction.options.get('page')?.value ?? 0);

    const {players, page, pages} = await getLeaderBoard(wantedPage);

    if (wantedPage > pages) {
      eventEmbed.setTitle('No page found');
      eventEmbed.setDescription(`There are only ${pages} leaderboard pages`);
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    if (players.length === 0) {
      eventEmbed.setDescription('No players yet...');
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    eventEmbed.setTitle('Sugar Daddies');
    let lbString = '';

    players.forEach((player, i) => {
      lbString += `**${page === 1 ? i + 1 : (page - 1) * 10 + (i + 1)}**. <@${player.id}> - ${!player.isDead ? `${player.candy} 🍬` : '💀'}\n`;
    });

    eventEmbed.setDescription(lbString);
    eventEmbed.setFooter({
      text: `Page ${page}/${pages}`,
    });

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (interaction.commandName === 'eat') {
    const {content, active} = isGameActive(configCache, interaction.channelId);

    if (!active) {
      await interaction.reply({
        content: content ?? 'Something went wrong',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply();

    const currentPlayer = await getPlayer(interaction.user.id);

    if (!currentPlayer) {
      await interaction.editReply({
        embeds: [notPlaying()],
      });
      return;
    }

    if (!currentPlayer.isDead) {
      await interaction.editReply({
        embeds: [notDeadEat()],
      });
      return;
    }

    if (configCache.cooldownEnabled) {
      if (!canTot(currentPlayer, configCache)) {
        await interaction.editReply({
          embeds: [eatOnCooldown(currentPlayer, configCache)],
        });
        return;
      }
    }

    const target = interaction.options.get('player')?.value as string;

    if (!target) {
      await interaction.editReply({
        content: 'You must select a player',
      });
      return;
    }

    if (target === interaction.user.id) {
      await interaction.editReply({
        content: 'You must select a player other than yourself',
      });
      return;
    }

    const targetPlayer = await getPlayer(target);

    if (!targetPlayer) {
      await interaction.editReply({
        content: 'That player is not trick or treating!',
      });
      return;
    }

    const {
      success,
      eaten,
      player,
      target: actualTarget,
    } = await eatCandy(currentPlayer, targetPlayer);

    eventEmbed.setColor(ColorEnums.undead);
    eventEmbed.setTitle('You ███');

    if (!success || !actualTarget) {
      const failEmbed = failedToEat();
      failEmbed.setFooter({
        text: `You have ███en ${player.destroyedCandy} 🍬`,
      });

      await interaction.editReply({
        embeds: [failEmbed],
      });
      return;
    }

    let attackString = `You at██ck██ <@${target}>!\n\n`;
    const candyString = candyPlur(eaten);

    if (actualTarget.id !== targetPlayer.id) {
      if (eaten > 0) {
        attackString += `...\n\n**BUT** ███acked <@${actualTarget.id}> instead and ███ **${eaten} ${candyString}**!!\n\nHow Could you?`;
      } else {
        attackString += `...\n\n**BUT** tried to ███ <@${actualTarget.id}>'s candy instead!!!\n\nYou didn't manage to ███ any though.`;
      }
    } else {
      attackString = `You at██ck██ <@${target}>!\n\n`;
      if (eaten > 0) {
        attackString += `...\n\n**AND** ███ **${eaten}** of their CANDY!`;
      } else {
        attackString += "...\n\n**AND** Didn't ███ any ██ndy.";
      }
    }

    eventEmbed.setDescription(attackString);

    if (eaten > 0) {
      eventEmbed.setFooter({
        text: `You have now ███en ${player.destroyedCandy} 🍬`,
      });
    } else {
      eventEmbed.setFooter({
        text: `You have ███en ${player.destroyedCandy} 🍬`,
      });
    }

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (interaction.commandName === 'help') {
    let msg = '';
    commandList.forEach(({cmd, aliases, description}) => {
      msg += `**${cmd}**: ${description}`;

      if (aliases?.length) {
        const cmds = aliases.map(c => `\`${c}\``);
        msg += `\n**aliases**: [${cmds.join(', ')}]`;
      }

      msg += '\n\n';
    });
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        createEmbed({
          title: 'Help',
          description: msg,
          color: ColorEnums.base,
        }),
      ],
    });
    return;
  }

  // Admin commands
  if (interaction.commandName === 'story-create') {
    const category = interaction.options.get('category')?.value;
    const content = interaction.options.get('content')?.value;
    if (!category || !content) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'Category or content missing for the story',
      });
      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const newStory = await StoryTeller.addStory(
      category as StoryCategory,
      content as string,
    );

    if (!newStory) {
      eventEmbed.setTitle('Could not add story');
      eventEmbed.setDescription('Check the logs');
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    } else {
      eventEmbed.setTitle('Story added');
      eventEmbed.setDescription(
        `Category: ${category}\nStory: ${newStory.content}`,
      );
      eventEmbed.setFooter({
        text: `ID: ${newStory.id}`,
      });
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }
  }

  if (interaction.commandName === 'story-delete') {
    const id = interaction.options.get('id')?.value;

    if (!id) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You must provide the id',
      });
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const storyDeleted = await StoryTeller.deleteStory(id as string);

    if (!storyDeleted) {
      eventEmbed.setTitle('Something went wrong');
      eventEmbed.setDescription('Check the logs');
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    } else {
      eventEmbed.setTitle('Story Deleted');
      eventEmbed.setDescription(
        `Category: ${storyDeleted.category.name}\nStory: ${storyDeleted.content}`,
      );
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }
  }

  if (interaction.commandName === 'reset-all') {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const gameReset = await resetAll();

    let answer = '';
    if (gameReset) {
      answer = 'Successfully reset trick or treaters';
    } else {
      answer = 'Could not reset trick or treaters, check logs';
    }

    await interaction.editReply({
      content: answer,
    });
    return;
  }

  // Sending
  if (interaction.commandName === 'send') {
    // Don't allow anyone but the server owner to do this
    if (interaction.user.id !== interaction.guild?.ownerId) return;
    const chan = interaction.options.getChannel('channel', true, [
      ChannelType.GuildText,
      ChannelType.GuildDirectory,
      // Maybe extend this into threads etc at some point
    ]);
    const msg = interaction.options.getString('message');

    if (!chan || !msg) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You must provide both channel and a message',
      });

      return;
    }

    if (!chan) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You can only send messages to text or news channels',
      });

      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    try {
      await chan.send({content: msg});
      await interaction.editReply({
        content: 'Message successfully sent',
      });
    } catch (e) {
      const err = e as Error;
      console.error(e);
      await interaction.editReply({
        content: err.message ?? 'Something went wrong',
      });
    }

    return;
  }

  if (interaction.commandName === 'start-message') {
    const chan = interaction.options.getChannel('channel', true, [
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
      // Maybe extend this into threads etc at some point
    ]);

    if (!chan) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You must provide a valid channel',
      });
      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    try {
      await chan.send({
        embeds: [
          createEmbed({
            title: 'Trick or Treat',
            description: StartMessage,
            color: ColorEnums.dead,
            thumbnail: client.user?.displayAvatarURL(),
          }),
        ],
      });
      await interaction.editReply({
        content: 'Message successfully sent',
      });
    } catch (e) {
      const err = e as Error;
      console.error(e);
      await interaction.editReply({
        content: err.message ?? 'Something went wrong',
      });
    }
    return;
  }
});

client.on(Events.GuildMemberUpdate, async (prev, cur) => {
  if (prev.nickname || cur.nickname) {
    const existingPlayer = await Player.findOne({
      where: {
        id: cur.id,
      },
    });

    if (!existingPlayer) {
      return;
    }

    if (cur.nickname) {
      existingPlayer.name = cur.nickname;
    } else {
      existingPlayer.name = cur.user.username;
    }

    await existingPlayer.save();

    // Update the players name if they are the target
    const theDark = await getTheDark();

    if (!theDark) {
      return;
    }

    if (theDark.target_id === cur.id) {
      setStatus(theDark, client);
    }
  }
});

void client.login(TOKEN);
