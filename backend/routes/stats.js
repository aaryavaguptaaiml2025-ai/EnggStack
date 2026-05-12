const router = require("express").Router();
const auth   = require("../middleware/auth");
const { Stats } = require("../models/index");

// Section 2.7: Use client-provided timezone for bucketing, fallback to server UTC
const todayStr = (tz) => {
  try {
    if (tz) return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  } catch {}
  return new Date().toISOString().split("T")[0];
};
const todayDate = () => new Date().toDateString();
const dayIdx  = () => new Date().getDay();

async function getOrCreate(userId) {
  let s = await Stats.findOne({ user: userId });
  if (!s) s = await Stats.create({ user: userId });
  // Reset daily if new day
  if (s.lastMinDate !== todayDate()) {
    s.minsToday  = 0;
    s.lastMinDate = todayDate();
  }
  return s;
}

router.get("/", auth, async (req, res, next) => {
  try {
    const s = await getOrCreate(req.user.id);
    await s.save();
    res.json(s);
  } catch (e) { next(e); }
});

router.post("/pomodoro", auth, async (req, res, next) => {
  try {
    const { mins = 25, subjectId, timezone } = req.body;
    const s = await getOrCreate(req.user.id);

    // Streak
    const yest = new Date(); yest.setDate(yest.getDate()-1);
    if (s.lastStudyDate === yest.toDateString()) s.streak = (s.streak||0) + 1;
    else if (s.lastStudyDate !== todayDate())     s.streak = 1;
    s.lastStudyDate = todayDate();

    s.pomodoros   = (s.pomodoros||0) + 1;
    s.totalMins   = (s.totalMins||0) + mins;
    s.minsToday   = (s.minsToday||0) + mins;
    s.xp          = (s.xp||0) + 30;
    if (new Date().getHours() >= 22) s.nightSessions = (s.nightSessions||0) + 1;

    // Weekly array
    const w = [...(s.weeklyMins||[0,0,0,0,0,0,0])];
    w[dayIdx()] = (w[dayIdx()]||0) + mins;
    s.weeklyMins = w;

    // Heatmap — use client timezone for correct bucketing (Section 2.7)
    const hm = s.heatmap || new Map();
    const dateKey = todayStr(timezone);
    hm.set(dateKey, (hm.get(dateKey)||0) + mins);
    s.heatmap = hm;

    // Subject time
    if (subjectId) {
      const st = s.subjectTime || new Map();
      st.set(subjectId, (st.get(subjectId)||0) + mins);
      s.subjectTime = st;
    }

    await s.save();
    res.json(s);
  } catch (e) { next(e); }
});

router.post("/focus", auth, async (req, res, next) => {
  try {
    const { mins, subjectId, timezone } = req.body;
    const s = await getOrCreate(req.user.id);
    s.totalMins  = (s.totalMins||0)  + mins;
    s.minsToday  = (s.minsToday||0)  + mins;
    s.xp         = (s.xp||0) + mins;
    const w = [...(s.weeklyMins||[0,0,0,0,0,0,0])];
    w[dayIdx()] = (w[dayIdx()]||0) + mins;
    s.weeklyMins = w;
    const hm = s.heatmap || new Map();
    const dateKey = todayStr(timezone);
    hm.set(dateKey, (hm.get(dateKey)||0) + mins);
    s.heatmap = hm;
    if (subjectId) {
      const st = s.subjectTime || new Map();
      st.set(subjectId, (st.get(subjectId)||0) + mins);
      s.subjectTime = st;
    }
    await s.save();
    res.json(s);
  } catch (e) { next(e); }
});

module.exports = router;
