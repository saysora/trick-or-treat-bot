import {Sequelize} from 'sequelize-typescript';
import Prompt from '../models/Prompt';
import PromptCategory, {CategoryName} from '../models/PromptCategory';
import {ColorEnums, randomChance} from '../constants';

interface GameStory {
  color: ColorEnums;
  category: string;
  content: string;
}

interface GamePromptRes {
  gain: boolean;
  amount: number;
  story: GameStory;
}

export default class StoryTeller {
  static async randPromptByCat(category: CategoryName, candyCount: number) {
    let candyTerm = 'CANDY';

    if (candyCount < 0) {
      candyCount *= -1;
    }

    if (candyCount > 1) {
      candyTerm = 'CANDIES';
    }

    const prompt = await PromptCategory.findOne({
      where: {
        name: category,
      },
      include: [
        {
          attributes: ['content'],
          model: Prompt,
          order: Sequelize.literal('random()'),
          limit: 1,
        },
      ],
    });

    if (!prompt) {
      throw new Error('No prompt for category found');
    }
    return {
      category: prompt.name,
      content: prompt.prompts?.[0].content.replace(
        /<AMOUNT>/g,
        `**${candyCount} ${candyTerm}**`
      ),
    };
  }

  static async gamePrompt(chance: number): Promise<GamePromptRes> {
    // Variables to consider with this
    let payout = 0;
    let storyColor: ColorEnums;
    let storyCategory: CategoryName;
    let lowPayout = 4;
    let hiPayout = 8;
    let gain = true;

    switch (true) {
      case chance >= 600: {
        storyCategory = CategoryName.critWin;
        storyColor = ColorEnums.win;
        break;
      }
      case chance >= 200 && chance < 600: {
        storyCategory = CategoryName.win;
        storyColor = ColorEnums.barelyWin;
        lowPayout = 0;
        hiPayout = 3;
        break;
      }
      case chance >= 11 && chance < 200: {
        storyCategory = CategoryName.loss;
        storyColor = ColorEnums.loss;
        lowPayout = 1;
        gain = false;
        break;
      }
      case chance > 1 && chance < 11: {
        storyCategory = CategoryName.totalLoss;
        storyColor = ColorEnums.totalLoss;
        break;
      }

      case chance <= 1: {
        storyCategory = CategoryName.gameover;
        storyColor = ColorEnums.dead;
        break;
      }

      default: {
        storyCategory = CategoryName.win;
        storyColor = ColorEnums.base;
      }
    }

    payout = randomChance(lowPayout, hiPayout).number;

    if (payout === 0 && storyCategory === CategoryName.win) {
      storyCategory = CategoryName.falseWin;
      storyColor = ColorEnums.notReallyWin;
    }

    if (payout === 1 && storyCategory === CategoryName.win) {
      storyCategory = CategoryName.singularWin;
      storyColor = ColorEnums.normWin;
    }

    const story = await this.randPromptByCat(storyCategory, payout);

    return {
      gain,
      amount: payout,
      story: {
        color: storyColor,
        ...story,
      },
    };
  }
}