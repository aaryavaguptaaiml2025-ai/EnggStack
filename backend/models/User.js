const mongoose = require("mongoose");
<<<<<<< HEAD
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
=======
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Core identity
  name:         { type: String, required: false, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  username:     { type: String, unique: true, sparse: true, trim: true },
  password:     { type: String, select: false },        // null for Google-only users
  googleId:     { type: String, unique: true, sparse: true },
  googleAvatar: { type: String, default: "" },

  // PIN login (4-digit, hashed)
  pin:          { type: String, select: false },

  // Profile / Personalization
  avatar:       { type: String, default: "" },          // base64 or URL
  avatarEmoji:  { type: String, default: "🎓" },
  theme:        { type: String, default: "dark", enum: ["dark","midnight","forest","ocean","candy"] },
  accentColor:  { type: String, default: "#4ade80" },

  // Study goals & quotes
  dailyGoalMins:   { type: Number, default: 120 },
  dailyGoalPomos:  { type: Number, default: 4 },
  customQuotes:    [{ type: String }],

  // Notification prefs
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
  notifyDeadlines: { type: Boolean, default: true },
  notifyBreak:     { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

<<<<<<< HEAD
// Hash password and PIN before save
=======
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
userSchema.pre("save", async function () {
  this.updatedAt = new Date();
  if (this.isModified("password") && this.password)
    this.password = await bcrypt.hash(this.password, 12);
  if (this.isModified("pin") && this.pin)
    this.pin = await bcrypt.hash(this.pin, 10);
});

userSchema.methods.comparePassword = function (p) { return bcrypt.compare(p, this.password); };
userSchema.methods.comparePin      = function (p) { return bcrypt.compare(p, this.pin); };

<<<<<<< HEAD
const User = mongoose.model("User", userSchema);

// ── Drop stale indexes from old schema versions ───────────────────────────────
// The old schema had a `uid` field that created a unique index.
// This migration runs once on startup and silently removes it.
User.collection.dropIndex("uid_1").catch(() => {
  // Index doesn't exist or already dropped — that's fine, ignore
});

module.exports = User;
=======
module.exports = mongoose.model("User", userSchema);
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
