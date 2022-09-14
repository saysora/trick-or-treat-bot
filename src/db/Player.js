import mongoose from "mongoose";

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

const Player = mongoose.model("Player", PlayerSchema);

export default Player;
