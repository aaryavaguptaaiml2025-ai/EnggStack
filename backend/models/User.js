const mongoose = require("mongoose");
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
  notifyDeadlines: { type: Boolean, default: true },
  notifyBreak:     { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
  this.updatedAt = new Date();
  if (this.isModified("password") && this.password)
    this.password = await bcrypt.hash(this.password, 12);
  if (this.isModified("pin") && this.pin)
    this.pin = await bcrypt.hash(this.pin, 10);
});

userSchema.methods.comparePassword = function (p) { return bcrypt.compare(p, this.password); };
userSchema.methods.comparePin      = function (p) { return bcrypt.compare(p, this.pin); };

module.exports = mongoose.model("User", userSchema);
