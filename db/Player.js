const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  id: String,
  guild: String,
  tricks: Number,
  treats: Number,
  attempts: Number,
  latestAttempt: Date,
  lost: false,
});

module.exports = mongoose.model("Player", PlayerSchema);
