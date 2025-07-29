import {randomInt} from 'node:crypto';
import {randomChance} from '../constants';
export function newChance(min: number, max: number, mod?: number) {
  // Implement mod later
  return randomInt(min, max + 1);
}

const newChanceNums: number[] = [];
const oldChanceNums: number[] = [];
for (let i = 0; i < 100; i++) {
  newChanceNums.push(newChance(1, 1000));
  oldChanceNums.push(randomChance(1, 1000).number);
}
console.log(`New Chance Roll - ${newChanceNums.join()}`);
console.log(`Old Chance Roll - ${oldChanceNums.join()}`);
