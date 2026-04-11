const router = require("express").Router();
const jwt    = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User   = require("../models/User");
const { Stats } = require("../models/index");
const auth   = require("../middleware/auth");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
<<<<<<< HEAD

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const safe = (u) => ({
  id:          u._id,
  name:        u.name,
  email:       u.email,
  username:    u.username,
  avatar:      u.avatar,
  avatarEmoji: u.avatarEmoji,
  googleAvatar:u.googleAvatar,
  theme:       u.theme,
  accentColor: u.accentColor,
  dailyGoalMins:   u.dailyGoalMins,
  dailyGoalPomos:  u.dailyGoalPomos,
  customQuotes:    u.customQuotes,
  notifyDeadlines: u.notifyDeadlines,
  notifyBreak:     u.notifyBreak,
  hasPin:      !!u.pin,
  hasPassword: !!u.password,
  hasGoogle:   !!u.googleId,
=======
const sign   = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const safe   = (u)  => ({ id:u._id, name:u.name, email:u.email, username:u.username,
  avatar:u.avatar, avatarEmoji:u.avatarEmoji, googleAvatar:u.googleAvatar,
  theme:u.theme, accentColor:u.accentColor,
  dailyGoalMins:u.dailyGoalMins, dailyGoalPomos:u.dailyGoalPomos,
  customQuotes:u.customQuotes, notifyDeadlines:u.notifyDeadlines, notifyBreak:u.notifyBreak,
  hasPin: !!u.pin, hasPassword: !!u.password, hasGoogle: !!u.googleId,
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
});

async function ensureStats(userId) {
  const exists = await Stats.findOne({ user: userId });
  if (!exists) await Stats.create({ user: userId });
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
<<<<<<< HEAD

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists)
      return res.status(400).json({ error: "Email already registered. Please sign in instead." });

    if (username) {
      const unameExists = await User.findOne({ username: username.trim() });
      if (unameExists)
        return res.status(400).json({ error: "Username already taken. Try another one." });
    }

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      username: username ? username.trim() : undefined,
    });

    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });

  } catch (e) {
    // Handle MongoDB duplicate key errors with friendly messages
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0];
      if (field === "email")    return res.status(400).json({ error: "Email already registered." });
      if (field === "username") return res.status(400).json({ error: "Username already taken." });
      return res.status(400).json({ error: "Account already exists with those details." });
    }
    console.error("Register error:", e);
    res.status(500).json({ error: e.message });
  }
=======
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    if (await User.findOne({ email })) return res.status(400).json({ error: "Email already registered" });
    if (username && await User.findOne({ username })) return res.status(400).json({ error: "Username taken" });
    const user = await User.create({ name, email, password, username: username||undefined });
    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
<<<<<<< HEAD
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user)
      return res.status(400).json({ error: "No account found with that email." });
    if (!user.password)
      return res.status(400).json({ error: "This account uses Google login. Please sign in with Google." });
    if (!(await user.comparePassword(password)))
      return res.status(400).json({ error: "Wrong password." });

    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: e.message });
  }
=======
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });
    if (!(await user.comparePassword(password))) return res.status(400).json({ error: "Invalid credentials" });
    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
<<<<<<< HEAD
    if (!credential)
      return res.status(400).json({ error: "No Google credential provided" });

    const gid = process.env.GOOGLE_CLIENT_ID;
    if (!gid || gid.includes("YOUR_"))
      return res.status(500).json({ error: "Google OAuth not configured on server. Add GOOGLE_CLIENT_ID to Render environment variables." });

    const ticket = await client.verifyIdToken({ idToken: credential, audience: gid });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ name, email, googleId, googleAvatar: picture });
      await ensureStats(user._id);
    } else {
      // Link Google to existing account
      if (!user.googleId) { user.googleId = googleId; user.googleAvatar = picture; await user.save(); }
    }

    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) {
    console.error("Google auth error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ── PIN Login ─────────────────────────────────────────────────────────────────
router.post("/pin-login", async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() }).select("+pin");
    if (!user || !user.pin)
      return res.status(400).json({ error: "No PIN set for this account. Set it in Settings." });
    if (!(await user.comparePin(pin)))
      return res.status(400).json({ error: "Wrong PIN." });
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
=======
    if (!credential) return res.status(400).json({ error: "No credential" });
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes("YOUR_"))
      return res.status(500).json({ error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID to backend/.env" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const picture = payload.picture;
    const name = payload.name || email.split("@")[0] || "User";

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        googleAvatar: picture
      });
      await ensureStats(user._id);
    } else if (!user.googleId) {
      user.googleId     = googleId;
      user.googleAvatar = picture;
      await user.save();
    }
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PIN login (lookup by email then verify PIN) ────────────────────────────────
router.post("/pin-login", async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email }).select("+pin");
    if (!user || !user.pin) return res.status(400).json({ error: "No PIN set for this account" });
    if (!(await user.comparePin(pin))) return res.status(400).json({ error: "Wrong PIN" });
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Me ─────────────────────────────────────────────────────────────────────────
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(safe(user));
<<<<<<< HEAD
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
=======
  } catch (e) { res.status(500).json({ error: e.message }); }
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
});

module.exports = router;
