require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors({
  origin: "https://enggstack-q018.vercel.app",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
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
app.use("/api/stats",     require("./routes/stats"));
app.use("/api/user",      require("./routes/user"));
app.use("/api/deadlines", require("./routes/deadlines"));
app.use("/api/notes",     require("./routes/notes"));
app.use("/api/checklist", require("./routes/checklist"));
app.use("/api/timetable", require("./routes/timetable"));
app.use("/api/subjects",  require("./routes/subjects"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/export",    require("./routes/export"));

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