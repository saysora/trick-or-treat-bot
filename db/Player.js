const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  id: String,
  guild: String,
  fails: Number,
  treats: Number,
  attempts: Number,
  candylost: Number,
  latestAttempt: Date,
  lost: false,
});

module.exports = mongoose.model("Player", PlayerSchema);
