import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useStats, BADGES, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api";
import { Card, ProgressBar, Badge } from "../components/ui";
import XPBar from "../components/XPBar";
import TodaysPlan from "../components/TodaysPlan";

/* ── Ambient Background with floating particles ── */
function AmbientBackground() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.1,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient orbs */}
      <motion.div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[160px]"
        style={{ background: 'color-mix(in srgb, var(--ac) 6%, transparent)' }}
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.05, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[140px]"
        style={{ background: 'color-mix(in srgb, var(--glow, #8b5cf6) 5%, transparent)' }}
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -40, 0], scale: [1, 0.95, 1.05, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full blur-[120px]"
        style={{ background: 'color-mix(in srgb, var(--ac) 3%, transparent)' }}
        animate={{ x: [0, 50, -30, 0], y: [0, -30, 50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, bottom: '-10px',
            width: p.size, height: p.size,
            background: 'var(--ac, #00C896)',
            opacity: p.opacity,
          }}
          animate={{ y: [0, -window.innerHeight - 50], opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {/* Light beam */}
      <motion.div
        className="absolute top-0 left-0 w-[200px] h-[200%] rotate-45 opacity-0"
        style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--ac) 4%, transparent), transparent)' }}
        animate={{ x: ['-200px', '200vw'], opacity: [0, 0.06, 0] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 12, ease: "linear" }}
      />
    </div>
  );
}

/* ── Constants ── */
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* Color-role stat cards: orange=streak, blue=info, danger=pomodoro, purple=level */
const STAT_CONFIG = [
  { icon:"local_fire_department", label:"Streak",    color:"#f97316", filled:true,  suffix:"d" },
  { icon:"schedule",              label:"Mins Today", color:"#3b82f6", suffix:"" },
  { icon:"timer",                 label:"Pomodoros",  color:"#f87171", suffix:"" },
  { icon:"emoji_events",          label:"Level",      color:"#8b5cf6", filled:true,  suffix:"" },
];

const QUICK_ACTIONS = [
  { icon:"timer",          label:"Pomodoro",    to:"/pomodoro",     c:"#00C896" },
  { icon:"dark_mode",      label:"Focus",       to:"/focus",        c:"#3b82f6" },
  { icon:"checklist",      label:"Checklist",   to:"/checklist",    c:"#00C896" },
  { icon:"notifications",  label:"Deadlines",   to:"/deadlines",    c:"#f97316" },
  { icon:"analytics",      label:"Analytics",   to:"/analytics",    c:"#8b5cf6" },
  { icon:"calculate",      label:"Calculator",  to:"/calculator",   c:"#3b82f6" },
];

