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
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const Database = require("./classes/Database");

// Helper function for candy nums

function randomNumBet(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const paginate = (array, pagesize, pagenum) => {
  return array.slice((pagenum - 1) * pagesize, pagenum * pagesize);
};

/* 
/// TODO
/
/ + Check for if command is 2 hours later than last trigger
*/

// WINS

const singularwin = [
  "A neighbors dog drops a snickers...? And nobody sees it. You gained a candy?",
  "You sneakily grab an extra candy without Mrs. Jones seeing. You gained a candy.",
  "There was an extra skittle in your bag of skittles! You gained a candy.",
  "You take a piece of candy from your brother while he isn't looking.",
  "You find a candy corn in the couch cushions. It's prolly 43 years old, but it tastes fine.",
  "You spot a half-licked lollipop stuck to the side of a tree. You blow on it and think it looks alright.",
  "Your FAVORITE teacher sneaks you an extra piece of candy for all those good boy points you've been racking up.",
  "Sweet! Half chewed gum on the sidewalk and NO ANTS!!",
  "While cleaning your room before you go trick or treating, you find a unexpired Reeses under your bed.",
  "While trick or treating you spot a single gumdrop on a trash can under the moonlight.",
  "You try to reach the top of the kitchen cabinet, feeling a crinkled wrappe ryou stand on your toes to pull down a dusty Butterfinger.",
  "You grab your trick or treat bag and realize there's a chocolate bar left inside.",
  "You notice a floating cube with a quesiton mark on it. You hit it and out pops a single chocolate coin!",
  "You're cleaning out your old highschool backpack, between some binders you find a pack of Nerds.",
  "You did not succumb to the bad luck. You get one candy.",
];

const wins = [
  "A mod likes your costume. They give you <AMOUNT>.",
  "You become a discord kitten. You gain <AMOUNT>.",
  "Someone likes your costume! They gave you <AMOUNT>.",
  "You found <AMOUNT> on the ground... Gross.",
  "Grandma liked your bad costume. You gained <AMOUNT>.",
  "You gave a good suggestion to the mods and gained <AMOUNT>.",
  "Some guy in a white van says he has candy in the back! You gain <AMOUNT>.",
  "You found someone's stash of candy. You gain <AMOUNT>.",
  "You give a Shinigami an apple. They give you <AMOUNT>.",
  "You visit a graveyard with your friends and meet a friendly ghost! He offers you <AMOUNT> candy to gtfo.",
  "Your best friend is allergic to peanuts. They give you <AMOUNT>",
  "You wish your oddly pale history teacher a Happy Halloween. They smile for the first time, showing fangs and give you <AMOUNT>.",
  "You abuse the front door physics and clip into a neighbors house, grabbing <AMOUNT> before running away.",
  "You didn't win the costume contest. At least you got a participation medal and <AMOUNT>.",
  "You pass a mouse hole, there's a plate of cheese adjacent to it. Seeing this fills you with determination, and <AMOUNT>.",
  "You unmask captain cutler and immediately turn him into the police. They give you <AMOUNT> as a reward.",
  "You help stop a troll in main from making the Convo weird! The grateful mods give you <AMOUNT>.",
];

const criticalwin = [
  "You took a trip to the rich neighborhood and got king-sized candy bars! You gained <AMOUNT>.",
  "You stumbled upon a house with a 'Take your own candy' bowl! You gain <AMOUNT>.",
  "Your little brother HATES M&Ms and gives you all of his. You gain <AMOUNT>.",
  "You suddenly remember where last year's candy stash is hidden! You gain <AMOUNT>.",
  "Nobody wants to walk down your long ass driveway so mom lets you keep all of the candy. You gain <AMOUNT>.",
  "Your mom gives you all the left overs from the candy bowl. you gain <AMOUNT>.",
  "You found a treasure map. You follow it and dig up a chest on Candy Island! You gain <AMOUNT>.",
  "You finally got that triple combo during the Candy Crush Spooktacular event. You gain <AMOUNT>.",
  "You take a trip to a haunted house where you scare the pants off your friends. They drop <AMOUNT>. More for you.",
  "Your boss decides to give you your entire paycheck in candy...? You gain <AMOUNT>. Maybe look for a new line of work.",
  "Some dumb bullies try to jump you for your candy. Luckily you've been taking taekwondo. You get <AMOUNT> candy from their bags.",
  "You find a hidden door behind your grandfather's old wooden closet. Opening the door, it's a not chilly inside but you find a stashed <AMOUNT>.",
  "You and your friend stumble upon a party where they all love your costumes, they award you winners of the party and give you <AMOUNT>! Look at you go.",
  "Your friends hot mom loves your costume and slips you <AMOUNT>. Maybe keep that first part to yourself.",
];

// LOSSES

const losses = [
  "There was a hole in your bag. You lose <AMOUNT>.",
  "A mod pulled you over. You bribed them with <AMOUNT>.",
  "You cross the path of a person dressed as a sphinx! You lose <AMOUNT> for guessing their riddle wrong.",
  "You cross the path of a person dressed as a sphinx! You lose <AMOUNT> for guessing their riddle right.",
  "You lost your v-card... And <AMOUNT>!!",
  "You took a wrong turn and some bullies beat you up and took your candy! You lose <AMOUNT>.",
  "Your mom sorts through your candy. You lose <AMOUNT>.",
  "The school bully finds you. You lose <AMOUNT>.",
  "Your mom sees your Tik-Tok reaction video. You lose <AMOUNT>.",
  "It rained for part of Halloween! You lose <AMOUNT>.",
  "You ate too many LemonHeads and feel sick! You lose <AMOUNT>.",
  "Parent tax. Dad takes <AMOUNT>. There go your Baby Ruths.",
  "You were horni in main-chat. You lose <AMOUNT>.",
  "Your mom found the Only Fans credit card transaction. You lose <AMOUNT>.",
  'You clicked a "free candy giveaway" link in your DMs. You lose <AMOUNT>.',
  "You left your door open for a moment and your brother runs in. He takes <AMOUNT>.",
  "A seagull swoops down RIGHT as you try to eat some candy. You lose <AMOUNT>.",
  "Your highschool bully attempts to steal your lunch money, but you only have candy! You lose <AMOUNT>.",
  "You got caught TPing Old Man Jenkins house. Your parents make you give <AMOUNT> to your sibling.",
  "The monsters under your bed need something to eat too. Better not be you. You lose <AMOUNT>.",
];

// FALSE POSITIVES
const falsewins = [
  "Grandma gave you raisins.",
  "Some guy in a white van says he has candy in the back! You get in! ...",
  "Someone took ALL of the candy and emptied the bucket before you got there.",
  "You walk up to a house and try to ring the doorbell. They turn their lights off.",
  "As you are walking between the houses you see a glimmer, you reach down expecting a candy bar but as you pull it up it's but only the wrapper.",
  "You got a rock.",
  "You found a rainbow and run to follow it, but there were no skittles only a pot of gold. :(",
  "You were out trick or treating when your dentist sees you. He holds something in his hand but it turns out to be a roll of dental floss.",
  "You trick or treated at a house that **only** gives out healthy snacks. Drats.",
  "Your friend is allergic to peanuts so you decide to trade their Snickers for your Tootsie Pop.",
  "The house you trick or treated at has a 'take one please' candy basket! ... But it's empty. Damn greey goblins.",
];

// LOSE ALL CANDY
const totalfail = [
  "You have diabetes and your parents took away ALL of your candy.",
  "You accidentally trick or treated at your Dentist's and he confiscated ALL your candy.",
  "You were accidentally banned during a raid and lose ALL your candy.",
  "You stumble across people dressed as Oregon Trail Settlers. You DIE of dysentery AND lose ALL your candy.",
  "You got caught sticking bologna to people's cars. You lose ALL of your candy.",
  "You play with an oujia board and get possessed... the candy is NO LONGER yours.",
  "You received a sentient gummy bear and realize candy have feelings too. You decide to set ALL your candy free in the forest. How sweet of you.",
  "You wanted to check out this clown everyone was hyping up in the sewer grates. You slipped when you tried to take a peek and dropped ALL of your candy.",
  "Some kid robs you at gunpoint for EVERYTHING in your bag... where did he even get that???",
];

// ABSOLUTE LOSS

const YOULOSTTHEGAME = [
  "You put your alien mask on. You know the one; that cool one that glows in the dark. You're gonna be the coolest kid in town, lighting up neon green under every blacklight along your trick or treating route. You grab your super cool X files pillow case. Yes, X files is cool... Shut up, random inside voice that's always trying to keep you down. This is your night. You run out into the dark, weaving through masses of kids, raking in all kinds of candy. Your bag is almost full...You got tons of compliments and all feels right in the world. It's getting kind of late, and you're getting kind of hungry. As you walk home, you pull out a snickers bar, cause when you're hungry, you're kind of a Xenomorph. You get this feeling you're being watched... You look behind you. A shadow quickly shuffles into the nearby bushes. Better check it out. What could go wrong? You follow the strange figure.. It's really short.. It must be a little lost kid. You pull out your phone to use the flashlight.. but it's dead. That's weird.. you barely used it tonight. You suddenly realize you don't know where you are. A bright light flashes above you and an unseen force starts to lift you up into the sky.... You wake up in your bed. Your X files pillowcase is empty and covered in a strange slime. Your butthole also feels kinda sore.\n**Guess it wasn't your night after all.**",
  "This year you're ready. No matter what they do you're gonna make it safely home with your bag of candy. This time you have all the right gear. You put on football pads under your Robin Hood costume, complete with a mask. Armor and a disguise.. If they don't know it's you under the mask.. they cant prey on you. Protection.. Check. You strap on your super soaker pistols filled with vinegar and tie your cabbage juice water balloons to your belt. They only like sweets.. and they hate vegetables. One spritz in the eyes and they should scatter. Weaponry.. Check. Finally, we need backup. You get the harness and the leash for Killer, your new Rottweiler. The tiny creeps don't stand a chance. Confident, and ready for action, you exit your house. You keep a lookout, but so far no signs of the enemy... 2 blocks of candy down.. Still the coast is clear. Dare you hope that this year they might have chosen someone else? As the night progresses with no incident, you relax and start to enjoy yourself. Your bag is filled nicely but you're getting tired. It's safe to say you can finally enjoy your Halloween the way it was meant to be enjoyed.. Time to go home and dig into your prize. You climb your porch steps and put the keys into the lock. OW! You look down.. A fork! How did they find home base? You reach for your pistol but it's already too late. They're everywhere. You hear the clicking of a hundred tiny wooden legs as the garden gnomes surround you. You call to Killer for help, but the dog just licks his balls. They beat you senseless and take your candy.\n**Serves you right.**",
  "You wake up in an unfamiliar room inside a bathtub. As you begin to shift your foot catches on a drain plug, unplugging it. The water starts to drain, and a small light flickers on. The room itself is pitch black, but you still just barely make out a key and another person in the dark. As you lift yourself out of the tub and fall onto the floor,  you cough and gasp from the shock of it all. You manage to get to your feet, but as you move forward you realize your ankle is chained to something. You feel your way in the dark to a pipe in the corner. You then reach down to pulling at the chain that is attached to it. you cry out, frantic, frightened, and a bit hysterical:  Help! Someone help me! (you stop when you hear a loud dragging sound somewhere in the room. You look out into the darkness and calls out.) Is someone there? (You turn back to the corner where you are chained, and say in a slightly softer but still panicked voice) Shit, Im probably dead. Suddenly, from out within the darkness comes a mans voice:\n**I want to play a game.**",
  "It's been a great year. The war looks like its finally coming to an end and the troops are coming home. Everyone is full of hope, and in celebration, stocking up on candy. As I'm putting on my survivor costume makeup, I analyze it with a critical eye. Is this too Mad Max or is it more like The Walking Dead. I paint on some more dirt stains and get out my fake machete. Machete's work for every doomsday right? I stroll out the house with my dirty duffel bag and head to the best neighborhood in town to get the good stuff. As I strut from house to house, I make a big show of squaring off with every alien, vampire, or fellow survivor costume I see. Most people are fun and play along. My bag fills up, and so does my mood. As I'm heading home I notice some people looking up at the sky and talking fearfully. What's that? Bright streaks are zooming.. This way. A family behind me calls to me. \"Get inside quick! We have a shelter!\" I was about to ask what they were talking about, when the father grabs me by the arm and drags me inside. I'm quickly ushered to the basement. I start to object and he slams the lid shut and locks it. \"Hey, you can't ju....\" BOOM. The bunker shakes and dust falls from the ceiling. A radio in the back crackles and I hear. \"They lied. They promised a cease fire and what we got were nu...\". The radio fizzles out. Nukes?! We all look at each other in horror. The family realizes they're about to share their rations with a stranger. I realize I dropped my bag of candy when the father grabbed me.\n**It's the end, but at least I'm dressed for the part.**",
  `Your friend Marcus Halberstam offers drinks at his place after a long night of drinking at the bar and he wont take no for an answer.\n"Come on, you dumb son of a bitch."\nHe says as he helps you into your jacket. "I've got a preview of the Barneys catalogue and a bottle of Absolut waiting for us."\nYou get to the apartment and notice the living room floor has been meticulously covered with newspaper. You slump drunkenly in a white Eames chair, a glass in hand as Halberstam is looking through his CDs.\n"You like Huey Lewis and the News?" he asks.\n"They're okay." you respond.\n"Their early work was a little too New Wave for my taste. But then Sports came out in 1983, I think they really came into their own, commercially and artistically." Halberstam states as he walks to his bathroom.\n"The whole album has a clear, crisp sound and a new sheen of consummate professionalism that gives the songs a big boost." Halberstam comes back out and walks to the foyer.\n"He's been compared to Elvis Costello but I think Huey has a more bitter, cynical sense of humor."\nYou absent-mindedly leaf through the Barneys catalogue only half listening.\n"Hey, Halberstam?"\n"Yes?"\n"Why are there copies of the Style section all over the place? Do you have a dog? A chow or something?"\n"No."\n"Is that a raincoat?"\n"Yes, it is."\nHe moves to the CD player. and takes a CD out of its case and slides it in the machine. Then states "In 87 Huey released this, Fore!, their most accomplished album. I think their undisputed masterpiece is "HiP To Be Square," a song so catchy that most people probably don't listen to the lyrics. But they should because it's not just about the pleasures of conformity and the importance of trends. It's also a personal statement about the band itself."\nHe walked behind you as he spoke.\n"HEY PAUL!"\nAs you turn around to question him since, well your name isn't Paul, you are greeted with **AN AXE TO THE FACE.**`,
];

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

  // client.application.commands
  //   .fetch({ guildId: process.env.GUILDID })
  //   .then((data) => console.log(data));
});

