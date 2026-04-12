// In-memory OTP store — works fine for single-instance servers (Render free tier)
// Each entry: { otp, expires, userData }
const store = new Map();

const OTP_TTL = 10 * 60 * 1000; // 10 minutes

module.exports = {
  set(email, otp, userData) {
    store.set(email.toLowerCase(), {
      otp,
      expires: Date.now() + OTP_TTL,
      userData,
      attempts: 0,
    });
  },

  get(email) {
    return store.get(email.toLowerCase()) || null;
  },

  verify(email, otp) {
    const entry = store.get(email.toLowerCase());
    if (!entry) return { ok: false, reason: "No pending verification for this email. Please register again." };
    if (Date.now() > entry.expires) {
      store.delete(email.toLowerCase());
      return { ok: false, reason: "Code expired. Please register again to get a new code." };
    }
    entry.attempts++;
    if (entry.attempts > 5) {
      store.delete(email.toLowerCase());
      return { ok: false, reason: "Too many wrong attempts. Please register again." };
    }
    if (entry.otp !== otp.toString()) return { ok: false, reason: "Wrong code. Try again." };
    store.delete(email.toLowerCase());
    return { ok: true, userData: entry.userData };
  },

  delete(email) {
    store.delete(email.toLowerCase());
  },
};
