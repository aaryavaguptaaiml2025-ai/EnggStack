const router = require("express").Router();
const auth   = require("../middleware/auth");
const User   = require("../models/User");
const { Stats, Deadline, Note, ChecklistItem, TimetableEntry, Subject, Reminder } = require("../models/index");
const Deck   = require("../models/Deck");
const Card   = require("../models/Card");
const WeeklyReport = require("../models/WeeklyReport");
const ChatSession  = require("../models/ChatSession");

// Update profile / settings
router.patch("/profile", auth, async (req, res, next) => {
  try {
    const allowed = ["name","username","avatar","avatarEmoji","theme","accentColor",
                     "dailyGoalMins","dailyGoalPomos","customQuotes",
                     "notifyDeadlines","notifyBreak","soundEnabled"];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    // Username uniqueness
    if (update.username) {
      const clash = await User.findOne({ username: update.username, _id: { $ne: req.user.id } });
      if (clash) return res.status(400).json({ error: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    const safe = (u) => ({ id:u._id, name:u.name, email:u.email, username:u.username,
      avatar:u.avatar, avatarEmoji:u.avatarEmoji, googleAvatar:u.googleAvatar,
      theme:u.theme, accentColor:u.accentColor,
      dailyGoalMins:u.dailyGoalMins, dailyGoalPomos:u.dailyGoalPomos,
      customQuotes:u.customQuotes, notifyDeadlines:u.notifyDeadlines, notifyBreak:u.notifyBreak,
      soundEnabled:u.soundEnabled,
      hasPin:!!u.pin, hasPassword:!!u.password, hasGoogle:!!u.googleId,
    });
    res.json(safe(user));
  } catch (e) { next(e); }
});

// Change password
router.patch("/password", auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (user.password && !(await user.comparePassword(currentPassword)))
      return res.status(400).json({ error: "Current password is wrong" });
    user.password = newPassword;
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Set / change PIN
router.patch("/pin", auth, async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    const user = await User.findById(req.user.id);
    user.pin = pin;
    await user.save();
    res.json({ ok: true, message: "PIN set successfully" });
  } catch (e) { next(e); }
});

// Remove PIN
router.delete("/pin", auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { pin: 1 } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Data Export (Feature 5 — complete) ────────────────────────────────────────
router.get("/export", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [notes, deadlines, checklist, timetable, subjects, reminders, stats, decks, cards, reports] = await Promise.all([
      Note.find({ user: userId }).sort({ updatedAt: -1 }),
      Deadline.find({ user: userId }).sort({ dueDate: 1 }),
      ChecklistItem.find({ user: userId }).sort({ createdAt: -1 }),
      TimetableEntry.find({ user: userId }).sort({ day: 1 }),
      Subject.find({ user: userId }).sort({ name: 1 }),
      Reminder.find({ user: userId }).sort({ fireAt: 1 }),
      Stats.findOne({ user: userId }),
      Deck.find({ userId }).sort({ createdAt: -1 }),
      Card.find({ userId }).sort({ createdAt: -1 }),
      WeeklyReport.find({ userId }).sort({ weekEnd: -1 }),
    ]);

    const user = await User.findById(userId).select("name email username");
    const { xp, streak, totalMins } = stats || {};
    const level = xp ? Math.floor(xp / 500) : 0;

    res.json({
      exportDate: new Date().toISOString(),
      user: { name: user?.name, email: user?.email, username: user?.username, xp, level, streak },
      notes,
      deadlines,
      checklist,
      timetable,
      subjects,
      reminders,
      stats,
      flashcardDecks: decks,
      flashcardCards: cards,
      weeklyReports: reports,
    });
  } catch (e) { next(e); }
});

// ── Delete Account (Feature 5) ────────────────────────────────────────────────
router.delete("/account", auth, async (req, res, next) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user.id).select("+pin");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Require PIN confirmation if user has one set
    if (user.pin) {
      if (!pin) return res.status(400).json({ error: "PIN confirmation required" });
      const match = await user.comparePin(pin);
      if (!match) return res.status(400).json({ error: "Incorrect PIN" });
    }

    const userId = req.user.id;

    // Delete all user data from all collections
    await Promise.all([
      Note.deleteMany({ user: userId }),
      Deadline.deleteMany({ user: userId }),
      ChecklistItem.deleteMany({ user: userId }),
      TimetableEntry.deleteMany({ user: userId }),
      Subject.deleteMany({ user: userId }),
      Reminder.deleteMany({ user: userId }),
      Stats.deleteMany({ user: userId }),
      Deck.deleteMany({ userId }),
      Card.deleteMany({ userId }),
      WeeklyReport.deleteMany({ userId }),
      ChatSession.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ ok: true, message: "Account and all data deleted permanently" });
  } catch (e) { next(e); }
});

module.exports = router;
