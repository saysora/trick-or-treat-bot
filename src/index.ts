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
import {ColorEnums, candyPayouts, randomChance} from './constants';
import Player from './models/Player';
import StoryTeller from './classes/storyteller';
import {CategoryName} from './models/PromptCategory';

const DISC_VARS = ['TOKEN', 'CLIENTID', 'WEBHOOK_URL'];

DISC_VARS.forEach(discVar => {
  if (!(discVar in process.env)) {
    throw new Error(`Missing ${discVar}`);
  }
});

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

client.once(Events.ClientReady, async readyClient => {
  botUser = readyClient.user;
  console.info(`Online as ${botUser.tag}`);
  await db.authenticate();
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.bot) return;

  const eventEmbed = new EmbedBuilder().setColor(ColorEnums.base);

  if (interaction.commandName === 'go-out') {
    await interaction.deferReply();

    const isCurrentPlayer = Player.findByPk(interaction.user.id);

    if (!isCurrentPlayer) {
      try {
        await Player.create({
          id: interaction.user.id,
          serverId: interaction.guildId,
        });

        eventEmbed.setTitle('You leave to trick or treat');
        eventEmbed.setColor(ColorEnums.loss);
        eventEmbed.setDescription(
          // eslint-disable-next-line
          `🏠🌲🏠🌲🏠🌲 \n🏃‍♀️  🏃 🏃‍\n🌲🏠🌲🏠🌲🏠\n\nDo be careful out there...`
        );
        eventEmbed.setFooter({
          text: 'Use the /tot command to collect candy',
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
        'No need to go out again,\ninstead use the trick-or-treat (or tot) command to gather candy'
      );
      await interaction.editReply({
        embeds: [eventEmbed],
      });
    }
    return;
  }

  if (['trick-or-treat', 'tot'].includes(interaction.commandName)) {
    //TODO: Insert check for date and if past game date, short circuit return
    await interaction.deferReply();

    const currentPlayer = await Player.findByPk(interaction.user.id);

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

    //TODO: Insert check for cooldown window

    const chance = randomChance(1, 1000);
    let candyPayout = 0;
    switch (true) {
      // CRITWIN 4 - 8
      case chance.number >= 600: {
        candyPayout = randomChance(candyPayouts.min, candyPayouts.max).number;
        const winStory = await StoryTeller.randPromptByCat(
          CategoryName.critWin
        );

        eventEmbed.setDescription(
          winStory.content.replace(/<AMOUNT>/, `**${candyPayout} CANDIES**`)
        );

        // TODO: Add in update logs

        break;
      }
      // NORM WIN 1 - 3
      case chance.number >= 200 && chance.number < 600: {
        candyPayout = randomChance(0, 3).number;

        // FalseWin if candy === 0
        if (candyPayout === 0) {
          const falseWinStory = await StoryTeller.randPromptByCat(
            CategoryName.falseWin
          );
          eventEmbed.setDescription(falseWinStory.content);
          break;
        }

        // Singular win if candy === 1
        if (candyPayout === 1) {
          const singleWinStory = await StoryTeller.randPromptByCat(
            CategoryName.singularWin
          );
          eventEmbed.setDescription(
            singleWinStory.content.replace(
              /<AMOUNT>/,
              `**${candyPayout} CANDY**`
            )
          );

          break;
        }

        //Otherwise full win
        const winStory = await StoryTeller.randPromptByCat(CategoryName.win);
        eventEmbed.setDescription(
          winStory.content.replace(/<AMOUNT>/, `**${candyPayout} CANDIES**`)
        );

        break;
      }
      case chance.number >= 11 && chance.number < 200: {
        candyPayout = randomChance(1, 8).number;
        const lossStory = await StoryTeller.randPromptByCat(CategoryName.loss);
        eventEmbed.setDescription(
          lossStory.content.replace(/<AMOUNT>/, `**${candyPayout} CANDIES**`)
        );
        candyPayout *= -1;
        break;
      }

      // Lose all candy
      case chance.number > 1 && chance.number < 11: {
        const totalLossStory = await StoryTeller.randPromptByCat(
          CategoryName.totalLoss
        );
        eventEmbed.setDescription(totalLossStory.content);
        break;
      }

      // Shi ne
      case chance.number <= 1: {
        const gameoverStory = await StoryTeller.randPromptByCat(
          CategoryName.gameover
        );
        eventEmbed.setDescription(gameoverStory.content);
        break;
      }

      default: {
        console.log('dunno yet');
      }
    }
    console.log({chance: chance.number, candyPayout});

    await interaction.editReply({
      embeds: [eventEmbed],
    });
  }
});

client.login(process.env.TOKEN!);
