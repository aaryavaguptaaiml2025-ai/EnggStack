const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User    = require("../models/User");
const { Stats } = require("../models/index");
const auth    = require("../middleware/auth");
const { generateOTP, sendOTPEmail } = require("../utils/mailer");
const Otp = require("../models/Otp");
const rateLimit = require("express-rate-limit");

// ── Rate limiters ─────────────────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests. Please try again after 15 minutes." }
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sign   = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── Hash OTP with SHA-256 before storing ──────────────────────────────────────
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp.toString()).digest("hex");
}

// ── Safe user projection (never leak secrets) ─────────────────────────────────
const safe = (u) => ({
  id:u._id, name:u.name, email:u.email, username:u.username,
  avatar:u.avatar, avatarEmoji:u.avatarEmoji, googleAvatar:u.googleAvatar,
  theme:u.theme, accentColor:u.accentColor,
  dailyGoalMins:u.dailyGoalMins, dailyGoalPomos:u.dailyGoalPomos,
  customQuotes:u.customQuotes, notifyDeadlines:u.notifyDeadlines, notifyBreak:u.notifyBreak,
  soundEnabled:u.soundEnabled,
  hasPin:!!u.pin, hasPassword:!!u.password, hasGoogle:!!u.googleId,
});

// ── Ensure stats doc exists ───────────────────────────────────────────────────
async function ensureStats(userId) {
  const e = await Stats.findOne({ user: userId });
  if (!e) await Stats.create({ user: userId });
}

// ── Friendly error wrapper ────────────────────────────────────────────────────
function friendlyError(e) {
  if (e.message?.includes("validation")) return "Something went wrong. Please try again.";
  if (e.code === 11000) return "Account already exists.";
  return e.message || "An unexpected error occurred.";
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION FLOW (2-step: send-otp → verify-otp)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Step 1: Send OTP ──────────────────────────────────────────────────────────
router.post("/send-otp", otpLimiter, async (req, res) => {
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

    if (!process.env.RESEND_API_KEY) {
      console.error("[Auth] RESEND_API_KEY not configured");
      return res.status(500).json({ error: "Email service not configured. Contact support." });
    }

    const otp = generateOTP();

    await Otp.deleteMany({ email: emailLower });
    await Otp.create({
      email: emailLower,
      otp: hashOtp(otp),
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      userData: {
        name: (name || "User").trim(),
        email: emailLower,
        password,
        username: username ? username.trim() : undefined,
      }
    });

    await sendOTPEmail(emailLower, otp, (name || "User").trim());
    res.json({ ok: true, message: `Verification code sent to ${emailLower}` });
  } catch(e) {
    console.error("[Auth] send-otp error:", e);
    res.status(500).json({ error: "Failed to send verification email. Please try again." });
  }
});

// ── Step 2: Verify OTP and create account ─────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and code required" });

    const emailLower = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: emailLower });

    if (!otpRecord)
      return res.status(400).json({ error: "No pending verification. Please register again." });

    if (new Date() > otpRecord.otpExpiry) {
      await Otp.deleteOne({ email: emailLower });
      return res.status(400).json({ error: "Code expired. Please register again." });
    }

    otpRecord.attempts = (otpRecord.attempts || 0) + 1;
    if (otpRecord.attempts > 5) {
      await Otp.deleteOne({ email: emailLower });
      return res.status(400).json({ error: "Too many wrong attempts. Please register again." });
    }

    if (otpRecord.otp !== hashOtp(otp)) {
      await otpRecord.save();
      return res.status(400).json({ error: "Wrong code. Try again." });
    }

    await Otp.deleteOne({ email: emailLower });

    if (await User.findOne({ email: otpRecord.userData.email }))
      return res.status(400).json({ error: "Email already registered." });

    const user = await User.create(otpRecord.userData);
    await ensureStats(user._id);
    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) {
    console.error("[Auth] verify-otp error:", e);
    res.status(500).json({ error: friendlyError(e) });
  }
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
router.post("/resend-otp", otpLimiter, async (req, res) => {
  try {
    const emailLower = req.body.email?.toLowerCase().trim();
    if (!emailLower) return res.status(400).json({ error: "Email is required" });

    const otpRecord = await Otp.findOne({ email: emailLower });
    if (!otpRecord) return res.status(400).json({ error: "No pending registration. Please register again." });

    const otp = generateOTP();
    otpRecord.otp = hashOtp(otp);
    otpRecord.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    otpRecord.attempts = 0;
    await otpRecord.save();

    await sendOTPEmail(emailLower, otp, otpRecord.userData?.name || "User");
    res.json({ ok: true, message: "New code sent!" });
  } catch(e) {
    console.error("[Auth] resend-otp error:", e);
    res.status(500).json({ error: "Failed to resend code. Please try again." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Email/Password Login ──────────────────────────────────────────────────────
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
  } catch(e) {
    console.error("[Auth] login error:", e);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "No credential provided" });

    const gid = process.env.GOOGLE_CLIENT_ID;
    if (!gid || gid.includes("YOUR_"))
      return res.status(500).json({ error: "Google OAuth not configured on server." });

    const ticket = await client.verifyIdToken({ idToken: credential, audience: gid });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        name: name || "User",
        email: email.toLowerCase(),
        googleId,
        googleAvatar: picture || "",
      });
      await user.save();
      await ensureStats(user._id);
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.googleAvatar = picture || "";
      await user.save();
    }

    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) {
    console.error("[Auth] google error:", e);
    res.status(500).json({ error: "Google login failed. Please try again." });
  }
});

// ── PIN Login (Section 1.3 — strict rate limiter) ─────────────────────────────
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});
router.post("/pin-login", pinLimiter, async (req, res) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ error: "Email and PIN required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+pin");
    if (!user || !user.pin) return res.status(400).json({ error: "No PIN set for this account." });
    if (!(await user.comparePin(pin))) return res.status(400).json({ error: "Wrong PIN." });

    res.json({ token: sign(user._id), user: safe(user) });
  } catch(e) {
    console.error("[Auth] pin-login error:", e);
    res.status(500).json({ error: "PIN login failed. Please try again." });
  }
});

// ── Me (current user) ────────────────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(safe(user));
  } catch(e) {
    console.error("[Auth] me error:", e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD FLOW (2-step: forgot-password → reset-password)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Forgot Password — Send OTP ───────────────────────────────────────────────
router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email }).select("+otp +otpExpiry +otpAttempts");
    if (!user) return res.status(400).json({ error: "No account found with that email." });

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Email service not configured. Contact support." });
    }

    const otp = generateOTP();

    user.otp = hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(email, otp, user.name || "User");
    res.json({ ok: true, message: `Reset code sent to ${email}` });
  } catch (e) {
    console.error("[Auth] forgot-password error:", e);
    res.status(500).json({ error: "Failed to send reset code. Please try again." });
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
    const user = await User.findOne({ email: emailLower }).select("+otp +otpExpiry +otpAttempts +password");

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ error: "No pending password reset. Please request a new code." });
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ error: "Code expired. Please request a new one." });
    }

    user.otpAttempts = (user.otpAttempts || 0) + 1;
    if (user.otpAttempts > 5) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ error: "Too many wrong attempts. Please request a new code." });
    }

    if (user.otp !== hashOtp(otp)) {
      await user.save();
      return res.status(400).json({ error: "Wrong code. Try again." });
    }

    // Set new password (hashed via pre-save hook) and clear OTP fields
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({ ok: true, message: "Password reset successfully. You can now sign in." });
  } catch (e) {
    console.error("[Auth] reset-password error:", e);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

module.exports = router;
