require("dotenv").config();

const WebSocket = require("ws");
const axios = require("axios");

// Prep for Guilded getting
const TrickorTreat = require("./classes/TrickorTreat");
const Storyteller = require("./classes/StoryTeller");

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

const sendHook = (embed = {}) => {
  return axios.post(
    process.env.WEBHOOKURL,
    { embeds: [embed] },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
};

let reconnectTimer = null;
function stopOtherReconnects() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function connect() {
  const client = new WebSocket(`wss://api.guilded.gg/v1/websocket`, {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  });

  // console.log("Connected to Guilded");

  /* The normal stuff */

  client.on("open", async () => {
    stopOtherReconnects();
    console.log("connected to Guilded!");
    await Database.connect();
  });

  client.on("close", async () => {
    client.terminate();
    stopOtherReconnects();
    reconnectTimer = setTimeout(reconnect, 5000);
  });

  // All our commands

  client.on("message", async (msg) => {
    const { t: eventType, d: eventData } = JSON.parse(msg);

    if (eventType == "ChatMessageCreated") {
      // Doing our commands in here, actually.

      // Go out command first

      const { message } = eventData;

      if (
        message.hasOwnProperty("createdByBotId") ||
        message.hasOwnProperty("crearedByWebhookId") ||
        message.type !== "default"
      )
        return;

      console.log(message);

      if (
        message.content.startsWith("!addstory") &&
        message.createdBy == "x4oJZXoA"
      ) {
        const args = message.content.split("|").map((piece) => piece.trim());
        args.shift();
        if (!args.length == 2) {
          return;
        }
        const category = args[0].toLowerCase();
        const story = args[1];

        if (!category || !story) {
          return;
        }

        const embed = {
          color: 0xcc5500,
          title: "Story added!",
        };

        const newstory = await Storyteller.addStory(category, story);

        if (!newstory) {
          sendMsg(
            message.channelId,
            `Something went wrong adding that story.`,
            {
              replyMessageIds: [message.id],
              isPrivate: true,
            }
          );
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

        sendHook(embed);

        return;
      }

      if (
        message.content.startsWith("!editstory") &&
        message.createdBy == "x4oJZXoA"
      ) {
        const args = message.content.split("|").map((piece) => piece.trim());
        args.shift();
        if (!args.length == 2) {
          return;
        }
        const id = args[0].toLowerCase();
        const story = args[1];

        if (!id || !story) {
          return;
        }

        const editedstory = await Storyteller.editStoryContent(id, story);

        if (!editedstory) {
          sendMsg(
            message.channelId,
            `Something went wrong adding that story.`,
            {
              replyMessageIds: [message.id],
              isPrivate: true,
            }
          );
          return;
        }

        const embed = {
          color: 0xcc5500,
          title: "Story edited!",
          description: editedstory.content,
          fields: [{ name: "Category", value: editedstory.category }],
          footer: {
            text: "Story ID: " + editedstory.id,
          },
        };

        sendHook(embed);

        return;
      }

      if (
        message.content.startsWith("!editcat") &&
        message.createdBy == "x4oJZXoA"
      ) {
        const args = message.content.split("|").map((piece) => piece.trim());
        args.shift();
        if (!args.length == 2) {
          return;
        }
        const id = args[0];
        const category = args[1].toLowerCase();

        if (!id || !category) {
          return;
        }

        const editedcat = await Storyteller.editStoryCategory(id, category);

        if (!editedcat) {
          sendMsg(
            message.channelId,
            `Something went wrong adding that story.`,
            {
              replyMessageIds: [message.id],
              isPrivate: true,
            }
          );
          return;
        }

        const embed = {
          color: 0xcc5500,
          title: "Story category edited!",
          description: editedcat.content,
          fields: [{ name: "Category", value: editedcat.category }],
          footer: {
            text: "Story ID: " + editedcat.id,
          },
        };

        sendHook(embed);

        return;
      }

      if (
        message.content.startsWith("!delstory") &&
        message.createdBy == "x4oJZXoA"
      ) {
        const args = message.content.split("|").map((piece) => piece.trim());
        args.shift();
        if (!args.length == 2) {
          return;
        }
        const id = args[0];
        // const category = args[1].toLowerCase();

        if (!id) {
          return;
        }

        const story = await Storyteller.getStory(id);

        if (!story) {
          sendMsg(
            message.channelId,
            `Something went wrong adding that story.`,
            {
              replyMessageIds: [message.id],
              isPrivate: true,
            }
          );
          return;
        }

        const embed = {
          color: 0xcc5500,
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

        const delstory = await Storyteller.deleteStory(id);

        if (!delstory) {
          sendMsg(
            message.channelId,
            `Something went wrong adding that story.`,
            {
              replyMessageIds: [message.id],
              isPrivate: true,
            }
          );
          return;
        }

        sendHook(embed);

        return;
      }

      if (
        message.content.startsWith("!tellstory") &&
        message.createdBy == "x4oJZXoA"
      ) {
        const args = message.content.split("|").map((piece) => piece.trim());
        args.shift();
        if (!args.length == 2) {
          return;
        }
        const id = args[0];
        // const category = args[1].toLowerCase();

        if (!id) {
          return;
        }

        const story = await Storyteller.getStory(id);

        if (!story) {
          sendMsg(
            message.channelId,
            `Something went wrong adding that story.`,
            {
              replyMessageIds: [message.id],
              isPrivate: true,
            }
          );
          return;
        }

        const embed = {
          color: 0xcc5500,
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

        sendHook(embed);

        return;
      }

      // Enable check for specific channel later
      // if (message.channelId !== process.env.GAMECHANNEL) return;

      if (message.content == "!test") {
        sendMsg(message.channelId, `<@${message.createdBy}>`);
      }

      if (message.content == "!go-out") {
        const player = await TrickorTreat.addPlayer(message.createdBy, "hch");

        if (!player) {
          sendMsg(message.channelId, "You already went out.", {
            replyMessageIds: [message.id],
            isPrivate: true,
          });
          return;
        }

        const embed = {
          title: "You leave to trick or treat",
          color: 0xcc5500,
          description: `\n🏃‍♀️🏃🏃‍♂️🏠\n`,
          footer: {
            text: `Do be careful out there...`,
          },
        };

        sendHook(embed);

        // sendMsg(message.channelId, "Do be careful out there.", {
        //   replyMessageIds: [message.id],
        // });

        return;
      }

      if (message.content == "!bag") {
        const player = await TrickorTreat.getPlayer(message.createdBy);

        //     // If we cannot find that player we invite them to play.
        if (!player) {
          sendMsg(message.channelId, `You need to go out first`, {
            replyMessageIds: [message.id],
            isPrivate: true,
          });

          return;
        }

        sendMsg(
          message.channelId,
          `**Bag**\n ${
            player.lost == false
              ? "**Status:** You are alive"
              : "**Status:** 💀"
          }\nYou have ${player.treats} 🍬\n${
            player.lost == false
              ? moment()
                  .utc()
                  .isSameOrBefore(
                    moment(player.latestAttempt).add(
                      parseInt(cooldowntime.int),
                      cooldowntime.unit
                    )
                  ) && player.attempts > 0
                ? "Time until next trick or treat: " +
                  moment(player.latestAttempt)
                    .add(cooldowntime.int, cooldowntime.unit)
                    .from(moment(), true)
                : "You can trick or treat."
              : "Died at " + new Date(player.latestAttempt).toLocaleString()
          }`,
          {
            replyMessageIds: [message.id],
            isPrivate: true,
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
              isPrivate: true,
            }
          );
          return;
        }

        const embed = {
          title: "Trick or Treat",
          color: 0xcc5500,
        };

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
                .from(
                  moment(),
                  true
                )}** before you can trick or treat again...`,
              {
                replyMessageIds: [message.id],
                isPrivate: true,
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
          randomwin = randomwin.content.replace(
            "<AMOUNT>",
            `${candystring.toUpperCase()}`
          );

          embed.color = 0xffc53b;
          embed.description = `${randomwin}`;
          embed.footer = {
            text: `You now have ${
              you.treats + candynum < 0 ? 0 : you.treats + candynum
            } 🍬`,
          };

          sendHook(embed);

          // sendMsg(
          //   message.channelId,
          //   `${randomwin}\n\nYou now have ${
          //     you.treats + candynum < 0 ? 0 : you.treats + candynum
          //   } 🍬`,
          //   {
          //     replyMessageIds: [message.id],
          //   }
          // );

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

            // Update the embed
            embed.description = `${randomwin}`;
            embed.color = 0xf3f3f3;
            embed.footer = {
              text: `You now have ${you.treats} 🍬`,
            };

            sendHook(embed);

            // sendMsg(
            //   message.channelId,
            //   `${randomwin}\n\nYou still have ${you.treats} 🍬`,
            //   {
            //     replyMessageIds: [message.id],
            //   }
            // );
            // Edit the interaction and return

            return;
          }

          // If the number of candy is greater than 0
          if (candynum > 1) {
            // Update the embed with a new color and set our random win to one of the win stories
            embed.color = 0x34663d;
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
            embed.color = 0x24768c;
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
            text: `You now have ${
              you.treats + candynum < 0 ? 0 : you.treats + candynum
            } 🍬`,
          };

          sendHook(embed);
          // sendMsg(
          //   message.channelId,
          //   `${randomwin}\n\nYou now have ${
          //     you.treats + candynum < 0 ? 0 : you.treats + candynum
          //   } 🍬`,
          //   {
          //     replyMessageIds: [message.id],
          //   }
          // );

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
            `${candystring.toUpperCase()}`
          );

          // Update the embed
          embed.color = 0xef4136;
          embed.description = `${randomloss}`;
          embed.footer = {
            text: `You now have ${
              you.treats - candynum < 0 ? 0 : you.treats - candynum
            } 🍬`,
          };

          sendHook(embed);

          // sendMsg(
          //   message.channelId,
          //   `${randomloss}\n\nYou now have ${
          //     you.treats - candynum < 0 ? 0 : you.treats - candynum
          //   } 🍬`,
          //   {
          //     replyMessageIds: [message.id],
          //   }
          // );

          // Edit interaction and return

          return;
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
          embed.color = 0x645278;
          embed.description = `${randomloss}`;
          embed.footer = {
            text: `You now have 0 🍬`,
          };

          sendHook(embed);

          // sendMsg(message.channelId, `${randomloss}\n\nYou now have 0 🍬`, {
          //   replyMessageIds: [message.id],
          // });

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
          embed.description = `${story}`;
          embed.footer = {
            text: `You are DEAD.`,
          };

          sendHook(embed);

          // sendMsg(message.channelId, `${story}\n\nYou are **DEAD**`, {
          //   replyMessageIds: [message.id],
          // });

          // Edit the interaction and return

          return;
        }
      }

      // if (message.content.startsWith("!sugar-daddies")) {
      //   /* I hate this code below for variable names. God forgive me. :') */

      //   const args = message.content.split(" ");
      //   args.shift();

      //   // We get our whole player list except if they have lost. We order that list by how many candies they have.
      //   const sugardaddies = await TrickorTreat.getPlayers({ lost: false }, [
      //     ["treats", "desc"],
      //   ]);

      //   // We get the page of our leaderboard based on a possible interaction subcommand, but if that is not there we only show the 1st page.
      //   let page = args[0] ? args[0] : 1;

      //   // Using the paginate function at the top we then paginate our board based on 10s.
      //   // This slices our results into sets of 10 and returns the set based on the page variable
      //   let boardpage = paginate(sugardaddies, 10, page);

      //   // We calculate our page number based on if the number of players are greater than 10
      //   // If it is, we divide our player numbers by 10
      //   let pages = sugardaddies.length > 10 ? sugardaddies.length / 10 : 1;

      //   // If the user tries to enter a higher page than what we actually have (or smaller) we force page to be 1
      //   if (page > pages + 1 || page < 1) {
      //     page = 1;
      //   }

      //   // If there is a remainder in splitting our array we defer to the higher number of pages
      //   if (sugardaddies.length % 10) {
      //     pages = Math.ceil(pages);
      //   }

      //   // We want to tell the player what number they are, so we get them from our overall list not just the splice

      //   const index = sugardaddies.findIndex(
      //     (daddy) => daddy.id == message.createdBy
      //   );

      //   let askerindex = index >= 0 ? "#" + (index + 1) + "." : "💀";

      //   if (index == -1) {
      //     askerindex = "not yet trick or treating.";
      //   }

      //   // We create our string

      //   let leaderboardstr = `
      //   **🎃 Sugar Daddies 🎃**\nFind out who the candy connoisseurs are.\n
      // `;

      //   //     const embed = {
      //   //       title: ":jack_o_lantern: Sugar Daddies :jack_o_lantern:",
      //   //       color: 0xcc5500,
      //   //       author: {
      //   //         name: client.user.username,
      //   //         icon_url: client.user.avatarURL(),
      //   //       },
      //   //       description: "Find out who the candy connoisseurs are.\n\n",
      //   //       footer: {
      //   //         text: `${page}/${pages} • You are ${askerindex}`,
      //   //       },
      //   //     };

      //   // We update the embed description field based on the players on that page and assign their number to the left
      //   boardpage.forEach((daddy, index) => {
      //     var betterindex = page > 1 ? index + 10 * (page - 1) + 1 : index + 1;
      //     leaderboardstr += `**${betterindex}.** - <@${daddy.id}> - ${
      //       daddy.lost == false ? daddy.treats + " :candy:" : ":skull:"
      //     }\n`;
      //   });

      //   // Edit our interaction and return
      //   sendMsg(message.channelId, `${leaderboardstr}`, {
      //     replyMessageIds: [message.id],
      //   });

      //   return;
      // }
    }
  });
  return client;
}

function reconnect() {
  console.log("attempting to connect...");
  stopOtherReconnects();
  const client = connect();
  reconnectTimer = setTimeout(function () {
    client.terminate();
    reconnect();
  }, 5000);
}

reconnect();
