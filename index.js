require("dotenv").config();

const WebSocket = require("ws");
const axios = require("axios");
// const fetch = require("node-fetch");

// Prep for Guilded getting
const TrickorTreat = require("./classes/TrickorTreat");
const Storyteller = require("./classes/StoryTeller");

const client = new WebSocket("wss://api.guilded.gg/v1/websocket", {
  headers: {
    Authorization: `Bearer ${process.env.TOKEN}`,
  },
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

const headers = {
  Authorization: `Bearer ${process.env.TOKEN}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

const cooldowntime = {
  int: process.env.TIMECOOLDOWNINT ? process.env.TIMECOOLDOWNINT : 1,
  unit: process.env.TIMECOOLDOWNUNIT ? process.env.TIMECOOLDOWNUNIT : "h",
};

const sendMsg = (channel, content, options = {}) => {
  return axios.post(
    `https://www.guilded.gg/api/v1/channels/${channel}/messages`,
    { content, ...options },
    {
      headers: headers,
    }
  );
};

/* The normal stuff */

client.on("open", async () => {
  console.log("Connected to Guilded");
  await Database.connect();
});

// All our commands

client.on("message", async (msg) => {
  const { t: eventType, d: eventData } = JSON.parse(msg);

  if (eventType == "ChatMessageCreated") {
    // Doing our commands in here, actually.

    // Go out command first

    const { message } = eventData;

    if (message.hasOwnProperty("createdByBotId")) return;

    console.log(message);

    // Enable check for specific channel later
    // if(message.channelId !== process.env.GAMECHANNEL) return;

    if (message.content == "!go-out") {
      const player = await TrickorTreat.addPlayer(message.createdBy, "hch");

      if (!player) {
        sendMsg(message.channelId, "You already went out.", {
          replyMessageIds: [message.id],
        });
        return;
      }

      sendMsg(message.channelId, "Do be careful out there.", {
        replyMessageIds: [message.id],
      });

      return;
    }

    if (message.content == "!bag") {
      const player = await TrickorTreat.getPlayer(message.createdBy);

      //     // If we cannot find that player we invite them to play.
      if (!player) {
        sendMsg(message.channelId, `You need to go out first`, {
          replyMessageIds: [message.id],
        });

        return;
      }

      sendMsg(
        message.channelId,
        `**Bag**\n ${
          player.lost == false ? "**Status:** You are alive" : "**Status:** 💀"
        }\nYou have ${player.treats} 🍬\n${
          player.lost == false
            ? moment()
                .utc()
                .isSameOrBefore(
                  moment(player.latestAttempt).add(
                    parseInt(cooldowntime.int),
                    cooldowntime.unit
                  )
                ) && player.treats > 0
              ? "Time until next trick or treat:" +
                moment(player.latestAttempt)
                  .add(cooldowntime.int, cooldowntime.unit)
                  .from(moment(), true)
              : "You can trick or treat."
            : "Died at " + new Date(player.latestAttempt).toLocaleString()
        }`,
        {
          replyMessageIds: [message.id],
        }
      );

      return;
    }

    if (message.content == "!trick-or-treat") {
      const chance = Math.floor(Math.random() * 1000);

      // Check for the player to ensure we have data on them
      const you = await TrickorTreat.getPlayer(message.createdBy);

      if (!you) {
        sendMsg(message.channelId, `You need to go out first`);

        return;
      }

      if (you.lost == true) {
        sendMsg(
          message.channelId,
          `You are **DEAD**.\nYou cannot trick or treat anymore.\nDied at ${new Date(
            you.latestAttempt
          ).toLocaleString()}`,
          {
            replyMessageIds: [message.id],
          }
        );
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
          sendMsg(
            message.channelId,
            `Oh aren't we eager?\nToo bad.\nYou must wait **${moment(
              you.latestAttempt
            )
              .add(cooldowntime.int, cooldowntime.unit)
              .from(moment(), true)}** before you can trick or treat again...`,
            {
              replyMessageIds: [message.id],
            }
          );

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

        sendMsg(
          message.channelId,
          `${randomwin}\n\nYou now have ${
            you.treats + candynum < 0 ? 0 : you.treats + candynum
          } 🍬`,
          {
            replyMessageIds: [message.id],
          }
        );

        // Edit the interaction and return

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
          randomwin = await Storyteller.randomStoryByCat("falsewins");

          randomwin = randomwin.content;

          if (!randomwin) {
            randomwin = "Oh... You didn't get any candy...";
          }
          sendMsg(
            message.channelId,
            `${randomwin}\n\nYou still have ${you.treats} 🍬`,
            {
              replyMessageIds: [message.id],
            }
          );
          // Edit the interaction and return

          return;
        }

        // If the number of candy is greater than 0
        if (candynum > 1) {
          // Update the embed with a new color and set our random win to one of the win stories
          randomwin = await Storyteller.randomStoryByCat("wins");

          if (!randomwin) {
            randomwin = "Wow! You got <AMOUNT>!";
          }

          // Update our strings to remove the amount
          randomwin = randomwin.content.replace(
            "<AMOUNT>",
            `**${candystring}**`
          );
        } else {
          // Otherwise change the embed with the single win color and update randomwin to be one of those stories
          randomwin = await Storyteller.randomStoryByCat("singularwin");

          if (!randomwin) {
            randomwin = "You just got <AMOUNT>.";
          }

          // Update our strings to remove the amount
          randomwin = randomwin.content.replace(
            "<AMOUNT>",
            `**${candystring}**`
          );
        }

        // We update our embed now with whichever string was matched
        sendMsg(
          message.channelId,
          `${randomwin}\n\nYou now have ${
            you.treats + candynum < 0 ? 0 : you.treats + candynum
          } 🍬`,
          {
            replyMessageIds: [message.id],
          }
        );

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
        randomloss = randomloss.content.replace(
          "<AMOUNT>",
          `**${candystring}**`
        );

        // Update the embed

        sendMsg(
          message.channelId,
          `${randomloss}\n\nYou now have ${
            you.treats + candynum < 0 ? 0 : you.treats - candynum
          } 🍬`,
          {
            replyMessageIds: [message.id],
          }
        );

        // Edit interaction and return

        return;
      }

      // LOSE ALL CANDY
      if (chance > 1 && chance < 11) {
        // We use the setCandy method to just drop the users candy to 0
        const candynum = await TrickorTreat.setCandy(0, you.id, true);

        // Grab a random lose all story from totalfail

        let randomloss = await Storyteller.randomStoryByCat("totalfail");

        if (!randomloss) {
          randomloss = "You lost ALL YOUR CANDY!";
        }

        // Update embed

        sendMsg(message.channelId, `${randomloss}\n\nYou now have 0 🍬`, {
          replyMessageIds: [message.id],
        });

        // Edit interaction and return

        return;
      }

      // YOU LOST
      if (chance == 1 || chance == 0) {
        // This ends the game for the players
        const youlose = await TrickorTreat.playerLOSS(cmd.member.user.id);

        // We grab a random endgame story
        // const story =
        //   YOULOSTTHEGAME[Math.floor(Math.random() * YOULOSTTHEGAME.length)];

        const story = await Storyteller.randomStoryByCat("gameover");

        story = story.content;

        if (!story) {
          story =
            "You feel death's cold embrace settle in as everything gets dark...";
        }

        // Update our strings to remove the amount
        // randomwin = randomwin.content.replace('<AMOUNT>', `**${candystring}**`);

        // Update the embed

        sendMsg(message.channelId, `${story}\n\nYou are **DEAD**`, {
          replyMessageIds: [message.id],
        });

        // Edit the interaction and return

        return;
      }
    }
  }
});

