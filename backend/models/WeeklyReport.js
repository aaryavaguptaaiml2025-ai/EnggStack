const mongoose = require("mongoose");

const weeklyReportSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  weekStart:    { type: Date, required: true },
  weekEnd:      { type: Date, required: true },
  totalMins:    { type: Number, default: 0 },
  sessions:     { type: Number, default: 0 },
  xpEarned:     { type: Number, default: 0 },
  streakStatus: { type: Number, default: 0 },
  deadlinesDone:   { type: Number, default: 0 },
  deadlinesMissed: { type: Number, default: 0 },
  subjectBreakdown: [{ subject: String, mins: Number }],
  aiRecommendations: [{ type: String }],
  summary:      { type: String, default: "" },
  createdAt:    { type: Date, default: Date.now },
});

weeklyReportSchema.index({ userId: 1, weekEnd: -1 });

module.exports = mongoose.model("WeeklyReport", weeklyReportSchema);
