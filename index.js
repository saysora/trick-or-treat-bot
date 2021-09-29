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
  "You try to reach the top of the kitchen cabinet, feeling a crinkled wrapper you stand on your toes to pull down a dusty Butterfinger.",
  "You grab your trick or treat bag and realize there's a chocolate bar left inside.",
  "You notice a floating cube with a question mark on it. You hit it and out pops a single chocolate coin!",
  "You're cleaning out your old highschool backpack, between some binders you find a pack of Nerds.",
  "You did not succumb to the bad luck. You get one candy.",
  "You get a lollipop for good behavior!",
  "You survive jigsaws trap and come home with a new will to live. He leaves you a piece of candy on your pillow as a reward.",
  "Your teacher hands out a piece of candy to the entire class for halloween.",
  "Your dog brings you a candy covered in slobber. He sure loves you.",
  "Your friend opens a bag of M&Ms in front of you. You stare at him until he hands you a single M&M.",
  "You're cleaning out your old trick or treat bag, a single gumball rolls out. Best not to question how long that's been in there... Probably a few Halloweens...",
  "You find a piece of candy wedged between the car seats on your way over to your friends house.",
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
  "While trick or treating at your science teachers house, he teaches you how to make your own candy! You gain <AMOUNT>.",
  "You meet up at your friends house to go trick or treating together. Their mom gives you <AMOUNT> candy to start the night.",
  "You and your friends visit that spooky house at the end of the street. You find <AMOUNT> of candy left by other scared kids.",
  "There was a hole in someone else's trick or treat bag. You pick up <AMOUNT> scattered on the ground.",
  "The little kids are so terrified of your costume that they drop <AMOUNT>. More for you.",
  "Doc appears before you in the DeLorean from Back to the Future. He throws you a bag with <AMOUNT> in it.",
  "You spammed the Trickster too hard and it got confused. It puts an extra <AMOUNT> in your bag.",
  "Someone comes up to you and compliments your well-timed doot meme. They also give you <AMOUNT>.",
  "You find <AMOUNT> in your loaf of bread by some means of witchcraft. Odd.",
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
  "You find a hidden door behind your grandfather's old wooden closet. Opening the door ...it's just a wooden closet inside but you find <AMOUNT>.",
  "You and your friend stumble upon a party where they all love your costumes, they award you winners of the party and give you <AMOUNT>! Look at you go.",
  "Your friends hot mom loves your costume and slips you <AMOUNT>. Maybe keep that first part to yourself.",
  "Your entire garden of candy plants finally grew! You harvest <AMOUNT>.",
  "You catch your friend doing something they shouldn’t be. They give you <AMOUNT> candy to keep quiet.",
  "You were one of the few survivors of camp crystal lake. The police give you <AMOUNT> to never speak of it again.",
  "You raid area 51 with a hundred other nerds but you're the only one who makes it inside. You didn't see any aliens but you find <AMOUNT>.",
  "Your classmates thought it would be funny to dump pigs blood on you during your Prom Queen acceptance speech. You didn’t think it was very funny and take <AMOUNT> from them.",
  "You follow some drunk old man through a green portal, it takes you to a world of candy! You grab <AMOUNT> before going back through the portal.",
  "You look up and see a shooting star. You call into the heavens that you could use a wish right now. <AMOUNT> falls from the sky in response.",
  'You just saw Joe Biden fall down a flight of stairs. You help him up and he writes you a check for <AMOUNT>. "Thank you, son."',
  "You found all 8 of slendermans pages! You gain <AMOUNT> and survive... for now.",
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
  "You spend too much time making your costume perfect and are late to Trick or Treat! You lose <AMOUNT>.",
  "You forgot the chant and a blue-masked fox swipes <AMOUNT> from you.  Damn it Swiper.",
  "A blue hedgehog speeds through the neighborhood pick pocketing <AMOUNT> and knocking you over.",
  "Your mom misheard your costume request and got you a rat costume instead of a Batman costume. The neighborhood rats thinking you are their king swarm you and take <AMOUNT>.",
  "A troll comes into main and yoinks <AMOUNT> with their candy grabber.",
  "A bat flies in your hair! You drop <AMOUNT> in your panic to get it out!",
  "Your cat knocks your drink onto <AMOUNT>. They are unsalvageable.",
  "You get into a fight on your way over to your friends house. Luckily they only take <AMOUNT> and not your whole bag.",
  "After clicking on a Nitro Giveaway link, your computer comes to life and steals <AMOUNT> from your bag. Sucks to suck.",
  "Your zombie friend Ted CRAVES BRAINS... But he'll settle for <AMOUNT> instead.",
  "You just got braces and cant have any caramel. You give <AMOUNT> to your sibling.",
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
  "The house you trick or treated at has a 'take one please' candy basket! ... But it's empty. Damn greedy goblins.",
  "You go trick or treating at Mystery Inc house. Shaggy and Scooby give you a Scooby snack since they ate all the candy before you got there.",
  "Grandma forgot her glasses and tripped while walking to the door. You get no candy... Oh and poor Grandma.",
  'You knock on the door, a woman opens up the door but you hear a few children laughing and playing in the background. You lean to the side and see behind her an entire family enjoying dinner together. The woman smiles and says "Would you like to join us for dinner?" They didn\'t have any candy to give you.',
  "You walk up to a decrepit house to get some candy. The basket on the porch is empty so you knock on the door. Behind you there are a bunch of men dressed up as police officers. Their costumes are very realistic. When the door opens, the police arrest the man. The worst part is you got no candy.",
  "Your friend invites you over to play Candyland. Unfortunately the board is not made of candy like you thought. Talk about false advertising.",
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
  "A gang in a funky van foil your spoopy halloween plans. They unmask you and take ALL your loot. You would've gotten away with it too if out weren't for those pesky kids.",
  "Your friends find out you’ve been plotting to steal their candy. They take ALL YOUR CANDY and their friendship along with it. How Sad.",
  "You hear a sudden **VWOOP** behind you. As soon as you turn to see what it is, an ENDERMAN makes off with all your candy! Did't they only like grass blocks?",
  "Your sibling gets upset that you won't trade candy with them. They throw your ENTIRE bag into the street where it is run over by a car. Talk about timing.",
  "Your sibling takes and wastes ALL of your Halloween candy JUST to get Tik-Tok famous. UGH!",
  "A witch steals ALL of your candy to refurnish her house. At least she didn't eat you.",
  "Your mom was right too much candy does rot your teeth. You no longer can eat ANY of your candy after that root canal.",
  "You give up all your candy to get your soul back from a demon. Why you made that deal in the first place, nobody knows.",
  "On your way home you stumble across a note. You continue to find notes along your journey home.  You only find six before reaching your destination. Slenderman is not pleased by this and takes ALL your candy.",
  "ALL of your candy was taken to the upside-down by a Demogorgon. At least Will has a sweet treat for later.",
  '"Beetle Juice, Beetle Juice Beetle Juice!" you summon him and he turns ALL your candy into dancing shrimp.',
  "You take a trip to candy mountain with some colorful friends only to be knocked unconscious. You wake up to a missing kidney and ALL your candy stolen. Some friends.",
];

