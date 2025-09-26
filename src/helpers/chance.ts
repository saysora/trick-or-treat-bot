import {randomInt} from 'node:crypto';

export function randomChance(min: number, max: number, mod = 0) {
  // Implement mod later
  return randomInt(min, max + 1) + mod;
}
