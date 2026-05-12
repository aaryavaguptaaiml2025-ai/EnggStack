// ── shared factory ─────────────────────────────────────────────────────────────
const express = require("express");
const auth = require("../middleware/auth");
const { Deadline, Note, ChecklistItem, TimetableEntry, Subject, Reminder } = require("../models/index");

// Section 1.6: Validate note content length
const MAX_NOTE_CONTENT = 50000;

function crud(Model, sortOpts = { createdAt: -1 }) {
  const r = express.Router();

  r.get("/", auth, async (req, res, next) => {
    try {
      // Section 4.4: Pagination for notes
      if (Model.modelName === "Note") {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const notes = await Model.find({ user: req.user.id })
          .sort(sortOpts)
          .skip((page - 1) * limit)
          .limit(limit);
        const total = await Model.countDocuments({ user: req.user.id });
        return res.json({ notes, total, page, totalPages: Math.ceil(total / limit) });
      }
      res.json(await Model.find({ user: req.user.id }).sort(sortOpts));
    } catch (e) { next(e); }
  });

  r.post("/", auth, async (req, res, next) => {
    try {
      // Section 1.6: Validate note content length
      if (Model.modelName === "Note" && req.body.content && req.body.content.length > MAX_NOTE_CONTENT) {
        return res.status(400).json({ error: `Note content exceeds ${MAX_NOTE_CONTENT} character limit.` });
      }
      res.json(await Model.create({ ...req.body, user: req.user.id }));
    } catch (e) { next(e); }
  });

  r.patch("/:id", auth, async (req, res, next) => {
    try {
      const d = { ...req.body };
      if (Model.modelName === "Note") {
        d.updatedAt = new Date();
        // Section 1.6: Validate note content length
        if (d.content && d.content.length > MAX_NOTE_CONTENT) {
          return res.status(400).json({ error: `Note content exceeds ${MAX_NOTE_CONTENT} character limit.` });
        }
      }
      res.json(await Model.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, d, { new: true }));
    } catch (e) { next(e); }
  });

  r.delete("/:id", auth, async (req, res, next) => {
    try {
      await Model.findOneAndDelete({ _id: req.params.id, user: req.user.id });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return r;
}

module.exports = {
  deadlines: crud(Deadline, { dueDate: 1 }),
  notes:     crud(Note,     { pinned:-1, updatedAt:-1 }),
  checklist: crud(ChecklistItem, { done:1, createdAt:-1 }),
  timetable: crud(TimetableEntry, { day:1, startTime:1 }),
  subjects:  crud(Subject,  { name:1 }),
  reminders: crud(Reminder, { fireAt:1 }),
};
