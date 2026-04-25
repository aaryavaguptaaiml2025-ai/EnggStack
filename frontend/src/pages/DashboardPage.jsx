import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats, BADGES, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Badge, AnimNum } from "../components/ui";
import XPBar from "../components/XPBar";
import TodaysPlan from "../components/TodaysPlan";

/* â”€â”€ Constants â”€â”€ */
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const STAT_CONFIG = [
  { icon:"local_fire_department", label:"Streak",    color:"#00C896", filled:true },
  { icon:"schedule",              label:"Mins Today", color:"#00C896" },
  { icon:"timer",                 label:"Pomodoros",  color:"#00C896" },
  { icon:"emoji_events",          label:"Level",      color:"#00C896", filled:true },
];

const QUICK_ACTIONS = [
  { icon:"timer",          label:"Pomodoro",    to:"/pomodoro",     c:"#00C896" },
  { icon:"dark_mode",      label:"Focus",       to:"/focus",        c:"#00C896" },
  { icon:"checklist",      label:"Checklist",   to:"/checklist",    c:"#00C896" },
  { icon:"notifications",  label:"Deadlines",   to:"/deadlines",    c:"#fbbf24" },
  { icon:"analytics",      label:"Analytics",   to:"/analytics",    c:"#00C896" },
  { icon:"calculate",      label:"Calculator",  to:"/calculator",   c:"#00C896" },
];

