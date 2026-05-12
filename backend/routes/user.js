const router = require("express").Router();
const auth   = require("../middleware/auth");
const User   = require("../models/User");
const { Stats, Deadline, Note, ChecklistItem, TimetableEntry, Subject, Reminder } = require("../models/index");

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

// ── Data Export (Section 4.3) ─────────────────────────────────────────────────
router.get("/export", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [notes, deadlines, checklist, timetable, subjects, reminders, stats] = await Promise.all([
      Note.find({ user: userId }).sort({ updatedAt: -1 }),
      Deadline.find({ user: userId }).sort({ dueDate: 1 }),
      ChecklistItem.find({ user: userId }).sort({ createdAt: -1 }),
      TimetableEntry.find({ user: userId }).sort({ day: 1 }),
      Subject.find({ user: userId }).sort({ name: 1 }),
      Reminder.find({ user: userId }).sort({ fireAt: 1 }),
      Stats.findOne({ user: userId }),
    ]);

    const user = await User.findById(userId).select("name email username");

    res.json({
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email, username: user?.username },
      notes,
      deadlines,
      checklist,
      timetable,
      subjects,
      reminders,
      stats,
    });
  } catch (e) { next(e); }
});

module.exports = router;
