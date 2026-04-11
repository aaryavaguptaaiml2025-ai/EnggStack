const mongoose = require("mongoose");
const { Schema } = mongoose;
const uid = () => ({ type: Schema.Types.ObjectId, ref: "User", required: true });

// ── Stats ─────────────────────────────────────────────────────────────────────
const statsSchema = new Schema({
  user:          { ...uid(), unique: true },
  xp:            { type: Number, default: 0 },
  streak:        { type: Number, default: 0 },
  lastStudyDate: { type: String, default: "" },
  totalMins:     { type: Number, default: 0 },
  minsToday:     { type: Number, default: 0 },
  lastMinDate:   { type: String, default: "" },
  pomodoros:     { type: Number, default: 0 },
  nightSessions: { type: Number, default: 0 },
  weeklyMins:    { type: [Number], default: [0,0,0,0,0,0,0] },
  // Heatmap: { "2024-01-15": 45, ... }
  heatmap:       { type: Map, of: Number, default: {} },
  // Subject time: { subjectId: mins }
  subjectTime:   { type: Map, of: Number, default: {} },
});
const Stats = mongoose.model("Stats", statsSchema);

// ── Deadline ──────────────────────────────────────────────────────────────────
const deadlineSchema = new Schema({
  user:     uid(),
  title:    { type: String, required: true },
  subject:  { type: String, default: "" },
  dueDate:  { type: Date, required: true },
  done:     { type: Boolean, default: false },
  priority: { type: String, default: "medium", enum: ["low","medium","high"] },
  createdAt: { type: Date, default: Date.now },
});
const Deadline = mongoose.model("Deadline", deadlineSchema);

// ── Note ──────────────────────────────────────────────────────────────────────
const noteSchema = new Schema({
  user:      uid(),
  title:     { type: String, required: true },
  content:   { type: String, default: "" },
  subject:   { type: String, default: "" },
  tags:      [{ type: String }],
  pinned:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Note = mongoose.model("Note", noteSchema);

// ── ChecklistItem ─────────────────────────────────────────────────────────────
const checklistSchema = new Schema({
  user:    uid(),
  text:    { type: String, required: true },
  done:    { type: Boolean, default: false },
  subject: { type: String, default: "" },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});
const ChecklistItem = mongoose.model("ChecklistItem", checklistSchema);

// ── TimetableEntry ────────────────────────────────────────────────────────────
const timetableSchema = new Schema({
  user:      uid(),
  day:       { type: String, required: true },
  subject:   { type: String, required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  room:      { type: String, default: "" },
  color:     { type: String, default: "#60a5fa" },
});
const TimetableEntry = mongoose.model("TimetableEntry", timetableSchema);

// ── Subject ───────────────────────────────────────────────────────────────────
const subjectSchema = new Schema({
  user:        uid(),
  name:        { type: String, required: true },
  color:       { type: String, default: "#60a5fa" },
  totalTopics: { type: Number, default: 0 },
  doneTopics:  { type: Number, default: 0 },
  icon:        { type: String, default: "📚" },
});
const Subject = mongoose.model("Subject", subjectSchema);

// ── Reminder ──────────────────────────────────────────────────────────────────
const reminderSchema = new Schema({
  user:      uid(),
  title:     { type: String, required: true },
  body:      { type: String, default: "" },
  fireAt:    { type: Date, required: true },
  repeat:    { type: String, default: "none", enum: ["none","daily","weekly"] },
  done:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = { Stats, Deadline, Note, ChecklistItem, TimetableEntry, Subject, Reminder };