/* â”€â”€ StatCard â”€â”€ */
function StatCard({ icon, label, value, color, delay = 0, sub, filled }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="stat-card"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transition: "opacity .5s ease, transform .5s ease, background .2s",
        borderLeft: `3px solid ${color}`,
      }}
    >
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
          <div className="text-lg font-bold text-on-surface">{value}</div>
          {sub && (
            <div className="text-[10px] mt-0.5" style={{ color }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€ Helpers â”€â”€ */
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
    out.push({ icon: "warning", text: `"${urgent.title}" is due soon â€” revise now`, color: "#f87171" });

  const weak = subjects.find(s => s.totalTopics > 0 && s.doneTopics / s.totalTopics < 0.4);
  if (weak)
    out.push({ icon: "trending_up", text: `${weak.name} needs more focus (${Math.round((weak.doneTopics/weak.totalTopics)*100)}%)`, color: "#fbbf24" });

  if ((stats.minsToday || 0) === 0)
    out.push({ icon: "play_circle", text: "You haven't studied yet today", color: "#00C896" });
  else if ((stats.minsToday || 0) < 30)
    out.push({ icon: "target", text: "Keep going â€” you're just getting started", color: "#00C896" });

  if ((stats.streak || 0) >= 3)
    out.push({ icon: "local_fire_department", text: `${stats.streak}-day streak â€” don't break it!`, color: "#f97316" });

  if (!out.length)
    out.push({ icon: "check_circle", text: "Great job! Keep the momentum going.", color: "#00C896" });

  return out;
}

/* â”€â”€ Dashboard â”€â”€ */
export default function DashboardPage() {
  const { user } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();

  const [subjects,  setSubjects]  = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [notes,     setNotes]     = useState([]);

  const quotes = user?.customQuotes?.length
    ? user.customQuotes
    : [
        "Consistency beats motivation.",
        "Small steps every day.",
        "Focus on progress, not perfection.",
        "Push yourself â€” no one else will.",
      ];
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => {});
    api.getDeadlines().then(d => setDeadlines(d.filter(x => !x.done))).catch(() => {});
    api.getNotes().then(n => setNotes(n.slice(0, 3))).catch(() => {});
  }, []);

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

  return (
    <div className="page-container">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="mb-4">
        <div className="text-xs text-dim font-mono mb-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </div>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            {greeting}, {user?.name?.split(" ")[0]}
          </h1>
          {urgentDeadline && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold
              px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20
              urgency-ring">
              <span className="material-symbols-outlined text-xs">warning</span>
              {urgentDeadline.title} due soon
            </span>
          )}
        </div>
        <p className="text-sm text-[#00C896]/60 italic">"{quote}"</p>
      </div>

      {/* â”€â”€ Today's Plan (MOST PROMINENT) â”€â”€ */}
      <TodaysPlan
        subjects={subjects}
        deadlines={deadlines}
        stats={stats}
        user={user}
      />

      {/* â”€â”€ Daily Goal â”€â”€ */}
      <div className="glass-card p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#00C896]">flag</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-on-surface">
              Daily Goal â€” {stats.minsToday || 0}/{goal} mins
            </span>
            <span className="text-xs text-[#00C896] font-bold">{goalPct}%</span>
          </div>
          <ProgressBar value={stats.minsToday || 0} max={goal} color="#00C896" height={7} glow />
        </div>
        {goalPct >= 100 && (
          <span className="material-symbols-outlined text-[#00C896] text-2xl filled">
            check_circle
          </span>
        )}
      </div>

      {/* â”€â”€ Stat Cards â”€â”€ */}
      <div className="stagger grid-4 grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={STAT_CONFIG[0].icon} label={STAT_CONFIG[0].label}
          value={`${stats.streak || 0}d`} color={STAT_CONFIG[0].color}
          delay={0} filled={STAT_CONFIG[0].filled}
        />
        <StatCard
          icon={STAT_CONFIG[1].icon} label={STAT_CONFIG[1].label}
          value={<AnimNum value={stats.minsToday || 0} />} color={STAT_CONFIG[1].color}
          delay={80}
        />
        <StatCard
          icon={STAT_CONFIG[2].icon} label={STAT_CONFIG[2].label}
          value={stats.pomodoros || 0} color={STAT_CONFIG[2].color}
          delay={160}
        />
        <StatCard
          icon={STAT_CONFIG[3].icon} label={STAT_CONFIG[3].label}
          value={lv + 1} color={STAT_CONFIG[3].color}
          delay={240} sub={LEVEL_NAMES[lv]} filled={STAT_CONFIG[3].filled}
        />
      </div>

      {/* â”€â”€ XP Bar â”€â”€ */}
      <div className="mb-6"><XPBar xp={stats.xp || 0} /></div>

      {/* â”€â”€ Row 1: Suggestions | Subjects | Weekly â”€â”€ */}
      <div className="grid-3 grid grid-cols-3 gap-5 mb-5">
        {/* Smart Suggestions */}
        <Card accent="#f97316">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-orange-400 text-lg">
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

        {/* Subjects with progress */}
        <Card accent="#00C896">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00C896] text-lg">menu_book</span>
              <span className="text-sm font-bold text-on-surface">Subjects</span>
            </div>
            <button
              onClick={() => navigate("/subjects")}
              className="text-[11px] text-[#00C896] hover:underline font-semibold"
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
                className="bg-[#00C896]/10 border border-[#00C896]/20 rounded-xl px-4 py-2
                  text-[#00C896] text-xs font-semibold hover:bg-[#00C896]/15 transition-all duration-200"
              >
                Add Subjects
              </button>
            </div>
          ) : (
            subjects.slice(0, 5).map((s, i) => {
              const pct = s.totalTopics > 0
                ? Math.round((s.doneTopics / s.totalTopics) * 100)
                : 0;
              const clr = s.color || "#00C896";
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
                        Continue â†’
                      </button>
                    </div>
                  </div>
                  <ProgressBar value={pct} max={100} color={clr} height={4} />
                </div>
              );
            })
          )}
        </Card>

        {/* Weekly Chart */}
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

      {/* â”€â”€ Row 2: Notes | Deadlines | Badges â”€â”€ */}
      <div className="grid-3 grid grid-cols-[1.3fr_1fr_1fr] gap-5 mb-5">
        {/* Notes */}
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
                  <Badge color="#00C896">{n.subject || "--"}</Badge>
                </div>
                <div className="text-[11px] text-muted truncate">
                  {n.content?.slice(0, 50) || "Empty"}
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Deadlines (enhanced urgency) */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-warning text-lg">
                notifications_active
              </span>
              <span className="text-sm font-bold text-on-surface">Deadlines</span>
            </div>
            <button
              onClick={() => navigate("/deadlines")}
              className="text-[11px] text-[#00C896] hover:underline font-semibold"
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

        {/* Badges */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00C896] text-lg filled">
                workspace_premium
              </span>
              <span className="text-sm font-bold text-on-surface">Badges</span>
            </div>
            <button
              onClick={() => navigate("/gamification")}
              className="text-[11px] text-[#00C896] hover:underline font-semibold"
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

      {/* â”€â”€ Quick Actions â”€â”€ */}
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
