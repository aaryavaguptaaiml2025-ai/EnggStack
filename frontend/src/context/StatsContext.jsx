import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { sfx } from "../hooks/useSfx";

const Ctx = createContext(null);

export const XP_THRESHOLDS = [0,100,250,500,900,1500,2500,4000,6000,10000];
export const LEVEL_NAMES   = ["Beginner","Learner","Student","Scholar","Expert","Master","Legend","Genius","Prodigy","Einstein"];
export const LEVEL_ICONS   = ["🌱","📖","🎓","🔬","💡","🚀","⭐","👑","🧠","🔱"];
export const BADGES = [
  { id:"streak3",   icon:"🔥", label:"3-Day Streak",    color:"#f97316", check:(s)=>s.streak>=3 },
  { id:"streak7",   icon:"🔥", label:"7-Day Streak",    color:"#ef4444", check:(s)=>s.streak>=7 },
  { id:"streak30",  icon:"🏆", label:"30-Day Streak",   color:"#fbbf24", check:(s)=>s.streak>=30 },
  { id:"hours5",    icon:"⏱️", label:"5 Hrs Studied",   color:"#60a5fa", check:(s)=>s.totalMins>=300 },
  { id:"hours50",   icon:"💯", label:"50 Hrs Studied",  color:"#a78bfa", check:(s)=>s.totalMins>=3000 },
  { id:"hours200",  icon:"🎯", label:"200 Hrs Studied", color:"#ec4899", check:(s)=>s.totalMins>=12000 },
  { id:"pomo10",    icon:"🍅", label:"10 Pomodoros",    color:"#f87171", check:(s)=>s.pomodoros>=10 },
  { id:"pomo50",    icon:"🍎", label:"50 Pomodoros",    color:"#fbbf24", check:(s)=>s.pomodoros>=50 },
  { id:"nightowl",  icon:"🦉", label:"Night Owl",       color:"#c084fc", check:(s)=>s.nightSessions>=3 },
  { id:"scholar",   icon:"🎓", label:"Scholar",         color:"#34d399", check:(s)=>s.xp>=500 },
  { id:"master",    icon:"🧙", label:"Master",          color:"#818cf8", check:(s)=>s.xp>=2500 },
];

export function getLevel(xp) {
  let l = 0;
  for (let i = 0; i < XP_THRESHOLDS.length - 1; i++) { if (xp >= XP_THRESHOLDS[i]) l = i; }
  return l;
}

export function StatsProvider({ children }) {
  const [stats, setStats] = useState({ xp:0,streak:0,totalMins:0,minsToday:0,pomodoros:0,nightSessions:0,weeklyMins:[0,0,0,0,0,0,0],heatmap:{} });
  const [prevLevel, setPrevLevel] = useState(0);
  const [prevBadges, setPrevBadges] = useState([]);

  const refresh = useCallback(async () => {
    // ── FIX: Only fetch stats when user is authenticated ──────────────
    // Without this guard, StatsProvider (which wraps the entire app including
    // the login page) fires GET /api/stats on mount with no JWT token,
    // causing a 401 error in the console on every page load.
    if (!localStorage.getItem("es_token")) return;
    try { const s = await api.getStats(); setStats(s); } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const l = getLevel(stats.xp);
    if (l > prevLevel && prevLevel > 0) sfx.levelUp();
    setPrevLevel(l);
  }, [stats.xp]);

  useEffect(() => {
    const earned = BADGES.filter(b=>b.check(stats)).map(b=>b.id);
    if (prevBadges.length && earned.some(id=>!prevBadges.includes(id))) sfx.badge();
    setPrevBadges(earned);
  }, [stats]);

  const logPomodoro = async (mins=25, subjectId) => {
    const s = await api.logPomodoro({ mins, subjectId });
    setStats(s); sfx.complete();
  };
  const logFocus = async (mins, subjectId) => {
    const s = await api.logFocus({ mins, subjectId });
    setStats(s); sfx.xp();
  };

  return (
    <Ctx.Provider value={{ stats, refresh, logPomodoro, logFocus }}>
      {children}
    </Ctx.Provider>
  );
}
export const useStats = () => useContext(Ctx);
