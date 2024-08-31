import 'dotenv/config';
import {db} from './classes/database';
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  User,
  WebhookClient,
} from 'discord.js';
import commands from './commands';
import {
  ColorEnums,
  FALSE_STATUSES,
  isAfterDate,
  isBeforeDate,
  randomChance,
} from './constants';
import Player from './models/Player';
import StoryTeller from './classes/StoryTeller';
import {CategoryName} from './models/PromptCategory';
import moment = require('moment');
import PlayerManager from './classes/PlayerManager';
import Config from './models/Config';
import ConfigManager from './classes/ConfigManager';

// Services
const PManager = new PlayerManager(Player);
const CManager = new ConfigManager(Config);

// Setup
let configCache: Config;

const DISC_VARS = ['TOKEN', 'CLIENTID', 'WEBHOOK_URL'];

DISC_VARS.forEach(discVar => {
  if (!(discVar in process.env)) {
    throw new Error(`Missing ${discVar}`);
  }
});

// Should move this somewhere else to clean it up
// but yolo
const canTot = (player: Player) => {
  let canAttempt = false;

  if (
    player.gatherAttempts > 0 &&
    !moment().isSameOrAfter(
      moment(player.latestAttempt).add(
        configCache.cooldownTime,
        configCache.cooldownUnit as moment.unitOfTime.DurationConstructor
      )
    )
  ) {
    canAttempt = false;
  } else {
    canAttempt = true;
  }
  return canAttempt;
};

const timeToTot = (player: Player) => {
  console.log({
    lastAttempt: moment(player.latestAttempt).toString(),
    canAttemptTime: moment(player.latestAttempt)
      .add(
        configCache.cooldownTime,
        configCache.cooldownUnit as moment.unitOfTime.DurationConstructor
      )
      .toString(),
    now: moment().toString(),
    canAttempString: moment(player.latestAttempt)
      .add(
        configCache.cooldownTime,
        configCache.cooldownUnit as moment.unitOfTime.DurationConstructor
      )
      .fromNow(),
  });

  return moment(player.latestAttempt)
    .add(
      configCache.cooldownTime,
      configCache.cooldownUnit as moment.unitOfTime.DurationConstructor
    )
    .fromNow(true);
};

const hookClient = new WebhookClient({
  url: process.env.WEBHOOK_URL!,
});

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

(async () => {
  try {
    console.info(`Refreshing ${Object.keys(commands).length} commands.`);
    const data = (await rest.put(
      Routes.applicationCommands(process.env.CLIENTID!),
      {
        body: commands.map(command => command.toJSON()),
      }
    )) as string[];
    console.info(`Successfully reloaded ${data.length} (/) commands`);
  } catch (e) {
    console.error(e);
  }
})();

let botUser: User;

let config: Config;