// ABSOLUTE LOSS

const YOULOSTTHEGAME = [
  "You put your alien mask on. You know the one; that cool one that glows in the dark. You're gonna be the coolest kid in town, lighting up neon green under every blacklight along your trick or treating route. You grab your super cool X files pillow case. Yes, X files is cool... Shut up, random inside voice that's always trying to keep you down. This is your night. You run out into the dark, weaving through masses of kids, raking in all kinds of candy. Your bag is almost full...You got tons of compliments and all feels right in the world. It's getting kind of late, and you're getting kind of hungry. As you walk home, you pull out a snickers bar, cause when you're hungry, you're kind of a Xenomorph. You get this feeling you're being watched... You look behind you. A shadow quickly shuffles into the nearby bushes. Better check it out. What could go wrong? You follow the strange figure.. It's really short.. It must be a little lost kid. You pull out your phone to use the flashlight.. but it's dead. That's weird.. you barely used it tonight. You suddenly realize you don't know where you are. A bright light flashes above you and an unseen force starts to lift you up into the sky.... You wake up in your bed. Your X files pillowcase is empty and covered in a strange slime. Your butthole also feels kinda sore.\n**Guess it wasn't your night after all.**",
  "This year you're ready. No matter what they do you're gonna make it safely home with your bag of candy. This time you have all the right gear. You put on football pads under your Robin Hood costume, complete with a mask. Armor and a disguise.. If they don't know it's you under the mask.. they cant prey on you. Protection.. Check. You strap on your super soaker pistols filled with vinegar and tie your cabbage juice water balloons to your belt. They only like sweets.. and they hate vegetables. One spritz in the eyes and they should scatter. Weaponry.. Check. Finally, we need backup. You get the harness and the leash for Killer, your new Rottweiler. The tiny creeps don't stand a chance. Confident, and ready for action, you exit your house. You keep a lookout, but so far no signs of the enemy... 2 blocks of candy down.. Still the coast is clear. Dare you hope that this year they might have chosen someone else? As the night progresses with no incident, you relax and start to enjoy yourself. Your bag is filled nicely but you're getting tired. It's safe to say you can finally enjoy your Halloween the way it was meant to be enjoyed.. Time to go home and dig into your prize. You climb your porch steps and put the keys into the lock. OW! You look down.. A fork! How did they find home base? You reach for your pistol but it's already too late. They're everywhere. You hear the clicking of a hundred tiny wooden legs as the garden gnomes surround you. You call to Killer for help, but the dog just licks his balls. They beat you senseless and take your candy.\n**Serves you right.**",
  "You wake up in an unfamiliar room inside a bathtub. As you begin to shift your foot catches on a drain plug, unplugging it. The water starts to drain, and a small light flickers on. The room itself is pitch black, but you still just barely make out a key and another person in the dark. As you lift yourself out of the tub and fall onto the floor,  you cough and gasp from the shock of it all. You manage to get to your feet, but as you move forward you realize your ankle is chained to something. You feel your way in the dark to a pipe in the corner. You then reach down to pulling at the chain that is attached to it. you cry out, frantic, frightened, and a bit hysterical:  Help! Someone help me! (you stop when you hear a loud dragging sound somewhere in the room. You look out into the darkness and calls out.) Is someone there? (You turn back to the corner where you are chained, and say in a slightly softer but still panicked voice) Shit, Im probably dead. Suddenly, from out within the darkness comes a mans voice:\n**I want to play a game.**",
  "It's been a great year. The war looks like its finally coming to an end and the troops are coming home. Everyone is full of hope, and in celebration, stocking up on candy. As I'm putting on my survivor costume makeup, I analyze it with a critical eye. Is this too Mad Max or is it more like The Walking Dead. I paint on some more dirt stains and get out my fake machete. Machete's work for every doomsday right? I stroll out the house with my dirty duffel bag and head to the best neighborhood in town to get the good stuff. As I strut from house to house, I make a big show of squaring off with every alien, vampire, or fellow survivor costume I see. Most people are fun and play along. My bag fills up, and so does my mood. As I'm heading home I notice some people looking up at the sky and talking fearfully. What's that? Bright streaks are zooming.. This way. A family behind me calls to me. \"Get inside quick! We have a shelter!\" I was about to ask what they were talking about, when the father grabs me by the arm and drags me inside. I'm quickly ushered to the basement. I start to object and he slams the lid shut and locks it. \"Hey, you can't ju....\" BOOM. The bunker shakes and dust falls from the ceiling. A radio in the back crackles and I hear. \"They lied. They promised a cease fire and what we got were nu...\". The radio fizzles out. Nukes?! We all look at each other in horror. The family realizes they're about to share their rations with a stranger. I realize I dropped my bag of candy when the father grabbed me.\n**It's the end, but at least I'm dressed for the part.**",
  `Your friend Marcus Halberstam offers drinks at his place after a long night of drinking at the bar and he wont take no for an answer.\n"Come on, you dumb son of a bitch."\nHe says as he helps you into your jacket. "I've got a preview of the Barneys catalogue and a bottle of Absolut waiting for us."\nYou get to the apartment and notice the living room floor has been meticulously covered with newspaper. You slump drunkenly in a white Eames chair, a glass in hand as Halberstam is looking through his CDs.\n"You like Huey Lewis and the News?" he asks.\n"They're okay." you respond.\n"Their early work was a little too New Wave for my taste. But then Sports came out in 1983, I think they really came into their own, commercially and artistically." Halberstam states as he walks to his bathroom.\n"The whole album has a clear, crisp sound and a new sheen of consummate professionalism that gives the songs a big boost." Halberstam comes back out and walks to the foyer.\n"He's been compared to Elvis Costello but I think Huey has a more bitter, cynical sense of humor."\nYou absent-mindedly leaf through the Barneys catalogue only half listening.\n"Hey, Halberstam?"\n"Yes?"\n"Why are there copies of the Style section all over the place? Do you have a dog? A chow or something?"\n"No."\n"Is that a raincoat?"\n"Yes, it is."\nHe moves to the CD player. and takes a CD out of its case and slides it in the machine. Then states "In 87 Huey released this, Fore!, their most accomplished album. I think their undisputed masterpiece is "HiP To Be Square," a song so catchy that most people probably don't listen to the lyrics. But they should because it's not just about the pleasures of conformity and the importance of trends. It's also a personal statement about the band itself."\nHe walked behind you as he spoke.\n"HEY PAUL!"\nAs you turn around to question him since, well your name isn't Paul, you are greeted with **AN AXE TO THE FACE.**`,
  "It's Halloween baby, and you're ready to bag more than candy. You've been invited to the biggest party this year and a costume is mandatory. Chicks dig vampires, so it was a no-brainer. You grab a black satin pillowcase thinking it would best suit your look. Why not trick or treat on the way there? You might also meet some honeys with a fang fetish on the way. As you swagger from house to house, you notice a group of girls walking along behind you. They're all wearing black, dark makeup, and very flattering heels. Giggling and whispering among each other, they can't seem to keep their eyes off you. You give them a wink and wonder if you should just go on over, but a large family passes between you and you lose them somehow. Damn, lost your chance for a cute goth girlfriend. You swivel around and keep going. Just another block to the party. You can hear the house up ahead; people laughing, music blaring. Heck yeah, it's party time. A few drinks later...You get into the groove, dancing to the music and you glance over to the stairs. The girls! You grab your sack of candy and dig out three lollipops. \"Hey ladies, can I interest you in something delicious...Other than me of course.\" They giggle and look at each other. Then one of them grabs you by the collar and starts to drag you upstairs. YES, you knew you were getting more than candy tonight. They push you into a room and walk inside seductively, closing the door behind them. \"Whoa ladies, slow down, there's plenty of me to go around and the night is young.\" Their eyes all start to glow green, and their mouths open. They hiss and long fangs start to slide out of their gums. You start to panic and then one of them speaks. **\"Tonight, we are the trick... and you are the treat.**\"",
  "\"It's a full moon mom, I don't need a flashlight! There's plenty of streetlights anyway!\". Your mother just throws her hands up and fills up the empty plastic jack o lantern for the trick or treaters. \"Why would you listen to me, I'm only your mother, who birthed you at a great sacrifice to her bodily beauty.\" You roll your eyes and grab a grocery bag. \"I have a phone. It has a light. It's fine.\" You hear her take in a deep breath \"You expect people to give you candy when you're not even in a cos-\". You walk out the door and slam it before she can \"mom\" at you anymore. No costume, no problem. You live in a generous neighborhood. You'll tell them something philosophical like \"I am the future me. The me that gets straight A's and is great at sports.\" And they'll eat it up.. Like candy. Straight A's? Yeah Halloween is about the fantasy, alright. You saunter down the street and start your regular route. You get a few raised eyebrows but nobody turns you down. It was a fruitful evening. Your bag is heavy and so are your eyelids. Time to head home. Porch lights start going out and a fog starts setting in. Uh oh, guess it is getting dark. You pull out your phone but can't see much in the haze. You accidentally take a photo and notice something strange in the mist. Is that.. a dog? You peer into the dark where your phone was aimed, and a pair of bright yellow eyes stare back at you. Oh the hell with that, You've seen this movie. You start running. **Unfortunately the werewolf runs faster...**",
  'Your dad turns on the news and immediately turns it back off. "It\'s nothing but those doomsday people on again, saying tonight is the end. You be careful out there with those nutters about.. and behave." You just shake your head and strap on your wings. "Don\'t worry dad, this isn\'t just a costume. I\'ll be the epitome of grace." You give him your most angelic smile and he chuckles. You\'re going classic but with a twist tonight using a plastic jack o\' lantern pail that also lights up. You switch it on and head out. Lovely. You start skipping down the street, careful to avoid the strange people in white robes holding candles in groups. They looked like the people on tv. Their eyes follow you as you pass. "Prepare yourself, child." You just nod and duck your head, quickening the pace. You wander around the neighborhood, no particular plan of candy collection, and start visiting houses. A man at the door casually mentions to his wife as he\'s closing the door. "Hey I thought we had more candy than this." It does look pretty busy this year; people must be running out quick. You look down at your pail and you could swear it looked emptier than it did a few minutes ago. Strange. At the next house you see a little girl crying. "Someone stole it all mommy!" The concerned mother just looks around. "Who sweetie?" It\'s rude to stare so you keep walking but hold your pail closer. Apparently you have to be wary of thieves now. At the next house a kind lady extends her bowl to you, and as you are reaching in to grab your favorite candy.. It disappears in front of your eyes. The woman gasps and drops the bowl. The candy spills out.. And each one simply vanishes, one after the other. Behind you- you hear cries of alarm as others watch their candy disappear. A group of robed people raise their arms and shout.. **"BEHOLD THE CANDY RAPTURE!"**',
  "You know this sounds crazy.. but you've lived this day a thousand times and it always ends the same. You wake up, go to your classes, go home, put on my Marty McFly outfit, check your danger map, and make for the streets. It's Halloween and you don't care how many times you have to do this, you are going to get it right this time. You're going to make it home with your candy. You've been chased, beaten, kidnapped, even fallen into manholes... but not today. You draw out your neighborhood map and start labelling the incidents. No you can't take that route, at 8pm a rabid dog shows up and attacks you every time. AHA! You write up a cheat sheet with times and a route. Looking at it, you'd think a madman had done it, but this is going to be the key to success. You head out and start zigzagging; hitting one house in a neighborhood and then jumping backyards into a new one. You're keeping good time. Your bag is filling gloriously. For three hours, you're running with barely any breaks. This is the longest you've ever made it without something happening. You spot the greedy goblin troupe and duck behind a corner. You think you've pushed your luck. Time to head home. The later it gets the more goblins will show up. You've become a master of the night. Silent, watchful. You slink home, careful to evade all notice. You know to avoid the front porch since that's where the giant spider always ambushes you. You tumble across my backyard, staying low. I throw open my back door and slam it closed behind me. I stand there for a few minutes... Breathing heavily. Is this it? \"Am I finally free of this time loop?\" you whisper. You become distinctly aware of the heaviness of my candy bag. You open it up to reach in and partake of your prize... but instead of candy there's a black mamba. It bites you and you hit the floor, wracked with pain. A tall figure with horns and hoofed feet steps out of a shadowy corner of the living room. \"This isn't a time loop, you fool. It's a hell loop.\" **He laughs maniacally as you lose consciousness...**",
  'You\'ve just returned to your house after trick or treating. You and your friends made a pact this year that you would pool all of your candy and share it together. You also decided to all wear animal costumes. Roger is a gorilla, Peter is a pig, and you\'re a bear. For fun you leave your costumes on and start dumping your candy into a big pile on the table. Peter tries to grab one on the sly but Roger slaps his hand away. "I\'ve been thinking guys. I have the best costume, so clearly I think the majority of the candy should go to me." Oh no he didn\'t. Peter starts to object. "That\'s not wh-". Roger flicks him on the nose, interrupting him. "Shut up piggy, let the alphas talk." He looks at you. Although Roger\'s always been a little bit of a bully, this is definitely out of the norm and you\'re not sure how to handle it. "We had a deal Roger. We split it 3 ways. Trades are acceptable, but its gotta be even", you say. "Fine," say\'s Roger. "It\'ll be an even number... but I get first dibs." Peter snorts. "No way, Roger. That\'s bullsh-". Roger decks him. "Whoa! Let\'s not go all Lord of the Flies here, fellas." But it was too late. They start wailing on each other. In the scuffle they fall through the screen door and roll onto the grass. Roger takes a large rock from your fire pit. "Roger, no!". You couldn\'t stop him in time. He bashes Peter\'s head in and turns to you. You slump to the ground in shock. He stands up... holding the bloody rock. "Sorry," says Roger. **"Can\'t have any witnesses".**',
  "It's been a long day. You've just clocked out of work for Sunshine Cleaners. Nothing more depressing than cleaning other people's dishes and toilets all day. Thankfully, tonight is Halloween and nothing raises the spirit like sugar. You head home. A quick shower and You get into your astronaut costume. \"Tragic news tonight, as Nasa reports an explosion on the international space station..\" You switch off the radio. Oof, that sucks. It looks like you chose an unfortunate costume but it's too late to change it now. You agreed to meet with your friends in town at about 8:30, but it's still early, so why not do some trick or treating in the mean time. You get a phone alert from your news app. \"Debris from exploded space station..\" You close the app. You know its a tragedy and all but you really need to have a good time tonight, and this is too much of a bummer. You do some trick or treating and get tons of compliments on your costume. Mood restored and candy gained, you go to the meetup spot outside the mall where your friends are going to be. You're about to go for a mini snickers when you hear your name. You look up and smile as two of your friends approach from the parking lot. They wave excitedly and you wave back. In the middle of the street they suddenly stop, looking up and behind you. You turn around and a fiery streak is heading... straight for you! You drop the candy and start running. You hear an impact. You friends come running towards you. \"I'm ok,\" you say. \"Look! It's fine haha\". You reach out as they approach and they... run right through You. You turn and look. They're standing in front of a small crater looking in. You walk up and look inside. Your mangled corpse is in the center of the crater. A fiery... toilet seat... hit you? Your reaper grabs you by the shoulder. **\"Sorry honey, that's a shitty way to go.\"**",
  'You walk up to Granny Teodora\'s house. She\'s not your granny, but that\'s what everyone in the neighborhood calls her. You ring the doorbell and wait impatiently. You can hear her slowly shuffling to the door. "Come on, lady, trick or treat!". The door creaks open and a waft of strange spices and incense hits your nose. Like usual she\'s in some kind of bohemian getup. "Here you go, young one." She drops what looks like a homemade bag of raisins into your bag. "What the hell is this? Don\'t you know Halloween is about candy?" Teodora\'s eyes narrow and she looks at you as if for the first time. "You\'re a nasty one, aren\'t you?" She reaches into her pockets, pulling out some kind of dust. Before you can stop her, she blows it into your face, chants something in a language you\'ve never heard, and slams the door shut. "Psycho, old lady!" You cough and swipe the dust from your eyes. Wait till your dad hears about this. Whatever, you have a lot more houses to hit. You get back to trick or treating. The next house is where your friend lives. You bet his mom will give you the good stuff. You get to the door and shout the magic words. She appears at the door and smiles warmly. "Look who it is! Here have your favorite." She drops a king size bar into your bag. "I knew I could count on you Mrs... Mrs..." She looks mildly  offended that you\'ve forgotten her name but waves and shuts the door. That\'s weird, you\'ve known her all your life. Why would you forget her name? Wait... What\'s your name? Actually... Where are you? You look down and see a strange.. Thing in your grip.. Filled with... What are those? You let go of it and walk a few steps... Ooo shiny... Your mind goes blank and you stand staring into a nearby street lamp, **drooling on yourself...**',
  "One of your neighbors recently said they think they're being haunted. Tonight, on Halloween, your dad is going to go investigate. Why? Because he's a bonified ghost hunter. He says that Halloween is the best night of the year to score some ghost action. You asked him if you could come with him, but he said that the best way you could help is to just enjoy yourself trick or treating, and bring him back some candy. Before you took off for the night, you swiped one of his EVP recorders. EVP stands for electronic voice phenomena. You may not be able to go with him on his own hunt, but maybe you can get into one of your own. If you find something good, maybe he'll let you join his crew. You head straight for the richest neighborhood in your town. They usually shell out for the best candy. The costumes are killer this year and you have a great time. As you're walking along, you set eyes on the spookiest house you've ever seen in your life. This has got to have ghosts in it. You try the handle on the front door and of course it's locked. Maybe there's another way in. You tip toe around the back and put your face up to the back window. Peering inside, you see a white figure gliding across the room. The figure turns towards you. You hold your breath and duck. After a few moments, you slowly raise your head to look again.. Right in front of the window, a pale face looks directly into yours. She screams! You scream! Someone calls the cops! Apparently it wasn't a ghost, just a lady wrapped in a bed sheet. You apologize but the cops arrest you for trespassing and accuse you of being a peeping tom. As you sit in the back of the cop car, the EVP recorder switches on. A ghostly voice whispers from beyond the grave...**\"Save the pervert stuff for when you're dead, dude. Then no one can see you.\"**",
  "For the last couple weeks you've noticed something strange about your cat. You often catch her watching you, menacingly, from dark corners and shadowy doorways. You mentioned this to your family but they seem to have no idea what you're talking about. There have also been a number of strange cats hanging around the house that you know don't belong to your neighbors. You catch her glaring again and try to ignore it. Tonight is Halloween and it's all about having fun and collecting candy, not being paranoid that your cat is out to get you. Amusingly, you chose a black cat costume for tonight's trick or treating adventure. You grab your black muslin bag for your treats and head out into the neighborhood. After only a few houses, you notice an alarming number of cats about. Some of them even seem to be following you. Well, maybe they think you're their cat deity, you laugh to yourself. A few more houses down and you spot your cat. What the hell? She's supposed to be at home. You better get her back there as soon as possible before one of these weird cats hurts her. You walk up slowly, trying not to startle her, but she runs around the corner of a house. \"Wait! Here kitty kitty! It's time to come home.\" You round the corner after her and find her standing in the middle of a small park for children. Etched into the sand is a strange diagram. She sits at the center expectantly. You carefully squat down next to her and reach to pick her up. Then you see it. You're surrounded by cats of all kinds, their eyes staring intently. Ouch! You look down to see your cat has scratched you. As the blood runs, the other cats draw closer. They begin to yowl and hiss. All at one they pounce, shredding you everywhere. You fall into the sand and your blood pools into the scratched out symbol in the sand. You hear a hissing voice in your head. **\"Thank you, human, for being the sacrifice to my great return. The return of the goddess BASTET.\"**",
  'After working on the presidential campaign with Ted Cruz for 4 months, you have been noticed by him. He approaches you. "You\'ve been doing great work and I\'d like to take you out for dinner as a show of thanks." You are honored by his offer and accept. Before going, he asks you to accompany him to his office. You follow him through the halls and follow him into his office. He asks you, "Would you like a drink?" You accept this offer. He tells you to take a seat. As you sit down, you hear the lock on the door click. A devious chuckle escapes Ted\'s mouth. "Oops. That just slipped out." Cold sweat drips down your face as you go pale, scared of what\'s to come. "Why are you locking the door," you ask. He laughs. "It\'s a wonderful time of year, isn\'t it?" You nod nervously and respond. "Yeah, my birthday is in a few days." You turn around in the chair just in time to see him shiver in pleasure before responding. "Yes, it is your birthday soon. How perfect." He snaps his fingers and you hear a click. Looking down, your wrists are now clamped to the chair. In your panic, you yell. "I THOUGHT THOSE WERE JUST RUMOURS!" Ted giggles. "No one will hear you here. But no, those are not rumors. **I am the Zodiac Killer.**"',
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

  await client.user.setPresence({
    activities: [{ name: "with each and every one of you..." }],
  });
});