/* ── Counting number animation hook ── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const num = typeof target === "number" ? target : parseInt(target, 10) || 0;
    if (num === 0) { setValue(0); return; }
    startRef.current = null;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOut(progress) * num));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

/* ── 3D Tilt StatCard ── */
function StatCard({ icon, label, value, numericValue, color, suffix, sub, filled, index = 0 }) {
  const cardRef = useRef(null);
  const reduced = useReducedMotion();
  const countedVal = useCountUp(numericValue);

  const handleMouseMove = useCallback((e) => {
    if (reduced) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  }, [reduced]);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0)";
    }
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.45, ease: "easeOut", delay: index * 0.1 },
    },
  };

  return (
    <motion.div
      ref={cardRef}
      variants={reduced ? {} : cardVariants}
      initial={reduced ? undefined : "hidden"}
      animate={reduced ? undefined : "visible"}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="stat-card relative overflow-hidden"
      style={{
        borderLeft: `3px solid ${color}`,
        transition: "transform 0.15s ease-out, box-shadow 0.2s ease, background 0.2s",
      }}
    >
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }} />

      <div className="flex items-center gap-3 relative">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}
        >
          <span
            className={`material-symbols-outlined text-xl ${filled ? "filled" : ""}`}
            style={{ color }}
          >
            {icon}
          </span>
        </div>
        <div>
          <div className="label-text mb-0.5">{label}</div>
          <div className="text-lg font-bold text-on-surface">
            {countedVal}{suffix}
          </div>
          {sub && (
            <div className="text-[10px] mt-0.5" style={{ color }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Helpers ── */
function daysLeft(d) {
  const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
  return diff <= 0 ? "Today" : diff === 1 ? "1d" : `${diff}d`;
}

function buildSuggestions(subjects, deadlines, stats) {
  const out = [];
  const urgent = deadlines.find(
    d => Math.ceil((new Date(d.dueDate) - Date.now()) / 86400000) <= 2
  );
  if (urgent)
    out.push({ icon: "warning", text: `"${urgent.title}" is due soon — revise now`, color: "#f87171" });

  const weak = subjects.find(s => s.totalTopics > 0 && s.doneTopics / s.totalTopics < 0.4);
  if (weak)
    out.push({ icon: "trending_up", text: `${weak.name} needs more focus (${Math.round((weak.doneTopics/weak.totalTopics)*100)}%)`, color: "#f97316" });

  if ((stats.minsToday || 0) === 0)
    out.push({ icon: "play_circle", text: "You haven't studied yet today", color: "#3b82f6" });
  else if ((stats.minsToday || 0) < 30)
    out.push({ icon: "target", text: "Keep going — you're just getting started", color: "#00C896" });

  if ((stats.streak || 0) >= 3)
    out.push({ icon: "local_fire_department", text: `${stats.streak}-day streak — don't break it!`, color: "#f97316" });

  if (!out.length)
    out.push({ icon: "check_circle", text: "Great job! Keep the momentum going.", color: "#00C896" });

  return out;
}

/* ── Dashboard ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const toast = useToast();
  const notified = useRef(false);

  const [subjects,  setSubjects]  = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [notes,     setNotes]     = useState([]);

  const quotes = user?.customQuotes?.length
    ? user.customQuotes
    : [
        "Consistency beats motivation.",
        "Small steps every day.",
        "Focus on progress, not perfection.",
        "Push yourself — no one else will.",
      ];
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => {});
    api.getDeadlines().then(d => {
      const active = d.filter(x => !x.done);
      setDeadlines(active);
      if (!notified.current) {
        const urgent = active.filter(x => {
          const diff = Math.ceil((new Date(x.dueDate) - Date.now()) / 86400000);
          return diff >= 0 && diff <= 1;
        });
        if (urgent.length > 0) {
          setTimeout(() => toast.warning(`You have ${urgent.length} urgent deadline${urgent.length > 1 ? 's' : ''} due soon!`), 1000);
        }
        notified.current = true;
      }
    }).catch(() => {});
    api.getNotes(1, 3).then(res => {
      const notes = res?.notes || (Array.isArray(res) ? res : []);
      setNotes(notes.slice(0, 3));
    }).catch(() => {});
  }, [toast]);

  /* Derived data */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayIdx = new Date().getDay();
  const wMins = stats.weeklyMins || [0, 0, 0, 0, 0, 0, 0];
  const maxMins = Math.max(...wMins, 1);
  const lv = getLevel(stats.xp || 0);
  const goal = user?.dailyGoalMins || 120;
  const goalPct = Math.min(100, Math.round(((stats.minsToday || 0) / goal) * 100));

  const suggestions = useMemo(
    () => buildSuggestions(subjects, deadlines, stats),
    [subjects, deadlines, stats]
  );

  /* Urgent deadline for header */
  const urgentDeadline = deadlines.find(
    d => Math.ceil((new Date(d.dueDate) - Date.now()) / 86400000) <= 2
  );

  /* Weekly totals for comparison text */
  const weekTotal = wMins.reduce((a, b) => a + b, 0);

  /* Stat card numeric values */
  const statValues = [
    stats.streak || 0,
    stats.minsToday || 0,
    stats.pomodoros || 0,
    lv + 1,
  ];

  return (
    <div className="page-container relative">
      <AmbientBackground />
      {/* ── Header ── */}
      <div className="mb-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[11px] font-mono tracking-wider mb-2 uppercase"
          style={{ color: 'var(--dim)' }}
        >
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </motion.div>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl md:text-[32px] font-extrabold tracking-tight leading-tight grad-text"
          >
            {greeting}, {user?.name?.split(" ")[0]}
          </motion.h1>
          {urgentDeadline && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold
              px-3 py-1.5 rounded-full bg-red-400/[0.08] text-red-400 border border-red-400/[0.15]
              urgency-ring">
              <span className="material-symbols-outlined text-xs">warning</span>
              {urgentDeadline.title} due soon
            </span>
          )}
        </div>
        <p className="text-sm text-[#00C896]/50 italic font-medium">"{quote}"</p>
      </div>

      {/* ── Today's Plan (MOST PROMINENT) ── */}
      <TodaysPlan
        subjects={subjects}
        deadlines={deadlines}
        stats={stats}
        user={user}
      />

      {/* ── Daily Goal ── */}
      <div className="glass-card p-5 mb-7 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00C896]/[0.08] flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#00C896]">flag</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface">
              Daily Goal — {stats.minsToday || 0}/{goal} mins
            </span>
            <span className="text-xs text-[#00C896] font-bold">{goalPct}%</span>
          </div>
          <ProgressBar value={stats.minsToday || 0} max={goal} color="#00C896" height={6} />
        </div>
        {goalPct >= 100 && (
          <span className="material-symbols-outlined text-[#00C896] text-2xl filled">
            check_circle
          </span>
        )}
      </div>

      {/* ── Stat Cards (animated, 3D tilt, staggered, gradient border) ── */}
      <div className="grid-4 grid grid-cols-4 gap-4 mb-7">
        {STAT_CONFIG.map((cfg, i) => (
          <StatCard
            key={i}
            index={i}
            icon={cfg.icon}
            label={cfg.label}
            numericValue={statValues[i]}
            value={statValues[i]}
            color={cfg.color}
            suffix={cfg.suffix}
            filled={cfg.filled}
            sub={i === 3 ? LEVEL_NAMES[lv] : undefined}
          />
        ))}
      </div>

      {/* ── XP Bar ── */}
      <div className="mb-7"><XPBar xp={stats.xp || 0} /></div>

      {/* ── Row 1: Suggestions | Subjects | Weekly ── */}
      <div className="grid-3 grid grid-cols-3 gap-5 mb-6">
        {/* Smart Suggestions — orange accent */}
        <Card accent="#f97316">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#f97316] text-lg">
              auto_awesome
            </span>
            <span className="text-sm font-bold text-on-surface">Smart Suggestions</span>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="p-3 rounded-xl flex gap-3 items-start transition-all duration-200
                  hover:bg-white/[.04]"
                style={{ background: s.color + "0d", border: `1px solid ${s.color}20` }}
              >
                <span
                  className="material-symbols-outlined text-base flex-shrink-0 mt-0.5"
                  style={{ color: s.color }}
                >
                  {s.icon}
                </span>
                <span className="text-xs text-on-surface leading-relaxed">{s.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subjects with progress — blue accent for info */}
        <Card accent="#3b82f6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3b82f6] text-lg">menu_book</span>
              <span className="text-sm font-bold text-on-surface">Subjects</span>
            </div>
            <button
              onClick={() => navigate("/subjects")}
              className="text-[11px] text-[#3b82f6] hover:underline font-semibold"
            >
              Manage
            </button>
          </div>
          {subjects.length === 0 ? (
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-3 block">
                library_books
              </span>
              <div className="text-xs text-muted mb-3">No subjects yet</div>
              <button
                onClick={() => navigate("/subjects")}
                className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-xl px-4 py-2
                  text-[#3b82f6] text-xs font-semibold hover:bg-[#3b82f6]/15 transition-all duration-200"
              >
                Add Subjects
              </button>
            </div>
          ) : (
            subjects.slice(0, 5).map((s, i) => {
              const pct = s.totalTopics > 0
                ? Math.round((s.doneTopics / s.totalTopics) * 100)
                : 0;
              const clr = s.color || "#3b82f6";
              return (
                <div
                  key={i}
                  className="mb-3 p-2.5 rounded-xl bg-white/[.02] border border-white/[.04]
                    hover:border-white/[.08] transition-all duration-200 group"
                >
                  <div className="flex justify-between mb-1.5 items-center">
                    <span className="text-xs text-on-surface font-medium">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: clr }}>
                        {pct}%
                      </span>
                      <button
                        onClick={() => navigate("/subjects")}
                        className="text-[9px] text-muted hover:text-[#00C896] transition-colors
                          opacity-0 group-hover:opacity-100"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                  <ProgressBar value={pct} max={100} color={clr} height={4} />
                </div>
              );
            })
          )}
        </Card>

        {/* Weekly Chart — green for primary data */}
        <Card accent="#00C896">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00C896] text-lg">bar_chart</span>
              <span className="text-sm font-bold text-on-surface">This Week</span>
            </div>
            {weekTotal > 0 && (
              <span className="text-[10px] text-[#00C896] font-bold">
                {Math.round(weekTotal / 60)}h {weekTotal % 60}m
              </span>
            )}
          </div>
          <div className="flex items-end gap-1 h-20 mb-2">
            {wMins.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t transition-all duration-1000 ease-out"
                    style={{
                      minHeight: 3,
                      height: `${Math.round((m / maxMins) * 100)}%`,
                      background:
                        i === todayIdx
                          ? "linear-gradient(180deg, #00C896, #00C89688)"
                          : "rgba(255,255,255,.08)",
                      boxShadow:
                        i === todayIdx ? "0 0 10px rgba(0,200,150,.3)" : "none",
                    }}
                  />
                </div>
                <span
                  className={`text-[8px] ${
                    i === todayIdx ? "text-[#00C896] font-bold" : "text-dim"
                  }`}
                >
                  {DAYS[i]}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-2 flex justify-between">
            <span className="text-[11px] text-muted">Total</span>
            <span className="text-[11px] text-[#00C896] font-bold">{weekTotal} mins</span>
          </div>
        </Card>
      </div>

      {/* ── Row 2: Notes | Deadlines | Badges ── */}
      <div className="grid-3 grid grid-cols-[1.3fr_1fr_1fr] gap-5 mb-6">
        {/* Notes — green accent */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00C896] text-lg">edit_note</span>
              <span className="text-sm font-bold text-on-surface">Recent Notes</span>
            </div>
            <button
              onClick={() => navigate("/notes")}
              className="text-[11px] text-[#00C896] hover:underline font-semibold"
            >
              View all
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-3 block">
                note_add
              </span>
              <div className="text-xs text-muted">
                No notes.{" "}
                <button
                  onClick={() => navigate("/notes")}
                  className="text-[#00C896] hover:underline"
                >
                  Add one
                </button>
              </div>
            </div>
          ) : (
            notes.map((n, i) => (
              <div
                key={i}
                onClick={() => navigate("/notes")}
                className="p-3 rounded-xl border border-white/5 bg-white/[.03] mb-2 cursor-pointer
                  hover:border-[#00C896]/20 transition-all duration-200"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-on-surface truncate max-w-[70%]">
                    {n.title}
                  </span>
                  <Badge color="#3b82f6">{n.subject || "--"}</Badge>
                </div>
                <div className="text-[11px] text-muted truncate">
                  {n.content?.slice(0, 50) || "Empty"}
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Deadlines — warning accent */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f97316] text-lg">
                notifications_active
              </span>
              <span className="text-sm font-bold text-on-surface">Deadlines</span>
            </div>
            <button
              onClick={() => navigate("/deadlines")}
              className="text-[11px] text-[#f97316] hover:underline font-semibold"
            >
              View all
            </button>
          </div>
          {deadlines.length === 0 ? (
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-3 block">
                event_available
              </span>
              <div className="text-xs text-muted">
                No deadlines.{" "}
                <button
                  onClick={() => navigate("/deadlines")}
                  className="text-[#00C896] hover:underline"
                >
                  Add one
                </button>
              </div>
            </div>
          ) : (
            deadlines.slice(0, 4).map((d, i) => {
              const diff = Math.ceil((new Date(d.dueDate) - Date.now()) / 86400000);
              const c = diff <= 1 ? "#f87171" : diff <= 3 ? "#fbbf24" : "#00C896";
              const isUrgent = diff <= 1;
              return (
                <div
                  key={i}
                  className={`flex justify-between items-center p-2.5 rounded-xl
                    bg-white/[.03] mb-2 ${isUrgent ? "deadline-urgent" : ""}`}
                  style={isUrgent ? { border: "1px solid rgba(248,113,113,0.2)" } : {}}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-xs text-on-surface font-medium truncate">{d.title}</div>
                    <div className="text-[10px] text-muted">{d.subject}</div>
                  </div>
                  <Badge color={c} dot={isUrgent}>{daysLeft(d.dueDate)}</Badge>
                </div>
              );
            })
          )}
        </Card>

        {/* Badges — purple accent for level/achievements */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8b5cf6] text-lg filled">
                workspace_premium
              </span>
              <span className="text-sm font-bold text-on-surface">Badges</span>
            </div>
            <button
              onClick={() => navigate("/gamification")}
              className="text-[11px] text-[#8b5cf6] hover:underline font-semibold"
            >
              All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.slice(0, 6).map(b => {
              const e = b.check(stats);
              return (
                <div
                  key={b.id}
                  title={b.label}
                  className="p-2.5 rounded-xl flex gap-2 items-center transition-all duration-200"
                  style={{
                    border: `1px solid ${e ? b.color + "30" : "rgba(255,255,255,.05)"}`,
                    background: e ? b.color + "0a" : "rgba(255,255,255,.03)",
                    opacity: e ? 1 : 0.35,
                  }}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ color: e ? b.color : "#4a5568" }}
                  >
                    {b.icon}
                  </span>
                  <div
                    className="text-[10px] font-semibold leading-tight truncate"
                    style={{ color: e ? b.color : "#4a5568" }}
                  >
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#00C896] text-lg">bolt</span>
          <span className="text-sm font-bold text-on-surface">Quick Actions</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.to)}
              className="quick-action-btn"
              style={{ background: a.c + "0d", borderColor: a.c + "20", color: a.c }}
            >
              <span className="material-symbols-outlined text-xl">{a.icon}</span>
              <span className="text-[11px] font-semibold">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