client.once(Events.ClientReady, async readyClient => {
  botUser = readyClient.user;
  console.info(`Online as ${botUser.tag}`);
  await db.authenticate();

  configCache = await CManager.getConfig();
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.user.bot) return;

  const eventEmbed = new EmbedBuilder().setColor(ColorEnums.base);

  if (interaction.commandName === 'config-get') {
    await interaction.deferReply({
      ephemeral: true,
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
      ephemeral: true,
    });

    if (
      !interaction.options.get('item')?.value &&
      !interaction.options.get('value')?.value
    ) {
      eventEmbed.setTitle('Could not update');
      eventEmbed.setDescription('Could not find item or value');
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    configCache = await CManager.updateConfig({
      [interaction.options.get('item')?.value as string]:
        interaction.options.get('value')?.value,
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
    if (
      process.env.GAME_CHANNEL_ID &&
      interaction.channelId !== process.env.GAME_CHANNEL_ID
    ) {
      await interaction.reply({
        ephemeral: true,
        content: `You can only trick-or-treat in <#${process.env.GAME_CHANNEL_ID}>`,
      });
      return;
    }

    if (!configCache.enabled) {
      await interaction.reply({
        ephemeral: true,
        content: "It's not time to trick or treat yet!",
      });
      return;
    }

    if (configCache.startDate && isBeforeDate(configCache.startDate)) {
      await interaction.reply({
        ephemeral: true,
        content: `It's not time to trick or treat yet! You need to wait until ${moment(configCache.startDate, 'YYYY-MM-DD').format('MMMM Do')}`,
      });
      return;
    }

    if (configCache.endDate && isAfterDate(configCache.endDate)) {
      await interaction.reply({
        ephemeral: true,
        content: 'It is too late to trick or treat. Halloween is over.',
      });
      return;
    }

    await interaction.deferReply();

    const isCurrentPlayer = await PManager.getPlayer(interaction.user.id);

    if (!isCurrentPlayer) {
      try {
        await PManager.createPlayer({
          id: interaction.user.id,
          serverId: interaction.guildId!,
        });

        eventEmbed.setTitle('You leave to trick or treat');
        eventEmbed.setColor(ColorEnums.loss);
        eventEmbed.setDescription(
          `🏠🌲🏠🌲🏠🌲 \n🏃‍♀️  🏃 🏃‍\n🌲🏠🌲🏠🌲🏠\n\nDo be careful out there...`
        );
        eventEmbed.setFooter({
          text: 'Use the /trick-or-treat command to collect candy',
        });
      } catch (e) {
        eventEmbed.setTitle('Something went wrong');
        eventEmbed.setDescription('Contact saysora');
        console.error(e);
      } finally {
        await interaction.editReply({
          embeds: [eventEmbed],
        });
      }
      return;
    } else {
      eventEmbed.setTitle('You are already trick or treating');
      eventEmbed.setDescription(
        'No need to go out again,\ninstead use the /trick-or-treat  command to gather candy'
      );
      await interaction.editReply({
        embeds: [eventEmbed],
      });
    }
    return;
  }

  if (interaction.commandName === 'trick-or-treat') {
    if (
      process.env.GAME_CHANNEL_ID &&
      interaction.channelId !== process.env.GAME_CHANNEL_ID
    ) {
      await interaction.reply({
        ephemeral: true,
        content: `You can only trick-or-treat in <#${process.env.GAME_CHANNEL_ID}>`,
      });
      return;
    }

    if (!configCache.enabled) {
      await interaction.reply({
        ephemeral: true,
        content: "It's not time to trick or treat yet!",
      });
      return;
    }

    if (configCache.startDate && isBeforeDate(configCache.startDate)) {
      await interaction.reply({
        ephemeral: true,
        content: `It's not time to trick or treat yet! You need to wait until ${moment(configCache.startDate, 'YYYY-MM-DD').format('MMMM Do')}`,
      });
      return;
    }

    if (configCache.endDate && isAfterDate(configCache.endDate)) {
      await interaction.reply({
        ephemeral: true,
        content: 'It is too late to trick or treat. Halloween is over.',
      });
      return;
    }

    await interaction.deferReply();

    eventEmbed.setTitle('Trick or Treat');

    const currentPlayer = await PManager.getPlayer(interaction.user.id);

    if (!currentPlayer) {
      eventEmbed.setTitle('You are not trick or treating');
      eventEmbed.setDescription(
        'Use the go-out command to begin trick or treating'
      );
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    if (currentPlayer.isDead) {
      eventEmbed.setTitle('YOU ARE DEAD');
      eventEmbed.setDescription('You cannot trick or treat anymore');
      eventEmbed.setFooter({
        text: `Died at ${new Date(currentPlayer.latestAttempt).toLocaleString()}`,
      });
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    if (configCache.cooldownEnabled) {
      if (!canTot(currentPlayer)) {
        eventEmbed.setTitle('Eager are we?');
        eventEmbed.setDescription(
          `Too bad.\nYou must wait **${timeToTot(currentPlayer)}** before you can trick or treat again...`
        );
        eventEmbed.setFooter({
          text: `You have ${currentPlayer.candy} 🍬 • you can also check your backpack to see when you can trick or treat again`,
        });
        await interaction.editReply({
          embeds: [eventEmbed],
        });
        return;
      }
    }

    const chance = randomChance(1, 1000);
    const game = await StoryTeller.gamePrompt(chance.number);

    eventEmbed.setColor(game.story.color);
    eventEmbed.setDescription(game.story.content);

    let updatedPlayer: Player;

    switch (true) {
      case game.story.category === CategoryName.gameover: {
        updatedPlayer = await PManager.killPlayer(currentPlayer);
        eventEmbed.setFooter({
          text: 'You are DEAD',
        });
        break;
      }
      case game.story.category === CategoryName.totalLoss: {
        updatedPlayer = await PManager.playerLoseAllCandy(currentPlayer);
        eventEmbed.setFooter({
          text: 'You now have 0 🍬',
        });
        break;
      }
      default: {
        if (!game.gain) {
          updatedPlayer = await PManager.takePlayerCandy(
            currentPlayer,
            game.amount
          );
        } else {
          updatedPlayer = await PManager.givePlayerCandy(
            currentPlayer,
            game.amount
          );
        }

        if (game.amount === 0) {
          eventEmbed.setFooter({
            text: `You have ${updatedPlayer.candy} 🍬`,
          });
        } else {
          eventEmbed.setFooter({
            text: `You now have ${updatedPlayer.candy} 🍬`,
          });
        }
      }
    }

    await interaction.editReply({
      embeds: [eventEmbed],
    });
    return;
  }

  if (interaction.commandName === 'backpack') {
    if (
      process.env.GAME_CHANNEL_ID &&
      interaction.channelId !== process.env.GAME_CHANNEL_ID
    ) {
      await interaction.reply({
        ephemeral: true,
        content: `You can only trick-or-treat in <#${process.env.GAME_CHANNEL_ID}>`,
      });
      return;
    }

    if (!configCache.enabled) {
      await interaction.reply({
        ephemeral: true,
        content: "It's not time to trick or treat yet!",
      });
      return;
    }

    if (configCache.startDate && isBeforeDate(configCache.startDate)) {
      await interaction.reply({
        ephemeral: true,
        content: `It's not time to trick or treat yet! You need to wait until ${moment(configCache.startDate, 'YYYY-MM-DD').format('MMMM Do')}`,
      });
      return;
    }

    if (configCache.endDate && isAfterDate(configCache.endDate)) {
      await interaction.reply({
        ephemeral: true,
        content: 'It is too late to trick or treat. Halloween is over.',
      });
      return;
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const currentPlayer = await PManager.getPlayer(interaction.user.id);

    if (!currentPlayer) {
      await interaction.editReply({
        content: `You aren not trick-or-treating yet! Use the /go-out command to start`,
      });
      return;
    }

    const randomStatus =
      FALSE_STATUSES[
        Math.floor(Math.random() * FALSE_STATUSES.length)
      ].toUpperCase();

    let canTotString = canTot(currentPlayer)
      ? 'You can trick or treat again'
      : `Time until you can trick or treat again: ${timeToTot(currentPlayer)}`;

    let status = `You are feeling **${randomStatus}...**`;

    if (currentPlayer.isDead) {
      eventEmbed.setColor(ColorEnums.dead);
      status = '**YOU ARE DEAD**';
    }

    eventEmbed.setThumbnail(interaction.user.displayAvatarURL());
    eventEmbed.setDescription(`
      ## Backpack\n${status}\n\n
    `);
    if (!currentPlayer.isDead) {
      eventEmbed.setFooter({
        text: `${canTotString}`,
      });
    }

    eventEmbed.setFields([
      {
        name: 'Candy',
        value: `**${currentPlayer.candy}**`,
      },
      {
        name: 'Candy Lost',
        value: `**${currentPlayer.lostCandyCount}**`,
        inline: true,
      },
      {
        name: 'Gather Attempts',
        value: `**${currentPlayer.gatherAttempts}**`,
        inline: true,
      },
    ]);

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (['lb', 'leader-board'].includes(interaction.commandName)) {
    if (
      process.env.GAME_CHANNEL_ID &&
      interaction.channelId !== process.env.GAME_CHANNEL_ID
    ) {
      await interaction.reply({
        ephemeral: true,
        content: `You can only trick-or-treat in <#${process.env.GAME_CHANNEL_ID}>`,
      });
      return;
    }

    if (!configCache.enabled) {
      await interaction.reply({
        ephemeral: true,
        content: "It's not time to trick or treat yet!",
      });
      return;
    }

    if (configCache.startDate && isBeforeDate(configCache.startDate)) {
      await interaction.reply({
        ephemeral: true,
        content: `It's not time to trick or treat yet! You need to wait until ${moment(configCache.startDate, 'YYYY-MM-DD').format('MMMM Do')}`,
      });
      return;
    }

    return;
  }
});

client.login(process.env.TOKEN!);
