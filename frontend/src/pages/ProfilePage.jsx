import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useStats, getLevel, LEVEL_NAMES, LEVEL_ICONS, XP_THRESHOLDS, BADGES } from "../context/StatsContext";
import { Heatmap, ProgressBar } from "../components/ui";
import { api } from "../api";

export default function ProfilePage() {
  const { user } = useAuth();
  const { stats } = useStats();
  const [heatmap, setHeatmap] = useState({});

  useEffect(() => {
    api.getHeatmap?.().then(setHeatmap).catch(() => {});
  }, []);

  const lv = getLevel(stats.xp || 0);
  const lo = XP_THRESHOLDS[lv] || 0;
  const hi = XP_THRESHOLDS[lv + 1] || lo + 500;
  const xpProgress = ((stats.xp || 0) - lo) / (hi - lo);

  const earnedBadges = BADGES.filter(b => b.check(stats));
  const totalStudyHrs = Math.round((stats.totalStudyMins || 0) / 60);
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  const statItems = [
    { label: "Total XP", value: stats.xp || 0, icon: "star", color: "var(--ac)" },
    { label: "Study Hours", value: totalStudyHrs, icon: "schedule", color: "#60a5fa" },
    { label: "Current Streak", value: `${stats.streak || 0}d`, icon: "local_fire_department", color: "#f97316" },
    { label: "Sessions", value: stats.totalSessions || 0, icon: "target", color: "#a78bfa" },
    { label: "Badges", value: earnedBadges.length, icon: "military_tech", color: "#fbbf24" },
    { label: "Level", value: lv + 1, icon: "workspace_premium", color: "#f472b6" },
  ];

  return (
    <div className="page-container max-w-5xl mx-auto">
      {/* Hero Header */}
      <motion.div className="relative rounded-3xl overflow-hidden mb-8"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--ac) 8%, transparent), transparent 60%)` }} />
          <motion.div className="absolute -top-[30%] -right-[10%] w-[50%] h-[80%] rounded-full blur-[100px]"
            style={{ background: 'color-mix(in srgb, var(--ac) 6%, transparent)' }}
            animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
        </div>

        <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black relative"
              style={{
                background: `linear-gradient(135deg, var(--ac), color-mix(in srgb, var(--ac) 60%, #8b5cf6))`,
                color: 'var(--bg)',
                boxShadow: `0 0 30px color-mix(in srgb, var(--ac) 25%, transparent)`,
              }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
              {/* Level ring */}
              <div className="absolute -inset-1 rounded-full border-2 glow-pulse" style={{ borderColor: 'var(--ac)' }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: 'var(--bg)', border: '2px solid var(--ac)', color: 'var(--ac)' }}>
              {lv + 1}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div className="flex-1 text-center md:text-left"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-1 grad-text">{user?.name}</h1>
            {user?.username && <p className="text-sm font-mono mb-1" style={{ color: 'var(--muted)' }}>@{user.username}</p>}
            {user?.bio && <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{user.bio}</p>}
            
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--ac) 10%, transparent)', color: 'var(--ac)', border: '1px solid color-mix(in srgb, var(--ac) 20%, transparent)' }}>
                <span className="material-symbols-outlined text-sm filled">{LEVEL_ICONS[lv] || "workspace_premium"}</span>
                {LEVEL_NAMES[lv]}
              </span>
              <span className="text-xs" style={{ color: 'var(--dim)' }}>
                <span className="material-symbols-outlined text-sm align-middle mr-1">calendar_today</span>
                Joined {joinDate}
              </span>
            </div>

            {/* XP Bar */}
            <div className="mt-4 max-w-sm mx-auto md:mx-0">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-mono" style={{ color: 'var(--dim)' }}>Level {lv + 1}</span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--ac)' }}>{stats.xp || 0} / {hi} XP</span>
              </div>
              <ProgressBar value={xpProgress * 100} max={100} color="var(--ac)" glow height={6} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
        {statItems.map((s, i) => (
          <motion.div key={i}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="stat-card text-center p-4">
            <span className="material-symbols-outlined text-2xl mb-2 block filled" style={{ color: s.color }}>{s.icon}</span>
            <div className="text-xl font-extrabold mb-0.5" style={{ color: 'var(--text)' }}>{s.value}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--dim)' }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Heatmap */}
      <motion.div className="glass-card p-6 mb-8"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-lg" style={{ color: 'var(--ac)' }}>grid_view</span>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Study Activity</h2>
        </div>
        <Heatmap data={heatmap} />
      </motion.div>

      {/* Badges */}
      <motion.div className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: '#fbbf24' }}>military_tech</span>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Badges Earned</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'color-mix(in srgb, #fbbf24 10%, transparent)', color: '#fbbf24' }}>
            {earnedBadges.length} / {BADGES.length}
          </span>
        </div>
        {earnedBadges.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: 'var(--dim)' }}>emoji_events</span>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete tasks to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earnedBadges.map((b, i) => (
              <motion.div key={b.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="p-4 rounded-xl text-center"
                style={{
                  background: `${b.color}08`,
                  border: `1px solid ${b.color}25`,
                  boxShadow: `0 0 15px ${b.color}10`,
                }}>
                <div className="text-2xl mb-1">{b.icon}</div>
                <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--text)' }}>{b.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--dim)' }}>{b.desc}</div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
