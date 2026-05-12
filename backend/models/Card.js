const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  deckId:      { type: mongoose.Schema.Types.ObjectId, ref: "Deck", required: true, index: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  front:       { type: String, required: true },
  back:        { type: String, required: true },
  interval:    { type: Number, default: 1 },
  easeFactor:  { type: Number, default: 2.5 },
  dueDate:     { type: Date, default: Date.now },
  repetitions: { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

cardSchema.index({ deckId: 1, dueDate: 1 });
cardSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model("Card", cardSchema);
