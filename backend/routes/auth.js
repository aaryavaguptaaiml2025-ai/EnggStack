const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User    = require("../models/User");
const { Stats } = require("../models/index");
const auth    = require("../middleware/auth");
const { generateOTP, sendOTPEmail } = require("../utils/mailer");
const otpStore = require("../utils/otpStore");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sign   = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const safe = (u) => ({
  id:u._id, name:u.name, email:u.email, username:u.username,
  avatar:u.avatar, avatarEmoji:u.avatarEmoji, googleAvatar:u.googleAvatar,
  theme:u.theme, accentColor:u.accentColor,
  dailyGoalMins:u.dailyGoalMins, dailyGoalPomos:u.dailyGoalPomos,
  customQuotes:u.customQuotes, notifyDeadlines:u.notifyDeadlines, notifyBreak:u.notifyBreak,
  hasPin:!!u.pin, hasPassword:!!u.password, hasGoogle:!!u.googleId,
});

async function ensureStats(userId) {
  const e = await Stats.findOne({ user: userId });
  if (!e) await Stats.create({ user: userId });
}

// ── Step 1: Send OTP ──────────────────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const emailLower = email.toLowerCase().trim();

    if (await User.findOne({ email: emailLower }))
      return res.status(400).json({ error: "Email already registered. Please sign in instead." });
    if (username && await User.findOne({ username: username.trim() }))
      return res.status(400).json({ error: "Username already taken." });

    // If email not configured, skip OTP and create account directly
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn("GMAIL not configured — creating account without OTP");
      const user = await User.create({
        name: name.trim(), email: emailLower, password,
        username: username ? username.trim() : undefined,
      });
      await ensureStats(user._id);
      return res.json({ token: sign(user._id), user: safe(user), skipOTP: true });
    }

    const otp = generateOTP();
    otpStore.set(emailLower, otp, {
      name: name.trim(), email: emailLower, password,
      username: username ? username.trim() : undefined,
    });
    await sendOTPEmail(emailLower, otp, name.trim());
    res.json({ ok: true, message: `Verification code sent to ${emailLower}` });
  } catch(e) {
    console.error("[Auth Route] send-otp error:", e);
    if (e.message.includes("Invalid login") || e.message.includes("authentication")) {
      return res.status(500).json({ error: "Email authentication failed. Check GMAIL_USER and GMAIL_PASS on Render." });
    }
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

// ── Step 2: Verify OTP and create account ─────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and code required" });

    const result = otpStore.verify(email.toLowerCase().trim(), otp.toString().trim());
    if (!result.ok) return res.status(400).json({ error: result.reason });

    if (await User.findOne({ email: result.userData.email }))
      return res.status(400).json({ error: "Email already registered." });

    const user = await User.create(result.userData);
    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) {
    if (e.code === 11000) return res.status(400).json({ error: "Account already exists." });
    console.error("verify-otp:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const emailLower = req.body.email?.toLowerCase().trim();
    const entry = otpStore.get(emailLower);
    if (!entry) return res.status(400).json({ error: "No pending registration. Fill the form again." });
    const otp = generateOTP();
    otpStore.set(emailLower, otp, entry.userData);
    await sendOTPEmail(emailLower, otp, entry.userData?.name || "");
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) return res.status(400).json({ error: "No account found with that email." });
    if (!user.password) return res.status(400).json({ error: "This account uses Google login. Please sign in with Google." });
    if (!(await user.comparePassword(password))) return res.status(400).json({ error: "Wrong password." });
    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "No credential" });
    const gid = process.env.GOOGLE_CLIENT_ID;
    if (!gid || gid.includes("YOUR_"))
      return res.status(500).json({ error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID to Render." });
    const ticket = await client.verifyIdToken({ idToken: credential, audience: gid });
    const { sub: googleId, email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) { user = await User.create({ name, email, googleId, googleAvatar: picture }); await ensureStats(user._id); }
    else if (!user.googleId) { user.googleId = googleId; user.googleAvatar = picture; await user.save(); }
    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PIN Login ─────────────────────────────────────────────────────────────────
router.post("/pin-login", async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() }).select("+pin");
    if (!user || !user.pin) return res.status(400).json({ error: "No PIN set for this account." });
    if (!(await user.comparePin(pin))) return res.status(400).json({ error: "Wrong PIN." });
    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(safe(user));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Forgot Password — Send OTP ───────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No account found with that email." });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return res.status(500).json({ error: "Email not configured. Contact support." });
    }

    const otp = generateOTP();
    otpStore.set(`reset:${email}`, otp, { email });
    await sendOTPEmail(email, otp, user.name);
    res.json({ ok: true, message: `Reset code sent to ${email}` });
  } catch (e) {
    console.error("forgot-password:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Reset Password — Verify OTP and set new password ─────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: "Email, code, and new password are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const emailLower = email.toLowerCase().trim();
    const result = otpStore.verify(`reset:${emailLower}`, otp.toString().trim());
    if (!result.ok) return res.status(400).json({ error: result.reason });

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ error: "User not found" });

    user.password = newPassword;
    await user.save();
    res.json({ ok: true, message: "Password reset successfully. You can now sign in." });
  } catch (e) {
    console.error("reset-password:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
