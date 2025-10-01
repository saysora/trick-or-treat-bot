import {Sequelize} from 'sequelize';
import {ColorEnums, StoryCategory} from '../constants';
import Prompt from '../models/Prompt';
import {randomChance} from './chance';
import PromptCategory from '../models/PromptCategory';

const critWin = 700;
const normWin = 400;
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
    // Big Win
    case num >= critWin:
      category = StoryCategory.critWin;
      color = ColorEnums.win;
      candy = randomChance(critLowPayout, critHighPayout);
      break;
    // Norm win
    case num >= normWin && num < critWin:
      category = StoryCategory.win;
      color = ColorEnums.barelyWin;
      candy = randomChance(lowPayout, highPayout);
      break;
    // Loss
    case num >= normLoss && num < normWin:
      category = StoryCategory.loss;
      color = ColorEnums.loss;
      candy = randomChance(lowPayout + 1, critLowPayout);
      break;
    // Total Loss
    case num > totalLoss && num < normLoss:
      category = StoryCategory.totalLoss;
      color = ColorEnums.totalLoss;
      break;
    // Dedge
    case num <= 1:
      category = StoryCategory.gameover;
      color = ColorEnums.totalLoss;
      break;
    default:
      category = StoryCategory.win;
      color = ColorEnums.base;
      candy = randomChance(lowPayout, highPayout);
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
