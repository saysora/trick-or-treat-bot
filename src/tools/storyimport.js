import { readFile } from 'node:fs/promises';

import { Database } from '../classes/Database.js';
import Story from '../db/Story.js';


async function main() {
  const db = new Database();
  db.connect();
  const stories = await readFile('./stories.json');

  const json = JSON.parse(stories);

  const storyItems = json.data;
  let insertedItems = 0;

  for (const item of storyItems) {
    const newItem = new Story({
      id: item.id,
      content: item.content,
      category: item.category
    });
    await newItem.save();
    insertedItems++;
    console.log(`Inserted ${insertedItems} items`);
  }

}

(async () => {
  await main();
})();
