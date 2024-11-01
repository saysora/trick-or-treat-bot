import {Op, Sequelize} from 'sequelize';
import Player from '../models/Player';
import {randomChance} from '../constants';

interface CreatePlayerProps {
  id: string;
  serverId: string;
}

export default class PlayerManager {
  static async getPlayer(id: string): Promise<Player | null> {
    const player = await Player.findByPk(id);
    if (!player) {
      return null;
    }
    return player;
  }

  static async getRandomLivingPlayer(id: string[]) {
    const player = await Player.findOne({
      where: {
        id: {
          [Op.notIn]: id,
        },
        isDead: false,
      },
      order: Sequelize.literal('random()'),
    });

    if (!player) {
      return null;
    }

    return player;
  }

  static async createPlayer(player: CreatePlayerProps): Promise<Player | null> {
    try {
      const newPlayer = await Player.create({
        id: player.id,
        serverId: player.serverId,
      });
      return newPlayer;
    } catch (e) {
      return null;
    }
  }

  static async removePlayer(id: string): Promise<number | null> {
    try {
      const removedPlayer = await Player.destroy({
        where: {
          id,
        },
      });
      return removedPlayer;
    } catch (e) {
      return null;
    }
  }

  static async givePlayerCandy(
    player: Player,
    amount: number
  ): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    player.candy += amount;

    await player.save();

    return player;
  }

  static async takePlayerCandy(
    player: Player,
    amount: number
  ): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    if (player.candy < amount) {
      player.lostCandyCount += player.candy;
      player.candy = 0;
    } else {
      player.candy -= amount;
      player.lostCandyCount += amount;
    }

    // Hard enforce always having at least 0 candies
    if (player.candy < 0) {
      player.candy = 0;
    }

    await player.save();
    return player;
  }

  static async eatOtherPlayerCandy(
    player: Player,
    target: Player,
    potentialVictim: Player
  ) {
    const chance = randomChance(0, 100).number;
    let actualTarget: Player;
    let success = false;

    switch (true) {
      case chance >= 90: {
        actualTarget = target;
        success = true;
        break;
      }
      case chance < 90 && chance >= 60: {
        actualTarget = potentialVictim;
        success = true;
        break;
      }
      default: {
        actualTarget = target;
        success = false;
      }
    }

    const eatenCandyCount = randomChance(0, 3).number;

    player.latestAttempt = new Date();
    player.gatherAttempts += 1;

    if (success) {
      if (eatenCandyCount > actualTarget.candy) {
        player.destroyedCandy += actualTarget.candy;
        actualTarget.lostCandyCount += actualTarget.candy;
        actualTarget.candy = 0;
      } else {
        actualTarget.candy -= eatenCandyCount;
        actualTarget.lostCandyCount += eatenCandyCount;
        player.destroyedCandy += eatenCandyCount;
      }
      await actualTarget.save();
    }

    await player.save();

    return {
      success,
      intendedTarget: target.id === actualTarget.id,
      eatenCandyCount,
      player,
      actualTarget,
    };
  }

  static async playerLoseAllCandy(player: Player): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    player.lostCandyCount += player.candy;
    player.candy = 0;
    player.allCandyLostCount += 1;

    await player.save();
    return player;
  }

  static async killPlayer(player: Player): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    player.lostCandyCount += player.candy;
    player.candy = 0;
    player.isDead = true;

    await player.save();
    return player;
  }

  static async playerLB(page = 1): Promise<{
    page: number;
    players: Player[]; //& {place: number}[];
    totalPages: number;
  }> {
    const limit = 10;
    const lbPage = page === 0 ? 0 : (page - 1) * limit;

    const {rows: players, count} = await Player.findAndCountAll({
      limit,
      offset: lbPage,
      order: [['candy', 'DESC']],
    });

    return {
      page: page === 0 ? 1 : page,
      players,
      totalPages: Math.ceil(count / limit),
    };
  }

  static async resetAll(): Promise<boolean> {
    try {
      await Player.destroy({where: {}});
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
