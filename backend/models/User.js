const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Core identity
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  username:     { type: String, unique: true, sparse: true, trim: true },
  password:     { type: String, select: false },
  googleId:     { type: String, unique: true, sparse: true },
  googleAvatar: { type: String, default: "" },

  // PIN login
  pin: { type: String, select: false },

  // Profile
  avatar:      { type: String, default: "" },
  avatarEmoji: { type: String, default: "🎓" },
  theme:       { type: String, default: "dark", enum: ["dark","midnight","forest","ocean","candy"] },
  accentColor: { type: String, default: "#4ade80" },

  // Goals & quotes
  dailyGoalMins:  { type: Number, default: 120 },
  dailyGoalPomos: { type: Number, default: 4 },
  customQuotes:   [{ type: String }],

  // Notifications
  notifyDeadlines: { type: Boolean, default: true },
  notifyBreak:     { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password and PIN before save
userSchema.pre("save", async function () {
  this.updatedAt = new Date();
  if (this.isModified("password") && this.password)
    this.password = await bcrypt.hash(this.password, 12);
  if (this.isModified("pin") && this.pin)
    this.pin = await bcrypt.hash(this.pin, 10);
});

userSchema.methods.comparePassword = function (p) { return bcrypt.compare(p, this.password); };
userSchema.methods.comparePin      = function (p) { return bcrypt.compare(p, this.pin); };

const User = mongoose.model("User", userSchema);

// ── Drop stale indexes from old schema versions ───────────────────────────────
// The old schema had a `uid` field that created a unique index.
// This migration runs once on startup and silently removes it.
User.collection.dropIndex("uid_1").catch(() => {
  // Index doesn't exist or already dropped — that's fine, ignore
});

module.exports = User;
