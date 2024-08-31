import 'dotenv/config';
import moment = require('moment');

export enum ColorEnums {
  base = '#FF7518',
  win = '#F6B132',
  normWin = '#ffffff',
  barelyWin = '#01AC20',
  notReallyWin = '#43B7DF',
  loss = '#C75D64',
  totalLoss = '#844D99',
  dead = '#B30000',
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
