import { Client } from 'gilapi';
import { Database } from "./classes/Database";

import { TrickorTreat } from "./classes/TrickorTreat";
import { Storyteller } from "./classes/StoryTeller";

import moment from "moment";
import constants from "./constants";

const { client, gilapi: gapi } = new Client(process.env.TOKEN);

const botowner = process.env.BOT_OWNER_ID;

const gameserver = process.env.GAMESERVER ?? null;
const gamechannel = process.env.GAMECHANNEL ?? null;
const commandlist = [
  {
    action: "!help",
    description: "View all commands.",
  },
  {
    action: "!go-out",
    description: "Use First. Starts trick or treating.",
  },
  { action: "!bag", description: "View how much candy you've collected." },
  { action: "!trick-or-treat OR !tot", description: "Collect candy." },
  { action: "!lb", description: "View the leaderboard" },
  { action: "!scorecard", description: "Find out your final stats" },
  {
    action: "!promptcats",
    description: "List the prompt categories and count",
  },
  {
    action: `!randomprompt <category>`,
    description: "Provide a category and get a random prompt",
  },
];

/**
 * Returns a number between two other numbers
 * @param {number} min
 * @param {number} max
 * @returns {number} random number
 */
function randomNumBet(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Helper function to paginate our leader board.
 * @param {Array} array
 * @param {number} pagesize
 * @param {number} pagenum
 * @returns {Array} Slice of array
 */
const paginate = (array, pagesize, pagenum) => {
  return array.slice((pagenum - 1) * pagesize, pagenum * pagesize);
};

const cooldowntime = {
  int: process.env.COOLDOWN_TIME ?? 1,
  unit: process.env.COOLDOWN_UNIT ?? "h",
};

const db = new Database();

/* The normal stuff */

client.on("open", async () => {
  console.log("connected to Guilded!");
  db.connect();
});

client.on("close", async () => {
  client.reconnect();
  db.disconnect();
});

// All our commands

client.on("ChatMessageCreated", async (data) => {
  const { message, serverId } = data;

  if (message.createdBy == process.env.BOTUSERID) return;

  // Story add / edit commands

  if (
    message.createdBy == botowner &&
    message.content.startsWith("!sayembed")
  ) {
    const args = message.content.split("|").map((piece) => piece.trim());
    await gapi.delMsg(message.channelId, message.id);
    args.shift();

    if (args.length != 2) {
      return;
    }

    const { member } = await gapi.getMember(serverId, process.env.BOTUSERID);

    const { avatar } = member.user;

    const embed = {
      // title: "Surely this can't be ALL the candy, kupo!",
      color: constants.base,
      author: {
        name: member.user.name,
      },
      thumbnail: {
        url: avatar ?? "https://i.imgur.com/GbA4vQk.png",
      },
      description: `\n${args[1]}\n\n`,
    };

    return await gapi.sendMsg(args[0], {
      embeds: [embed],
    });
  }

  if (message.createdBy == botowner && message.content.startsWith("!say")) {
    const args = message.content.split("|").map((piece) => piece.trim());
    await gapi.delMsg(message.channelId, message.id);
    args.shift();

    if (args.length != 2) {
      return;
    }

    return await gapi.sendMsg(args[0], {
      content: `${args[1]}`,
    });
  }

  if (message.content == "!lore" && message.createdBy == botowner) {
    const { member: bot } = await gapi.getMember(serverId, process.env.BOTUSERID);

    const { avatar } = bot.user;

    await gapi.delMsg(message.channelId, message.id);
    const embed = {
      title: "Surely this can't be ALL the candy, kupo!",
      color: constants.base,
      author: {
        name: bot.user.name,
      },
      thumbnail: {
        url: avatar ?? "https://i.imgur.com/GbA4vQk.png",
      },
      description: `
      Halt! Who goes there, kupo?

      Oh, I didn't see you there, kupo.

      What do you mean I look suspicious, kupo!?

      I'm not suspicious in the slightest, kupo!

      My name is Mogrid, and I am a moogle, kupo!

      You see, I followed my nose and found these delightful sweets, kupo.

      I simply must find more of these and take them back to my friends, kupo!

      Hmm... But I don't know where else to look, kupo!

      I know, kupo! You shall help me collect all the sweets, kupo!

      I'll reward you handsomly, I assure you, kupo!

      However, you must collect it all before **midnight** on ${moment(
        process.env.ENDTIME
      )
          .subtract(1, "d")
          .format("MMMM DD")}, kupo!
      `,
    };

    const embed2 = {
      title: "How to collect candy, kupo!",
      color: constants.base,
      author: {
        name: bot.user.name,
      },
      thumbnail: {
        url: avatar ?? "https://i.imgur.com/GbA4vQk.png",
      },
      description: `
      I think you call it... trick or treating, kupo?

      1. You can only **!trick-or-treat** command once every ${process.env.COOLDOWN_ENABLED
          ? `**${cooldowntime.int}${cooldowntime.unit}**`
          : ""
        } since you last used it, kupo.
      
      2. If you're ever confused, type **!help** kupo!
      
      3. That is all there is to it, kupo!
        `,
      footer: {
        text: `Type !go-out to begin...`,
      },
    };

    await gapi.sendMsg(message.channelId, {
      embeds: [embed, embed2],
    });
  }

  if (message.content == "!categories" && message.createdBy == botowner) {
    const cats = await Storyteller.getCategories();

    if (!cats) {
      return;
    }

    const embed = {
      color: constants.base,
      title: "Story Categories",
      description: "",
    };

    cats.forEach((cat) => {
      embed.description += `${cat}\n`;
    });

    return await gapi.sendMsg(message.channelId, { embeds: [embed] });
  }

  // Add story
  if (
    message.content.startsWith("!addstory") &&
    message.createdBy == botowner
  ) {
    const args = message.content.split("|").map((piece) => piece.trim());
    args.shift();
    if (args.length != 2) {
      return;
    }
    const category = args[0].toLowerCase();
    const story = args[1];

    if (!category || !story) {
      return;
    }

    const embed = {
      color: constants.base,
      title: "Story added!",
    };

    const newstory = await Storyteller.addStory(category, story);

    if (!newstory) {
      await gapi.sendMsg(message.channelId, `Something went wrong adding that story.`, {
        replyMessageIds: [message.id],
        isPrivate: true,
      });
      return;
    }

    embed.description = newstory.content;
    embed.fields = [
      {
        name: "Category",
        value: newstory.category,
      },
    ];

    embed.footer = {
      text: "Story ID: " + newstory.id,
    };

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
      isPrivate: true,
      replyMessageIds: [message.id],
    });
  }

  // Edit story
  if (
    message.content.startsWith("!editstory") &&
    message.createdBy == botowner
  ) {

    const args = message.content.split("|").map((piece) => piece.trim());

    args.shift();

    if (args.length != 2) {
      return;
    }

    const id = args[0].toLowerCase();
    const story = args[1];

    if (!id || !story) {
      return;
    }

    try {
      const editedstory = await Storyteller.editStoryContent(id, story);

      const embed = {
        color: 0xcc5500,
        title: "Story edited!",
        description: editedstory.content,
        fields: [{ name: "Category", value: editedstory.category }],
        footer: {
          text: "Story ID: " + editedstory.id,
        },
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        isPrivate: true,
        replyMessageIds: [message.id],
      });
    } catch (e) {
      console.error(e)
      return await gapi.sendMsg(message.channelId, {
        content: `Something went wrong adding that story.`,
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }
  }

  // Edit category
  if (message.content.startsWith("!editcat") && message.createdBy == botowner) {
    const args = message.content.split("|").map((piece) => piece.trim());
    args.shift();

    if (args.length != 2) {
      return;
    }

    const id = args[0];
    const category = args[1].toLowerCase();

    if (!id || !category) {
      return;
    }

    try {
      const editedcat = await Storyteller.editStoryCategory(id, category);

      const embed = {
        color: 0xcc5500,
        title: "Story category edited!",
        description: editedcat.content,
        fields: [{ name: "Category", value: editedcat.category }],
        footer: {
          text: "Story ID: " + editedcat.id,
        },
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        isPrivate: true,
        replyMessageIds: [message.id],
      });
    } catch (e) {
      console.error(e);
      return await gapi.sendMsg(message.channelId, {
        content: `Something went wrong adding that story.`,
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }

  }

  // Delete story
  if (
    message.content.startsWith("!delstory") &&
    message.createdBy == botowner
  ) {
    const args = message.content.split("|").map((piece) => piece.trim());

    args.shift();

    if (args.length != 2) {
      return;
    }

    const id = args[0];

    if (!id) {
      return;
    }

    try {
      const story = await Storyteller.getStory(id);

      const embed = {
        color: constants.base,
        title: "Story Deleted",
        description: story.content,
        fields: [
          {
            name: "Category",
            value: `${story.category}`,
          },
          {
            name: "ID",
            value: `${story.id}`,
          },
        ],
      };

      await Storyteller.deleteStory(id);

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        isPrivate: true,
        replyMessageIds: [message.id],
      });
    } catch (e) {
      console.error(e);
      return await gapi.sendMsg(message.channelId, {
        content: `Something went wrong deleting that story.`,
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }

  }

  // Tell story
  if (
    message.content.startsWith("!tellstory") &&
    message.createdBy == botowner
  ) {
    const args = message.content.split("|").map((piece) => piece.trim());

    args.shift();

    if (args.length != 2) {
      return;
    }

    const id = args[0];

    if (!id) {
      return;
    }
    try {
      const story = await Storyteller.getStory(id);

      const embed = {
        color: constants.base,
        title: "Story",
        description: story.content,
        fields: [
          {
            name: "Category",
            value: `${story.category}`,
          },
          {
            name: "ID",
            value: `${story.id}`,
          },
        ],
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        isPrivate: true,
        replyMessageIds: [message.id],
      });
    } catch (e) {
      console.error(e);
      return await gapi.sendMsg(message.channelId, {
        content: `Something went wrong adding that story.`,
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }
  }

  // Code to force game to be in Moogle Cafe

  if (
    gameserver &&
    serverId !== gameserver &&
    commandlist.some((cmd) => message.content.startsWith(cmd.action))
  ) {
    return await gapi.sendMsg(message.channelId, {
      content: `The only place to play is in the Moogle Cafe! Consider joining today!\n https://www.guilded.gg/mooglecafe`,
    });
  }

  if (
    gamechannel &&
    gamechannel !== message.channelId &&
    commandlist.some((cmd) => message.content.startsWith(cmd.action))
  ) {
    return;
  }

  /* If there is a game channel, force all game commands to be in there */

  // ACTUAL game commands

  if (message.content == "!help") {
    const embed = {
      title: "Command List",
      color: constants.base,
      description: `${commandlist
        .map((cmd) => `**${cmd.action}** - ${cmd.description}`)
        .join("\n\n")}`,
    };

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
      isPrivate: true,
      replyMessageIds: [message.id],
    });
  }

  if (message.content == "!go-out") {
    const player = await TrickorTreat.addPlayer(message.createdBy, serverId);

    const embed = {
      title: "You leave to trick or treat",
      color: constants.base,
      description: `\n🏃‍♀️🏃🏃‍♂️🌲\n\nDo be careful out there...`,
      footer: {
        text: `Type !trick-or-treat to collect candy`,
      },
    };

    // Make sure the game turns off at the proper time (November 1st 2021)
    if (moment().isSameOrAfter(moment(process.env.ENDTIME))) {
      embed.title = "Halloween is over.";
      embed.description =
        "You can no longer Trick or Treat.\nBut I'll see you next year...";
      embed.footer = {
        text: null,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
      });
    }

    if (!player) {
      return await gapi.sendMsg(message.channelId, {
        content: "You already went out.",
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
      isPrivate: true,
      replyMessageIds: [message.id],
    });
  }

  // Bag
  if (message.content == "!bag") {
    const player = await TrickorTreat.getPlayer(message.createdBy);

    // If we cannot find that player we invite them to play.
    if (!player) {
      return await gapi.sendMsg(message.channelId, {
        content: `You need to go out first`,
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }

    const embed = {
      title: `Your bag`,
      color: 0xcc5500,
      description: `What delightful sweets might there be inside this bag?\n\n**STATUS: ${player.lost == false && player.attempts < 50
        ? "YOU ARE ALIVE"
        : player.lost == false && player.attempts > 50
          ? "YOU ARE STILL ALIVE"
          : ":skull:"
        }**\n\n:candy: **${player.treats}**`,
    };

    if (
      moment()
        .utc()
        .isSameOrBefore(
          moment(player.latestAttempt).add(
            parseInt(cooldowntime.int),
            cooldowntime.unit
          )
        ) &&
      player.attempts > 0
    ) {
      embed.footer = {
        text:
          "Time until next trick or treat: " +
          moment(player.latestAttempt)
            .add(cooldowntime.int, cooldowntime.unit)
            .from(moment(), true),
      };
    } else {
      embed.footer = {
        text: "You can trick or treat",
      };
    }

    // If the player has lost we then show them nothing but their loss
    if (player.lost == true) {
      embed.description = "\n\n:skull:\n\n";
      // And when they died.
      embed.footer = {
        text: `Died at ${new Date(player.latestAttempt).toLocaleString()}`,
      };
    }

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
      isPrivate: true,
      replyMessageIds: [message.id],
    });
  }

  if (message.content == "!promptcats") {
    const embed = {
      title: `Prompt categories`,
      description: "Here are the different available categories.",
      color: constants.base,
      fields: [],
    };
    const categories = await Storyteller.getCategories();

    const catAndNum = await Promise.all(
      categories.map(async (cat) => {
        const num = await Storyteller.countStories(cat);
        return {
          name: cat,
          num,
        };
      })
    );

    for (const cat of catAndNum) {
      embed.fields.push({
        name: `${cat.name}`,
        value: `${cat.num}`,
        inline: true,
      });
    }

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
    });
  }
  if (message.content.startsWith("!randomprompt ")) {
    const embed = {
      title: `Halloween Prompt`,
    };

    const args = message.content.split(`!randomprompt `);
    args.shift();

    const theStory = await Storyteller.randomStoryByCat(
      args[0].toLowerCase().trim()
    );

    if (!theStory) {
      embed.title = "Category does not exist";
      embed.color = constants.loss;
      embed.description = "Please try again using the proper category";
      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
      });
    }

    embed.title = `Halloween Prompt - ${args[0].toLowerCase().trim()}`;
    embed.description = theStory.content;
    embed.footer = {
      text: `Story ID - ${theStory.id}`,
    };

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
    });
  }

  if (message.content == "!scorecard") {
    if (moment().isSameOrBefore(moment(process.env.ENDTIME))) return;

    const { member } = await gapi.getMember(message.serverId, message.createdBy);

    const embed = {
      title: `<@${message.createdBy}>'s Score Card`,
      thumbnail: {
        url: member.user.avatar ?? null,
      },
      color: constants.base,
      description: "Thanks for playing!\n\nHere are your final results:",
    };

    const player = await TrickorTreat.getPlayer(message.createdBy);

    if (!player) {
      return;
    }

    embed.fields = [
      {
        name: "Final Count",
        value: `${player.treats}`,
        inline: true,
      },
      {
        name: "Total Collected",
        value: `${player.treats + player.candylost}`,
        inline: true,
      },
      {
        name: "Total Lost",
        value: `${player.candylost}`,
        inline: true,
      },
      {
        name: "Total Attempts",
        value: `${player.attempts}`,
        inline: true,
      },
      {
        name: "Wins",
        value: `${player.attempts - player.fails}`,
        inline: true,
      },
      {
        name: "Losses",
        value: `${player.fails}`,
        inline: true,
      },
      {
        name: "Survived?",
        value: `${player.lost ? "No" : "Yes"}`,
        inline: true,
      },
    ];

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
    });
  }

  if (message.content == "!trick-or-treat" || message.content == "!tot") {
    const embed = {
      title: "Trick or Treat",
      color: constants.base,
    };

    // Make sure the game turns off at the proper time (November 1st 2021)
    if (moment().isSameOrAfter(moment(process.env.ENDTIME))) {
      embed.title = "Halloween is over.";
      embed.description =
        "You can no longer Trick or Treat.\nBut I'll see you next year...";
      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
      });
    }

    const chance = Math.floor(Math.random() * 1000);

    // Check for the player to ensure we have data on them
    const you = await TrickorTreat.getPlayer(message.createdBy);

    if (!you) {
      return await gapi.sendMsg(message.channelId, {
        content: `You need to go out first (use the !go-out command)`,
      });
    }

    if (you.lost == true) {
      embed.title = "YOU ARE DEAD";
      embed.description = `You cannot trick or treat anymore.`;
      embed.footer = {
        text: `Died at ${new Date(you.latestAttempt).toLocaleString()}`,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        replyMessageIds: [message.id],
        isPrivate: true,
      });
    }

    // Timegate

    if (process.env.COOLDOWN_ENABLED == "true") {
      if (
        moment()
          .utc()
          .isSameOrAfter(
            moment(you.latestAttempt).add(
              parseInt(cooldowntime.int),
              cooldowntime.unit
            )
          ) &&
        you.attempts > 0
      ) {
        // We don't want to return here we want them to play.
      } else if (you.attempts == 0) {
        // Also don't fire here.
      } else {
        (embed.description = `Oh aren't we eager, <@${message.createdBy
          }>? \nToo bad.\nYou must wait **${moment(you.latestAttempt)
            .add(cooldowntime.int, cooldowntime.unit)
            .from(moment(), true)}** before you can trick or treat again...`),
          (embed.footer = {
            text: `You have ${you.treats} 🍬 • you can also check your bag to see when you can trick or treat again`,
          });

        await gapi.delMsg(message.channelId, message.id);

        return await gapi.sendMsg(message.channelId, {
          embeds: [embed],
          isPrivate: true,
        });
      }
    }

    // CRITICAL WIN 4-8
    if (chance > 600) {
      // Give the user the candy of a random number between 4 and 8
      const candynum = await TrickorTreat.give(randomNumBet(4, 8), you.id);

      //Create a string to simplify listing it later
      const candystring = candynum + " candies";

      // Randomly select which story to use and convert it's <AMOUNT> string to our candystring

      // Fetch these from our DB now
      let randomwin = await Storyteller.randomStoryByCat("critwins");

      // Generic fallback if fails
      if (!randomwin) {
        randomwin = `Wow you got ${candystring.toUpperCase()}!`;
      } else {
        // Update our strings to remove the amount
        randomwin = randomwin.content.replace(
          "<AMOUNT>",
          `${candystring.toUpperCase()}`
        );
      }

      embed.color = constants.win;
      embed.description = `${randomwin}`;
      embed.footer = {
        text: `You now have ${you.treats + candynum < 0 ? 0 : you.treats + candynum
          } 🍬`,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        replyMessageIds: [message.id],
      });
    }

    // NORMAL WIN - 0-3
    if (chance >= 200 && chance < 600) {
      // Give the user the candy of a random number between 0 and 3
      const candynum = await TrickorTreat.give(randomNumBet(0, 3), you.id);

      //Create a string to simplify listing it later (and allow for variation in number terms)
      const candystring =
        candynum > 1 ? candynum + " candies" : candynum + " candy";

      // Since this can be 1 of 3 different category of responses, we want to choose one based on our candynum
      let randomwin;

      // If the number of candy is 0 we send a false positive
      if (candynum == 0) {
        // Select a random false positive story
        randomwin = await Storyteller.randomStoryByCat("falsewins");

        randomwin = randomwin.content;

        if (!randomwin) {
          randomwin = "Oh... You didn't get any candy...";
        }

        // Update the embed
        embed.description = `${randomwin}`;
        embed.color = constants.normWin;
        embed.footer = {
          text: `You now have ${you.treats} 🍬`,
        };

        return await gapi.sendMsg(message.channelId, {
          embeds: [embed],
          replyMessageIds: [message.id],
        });
      }

      // If the number of candy is greater than 0
      if (candynum >= 1) {
        // Update the embed with a new color and set our random win to one of the win stories
        embed.color = constants.barelyWin;
        randomwin = await Storyteller.randomStoryByCat("wins");

        if (!randomwin) {
          randomwin = "Wow! You got <AMOUNT>!";
        }

        // Update our strings to remove the amount
        randomwin = randomwin.content.replace(
          "<AMOUNT>",
          `${candystring.toUpperCase()}`
        );
      } else {
        embed.color = constants.notReallyWin;
        // Otherwise change the embed with the single win color and update randomwin to be one of those stories
        randomwin = await Storyteller.randomStoryByCat("singularwin");

        if (!randomwin) {
          randomwin = "You just got <AMOUNT>.";
        }

        // Update our strings to remove the amount
        randomwin = randomwin.content.replace(
          "<AMOUNT>",
          `${candystring.toUpperCase()}`
        );
      }

      // We update our embed now with whichever string was matched

      embed.description = `${randomwin}`;
      embed.footer = {
        text: `You now have ${you.treats + candynum < 0 ? 0 : you.treats + candynum
          } 🍬`,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        replyMessageIds: [message.id],
      });
    }

    // Normal losses 1-8
    if (chance < 200 && chance > 11) {
      // We use the take command to ensure we are properly removing a random number between 1 and 8 from users and getting them.
      const candynum = await TrickorTreat.take(randomNumBet(1, 8), you.id);

      // We set our candy string for the variation of plurality.
      const candystring =
        candynum > 1 ? candynum + " candies" : candynum + " candy";

      // Randomly select which loss story to use for the embed
      // const randomLoss = losses[
      //   Math.floor(Math.random() * losses.length)
      // ].replace("<AMOUNT>", `**${candystring}**`);

      let randomloss = await Storyteller.randomStoryByCat("loss");

      if (!randomloss) {
        randomloss = "You just lost <AMOUNT>!";
      }

      // Update our strings to remove the amount
      randomloss = randomloss.content.replace(
        "<AMOUNT>",
        `${candystring.toUpperCase()}`
      );

      // Update the embed
      embed.color = constants.loss;
      embed.description = `${randomloss}`;
      embed.footer = {
        text: `You now have ${you.treats - candynum < 0 ? 0 : you.treats - candynum
          } 🍬`,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        replyMessageIds: [message.id],
      });
    }

    // LOSE ALL CANDY
    if (chance > 1 && chance < 11) {
      // We use the setCandy method to just drop the users candy to 0
      const candynum = await TrickorTreat.setCandy(0, you.id, true);

      // Grab a random lose all story from totalfail

      let randomloss = await Storyteller.randomStoryByCat("totalfail");

      randomloss = randomloss.content;

      if (!randomloss) {
        randomloss = "You lost ALL YOUR CANDY!";
      }

      // Update embed
      embed.color = constants.totalLoss;
      embed.description = `${randomloss}`;
      embed.footer = {
        text: `You now have 0 🍬`,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        replyMessageIds: [message.id],
      });
    }

    // YOU LOST
    if (chance == 1 || chance == 0) {
      // This ends the game for the players
      const youlose = await TrickorTreat.playerLOSS(cmd.member.user.id);

      // We grab a random endgame story
      // const story =
      //   YOULOSTTHEGAME[Math.floor(Math.random() * YOULOSTTHEGAME.length)];

      let story = await Storyteller.randomStoryByCat("gameover");

      story = story.content;

      if (!story) {
        story =
          "You feel death's cold embrace settle in as everything gets dark...";
      }

      // Update our strings to remove the amount
      // randomwin = randomwin.content.replace('<AMOUNT>', `**${candystring}**`);

      // Update the embed
      embed.color = constants.dead;
      embed.description = `${story}`;
      embed.footer = {
        text: `You are DEAD.`,
      };

      return await gapi.sendMsg(message.channelId, {
        embeds: [embed],
        replyMessageIds: [message.id],
      });
    }
  }

  if (message.content.startsWith("!lb")) {
    const sugardaddies = await TrickorTreat.getPlayers({ lost: false }, [
      ["treats", "desc"],
    ]);

    let args = message.content.split(" ");

    args.shift();

    if (args.length > 0 && isNaN(parseInt(args[0]))) {
      return await gapi.sendMsg(message.channelId, {
        content: "The page must be a number",
        isPrivate: true,
        replyMessageIds: [message.id],
      });
    }

    // We get the page of our leaderboard based on a possible interaction subcommand, but if that is not there we only show the 1st page.
    let page = args.length !== 0 ? parseInt(args[0]) : 1;

    // Using the paginate function at the top we then paginate our board based on 10s.
    // This slices our results into sets of 10 and returns the set based on the page variable
    let boardpage = paginate(sugardaddies, 10, page);

    // We calculate our page number based on if the number of players are greater than 10
    // If it is, we divide our player numbers by 10
    let pages =
      sugardaddies.length > 10 ? Math.ceil(sugardaddies.length / 10) : 1;

    // If the user tries to enter a higher page than what we actually have (or smaller) we force page to be 1
    if (page > pages || page < 1) {
      page = 1;
      boardpage = paginate(sugardaddies, 10, page);
    }

    // If there is a remainder in splitting our array we defer to the higher number of pages
    if (sugardaddies.length % 10) {
      pages = Math.ceil(pages);
    }

    // We want to tell the player what number they are, so we get them from our overall list not just the splice

    const index = sugardaddies.findIndex(
      (daddy) => daddy.id == message.createdBy
    );

    let askerindex = index >= 0 ? "#" + (index + 1) + "." : "💀";

    if (index == -1) {
      askerindex = "not yet trick or treating.";
    }

    // We create our embed
    const embed = {
      title: ":jack_o_lantern: Leaderboard :jack_o_lantern:",
      color: constants.base,
      // author: {
      //   name: client.user.username,
      //   icon_url: client.user.avatarURL(),
      // },
      description: "Find out who the candy connoisseurs are.\n\n",
      footer: {
        text: `${page}/${pages} • You are ${askerindex}`,
      },
    };

    // We update the embed description field based on the players on that page and assign their number to the left
    boardpage.forEach((daddy, index) => {
      var betterindex = page > 1 ? index + 10 * (page - 1) + 1 : index + 1;
      embed.description += `**${betterindex}.** <@${daddy.id}> - ${daddy.lost == false ? daddy.treats + " :candy:" : ":skull:"
        }\n`;
    });

    return await gapi.sendMsg(message.channelId, {
      embeds: [embed],
      isSilent: true,
    });
  }
});
