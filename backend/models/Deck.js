const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subject:   { type: String, default: "" },
  title:     { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

deckSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Deck", deckSchema);
