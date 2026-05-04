const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User    = require("../models/User");
const { Stats } = require("../models/index");
const auth    = require("../middleware/auth");
const { generateOTP, sendOTPEmail } = require("../utils/mailer");
const Otp = require("../models/Otp");
const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

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

    // If email not configured, fail explicitly
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return res.status(500).json({ error: "Email not configured. Contact support." });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.deleteMany({ email: emailLower }); // clear existing
    await Otp.create({
      email: emailLower,
      otp,
      otpExpiry,
      userData: {
        name: name ? name.trim() : "User", email: emailLower, password,
        username: username ? username.trim() : undefined,
      }
    });
    await sendOTPEmail(emailLower, otp, name.trim());
    res.json({ ok: true, message: `Verification code sent to ${emailLower}` });
  } catch(e) {
    console.error("[Auth Route] send-otp error:", e);
    res.status(500).json({ error: e.message || "Failed to send email. Please try again later." });
  }
});

// ── Step 2: Verify OTP and create account ─────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and code required" });

    const emailLower = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: emailLower });
    
    if (!otpRecord) return res.status(400).json({ error: "No pending verification for this email. Please register again." });
    
    if (new Date() > otpRecord.otpExpiry) {
      await Otp.deleteOne({ email: emailLower });
      return res.status(400).json({ error: "Code expired. Please register again to get a new code." });
    }

    otpRecord.attempts = (otpRecord.attempts || 0) + 1;
    if (otpRecord.attempts > 5) {
      await Otp.deleteOne({ email: emailLower });
      return res.status(400).json({ error: "Too many wrong attempts. Please register again." });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
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
    if (e.code === 11000) return res.status(400).json({ error: "Account already exists." });
    console.error("verify-otp:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
router.post("/resend-otp", otpLimiter, async (req, res) => {
  try {
    const emailLower = req.body.email?.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: emailLower });
    if (!otpRecord) return res.status(400).json({ error: "No pending registration. Fill the form again." });
    
    const otp = generateOTP();
    otpRecord.otp = otp;
    otpRecord.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    otpRecord.attempts = 0;
    await otpRecord.save();
    
    await sendOTPEmail(emailLower, otp, otpRecord.userData?.name || "");
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
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    let user = await User.findOne({ email });
    if (!user) { 
      try {
        user = new User({ name: name || "User", email, googleId, googleAvatar: picture });
        await user.save();
        await ensureStats(user._id);
      } catch (err) {
        console.error("User save error:", err);
        return res.status(500).json({ error: "User creation failed" });
      }
    } else if (!user.googleId) { 
      try {
        user.googleId = googleId; 
        user.googleAvatar = picture; 
        await user.save(); 
      } catch (err) {
        console.error("User save error:", err);
        return res.status(500).json({ error: "User update failed" });
      }
    }
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
router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No account found with that email." });

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Email not configured. Contact support." });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save to User directly for reset password
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

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
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ error: "No pending password reset for this email." });
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

    if (user.otp !== otp.toString().trim()) {
      await user.save();
      return res.status(400).json({ error: "Wrong code. Try again." });
    }

    // Hash password inside User model pre-save hook
    user.password = newPassword;
    
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    
    try {
      await user.save();
    } catch (err) {
      console.error("User save error:", err);
      return res.status(500).json({ error: "User save failed" });
    }
    res.json({ ok: true, message: "Password reset successfully. You can now sign in." });
  } catch (e) {
    console.error("reset-password:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
