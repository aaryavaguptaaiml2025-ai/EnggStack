const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  userData: { type: Object },
  attempts: { type: Number, default: 0 },
  otpExpiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL: 10 minutes auto-cleanup
});

module.exports = mongoose.model("Otp", otpSchema);
