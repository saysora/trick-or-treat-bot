import Story from "../db/Story";

export class Storyteller {
  // Create a story
  static async addStory(category, thestory) {
    const story = await Story.find({ content: thestory, category: category });
    const numOfStories = await Story.countDocuments();
    if (!thestory) return null;

    const newstory = await Story.create({
      id: numOfStories + 1,
      content: thestory,
      category,
    });

    return newstory;
  }

  // Edit a story
  static async editStoryContent(id, newcontent) {
    const story = await Story.findOne({ id });

    if (!story) return null;

    story.content = newcontent;

    story.save();

    return story;
  }

  // Edit a story category
  static async editStoryCategory(id, newcategory) {
    const story = await Story.findOne({ id });

    if (!story) return null;

    story.category = newcategory;

    story.save();

    return story;
  }

  static async deleteStory(id) {
    const story = await Story.deleteOne({ id });

    if (!story) return null;

    return story;
  }

  static async getStory(id) {
    const story = await Story.findOne({ id });

    if (!story) return null;

    return story;
  }

  static async randomStoryByCat(category) {
    const count = await Story.countDocuments({ category });

    if (!count) return null;

    const randomStoryNum = Math.floor(Math.random() * count);

    const randomstory = await Story.findOne({ category }).skip(randomStoryNum);

    if (!randomstory) return null;

    return randomstory;
  }

  static async getCategories() {
    const cats = [];

    const stories = await Story.find();

    if (!stories) {
      return null;
    }

    stories.forEach((story) => {
      if (!cats.includes(story.category)) {
        cats.push(story.category);
      }
    });

    return cats;
  }

  // static async countStoriesByCat() {
  //   const cats = [];

  //   const stories = await Story.find();

  //   if (!stories) {
  //     return null;
  //   }

  //   stories.forEach((story) => {
  //     if (!cats.includes(story.category)) {
  //       cats.push(story.category);
  //     }
  //   });

  // }

  static async countStories(category) {
    const count = await Story.countDocuments({ category });

    if (!count) {
      return 0;
    }

    return count;
  }
}
