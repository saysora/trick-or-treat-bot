const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  id: String,
  guild: String,
  fails: {
    type: Number,
    default: 0,
  },
  treats: {
    type: Number,
    default: 0,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  candylost: {
    type: Number,
    default: 0,
  },
  latestAttempt: Date,
  lost: false,
});

module.exports = mongoose.model("Player", PlayerSchema);
