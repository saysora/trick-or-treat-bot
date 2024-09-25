import 'dotenv/config';
import {db} from './classes/database';
import {
  ActivityType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  User,
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

// Setup
let configCache: Config;
const HALLOWEEN_DATE = '2024-10-31';

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
  return moment(player.latestAttempt)
    .add(
      configCache.cooldownTime,
      configCache.cooldownUnit as moment.unitOfTime.DurationConstructor
    )
    .fromNow(true);
};

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

client.once(Events.ClientReady, async readyClient => {
  botUser = readyClient.user;
  console.info(`Online as ${botUser.tag}`);
  await db.authenticate();

  configCache = await ConfigManager.getConfig();
  const halloweenTimer = setInterval(() => {
    const timeUntilHalloween = moment(HALLOWEEN_DATE).fromNow(true);
    const minutesUntilHalloween = moment(HALLOWEEN_DATE).diff(
      moment(),
      'minutes'
    );
    if (minutesUntilHalloween < 0) {
      clearInterval(halloweenTimer);
      readyClient.user.setActivity('');
      return;
    }

    readyClient.user.setActivity(`${timeUntilHalloween} until Halloween`, {
      type: ActivityType.Custom,
    });
  }, 60 * 1000);
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

    configCache = await ConfigManager.updateConfig({
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

    const isCurrentPlayer = await PlayerManager.getPlayer(interaction.user.id);

    if (!isCurrentPlayer) {
      try {
        await PlayerManager.createPlayer({
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

    const currentPlayer = await PlayerManager.getPlayer(interaction.user.id);

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
      eventEmbed.setTitle('YOU ARE ██DEAD');
      eventEmbed.setDescription(
        'You cannot trick or treat anymore... But maybe there is something else you can do.'
      );
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
        updatedPlayer = await PlayerManager.killPlayer(currentPlayer);
        eventEmbed.setFooter({
          text: 'You are DEAD',
        });
        break;
      }
      case game.story.category === CategoryName.totalLoss: {
        updatedPlayer = await PlayerManager.playerLoseAllCandy(currentPlayer);
        eventEmbed.setFooter({
          text: 'You now have 0 🍬',
        });
        break;
      }
      default: {
        if (!game.gain) {
          updatedPlayer = await PlayerManager.takePlayerCandy(
            currentPlayer,
            game.amount
          );
        } else {
          updatedPlayer = await PlayerManager.givePlayerCandy(
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

    const currentPlayer = await PlayerManager.getPlayer(interaction.user.id);

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

    let status = `You are feeling **${randomStatus}**...`;

    let statFields = [
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
    ];

    if (currentPlayer.isDead) {
      eventEmbed.setColor(ColorEnums.dead);
      status = '**YOU ARE ██DEAD**\n\nYou are feeling **HUNGRY**...';

      canTotString = canTot(currentPlayer)
        ? 'You can ███ again...'
        : `Time until you can ███ again: ${timeToTot(currentPlayer)}`;

      statFields = [
        {
          name: 'Candy ██ten',
          value: `**${currentPlayer.destroyedCandy}**`,
        },
        ...statFields.slice(1),
      ];
    }

    eventEmbed.setThumbnail(interaction.user.displayAvatarURL());
    eventEmbed.setDescription(`
      ## Backpack\n${status}\n\n
    `);

    eventEmbed.setFooter({
      text: `${canTotString}`,
    });

    eventEmbed.setFields(statFields);

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (interaction.commandName === 'leaderboard') {
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

    await interaction.deferReply();

    const wantedPage = Number(interaction.options.get('page')?.value ?? 0);

    const {players, page, totalPages} =
      await PlayerManager.playerLB(wantedPage);

    if (wantedPage > totalPages) {
      eventEmbed.setTitle('No page found');
      eventEmbed.setDescription(
        `There are only ${totalPages} leaderboard pages`
      );
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
      lbString += `**${page === 1 ? i + 1 : (page - 1) * 10 + (i + 1)}**. <@${player.id}>\n`;
    });

    eventEmbed.setDescription(lbString);
    eventEmbed.setFooter({
      text: `Page ${page}/${totalPages}`,
    });

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  if (interaction.commandName === 'eat') {
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

    const currentPlayer = await PlayerManager.getPlayer(interaction.user.id);

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

    eventEmbed.setColor(ColorEnums.undead);

    if (!currentPlayer.isDead) {
      eventEmbed.setTitle('Huh?');
      eventEmbed.setDescription(`W█at d█ you █e█n?`);
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    if (configCache.cooldownEnabled) {
      if (!canTot(currentPlayer)) {
        eventEmbed.setTitle('No█ y█t...');
        eventEmbed.setDescription(
          `You must wait **${timeToTot(currentPlayer)}** before you can █at again.`
        );
        eventEmbed.setFooter({
          text: `You have ██ten ${currentPlayer.destroyedCandy} 🍬 • you can also check your backpack to see when you can ea█ again`,
        });
        await interaction.editReply({
          embeds: [eventEmbed],
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

    const targetPlayer = await PlayerManager.getPlayer(target);

    if (!targetPlayer) {
      await interaction.editReply({
        content: 'That player is not trick or treating!',
      });
      return;
    }

    const potentialVictim = await PlayerManager.getRandomLivingPlayer([
      interaction.user.id,
      target,
    ]);

    if (!potentialVictim) {
      eventEmbed.setDescription("Coul█ not █at.\n\nThat did█'t ██em to █ork");
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }

    const {
      success,
      intendedTarget,
      eatenCandyCount,
      player: updatedPlayer,
      actualTarget,
    } = await PlayerManager.eatOtherPlayerCandy(
      currentPlayer,
      targetPlayer,
      potentialVictim
    );

    eventEmbed.setTitle('You ███');

    if (!success) {
      eventEmbed.setDescription('No█hing ███pened\n\nYou are still ███gry...');
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      eventEmbed.setFooter({
        text: `You have ███en ${updatedPlayer.destroyedCandy} 🍬`,
      });
      return;
    }

    let attackString = '';
    let candyString = eatenCandyCount === 1 ? 'CANDY' : 'CANDIES';

    if (!intendedTarget) {
      attackString += `You at██ck██ <@${target}>!\n\n`;
      if (eatenCandyCount > 0) {
        attackString += `...\n\n**BUT** ███acked <@${actualTarget.id}> instead and ███ **${eatenCandyCount} ${candyString}**!!\n\nHow Could you?`;
      } else {
        attackString += `...\n\n**BUT** tried to ███ <@${actualTarget.id}>'s candy instead!!!\n\nYou didn't manage to ███ any though.`;
      }
    } else {
      attackString += `You at██ck██ <@${target}>!\n\n`;
      if (eatenCandyCount > 0) {
        attackString += `...\n\n**AND** ███ **${eatenCandyCount}** of their CANDY!`;
      } else {
        attackString += `...\n\n**AND** Didn't ███ any ██ndy.`;
      }
    }

    eventEmbed.setDescription(attackString);

    if (eatenCandyCount > 0) {
      eventEmbed.setFooter({
        text: `You have now ███en ${updatedPlayer.destroyedCandy} 🍬`,
      });
    } else {
      eventEmbed.setFooter({
        text: `You have ███en ${updatedPlayer.destroyedCandy} 🍬`,
      });
    }

    await interaction.editReply({
      embeds: [eventEmbed],
    });

    return;
  }

  // Admin commands
  if (interaction.commandName === 'story-create') {
    const category = interaction.options.get('category')?.value;
    const content = interaction.options.get('content')?.value;
    if (!category || !content) {
      await interaction.reply({
        ephemeral: true,
        content: 'Category or content missing for the story',
      });
      return;
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const newStory = await StoryTeller.addStory(
      category as CategoryName,
      content as string
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
        `Category: ${category}\nStory: ${newStory.content}`
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
        ephemeral: true,
        content: 'You must provide the id',
      });
    }

    await interaction.deferReply({
      ephemeral: true,
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
        `Category: ${storyDeleted.category.name}\nStory: ${storyDeleted.content}`
      );
      await interaction.editReply({
        embeds: [eventEmbed],
      });
      return;
    }
  }
});

client.login(process.env.TOKEN!);
