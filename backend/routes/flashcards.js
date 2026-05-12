const router = require("express").Router();
const auth   = require("../middleware/auth");
const Deck   = require("../models/Deck");
const Card   = require("../models/Card");
const { Stats } = require("../models/index");

// ── SM-2 Algorithm ────────────────────────────────────────────────────────────
function sm2(card, rating) {
  const qualityMap = { 1: 1, 2: 3, 3: 4, 4: 5 };
  const quality = qualityMap[rating] ?? 1;

  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return { easeFactor, interval, repetitions, dueDate };
}

// ── Decks ─────────────────────────────────────────────────────────────────────

// Create deck
router.post("/decks", auth, async (req, res, next) => {
  try {
    const { title, subject } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    const deck = await Deck.create({ userId: req.user.id, title: title.trim(), subject: subject || "" });
    res.json(deck);
  } catch (e) { next(e); }
});

// List decks with due card count
router.get("/decks", auth, async (req, res, next) => {
  try {
    const decks = await Deck.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const now = new Date();

    // Get due counts for all decks in a single aggregation
    const dueCounts = await Card.aggregate([
      { $match: { userId: require("mongoose").Types.ObjectId.createFromHexString(req.user.id), dueDate: { $lte: now } } },
      { $group: { _id: "$deckId", count: { $sum: 1 } } },
    ]);
    const dueMap = {};
    dueCounts.forEach(d => { dueMap[d._id.toString()] = d.count; });

    // Get total counts
    const totalCounts = await Card.aggregate([
      { $match: { userId: require("mongoose").Types.ObjectId.createFromHexString(req.user.id) } },
      { $group: { _id: "$deckId", count: { $sum: 1 } } },
    ]);
    const totalMap = {};
    totalCounts.forEach(d => { totalMap[d._id.toString()] = d.count; });

    const result = decks.map(d => ({
      ...d,
      dueCount: dueMap[d._id.toString()] || 0,
      totalCards: totalMap[d._id.toString()] || 0,
    }));

    res.json(result);
  } catch (e) { next(e); }
});

// Delete deck (and all its cards)
router.delete("/decks/:id", auth, async (req, res, next) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deck) return res.status(404).json({ error: "Deck not found" });
    await Card.deleteMany({ deckId: deck._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Cards ─────────────────────────────────────────────────────────────────────

// Create card
router.post("/cards", auth, async (req, res, next) => {
  try {
    const { deckId, front, back } = req.body;
    if (!deckId || !front?.trim() || !back?.trim())
      return res.status(400).json({ error: "deckId, front, and back are required" });

    // Verify deck belongs to user
    const deck = await Deck.findOne({ _id: deckId, userId: req.user.id });
    if (!deck) return res.status(404).json({ error: "Deck not found" });

    const card = await Card.create({
      deckId,
      userId: req.user.id,
      front: front.trim(),
      back: back.trim(),
      dueDate: new Date(), // Due immediately for first review
    });
    res.json(card);
  } catch (e) { next(e); }
});

// Get due cards for a deck
router.get("/decks/:deckId/due", auth, async (req, res, next) => {
  try {
    const cards = await Card.find({
      deckId: req.params.deckId,
      userId: req.user.id,
      dueDate: { $lte: new Date() },
    }).sort({ dueDate: 1 }).limit(50);
    res.json(cards);
  } catch (e) { next(e); }
});

// Get all cards in a deck
router.get("/decks/:deckId/cards", auth, async (req, res, next) => {
  try {
    const cards = await Card.find({
      deckId: req.params.deckId,
      userId: req.user.id,
    }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (e) { next(e); }
});

// Review a card (SM-2)
router.post("/cards/:cardId/review", auth, async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (![1, 2, 3, 4].includes(rating))
      return res.status(400).json({ error: "Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)" });

    const card = await Card.findOne({ _id: req.params.cardId, userId: req.user.id });
    if (!card) return res.status(404).json({ error: "Card not found" });

    const updated = sm2(card, rating);
    card.easeFactor  = updated.easeFactor;
    card.interval    = updated.interval;
    card.repetitions = updated.repetitions;
    card.dueDate     = updated.dueDate;
    await card.save();

    // Award 5 XP per card reviewed
    let stats = await Stats.findOne({ user: req.user.id });
    if (!stats) stats = await Stats.create({ user: req.user.id });
    stats.xp = (stats.xp || 0) + 5;
    await stats.save();

    res.json({ card, xpEarned: 5, totalXp: stats.xp });
  } catch (e) { next(e); }
});

// Delete a card
router.delete("/cards/:cardId", auth, async (req, res, next) => {
  try {
    await Card.findOneAndDelete({ _id: req.params.cardId, userId: req.user.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
