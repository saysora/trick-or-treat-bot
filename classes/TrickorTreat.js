const mongoose = require("mongoose");
const Player = require("../db/Player");
// Get Moment JS soonish

class TrickorTreat {
  static async addPlayer(id, guild, treats = 0) {
    // if (this.players.find((p) => p.id == id)) return;

    const player = await Player.findOne({ id: id });

    if (player) return;

    const newplayer = await Player.create({
      id: id,
      guild: guild,
      tricks: 0,
      treats: treats,
      attempts: 0,
      lost: false,
      latestattempt: null,
    });

    return newplayer.id;
  }

  static async getPlayer(id) {
    const player = await Player.findOne({ id: id });

    if (!player) {
      return null;
    }

    return player;
  }

  static async getPlayers(filters = {}, sorts = []) {
    return await Player.find(filters).sort([...sorts]);
  }

  static async removePlayer(id) {
    const deleted = await Player.deleteOne({ id: id });

    if (!deleted) {
      return null;
    }

    // this.players = this.players.filter((p) => p.id !== id);

    return deleted;
  }

  static async attempt(userid) {
    const player = await Player.findOne({ id: userid });

    if (!player) return null;

    player.attempts = player.attempts + 1;
    player.save();

    return player;
  }

  static async give(amount, userid) {
    const player = await Player.findOne({ id: userid });

    if (!player) {
      return null;
    }

    player.treats = player.treats + amount;

    if (player.treats < 0) {
      player.treats = 0;
    }

    player.save();

    return amount;
  }

  static async setCandy(amount, userid) {
    const player = await Player.findOne({ id: userid });

    if (!player) return null;

    player.treats = amount;

    player.save();

    return amount;
  }

  static async playerLOSS(id) {
    const player = await Player.findOne({ id: id });

    if (!player) return null;

    player.lost = true;

    player.save();

    return player;
  }
}

module.exports = TrickorTreat;
