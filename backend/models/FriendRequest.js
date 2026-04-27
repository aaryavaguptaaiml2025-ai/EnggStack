const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema({
  from:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, default: "pending", enum: ["pending", "accepted", "rejected"] },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate requests
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("FriendRequest", friendRequestSchema);