client.on("messageCreate", async (msg) => {
  if (msg.author.id !== "84695051535384576") return;

  if (msg.content == "!responses") {
    return await msg.channel
      .send(`Singular Win: ${singularwin.length}\nNormal Win: ${wins.length}\nCritical Win: ${criticalwin.length}\nLosses: ${losses.length}\nFalse Wins: ${falsewins.length}\nTotal Fails: ${totalfail.length}\nYou Lose: ${YOULOSTTHEGAME.length}
    `);
  }
  if (msg.content.startsWith("!test")) {
    const args = msg.content.split(" ");
    args.shift();

    let category;
    switch (args[0]) {
      case "singularwin":
        category = singularwin;
        break;
      case "wins":
        category = wins;
        break;
      case "critwin":
        category = criticalwin;
        break;
      case "losses":
        category = losses;
        break;
      case "totalfail":
        category = totalfail;
        break;
      case "lose":
        category = YOULOSTTHEGAME;
        break;
      default:
        category = singularwin;
        break;
    }

    let num = args[1];

    switch (args[1]) {
      case "first":
        num = 0;
        break;
      case "last":
        num = category.length - 1;
        break;
      default:
        break;
    }

    msg.channel.send(`${category[num]}`);
    return;
  }
});

client.on("interactionCreate", async (cmd) => {
  if (!cmd.isCommand()) return;

  if (cmd.commandName == "go-out") {
    const player = await TrickorTreat.addPlayer(
      cmd.member.user.id,
      cmd.guild.id
    );

    if (!player) {
      await cmd.reply("You are already trick or treating.");
      return;
    }

    return await cmd.reply(`Do be careful out there, <@${player}>...`);
  }

  if (cmd.commandName == "trick-or-treat") {
    const chance = Math.floor(Math.random() * 1000);

    const you = await TrickorTreat.getPlayer(cmd.member.user.id);

    if (!you) return;

    if (you.lost == true) {
      // Add message
      await cmd.reply({
        content: "You are **DEAD** and cannot trick or treat. :skull:",
        ephemeral: true,
      });
      return;
    }

    const gainAttempt = await TrickorTreat.attempt(cmd.member.user.id);

    // CRITICAL WIN 4-8
    if (chance > 600) {
      const candynum = await TrickorTreat.give(randomNumBet(4, 8), you.id);

      const candystring = candynum + " candies";

      const randomwin = criticalwin[
        Math.floor(Math.random() * criticalwin.length)
      ].replace("<AMOUNT>", candystring);

      await cmd.reply(
        `${randomwin} You now have ${you.treats + candynum} :candy:`
      );
    }

    // NORMAL WIN - 0-3
    if (chance > 100 && chance < 600) {
      const candynum = await TrickorTreat.give(randomNumBet(0, 3), you.id);

      const candystring =
        candynum > 1 ? candynum + " candies" : candynum + " candy";

      let randomWin;

      if (candynum == 0) {
        randomWin = falsewins[Math.floor(Math.random() * falsewins.length)];
        await cmd.reply(`${randomWin}`);
        return;
      } else if (candynum > 1) {
        randomWin = wins[Math.floor(Math.random() * wins.length)].replace(
          "<AMOUNT>",
          candystring
        );
      } else {
        randomWin = singularwin[
          Math.floor(Math.random() * singularwin.length)
        ].replace("<AMOUNT>", candystring);
      }

      await cmd.reply(
        `${randomWin} You now have ${you.treats + candynum} :candy:`
      );

      return;
    }

    // Normal losses 1-8
    if (chance < 200 && chance > 11) {
      const candynum = await TrickorTreat.give(-randomNumBet(1, 8), you.id);

      const candystring =
        -candynum > 1 ? -candynum + " candies" : -candynum + " candy";

      const randomLoss = losses[
        Math.floor(Math.random() * losses.length)
      ].replace("<AMOUNT>", candystring);

      await cmd.reply(
        `${randomLoss} You now have ${
          you.treats < 0 ? 0 : you.treats + candynum
        } :candy:`
      );

      return;
    }

    // LOSE ALL CANDY
    if (chance > 1 && chance < 11) {
      const candynum = await TrickorTreat.setCandy(0, you.id);

      const randomLoss =
        totalfail[Math.floor(Math.random() * totalfail.length)];

      await cmd.reply(`${randomLoss} You now have ${candynum} :candy:`);

      return;
    }

    // YOU LOST
    if (chance == 1 || chance == 0) {
      const youlose = await TrickorTreat.playerLOSS(cmd.member.user.id);

      const story =
        YOULOSTTHEGAME[Math.floor(Math.random() * YOULOSTTHEGAME.length)];

      await cmd.reply(story);

      return;
    }
  }

  if (cmd.commandName == "bag") {
    const player = await TrickorTreat.getPlayer(cmd.member.user.id);

    if (!player) {
      await cmd.reply({
        content: "You must first go out trick or treating...",
        ephemeral: true,
      });
      return;
    }

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

      timestamp: new Date(),
    };
    embed;
    return await cmd.reply({ embeds: [embed], ephemeral: true });
  }

  if (cmd.commandName == "sugar-daddies") {
    /* I hate this code below for variable names. God forgive me. :') */
    const sugardaddies = await TrickorTreat.getPlayers({ lost: false }, [
      ["treats", "desc"],
    ]);

    let page = cmd.options.getInteger("page")
      ? cmd.options.getInteger("page")
      : 1;

    let boardpage = paginate(sugardaddies, 10, page);
    let pages = sugardaddies.length > 10 ? sugardaddies.length / 10 : 1;

    if (page > pages + 1 || page < 1) {
      page = 1;
    }

    if (sugardaddies.length % 10) {
      pages = Math.ceil(pages);
    }

    const index = sugardaddies.findIndex(
      (daddy) => daddy.id == cmd.member.user.id
    );

    const embed = {
      title: ":jack_o_lantern: Sugar Daddies :jack_o_lantern:",
      color: 0xcc5500,
      author: {
        name: client.user.username,
        icon_url: client.user.avatarURL(),
      },
      description: "Find out who the candy connoisseurs are.\n\n",
      footer: {
        text: `${page}/${pages} • You are ${
          index >= 0 ? "#" + (index + 1) + "." : "💀"
        }`,
      },
    };

    boardpage.forEach((daddy, index) => {
      var betterindex = page > 1 ? index + 10 * (page - 1) + 1 : index + 1;
      embed.description += `**${betterindex}.** - <@${daddy.id}> - ${
        daddy.lost == false ? daddy.treats + " :candy:" : ":skull:"
      }\n`;
    });

    cmd.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
