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

export const randomChance = (min: number, max: number) => {
  return {
    min,
    number: Math.floor(Math.random() * (max - min + 1) + min),
    max,
  };
};

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
