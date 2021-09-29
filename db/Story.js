const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  content: String,
  category: String,
});

module.exports = new mongoose.model("Story", StorySchema);
