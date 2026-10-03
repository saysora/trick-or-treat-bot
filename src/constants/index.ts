export enum ColorEnums {
  base = "#FF7518",
  win = "#F6B132",
  normWin = "#ffffff",
  barelyWin = "#01AC20",
  notReallyWin = "#43B7DF",
  loss = "#C75D64",
  totalLoss = "#844D99",
  dead = "#B30000",
  undead = "#54C571",
}

export const PAGE_LIMIT = 10;
export const DEFAULT_PAGE = 1;
export const REFRESH_CANDY_COST = 3;

export enum TIMELINE_EVENT {
  START = "started",
  GAIN = "gained",
  LOST = " lost",
  LOST_ALL = "lost all",
  NOTHING = "nothing",
  DIED = "died",
}

export enum StoryCategory {
  singularWin = "singularwin",
  win = "win",
  critWin = "critwin",
  falseWin = "falsewin",
  loss = "loss",
  totalLoss = "totalloss",
  gameover = "gameover",
}

export enum PlayerCommands {
  go_out = "go-out",
  trick_or_treat = "trick-or-treat",
  tot = "tot",
  refresh = "refresh-status",
  bp = "backpack",
  lb = "leaderboard",
  eat = "eat",
  help = "help",
}

export function candyPlur(num: number) {
  if (num === 1) {
    return "Candy";
  }
  return "Candies";
}

export const commandList = [
  {
    cmd: `/${PlayerCommands.go_out}`,
    description: "Use this command to begin trick-or-treating",
  },
  {
    cmd: `/${PlayerCommands.trick_or_treat}`,
    aliases: ["/tot"],
    description: "Gather candy",
  },
  {
    cmd: `/${PlayerCommands.refresh}`,
    description: `Eat ${REFRESH_CANDY_COST} of your own candy to refresh your status`,
  },
  {
    cmd: `/${PlayerCommands.bp}`,
    description: "Check your stats",
  },
  {
    cmd: `/${PlayerCommands.lb}`,
    description: "See who has the most candy",
  },
  {
    cmd: `/${PlayerCommands.eat}`,
    description: "...What is this?",
  },
  {
    cmd: `/${PlayerCommands.help}`,
    description: "List info and commands",
  },
];