// client.on("interactionCreate", async (cmd) => {

//   // Our "Leaderboard"
//   if (cmd.commandName == "sugar-daddies") {
//     await cmd.deferReply();

//     /* I hate this code below for variable names. God forgive me. :') */

//     // We get our whole player list except if they have lost. We order that list by how many candies they have.
//     const sugardaddies = await TrickorTreat.getPlayers({ lost: false }, [
//       ["treats", "desc"],
//     ]);

//     // We get the page of our leaderboard based on a possible interaction subcommand, but if that is not there we only show the 1st page.
//     let page = cmd.options.getInteger("page")
//       ? cmd.options.getInteger("page")
//       : 1;

//     // Using the paginate function at the top we then paginate our board based on 10s.
//     // This slices our results into sets of 10 and returns the set based on the page variable
//     let boardpage = paginate(sugardaddies, 10, page);

//     // We calculate our page number based on if the number of players are greater than 10
//     // If it is, we divide our player numbers by 10
//     let pages = sugardaddies.length > 10 ? sugardaddies.length / 10 : 1;

//     // If the user tries to enter a higher page than what we actually have (or smaller) we force page to be 1
//     if (page > pages + 1 || page < 1) {
//       page = 1;
//     }

//     // If there is a remainder in splitting our array we defer to the higher number of pages
//     if (sugardaddies.length % 10) {
//       pages = Math.ceil(pages);
//     }

//     // We want to tell the player what number they are, so we get them from our overall list not just the splice

//     const index = sugardaddies.findIndex(
//       (daddy) => daddy.id == cmd.member.user.id
//     );

//     let askerindex = index >= 0 ? "#" + (index + 1) + "." : "💀";

//     if (index == -1) {
//       askerindex = "not yet trick or treating.";
//     }

//     // We create our embed
//     const embed = {
//       title: ":jack_o_lantern: Sugar Daddies :jack_o_lantern:",
//       color: 0xcc5500,
//       author: {
//         name: client.user.username,
//         icon_url: client.user.avatarURL(),
//       },
//       description: "Find out who the candy connoisseurs are.\n\n",
//       footer: {
//         text: `${page}/${pages} • You are ${askerindex}`,
//       },
//     };

//     // We update the embed description field based on the players on that page and assign their number to the left
//     boardpage.forEach((daddy, index) => {
//       var betterindex = page > 1 ? index + 10 * (page - 1) + 1 : index + 1;
//       embed.description += `**${betterindex}.** - <@${daddy.id}> - ${
//         daddy.lost == false ? daddy.treats + " :candy:" : ":skull:"
//       }\n`;
//     });

//     // Edit our interaction and return
//     await cmd.editReply({ embeds: [embed] });
//     return;
//   }
// });

// client.login(process.env.TOKEN);
