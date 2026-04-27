import { useState, useMemo } from "react";

/* ── Build a smart daily task list from real user data ── */
function buildPlan(subjects, deadlines, stats, user) {
  const tasks = [];
  const goal = user?.dailyGoalMins || 120;

  // 1. Urgent deadlines (≤3 days)
  deadlines
    .filter(d => !d.done)
    .forEach(d => {
      const diff = Math.ceil((new Date(d.dueDate) - Date.now()) / 86400000);
      if (diff <= 3) {
        tasks.push({
          id: `dl-${d._id || d.title}`,
          label: `Revise ${d.subject || d.title}`,
          sub: diff <= 0 ? "Due today!" : `Exam in ${diff}d`,
          mins: 30,
          icon: "event_upcoming",
          color: diff <= 1 ? "#f87171" : "#f97316",
          urgent: diff <= 1,
        });
      }
    });

  // 2. Weak subjects (progress < 40%)
  subjects
    .filter(s => s.totalTopics > 0 && (s.doneTopics / s.totalTopics) < 0.4)
    .slice(0, 2)
    .forEach(s => {
      tasks.push({
        id: `sub-${s._id || s.name}`,
        label: `Study ${s.name}`,
        sub: `${Math.round((s.doneTopics / s.totalTopics) * 100)}% complete`,
        mins: 30,
        icon: "menu_book",
        color: s.color || "#3b82f6",
      });
    });

  // 3. Start studying nudge
  if ((stats.minsToday || 0) < 30) {
    tasks.unshift({
      id: "start-session",
      label: "Start your first study session",
      sub: `Goal: ${goal} mins today`,
      mins: 25,
      icon: "play_circle",
      color: "#00C896",
    });
  }

  // 4. If nothing — positive fallback
  if (!tasks.length) {
    tasks.push({
      id: "on-track",
      label: "You're on track — keep going!",
      sub: `${stats.minsToday || 0} / ${goal} mins done`,
      mins: 0,
      icon: "check_circle",
      color: "#00C896",
    });
  }

  return tasks.slice(0, 5);
}

/* ── Checkable task row ── */
function PlanRow({ task, checked, onToggle, delay }) {
  const [pop, setPop] = useState(false);

  const handleToggle = () => {
    if (!checked) setPop(true);
    onToggle(task.id);
  };

  return (
    <div
      className={`plan-task-row ${checked ? "done" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center
          transition-all duration-300 ease-out ${pop ? "check-pop" : ""}`}
        style={{
          background: checked ? task.color : "transparent",
          border: `2px solid ${checked ? task.color : "rgba(255,255,255,.12)"}`,
          boxShadow: checked ? `0 0 8px ${task.color}30` : "none",
          transform: checked ? "scale(1.05)" : "scale(1)",
        }}
        onAnimationEnd={() => setPop(false)}
      >
        {checked && (
          <span className="material-symbols-outlined text-black text-xs font-bold">check</span>
        )}
      </button>

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: task.color + "12" }}
      >
        <span className="material-symbols-outlined text-sm" style={{ color: task.color }}>
          {task.icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="plan-task-label text-xs font-semibold text-on-surface truncate">
          {task.label}
        </div>
        <div className="text-[10px] text-muted mt-0.5">{task.sub}</div>
      </div>

      {/* Duration chip */}
      {task.mins > 0 && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: task.color + "15", color: task.color }}
        >
          {task.mins}m
        </span>
      )}

      {/* Urgency dot */}
      {task.urgent && (
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function TodaysPlan({ subjects, deadlines, stats, user }) {
  const [checked, setChecked] = useState({});

  const tasks = useMemo(
    () => buildPlan(subjects, deadlines, stats, user),
    [subjects, deadlines, stats, user]
  );

  const done = Object.values(checked).filter(Boolean).length;
  const total = tasks.length;

  const toggle = (id) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="hero-card p-6 mb-6 scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#00C896] text-xl filled">
              task_alt
            </span>
          </div>
          <div>
            <div className="text-base font-extrabold text-on-surface">Today's Plan</div>
            <div className="text-[10px] text-muted">
              {done === total && total > 0
                ? "All done — great work!"
                : `${done}/${total} completed`}
            </div>
          </div>
        </div>

        {/* Mini progress ring */}
        <div className="relative w-9 h-9">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="rgba(255,255,255,.06)" strokeWidth="3"
            />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="#00C896" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(done / Math.max(total, 1)) * 94.2} 94.2`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#00C896]">
            {total > 0 ? Math.round((done / total) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {tasks.map((t, i) => (
          <PlanRow
            key={t.id}
            task={t}
            checked={!!checked[t.id]}
            onToggle={toggle}
            delay={i * 60}
          />
        ))}
      </div>
    </div>
  );
}