client.on("messageCreate", async (msg) => {
  if (!["890794962353029130", "84695051535384576"].includes(msg.author.id))
    return;

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

  const msgcmdfilter = (m) => m.author.id === msg.author.id;

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
      await msg.channel.send("You must send a message");
      return;
    }

    const storyanswer = storychoice.first().content;

    console.log(args[0]);

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
    embed.footer = {
      text: "Story ID: " + storyToUpdate.id,
    };

    msg.channel.send({ embeds: [embed] });
    return;
  }

  // Edit category

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
      title: "Trick or Treat",
      color: 0xcc5500,
    };

    const player = await TrickorTreat.addPlayer(
      cmd.member.user.id,
      cmd.guild.id
    );

    if (!player) {
      embed.description = "You are already trick or treating.";

      await cmd.editReply({ embeds: [embed] });
      return;
    }

    embed.description = `Do be careful out there, <@${player}>...`;

    await cmd.editReply({ embeds: [embed] });

    return;
  }

  if (cmd.commandName == "trick-or-treat") {
    // Defer to edit after processing
    await cmd.deferReply();

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
      const randomwin = criticalwin[
        Math.floor(Math.random() * criticalwin.length)
      ].replace("<AMOUNT>", `**${candystring}**`);

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
        randomwin = falsewins[Math.floor(Math.random() * falsewins.length)];
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
        randomwin = wins[Math.floor(Math.random() * wins.length)].replace(
          "<AMOUNT>",
          `**${candystring}**`
        );
      } else {
        // Otherwise change the embed with the single win color and update randomwin to be one of those stories
        embed.color = 0x24768c;
        randomwin = singularwin[
          Math.floor(Math.random() * singularwin.length)
        ].replace("<AMOUNT>", `**${candystring}**`);
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
      const randomLoss = losses[
        Math.floor(Math.random() * losses.length)
      ].replace("<AMOUNT>", `**${candystring}**`);

      // Update the embed
      embed.color = 0xef4136;
      embed.description = `${cmd.member} ${randomLoss}`;
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
      const randomLoss =
        totalfail[Math.floor(Math.random() * totalfail.length)];

      // Update embed
      embed.color = 0x645278;
      embed.description = `${cmd.member} ${randomLoss}`;
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
      const story =
        YOULOSTTHEGAME[Math.floor(Math.random() * YOULOSTTHEGAME.length)];

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
        )
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
