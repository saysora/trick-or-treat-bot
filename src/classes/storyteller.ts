import {Sequelize} from 'sequelize-typescript';
import Prompt from '../models/Prompt';
import PromptCategory, {CategoryName} from '../models/PromptCategory';

export default class StoryTeller {
  static async randPromptByCat(category: CategoryName) {
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
      content: prompt.prompts?.[0].content,
    };
  }
}
