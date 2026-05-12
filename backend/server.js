require("dotenv").config();

// ── ENV VALIDATION (Section 1.7) ──────────────────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "OPENAI_API_KEY", "GOOGLE_CLIENT_ID"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var: ${key}`);
    process.exit(1);
  }
}

const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const helmet   = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// ── Security Headers (Section 1.1) ────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://accounts.google.com", process.env.FRONTEND_URL || "https://engg-stack.vercel.app"].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── CORS — explicit whitelist only (Section 1.2) ──────────────────────────────
const ALLOWED_ORIGINS = [
  "https://engg-stack.vercel.app",
  "https://engg-stack-qol8.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
// Add FRONTEND_URL / CLIENT_URL from env if set
if (process.env.FRONTEND_URL) ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
if (process.env.CLIENT_URL)   ALLOWED_ORIGINS.push(process.env.CLIENT_URL);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn("CORS blocked:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// ── Rate limiting (Section 1.4) ───────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip, // per-user if authenticated
  message: { error: "Too many AI requests. Try again in an hour." },
});

// ── DB Connection (Serverless Friendly) ───────────────────────────────────────
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGO_URI) { console.error("❌ MONGO_URI is not defined"); return; }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    if (process.env.NODE_ENV !== "production") console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
};

// Ensure DB connects before handling requests in Serverless
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    await connectDB();
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/ai",        aiLimiter, require("./routes/ai"));
app.use("/api/stats",     require("./routes/stats"));
app.use("/api/user",      require("./routes/user"));
app.use("/api/deadlines", require("./routes/deadlines"));
app.use("/api/notes",     require("./routes/notes"));
app.use("/api/checklist", require("./routes/checklist"));
app.use("/api/timetable", require("./routes/timetable"));
app.use("/api/subjects",  require("./routes/subjects"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/export",      require("./routes/export"));
app.use("/api/friends",     require("./routes/friends"));
app.use("/api/flashcards",  require("./routes/flashcards"));
app.use("/api/reports",     require("./routes/reports"));

// Health check — also prevents "Cannot GET /" confusion
app.get("/",         (_, res) => res.json({ status: "Cognit API is running" }));
app.get("/api/health",(_, res) => res.json({ status: "ok", time: new Date() }));

// ── Global Error Handling (Section 3.2) ───────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ── Server Start ──────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
  });
}

// ── Vercel Export ─────────────────────────────────────────────────────────────
module.exports = app;
