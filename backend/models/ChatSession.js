const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "New Chat" },
  messages: [{
    role: { type: String, required: true, enum: ["user", "assistant", "system"] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
