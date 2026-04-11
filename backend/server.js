require("dotenv").config();
<<<<<<< HEAD
const express  = require("express");
const cors     = require("cors");
=======
const express = require("express");
const cors = require("cors");
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const app = express();

<<<<<<< HEAD
// ── CORS — accepts localhost + all Vercel preview/production URLs ─────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      "http://localhost:5173",
      "http://localhost:3000",
    ];

    // Add CLIENT_URL from env if set
    if (process.env.CLIENT_URL) allowed.push(process.env.CLIENT_URL);

    // Allow ANY vercel.app subdomain (covers preview deploys automatically)
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    // Allow exact matches
    if (allowed.includes(origin)) return callback(null, true);

    console.warn("CORS blocked:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60000, max: 20,
  message: { error: "Too many AI requests, slow down." },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/ai",        aiLimiter, require("./routes/ai"));
=======
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      "http://localhost:5173",
      "https://engg-stack-q018.vercel.app",
      "https://engg-stack.vercel.app",
      "https://engg-stack-qol8-qw05iqeo3-aaryavaguptaaiml2025-ais-projects.vercel.app",
      process.env.CLIENT_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

const aiLimiter = rateLimit({
  windowMs: 60000,
  max: 20,
  message: { error: "Too many AI requests, slow down." }
});

app.use("/api/auth",      require("./routes/auth"));
// app.use("/api/ai",     aiLimiter, require("./routes/ai"));
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
app.use("/api/stats",     require("./routes/stats"));
app.use("/api/user",      require("./routes/user"));
app.use("/api/deadlines", require("./routes/deadlines"));
app.use("/api/notes",     require("./routes/notes"));
app.use("/api/checklist", require("./routes/checklist"));
app.use("/api/timetable", require("./routes/timetable"));
app.use("/api/subjects",  require("./routes/subjects"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/export",    require("./routes/export"));

<<<<<<< HEAD
// Health check — also prevents "Cannot GET /" confusion
app.get("/",         (_, res) => res.json({ status: "EnggStack API is running" }));
app.get("/api/health",(_, res) => res.json({ status: "ok", time: new Date() }));

// ── DB + Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB failed:", err.message);
    // Still start server so health check works
    app.listen(PORT, () => console.log(`⚠️  Server on port ${PORT} (no DB)`));
  });
=======
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date() }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    startServer();
  })
  .catch(err => {
    console.error("❌ MongoDB ERROR FULL:", err);
    startServer();
  });

function startServer() {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
