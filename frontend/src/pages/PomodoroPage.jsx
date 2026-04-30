import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { useStats } from "../context/StatsContext";
import { Toast, Btn } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import MovingBorderButton from "../components/ui/MovingBorderButton";

const CLR = { focus: "#00C896", short: "#3b82f6", long: "#8b5cf6" };
const LBL = { focus: "Focus Session", short: "Short Break", long: "Long Break" };
const STATUS = { focus: "FOCUS", short: "SHORT BREAK", long: "LONG BREAK" };

/* ── SVG Ring Timer Component ── */
function PomodoroRing({ progress, timeStr, label, mode }) {
  const reduced = useReducedMotion();
  const R = 90;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - progress / 100);

  return (
    <div className="relative w-[220px] h-[220px] flex items-center justify-center mb-8">
      <svg width={220} height={220} className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00C896" />
            <stop offset="100%" stopColor="#00e6a0" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle cx={110} cy={110} r={R} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        {/* Glow ring */}
        <circle cx={110} cy={110} r={R} fill="none"
          stroke="rgba(0,200,150,0.2)" strokeWidth={18}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: "blur(6px)",
            transition: reduced ? "none" : "stroke-dashoffset 0.8s ease",
          }} />
        {/* Main progress ring */}
        <circle cx={110} cy={110} r={R} fill="none"
          stroke="url(#ringGrad)" strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: reduced ? "none" : "stroke-dashoffset 0.8s ease",
          }} />
      </svg>
      <div className="text-center z-10 flex flex-col items-center">
        <div className="text-2xl font-bold tracking-wider font-mono text-[var(--text)]">
          {timeStr}
        </div>
        <div className="label-text mt-1" style={{ color: CLR[mode] }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── Floating XP Toast ── */
function XPToast({ xp, onDone }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  if (reduced) {
    return (
      <div className="fixed bottom-8 right-8 z-[9999] text-[#00C896] font-extrabold text-2xl">
        +{xp} XP
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -60 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed bottom-8 right-8 z-[9999] pointer-events-none"
    >
      <div className="text-2xl font-extrabold grad-text">
        +{xp} XP ✨
      </div>
    </motion.div>
  );
}

/* ── Main Pomodoro Page ── */
export default function PomodoroPage() {
  const { stats, logPomodoro } = useStats();
  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15 });
  const [mode, setMode] = useState("focus");
  const [tl, setTl] = useState(durations.focus * 60);
  const [run, setRun] = useState(false);
  const [sess, setSess] = useState(0);
  const [toast, setToast] = useState(null);
  const [xpToast, setXpToast] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const ref = useRef(null);
  const color = CLR[mode];

  const sw = (m) => { 
    clearInterval(ref.current); 
    setRun(false); 
    setMode(m); 
    setTl(durations[m] * 60); 
  };

  const done = useCallback(async () => {
    clearInterval(ref.current);
    setRun(false);
    if (mode === "focus") {
      await logPomodoro(durations.focus);
      setSess(s => s + 1);
      setToast(`Focus done! +${durations.focus} XP — take a break.`);

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#00C896", "#3b82f6", "#8b5cf6"],
      });

      setXpToast(durations.focus);

      const nextMode = (sess + 1) % 4 === 0 ? "long" : "short";
      setMode(nextMode);
      setTl(durations[nextMode] * 60);
      if (autoStart) {
        setTimeout(() => setRun(true), 1500);
      }
    } else {
      if (soundOn) sfx.notify();
      setToast("Break over! Ready to focus?");
      setMode("focus");
      setTl(durations.focus * 60);
      if (autoStart) {
        setTimeout(() => setRun(true), 1500);
      }
    }
  }, [mode, logPomodoro, durations, sess, autoStart, soundOn]);

  useEffect(() => {
    if (run) {
      ref.current = setInterval(() => {
        setTl(t => { if (t <= 1) { done(); return 0; } return t - 1; });
      }, 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [run, done]);

  // Handle duration changes from settings
  const handleDurationChange = (m, val) => {
    const v = Math.max(1, parseInt(val) || 1);
    setDurations(prev => ({ ...prev, [m]: v }));
    if (mode === m && !run) setTl(v * 60);
  };

  const progress = ((durations[mode] * 60 - tl) / (durations[mode] * 60)) * 100;
  const mins = String(Math.floor(tl / 60)).padStart(2, "0");
  const secs = String(tl % 60).padStart(2, "0");

  return (
    <div className="page-container flex flex-col items-center">
      {toast && <Toast msg={toast} color={color} onClose={() => setToast(null)} />}

      <AnimatePresence>
        {xpToast && <XPToast key="xp" xp={xpToast} onDone={() => setXpToast(null)} />}
      </AnimatePresence>

      {/* Page Header */}
      <div className="w-full flex justify-between items-start mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-3xl grad-text">timer</span>
            <h1 className="text-3xl font-extrabold grad-text tracking-tight">Pomodoro</h1>
          </div>
          <p className="text-muted text-sm">Deep work sessions</p>
        </div>
      </div>

      {/* Main Timer */}
      <PomodoroRing
        progress={progress}
        timeStr={`${mins}:${secs}`}
        label={STATUS[mode]}
        mode={mode}
      />

      {/* Mode Buttons */}
      <div className="flex gap-3 mb-10">
        {Object.entries(LBL).map(([m, label]) => {
          const active = mode === m;
          return (
            <button key={m} onClick={() => { if(soundOn) sfx.click(); sw(m); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-200
                ${active ? "font-semibold" : "glass-card text-muted hover:text-[var(--text)]"}`}
              style={active ? { background: "var(--ac-dim, rgba(0,200,150,0.15))", border: "1px solid rgba(0,200,150,0.4)", color: "var(--ac)" } : {}}>
              {label} {durations[m]}m
            </button>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-6 mb-12">
        <button onClick={() => { if(soundOn) sfx.click(); clearInterval(ref.current); setRun(false); setTl(durations[mode]*60); }}
          className="btn-ghost w-12 h-12 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">restart_alt</span>
        </button>

        <MovingBorderButton
          onClick={() => { if(soundOn) sfx.click(); setRun(r => !r); }}
          className="btn-primary px-10 py-3.5 rounded-full flex items-center justify-center gap-2 text-lg font-bold"
          style={{ background: "var(--ac)", color: "#0B1220" }}
        >
          <span className="material-symbols-outlined text-2xl">
            {run ? "pause" : "play_arrow"}
          </span>
          {run ? "Pause" : "Play"}
        </MovingBorderButton>

        <button onClick={() => { if(soundOn) sfx.click(); sw(mode === "focus" ? "short" : "focus"); }} title="Skip (no XP)"
          className="btn-ghost w-12 h-12 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">skip_next</span>
        </button>
      </div>

      {/* Session Stats */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 text-center">
          <div className="text-[28px] font-bold text-[var(--text)]">{sess}</div>
          <div className="label-text mt-1 text-muted">Today's Sessions</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-[28px] font-bold text-[var(--text)]">{stats.minsToday || 0}m</div>
          <div className="label-text mt-1 text-muted">Total Focus Time</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-[28px] font-bold text-[var(--clr-streak)]">{stats.streak || 0}</div>
          <div className="label-text mt-1 text-[var(--clr-streak)]">Current Streak</div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="w-full max-w-2xl">
        <button onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center justify-between glass-card p-4 text-left hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-dim">settings</span>
            <span className="font-semibold text-sm text-[var(--text)]">Timer Settings</span>
          </div>
          <span className="material-symbols-outlined text-dim transition-transform duration-200"
            style={{ transform: settingsOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
            expand_more
          </span>
        </button>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 mt-2 space-y-5 border-t-0 rounded-t-none border-x-0 border-b-0 bg-transparent">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label-text ml-1 block mb-1">Focus (min)</label>
                    <input type="number" value={durations.focus} onChange={e => handleDurationChange("focus", e.target.value)}
                      className="input-field w-full text-center" min="1" max="120" />
                  </div>
                  <div>
                    <label className="label-text ml-1 block mb-1">Short Break</label>
                    <input type="number" value={durations.short} onChange={e => handleDurationChange("short", e.target.value)}
                      className="input-field w-full text-center" min="1" max="30" />
                  </div>
                  <div>
                    <label className="label-text ml-1 block mb-1">Long Break</label>
                    <input type="number" value={durations.long} onChange={e => handleDurationChange("long", e.target.value)}
                      className="input-field w-full text-center" min="1" max="60" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <span className="text-sm text-[var(--text)]">Auto-start next session</span>
                  <button onClick={() => setAutoStart(!autoStart)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${autoStart ? 'bg-[var(--ac)]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoStart ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <span className="text-sm text-[var(--text)]">Sound effects</span>
                  <button onClick={() => setSoundOn(!soundOn)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${soundOn ? 'bg-[var(--ac)]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${soundOn ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
