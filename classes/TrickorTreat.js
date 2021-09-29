const mongoose = require("mongoose");
const Player = require("../db/Player");
const moment = require("moment");
// Get Moment JS soonish

class TrickorTreat {
  static async addPlayer(id, guild, treats = 0) {
    // if (this.players.find((p) => p.id == id)) return;

    const player = await Player.findOne({ id: id });

    if (player) return;

    const newplayer = await Player.create({
      id: id,
      guild: guild,
      fails: 0,
      treats: treats,
      candylost: 0,
      attempts: 0,
      lost: false,
      latestAttempt: moment().utc().format(),
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

  // static async attempt(userid) {
  //   const player = await Player.findOne({ id: userid });

  //   if (!player) return null;

  //   player.attempts = player.attempts + 1;
  //   player.save();

  //   return player;
  // }

  // static async candyLost(userid, amount) {
  //   const player = await Player.findOne({ id: userid });

  //   if (!player) return null;

  //   player.candylost = player.candylost + amount;

  //   return player;
  // }

  static async give(amount, userid) {
    const player = await Player.findOne({ id: userid });

    if (!player) {
      return null;
    }

    player.attempts = player.attempts + 1;
    player.treats = player.treats + amount;
    player.latestAttempt = moment().utc().format();

    if (player.treats < 0) {
      player.treats = 0;
    }

    player.save();

    return amount;
  }

  static async take(amount, userid) {
    const player = await Player.findOne({ id: userid });

    if (!player) return null;

    player.fails = player.fails + 1;
    player.attempts = player.attempts + 1;
    player.treats = player.treats - amount;
    player.candylost = player.candylost + amount;
    player.latestAttempt = moment().utc().format();

    if (player.treats < 0) {
      player.treats = 0;
    }

    player.save();

    return amount;
  }

  static async setCandy(amount, userid, candyloss = false) {
    const player = await Player.findOne({ id: userid });

    if (!player) return null;

    if (candyloss) {
      player.candylost = player.treats;
    }

    player.attempts = player.attempts + 1;
    player.treats = amount;
    player.latestAttempt = moment().utc().format();

    player.save();

    return amount;
  }

  static async playerLOSS(id) {
    const player = await Player.findOne({ id: id });

    if (!player) return null;

    player.candylost = player.candylost + player.treats;
    player.treats = 0;
    player.attempts = player.attempts + 1;
    player.lost = true;
    player.latestAttempt = moment().utc().format();

    player.save();

    return player;
  }
}

module.exports = TrickorTreat;
