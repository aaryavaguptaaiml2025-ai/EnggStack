const router  = require("express").Router();
const auth    = require("../middleware/auth");
const OpenAI  = require("openai");
const User    = require("../models/User");
const { Stats, Deadline } = require("../models/index");
const WeeklyReport = require("../models/WeeklyReport");
const { sendEmail } = require("../utils/mailer");

// ── Generate report for a single user ─────────────────────────────────────────
async function generateReportForUser(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Aggregate stats
  const stats = await Stats.findOne({ user: userId });
  const weeklyMins = stats?.weeklyMins || [0, 0, 0, 0, 0, 0, 0];
  const totalMinsThisWeek = weeklyMins.reduce((a, b) => a + b, 0);

  // Get heatmap data for the week
  const heatmap = stats?.heatmap || new Map();
  let sessionsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    if (heatmap.get?.(key) > 0) sessionsThisWeek++;
  }

  // Subject breakdown from subjectTime
  const subjectTime = stats?.subjectTime || new Map();
  const subjectBreakdown = [];
  if (subjectTime.forEach) {
    subjectTime.forEach((mins, subjectId) => {
      subjectBreakdown.push({ subject: subjectId, mins });
    });
  }

  // Deadlines
  const allDeadlines = await Deadline.find({
    user: userId,
    dueDate: { $gte: weekAgo, $lte: now },
  });
  const deadlinesDone = allDeadlines.filter(d => d.done).length;
  const deadlinesMissed = allDeadlines.filter(d => !d.done).length;

  // Build AI prompt
  const prompt = `You are an AI study coach. A student had the following week:
- Total study time: ${totalMinsThisWeek} minutes (${Math.round(totalMinsThisWeek / 60 * 10) / 10} hours)
- Study sessions: ${sessionsThisWeek} out of 7 days
- Current streak: ${stats?.streak || 0} days
- XP earned this week: ~${totalMinsThisWeek + (stats?.pomodoros || 0) * 30}
- Deadlines completed: ${deadlinesDone}, missed: ${deadlinesMissed}
- Subjects studied: ${subjectBreakdown.length > 0 ? subjectBreakdown.map(s => `${s.subject}: ${s.mins}min`).join(", ") : "No subject data"}

Give exactly 3 specific, actionable improvement recommendations. Each should be 1-2 sentences. Be encouraging but honest. Format as a JSON array of 3 strings.
Example: ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
Return ONLY the JSON array, no other text.`;

  let aiRecommendations = [
    "Try to study at least 30 minutes every day to build consistency.",
    "Focus on your weakest subjects first during peak energy hours.",
    "Use the Pomodoro technique to maintain focus during longer sessions."
  ];

  // Try to get AI recommendations
  const key = process.env.OPENAI_API_KEY;
  if (key && !key.includes("YOUR_")) {
    try {
      const openai = new OpenAI({ apiKey: key });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = completion.choices[0]?.message?.content || "";
      const parsed = JSON.parse(raw.trim());
      if (Array.isArray(parsed) && parsed.length >= 3) {
        aiRecommendations = parsed.slice(0, 3);
      }
    } catch (e) {
      console.error("AI report generation failed, using defaults:", e.message);
    }
  }

  const summary = `Week of ${weekAgo.toLocaleDateString("en-IN")} — ${now.toLocaleDateString("en-IN")}: ${Math.round(totalMinsThisWeek / 60)}h studied across ${sessionsThisWeek} days. ${deadlinesDone} deadlines completed.`;

  // Save report
  const report = await WeeklyReport.create({
    userId,
    weekStart: weekAgo,
    weekEnd: now,
    totalMins: totalMinsThisWeek,
    sessions: sessionsThisWeek,
    xpEarned: totalMinsThisWeek + (stats?.pomodoros || 0) * 30,
    streakStatus: stats?.streak || 0,
    deadlinesDone,
    deadlinesMissed,
    subjectBreakdown,
    aiRecommendations,
    summary,
  });

  // Try to send email (non-blocking)
  try {
    if (sendEmail && user.email) {
      const htmlBody = `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e5e7eb;padding:32px;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#00C896;font-size:24px;margin:0;">📊 Weekly Study Report</h1>
            <p style="color:#9ca3af;font-size:14px;">${summary}</p>
          </div>
          <div style="background:#1e293b;padding:20px;border-radius:12px;margin-bottom:16px;">
            <h3 style="color:#00C896;margin:0 0 12px;">Stats</h3>
            <p style="margin:4px 0;">🕐 Study Time: <strong>${Math.round(totalMinsThisWeek / 60)}h ${totalMinsThisWeek % 60}m</strong></p>
            <p style="margin:4px 0;">🔥 Streak: <strong>${stats?.streak || 0} days</strong></p>
            <p style="margin:4px 0;">✅ Deadlines Done: <strong>${deadlinesDone}</strong></p>
            <p style="margin:4px 0;">❌ Deadlines Missed: <strong>${deadlinesMissed}</strong></p>
          </div>
          <div style="background:#1e293b;padding:20px;border-radius:12px;">
            <h3 style="color:#00C896;margin:0 0 12px;">AI Recommendations</h3>
            ${aiRecommendations.map((r, i) => `<p style="margin:8px 0;padding:8px;background:#0f172a;border-radius:8px;font-size:14px;">${i + 1}. ${r}</p>`).join("")}
          </div>
          <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:24px;">Generated by Cognit • ${new Date().toLocaleDateString("en-IN")}</p>
        </div>
      `;
      await sendEmail(user.email, "Your Weekly Study Report — Cognit", htmlBody);
    }
  } catch (emailErr) {
    console.error("Failed to send weekly report email:", emailErr.message);
  }

  return report;
}

// ── Manual trigger for current user ───────────────────────────────────────────
router.post("/weekly", auth, async (req, res, next) => {
  try {
    const report = await generateReportForUser(req.user.id);
    if (!report) return res.status(404).json({ error: "User not found" });
    res.json(report);
  } catch (e) { next(e); }
});

// ── Get past reports ──────────────────────────────────────────────────────────
router.get("/", auth, async (req, res, next) => {
  try {
    const reports = await WeeklyReport.find({ userId: req.user.id })
      .sort({ weekEnd: -1 })
      .limit(12);
    res.json(reports);
  } catch (e) { next(e); }
});

// ── Cron trigger endpoint (secured with CRON_SECRET) ──────────────────────────
router.post("/cron/weekly", async (req, res, next) => {
  try {
    const secret = req.headers["x-cron-secret"] || req.body.secret;
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const users = await User.find({}).select("_id");
    let generated = 0;
    for (const u of users) {
      try {
        await generateReportForUser(u._id);
        generated++;
      } catch (e) {
        console.error(`Report failed for user ${u._id}:`, e.message);
      }
    }
    res.json({ ok: true, generated, total: users.length });
  } catch (e) { next(e); }
});

module.exports = router;
