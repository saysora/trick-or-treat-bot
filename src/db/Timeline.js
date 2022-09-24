import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  candyNum: Number,
  time: Date,
  eventType: String,
});

const TimelineSchema = new mongoose.Schema(
  {
    playerId: String,
    events: [EventSchema],
  },
  {
    timestamps: true,
  }
);

const Timeline = mongoose.model("Timeline", TimelineSchema);

export default Timeline;
