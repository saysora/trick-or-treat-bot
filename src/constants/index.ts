export enum ColorEnums {
  base = '#FF7518',
  win = '#F6B132',
  normWin = '#ffffff',
  barelyWin = '#01AC20',
  notReallyWin = '#43B7DF',
  loss = '#C75D64',
  totalLoss = '#844D99',
  dead = '#B30000',
  undead = '#54C571',
}

export const PAGE_LIMIT = 10;
export const DEFAULT_PAGE = 1;

export enum TIMELINE_EVENT {
  START = 'started',
  GAIN = 'gained',
  LOST = ' lost',
  LOST_ALL = 'lost all',
  NOTHING = 'nothing',
  DIED = 'died',
}

export enum StoryCategory {
  singularWin = 'singularwin',
  win = 'win',
  critWin = 'critwin',
  falseWin = 'falsewin',
  loss = 'loss',
  totalLoss = 'totalloss',
  gameover = 'gameover',
}

export function candyPlur(num: number) {
  if (num === 1) {
    return 'Candy';
  }
  return 'Candies';
}

export const commandList = [
  {
    cmd: '/go-out',
    description: 'Use this command to begin trick-or-treating',
  },
  {
    cmd: '/trick-or-treat',
    aliases: ['/tot'],
    description: 'Gather candy',
  },
  {
    cmd: '/backpack',
    description: 'Check your stats',
  },
  {
    cmd: '/leaderboard',
    description: 'See who has the most candy',
  },
  {
    cmd: '/eat',
    description: '...What is this?',
  },
  {
    cmd: '/help',
    description: 'List info and commands',
  },
];
