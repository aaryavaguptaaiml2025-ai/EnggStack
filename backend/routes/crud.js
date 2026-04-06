// ── shared factory ─────────────────────────────────────────────────────────────
const express = require("express");
const auth = require("../middleware/auth");
const { Deadline, Note, ChecklistItem, TimetableEntry, Subject, Reminder } = require("../models/index");

function crud(Model, sortOpts = { createdAt: -1 }) {
  const r = express.Router();
  r.get("/",      auth, async (req,res) => { try { res.json(await Model.find({user:req.user.id}).sort(sortOpts)); } catch(e){res.status(500).json({error:e.message})} });
  r.post("/",     auth, async (req,res) => { try { res.json(await Model.create({...req.body,user:req.user.id})); } catch(e){res.status(500).json({error:e.message})} });
  r.patch("/:id", auth, async (req,res) => { try { const d={...req.body}; if(Model.modelName==="Note") d.updatedAt=new Date(); res.json(await Model.findOneAndUpdate({_id:req.params.id,user:req.user.id},d,{new:true})); } catch(e){res.status(500).json({error:e.message})} });
  r.delete("/:id",auth, async (req,res) => { try { await Model.findOneAndDelete({_id:req.params.id,user:req.user.id}); res.json({ok:true}); } catch(e){res.status(500).json({error:e.message})} });
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
