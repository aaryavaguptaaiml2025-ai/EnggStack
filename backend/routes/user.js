const router = require("express").Router();
const auth   = require("../middleware/auth");
const User   = require("../models/User");

// Update profile / settings
router.patch("/profile", auth, async (req, res) => {
  try {
    const allowed = ["name","username","avatar","avatarEmoji","theme","accentColor",
                     "dailyGoalMins","dailyGoalPomos","customQuotes",
                     "notifyDeadlines","notifyBreak"];
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
      hasPin:!!u.pin, hasPassword:!!u.password, hasGoogle:!!u.googleId,
    });
    res.json(safe(user));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Change password
router.patch("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (user.password && !(await user.comparePassword(currentPassword)))
      return res.status(400).json({ error: "Current password is wrong" });
    user.password = newPassword;
    await user.save();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Set / change PIN
router.patch("/pin", auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    const user = await User.findById(req.user.id);
    user.pin = pin;
    await user.save();
    res.json({ ok: true, message: "PIN set successfully" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove PIN
router.delete("/pin", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { pin: 1 } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
