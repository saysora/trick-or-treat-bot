import {Sequelize} from 'sequelize';
import {ColorEnums, StoryCategory} from '../constants';
import Prompt from '../models/Prompt';
import {randomChance2} from './chance';
import PromptCategory from '../models/PromptCategory';

const critWin = 600;
const normWin = 200;
const normLoss = 11;
const totalLoss = 1;

// Candy
const lowPayout = 0;
const highPayout = 4;

const critLowPayout = 5;
const critHighPayout = 10;

export interface CategoryCandyAndColor {
  category: StoryCategory;
  candy: number;
  color: ColorEnums;
}

export function storyCategory(num: number): CategoryCandyAndColor {
  let category: StoryCategory;
  let color: ColorEnums;
  let candy = 0;

  switch (true) {
    case num >= critWin:
      category = StoryCategory.critWin;
      color = ColorEnums.win;
      candy = randomChance2(critLowPayout, critHighPayout);
      break;
    case num >= normWin && num < critWin:
      category = StoryCategory.win;
      color = ColorEnums.barelyWin;
      candy = randomChance2(lowPayout, highPayout);
      break;
    case num >= normLoss && num < normWin:
      category = StoryCategory.loss;
      color = ColorEnums.loss;
      candy = randomChance2(lowPayout + 1, critHighPayout);
      break;
    case num > totalLoss && num < normLoss:
      category = StoryCategory.totalLoss;
      color = ColorEnums.totalLoss;
      break;
    case num <= 1:
      category = StoryCategory.gameover;
      color = ColorEnums.totalLoss;
      break;
    default:
      category = StoryCategory.win;
      color = ColorEnums.base;
      candy = randomChance2(lowPayout, highPayout);
  }

  if (candy === 0 && category === StoryCategory.win) {
    category = StoryCategory.falseWin;
    color = ColorEnums.notReallyWin;
  }

  if (candy === 1) {
    category = StoryCategory.singularWin;
    color = ColorEnums.normWin;
  }

  return {
    category,
    candy,
    color,
  };
}

export async function storyByCategory(
  cat: StoryCategory,
): Promise<Prompt | null> {
  const story = await Prompt.findOne({
    include: [
      {
        model: PromptCategory,
        where: {
          name: cat,
        },
      },
    ],
    order: Sequelize.literal('random()'),
  });

  return story;
}
