import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  content: String,
  category: String,
});

const Story = new mongoose.model("Story", StorySchema);

export default Story;
