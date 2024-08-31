import {Repository} from 'sequelize-typescript';
import Player from '../models/Player';

interface CreatePlayerProps {
  id: string;
  serverId: string;
}

export default class PlayerManager {
  constructor(private playerRepo: Repository<Player>) {}

  async getPlayer(id: string): Promise<Player | null> {
    const player = await this.playerRepo.findByPk(id);
    if (!player) {
      return null;
    }
    return player;
  }

  async createPlayer(player: CreatePlayerProps): Promise<Player | null> {
    try {
      const newPlayer = await this.playerRepo.create({
        id: player.id,
        serverId: player.serverId,
      });
      return newPlayer;
    } catch (e) {
      return null;
    }
  }

  async removePlayer(id: string): Promise<number | null> {
    try {
      const removedPlayer = await this.playerRepo.destroy({
        where: {
          id,
        },
      });
      return removedPlayer;
    } catch (e) {
      return null;
    }
  }

  async givePlayerCandy(player: Player, amount: number): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    player.candy += amount;

    await player.save();

    return player;
  }

  async takePlayerCandy(player: Player, amount: number): Promise<Player> {
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

  async playerLoseAllCandy(player: Player): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    player.lostCandyCount += player.candy;
    player.candy = 0;
    player.allCandyLostCount += 1;

    await player.save();
    return player;
  }

  async killPlayer(player: Player): Promise<Player> {
    player.latestAttempt = new Date();
    player.gatherAttempts += 1;
    player.lostCandyCount += player.candy;
    player.candy = 0;
    player.isDead = true;

    await player.save();
    return player;
  }
}
