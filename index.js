require("dotenv").config();

const { REST, DiscordAPIError } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {
  Client,
  Intents,
  Message,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const TrickorTreat = require("./classes/TrickorTreat");
const Storyteller = require("./classes/StoryTeller");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const Database = require("./classes/Database");
const moment = require("moment");
const { off } = require("./db/Player");

// Helper function for candy nums
function randomNumBet(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
// Helper function to paginate our leader board.
const paginate = (array, pagesize, pagenum) => {
  return array.slice((pagenum - 1) * pagesize, pagenum * pagesize);
};

const cooldowntime = {
  int: process.env.TIMECOOLDOWNINT ? process.env.TIMECOOLDOWNINT : 1,
  unit: process.env.TIMECOOLDOWNUNIT ? process.env.TIMECOOLDOWNUNIT : "h",
};

/* Setup Slash Commands */

const commands = [
  {
    name: "go-out",
    description: "Join in on trick or treat.",
  },
  {
    name: "trick-or-treat",
    description: "Who knows what you'll get?",
  },
  {
    name: "bag",
    description: "Check how much candy you have.",
    // defaultPermission: false,
  },
  {
    name: "sugar-daddies",
    description: "Find out who has the most candy.",
    options: [
      {
        name: "page",
        type: "INTEGER",
        description: "Page number for the sugar daddy list",
      },
    ],
  },
];

/* The normal stuff */

client.on("ready", async () => {
  console.log("I am alive");
  await Database.connect();

  client.application.commands
    .set(commands, process.env.GUILDID)
    .then(console.log("(/) Commands registered"))
    .catch(console.error);

  await client.user.setPresence({
    activities: [{ name: "with each and every one of you..." }],
  });
});

client.on("messageCreate", async (msg) => {
  if (!["890794962353029130", "84695051535384576"].includes(msg.author.id))
    return;

  if (!["655351648373178388"].includes(msg.guild.id)) return;

  if (msg.content == "!categories") {
    const cats = await Storyteller.getCategories();

    if (!cats) {
      await msg.channel.send("Something went wrong");
      return;
    }

    const embed = {
      color: 0xcc5500,
      title: "Story Categories",
      fields: [],
    };

    cats.forEach((cat, index) => {
      embed.description += `${cat}\n`;
    });

    await msg.channel.send({ embeds: [embed] });
    return;
  }

  if (msg.content == "!responses") {
    const cats = await Storyteller.getCategories();

    if (!cats) {
      await msg.channel.send("Something went wrong");
      return;
    }

    const embed = {
      color: 0xcc5500,
      title: "Story Categories",
      fields: [],
    };

    const total = cats.map(async (cat) => {
      const number = await Storyteller.countStories(cat);

      if (!number) {
        return;
      }

      return `${cat} - ${number}`;
    });

    Promise.all(total)
      .then((values) => {
        embed.description = `${values.map((val) => val + "\n").join(" ")}`;
        let valuenums = values.map((val) => val.trim().split("-")[1]);
        let totalnum = valuenums.reduce(
          (acc, a) => parseInt(acc) + parseInt(a)
        );
        embed.description += `Total: **${totalnum}**`;
        msg.channel.send({ embeds: [embed] });
        return;
      })
      .catch((e) => {
        console.error(e);
        msg.channel.send("There was an error");
        return;
      });
  }

  const msgcmdfilter = (m) => m.author.id === msg.author.id;

  // Add Story

  if (msg.content == "!addstory") {
    await msg.channel.send("What is the category?");
    const category = await msg.channel
      .awaitMessages({
        filter: msgcmdfilter,
        max: 1,
        time: 30000,
        errors: ["time"],
      })
      .catch((e) => console.error(e));

    const embed = {
      color: 0xcc5500,
      title: "Story added!",
    };

    if (!category) {
      await msg.reply("You need to specify a category");
      return;
    }

    const categoryanswer = category.first().content;

    await msg.channel.send("What is the story?");

    const story = await msg.channel
      .awaitMessages({
        filter: msgcmdfilter,
        max: 1,
        time: 60000,
        errors: ["time"],
      })
      .catch((e) => console.error(e));

    if (!story) {
      await msg.reply("you need a story!");
      return;
    }

    const storyanswer = story.first().content;

    const addedStory = await Storyteller.addStory(
      categoryanswer.toLowerCase(),
      storyanswer
    );

    if (!addedStory) {
      // Something went wrong, probably.
      return;
    }

    embed.description = addedStory.content;
    embed.fields = [
      {
        name: "Category",
        value: addedStory.category,
      },
    ];

    embed.footer = {
      text: "Story ID: " + addedStory.id,
    };

    msg.reply({ embeds: [embed] });

    return;
  }

  // Edit Story

  if (msg.content.startsWith("!editstory")) {
    const args = msg.content.split(" ");
    args.shift();

    if (!args[0]) {
      await msg.channel.send("You must supply an ID");
      return;
    }

    const embed = {
      color: 0xcc5500,
      title: "Story edited!",
    };

    await msg.channel
      .send("What is the new story?")
      .catch((e) => console.error(e));

    const storychoice = await msg.channel
      .awaitMessages({
        filter: msgcmdfilter,
        max: 1,
        time: 60000,
        errors: ["time"],
      })
      .catch((e) => console.error(e));

    if (!storychoice) {
      await msg.channel.send("You must provide the new story.");
      return;
    }

    const storyanswer = storychoice.first().content;

    const storyToUpdate = await Storyteller.editStoryContent(
      args[0],
      storyanswer
    );

    if (!storyToUpdate) {
      await msg.channel.send("Something went wrong.");
      console.error(storyToUpdate);
      return;
    }

    embed.description = storyToUpdate.content;
    embed.fields = [{ name: "Category", value: storyToUpdate.category }];
    embed.footer = {
      text: "Story ID: " + storyToUpdate.id,
    };

    msg.channel.send({ embeds: [embed] });
    return;
  }

  // Edit category

  if (msg.content.startsWith("!editcat")) {
    const args = msg.content.split(" ");
    args.shift();

    if (!args[0]) {
      await msg.channel
        .send("You must provide an id")
        .catch((e) => console.error(e));
      return;
    }

    const embed = {
      color: 0xcc5500,
      title: "Story category edited!",
    };

    await msg.channel
      .send("What is the new category?")
      .catch((e) => console.error(e));

    const storycatchoice = await msg.channel
      .awaitMessages({
        filter: msgcmdfilter,
        max: 1,
        time: 60000,
        errors: ["time"],
      })
      .catch((e) => console.error(e));

    if (!storycatchoice) {
      await msg.channel.send("You must provide the new category.");
      return;
    }

    const storycatanswer = storycatchoice.first().content;

    const storyToUpdate = await Storyteller.editStoryCategory(
      args[0],
      storycatanswer
    );

    if (!storyToUpdate) {
      await msg.channel.send("Something went wrong.");
      console.error(storyToUpdate);
      return;
    }

    embed.description = storyToUpdate.content;
    embed.fields = [{ name: "Category", value: storyToUpdate.category }];
    embed.footer = {
      text: "Story ID: " + storyToUpdate.id,
    };

    msg.channel.send({ embeds: [embed] });
    return;
  }

  // Delete Story

  if (msg.content.startsWith("!deletestory")) {
    const args = msg.content.split(" ");
    args.shift();

    if (!args[0]) {
      await msg.channel
        .send("You must provide an ID")
        .catch((e) => console.error(e));
      return;
    }

    const story = await Storyteller.getStory(args[0]);

    if (!story) {
      await msg.channel
        .send("There is no story with that ID")
        .catch((e) => console.error(e));
      return;
    }

    const embed = {
      color: 0xcc5500,
      title: "Delete Story?",
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
      footer: {
        text: "Type 'yes' to delete",
      },
    };

    await msg.channel.send({ embeds: [embed] }).catch((e) => console.error(e));

    const doDelete = await msg.channel
      .awaitMessages({
        filter: msgcmdfilter,
        time: 30000,
        max: 1,
        errors: ["time"],
      })
      .catch((e) => console.error(e));

    if (!doDelete) {
      await msg.channel
        .send("Something went wrong.")
        .catch((e) => console.error(e));
      return;
    }

    const delAnswer = doDelete.first().content;

    if (!delAnswer.toLowerCase() == "yes") {
      await msg.channel
        .send("Deletion canceled")
        .catch((e) => console.error(e));
      return;
    }

    const deletedStory = await Storyteller.deleteStory(args[0]);

    if (!deletedStory) {
      console.error("Something went wrong.");
      return;
    }

    embed.title = "Story Deleted";

    msg.channel.send({ embeds: [embed] });
    return;
  }

  if (msg.content.startsWith("!single")) {
    const args = msg.content.split(" ");
    args.shift();
    let category = singularwin;
    if (args[0]) {
      category = args[0];
    }
    const teststory = await Storyteller.randomStoryByCat(category);

    if (!teststory) {
      // Flavor
      return;
    }

    const embed = {
      color: 0xcc5500,
      title: "Trick or Treat",
      description: teststory.content,
    };

    msg.channel.send({ embeds: [embed] });
    return;
  }
});

client.on("interactionCreate", async (cmd) => {
  if (!cmd.isCommand()) return;

  if (cmd.commandName == "go-out") {
    await cmd.deferReply();

    const embed = {
      title: "You leave to trick or treat",
      color: 0xcc5500,
    };

    // Make sure the game turns off at the proper time (November 1st 2021)
    if (moment().isSameOrAfter(moment(process.env.ENDTIME))) {
      embed.title = "Halloween is over.";
      embed.description =
        "You can no longer Trick or Treat.\nBut I'll see you next year...";
      await cmd.editReply({ embeds: [embed] });
      return;
    }

    const player = await TrickorTreat.addPlayer(
      cmd.member.user.id,
      cmd.guild.id
    );

    if (!player) {
      embed.title = "You already are trick or treating";
      embed.description = "...or did you forget?";

      await cmd.editReply({ embeds: [embed] });
      return;
    }

    embed.description = `\n🏃‍♀️🏃🏃‍♂️🏠\n`;
    embed.footer = {
      text: `Do be careful out there, ${
        cmd.member.nickname ? cmd.member.nickname : cmd.member.user.username
      }...\n\n`,
    };

    await cmd.editReply({ embeds: [embed] });

    return;
  }

  if (cmd.commandName == "trick-or-treat") {
    // Defer to edit after processing
    await cmd.deferReply();

    // Make sure the game turns off at the proper time (November 1st 2021)
    if (moment().isSameOrAfter(moment(process.env.ENDTIME))) {
      embed.title = "Halloween is over.";
      embed.description =
        "You can no longer Trick or Treat.\nBut I'll see you next year...";
      await cmd.editReply({ embeds: [embed] });
      return;
    }

    // Roll for what may happen
    const chance = Math.floor(Math.random() * 1000);

    // Check for the player to ensure we have data on them
    const you = await TrickorTreat.getPlayer(cmd.member.user.id);

    // Prepare the embed for

    const embed = {
      title: "Trick or Treat",
      color: 0xcc5500,
    };

    // If we do not have this player, invite them to play
    if (!you) {
      embed.description = "You must first go out trick or treating...";

      await cmd.editReply({ embeds: [embed] });

      return;
    }

    //If they are dead they CANNOT play
    if (you.lost == true) {
      embed.title = "You are DEAD";

      embed.description = "You cannot trick or treat anymore";

      embed.footer = {
        text: `Died at ${new Date(you.latestAttempt).toLocaleString()}`,
      };

      await cmd.editReply({ embeds: [embed] });
      return;
    }

    // Timegate

    if (process.env.TIMECOOLDOWNENABLED == "true") {
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
        embed.description = `Oh aren't we eager?\nToo bad.\nYou must wait **${moment(
          you.latestAttempt
        )
          .add(cooldowntime.int, cooldowntime.unit)
          .from(moment(), true)}** before you can trick or treat again...`;

        embed.footer = {
          text: `You have ${you.treats} 🍬 • you can also check your bag to see when you can trick or treat again`,
        };

        await cmd.editReply({ embeds: [embed] });
        return;
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
        randomwin = "Wow you got <AMOUNT>!";
      }

      // Update our strings to remove the amount
      randomwin = randomwin.content.replace("<AMOUNT>", `**${candystring}**`);

      // Update the embed with the new info
      embed.color = 0xffc53b;
      embed.description = `${cmd.member} ${randomwin}`;
      embed.footer = {
        text: `You now have ${
          you.treats + candynum < 0 ? 0 : you.treats + candynum
        } 🍬`,
      };

      // Edit the interaction and return
      await cmd.editReply({ embeds: [embed] });

      return;
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
        // randomwin = falsewins[Math.floor(Math.random() * falsewins.length)];
        randomwin = await Storyteller.randomStoryByCat("falsewins");

        randomwin = randomwin.content;

        if (!randomwin) {
          randomwin = "Oh... You didn't get any candy...";
        }

        // Update the embed
        embed.description = `${cmd.member} ${randomwin}`;
        embed.color = 0xf3f3f3;
        embed.footer = {
          text: `You now have ${you.treats} 🍬`,
        };

        // Edit the interaction and return
        await cmd.editReply({ embeds: [embed] });

        return;
      }

      // If the number of candy is greater than 0
      if (candynum > 1) {
        // Update the embed with a new color and set our random win to one of the win stories
        embed.color = 0x34663d;
        // randomwin = wins[Math.floor(Math.random() * wins.length)].replace(
        //   "<AMOUNT>",
        //   `**${candystring}**`
        // );

        randomwin = await Storyteller.randomStoryByCat("wins");

        if (!randomwin) {
          randomwin = "Wow! You got <AMOUNT>!";
        }

        // Update our strings to remove the amount
        randomwin = randomwin.content.replace("<AMOUNT>", `**${candystring}**`);
      } else {
        // Otherwise change the embed with the single win color and update randomwin to be one of those stories
        embed.color = 0x24768c;
        // randomwin = singularwin[
        //   Math.floor(Math.random() * singularwin.length)
        // ].replace("<AMOUNT>", `**${candystring}**`);
        randomwin = await Storyteller.randomStoryByCat("singularwin");

        if (!randomwin) {
          randomwin = "You just got <AMOUNT>.";
        }

        // Update our strings to remove the amount
        randomwin = randomwin.content.replace("<AMOUNT>", `**${candystring}**`);
      }

      // We update our embed now with whichever string was matched
      embed.description = `${cmd.member} ${randomwin}`;
      embed.footer = {
        text: `You now have ${
          you.treats + candynum < 0 ? 0 : you.treats + candynum
        } 🍬`,
      };

      // Edit the interaction and return
      await cmd.editReply({ embeds: [embed] });

      return;
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
      randomloss = randomloss.content.replace("<AMOUNT>", `**${candystring}**`);

      // Update the embed
      embed.color = 0xef4136;
      embed.description = `${cmd.member} ${randomloss}`;
      embed.footer = {
        text: `You now have ${
          you.treats - candynum < 0 ? 0 : you.treats - candynum
        } 🍬`,
      };

      // Edit interaction and return
      await cmd.editReply({ embeds: [embed] });

      return;
    }

    // LOSE ALL CANDY
    if (chance > 1 && chance < 11) {
      // We use the setCandy method to just drop the users candy to 0
      const candynum = await TrickorTreat.setCandy(0, you.id, true);

      // Grab a random lose all story from totalfail
      // const randomLoss =
      //   totalfail[Math.floor(Math.random() * totalfail.length)];

      let randomloss = await Storyteller.randomStoryByCat("totalfail");

      randomloss = randomloss.content;

      if (!randomloss) {
        randomloss = "You lost ALL YOUR CANDY!";
      }

      // Update our strings to remove the amount
      // randomwin = randomwin.content.replace('<AMOUNT>', `**${candystring}**`);

      // Update embed
      embed.color = 0x645278;
      embed.description = `${cmd.member} ${randomloss}`;
      embed.footer = {
        text: `You now have 0 🍬`,
      };

      // Edit interaction and return
      await cmd.editReply({ embeds: [embed] });

      return;
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
      embed.color = 0x8a0707;
      embed.description = `${cmd.member} ${story}`;
      embed.footer = {
        text: `You are DEAD.`,
      };

      // Edit the interaction and return
      await cmd.editReply({ embeds: [embed] });

      return;
    }
  }

  // Bag command for users to look to see how much candy they have
  if (cmd.commandName == "bag") {
    // We want this to be only for the user.
    await cmd.deferReply({ ephemeral: true });

    // We get the player and all their info to use for the embed
    const player = await TrickorTreat.getPlayer(cmd.member.user.id);

    // If we cannot find that player we invite them to play.
    if (!player) {
      // Make sure the game turns off at the proper time (November 1st 2021)
      if (moment().isSameOrAfter(moment(process.env.ENDTIME))) {
        embed.title = "Halloween is over.";
        embed.description =
          "You can no longer Trick or Treat.\nBut I'll see you next year...";
        await cmd.editReply({ embeds: [embed] });
        return;
      }

      // Edit interaction and return
      await cmd.editReply({
        content: "You must first go out trick or treating...",
      });

      return;
    }
    // We create our embed where we get fancy to see if the player has their nickname or now
    // We then do a silly ternary to give some MonkaS vibes if they've been going hard with attempts but haven't lost

    const embed = {
      color: 0xcc5500,
      author: {
        name: cmd.member.nickname
          ? cmd.member.nickname
          : cmd.member.user.username + "'s Candy Bag",
        icon_url: cmd.member.user.avatarURL(),
      },
      description: `What delightful sweets might there be inside this bag?\n\n**STATUS: ${
        player.lost == false && player.attempts < 50
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

    // Edit interaction and return.
    await cmd.editReply({ embeds: [embed], ephemeral: true });
    return;
  }

  // Our "Leaderboard"
  if (cmd.commandName == "sugar-daddies") {
    await cmd.deferReply();

    /* I hate this code below for variable names. God forgive me. :') */

    // We get our whole player list except if they have lost. We order that list by how many candies they have.
    const sugardaddies = await TrickorTreat.getPlayers({ lost: false }, [
      ["treats", "desc"],
    ]);

    // We get the page of our leaderboard based on a possible interaction subcommand, but if that is not there we only show the 1st page.
    let page = cmd.options.getInteger("page")
      ? cmd.options.getInteger("page")
      : 1;

    // Using the paginate function at the top we then paginate our board based on 10s.
    // This slices our results into sets of 10 and returns the set based on the page variable
    let boardpage = paginate(sugardaddies, 10, page);

    // We calculate our page number based on if the number of players are greater than 10
    // If it is, we divide our player numbers by 10
    let pages = sugardaddies.length > 10 ? sugardaddies.length / 10 : 1;

    // If the user tries to enter a higher page than what we actually have (or smaller) we force page to be 1
    if (page > pages + 1 || page < 1) {
      page = 1;
    }

    // If there is a remainder in splitting our array we defer to the higher number of pages
    if (sugardaddies.length % 10) {
      pages = Math.ceil(pages);
    }

    // We want to tell the player what number they are, so we get them from our overall list not just the splice

    const index = sugardaddies.findIndex(
      (daddy) => daddy.id == cmd.member.user.id
    );

    let askerindex = index >= 0 ? "#" + (index + 1) + "." : "💀";

    if (index == -1) {
      askerindex = "not yet trick or treating.";
    }

    // We create our embed
    const embed = {
      title: ":jack_o_lantern: Sugar Daddies :jack_o_lantern:",
      color: 0xcc5500,
      author: {
        name: client.user.username,
        icon_url: client.user.avatarURL(),
      },
      description: "Find out who the candy connoisseurs are.\n\n",
      footer: {
        text: `${page}/${pages} • You are ${askerindex}`,
      },
    };

    // We update the embed description field based on the players on that page and assign their number to the left
    boardpage.forEach((daddy, index) => {
      var betterindex = page > 1 ? index + 10 * (page - 1) + 1 : index + 1;
      embed.description += `**${betterindex}.** - <@${daddy.id}> - ${
        daddy.lost == false ? daddy.treats + " :candy:" : ":skull:"
      }\n`;
    });

    // Edit our interaction and return
    await cmd.editReply({ embeds: [embed] });
    return;
  }
});

client.login(process.env.TOKEN);
