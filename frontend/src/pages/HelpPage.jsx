import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "../hooks/useSfx";
import { useStats } from "../context/StatsContext";

export default function HelpPage() {
  const { stats } = useStats();
  const [activeTab, setActiveTab] = useState("xp");

  const tabs = [
    { id: "xp", icon: "bolt", label: "XP & Leveling", color: "#00C896" },
    { id: "badges", icon: "workspace_premium", label: "Badges & Rewards", color: "#8b5cf6" },
    { id: "social", icon: "group", label: "Friends & Sharing", color: "#3b82f6" },
    { id: "tools", icon: "apps", label: "Platform Tools", color: "#f59e0b" }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case "xp":
        return (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
            <div className="glass-card p-6 border-l-4" style={{borderColor: "#00C896"}}>
              <h3 className="text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00C896]">bolt</span>
                How to Earn XP
              </h3>
              <p className="text-muted text-sm leading-relaxed mb-4">
                XP (Experience Points) measures your productivity. You earn XP by engaging in productive activities on Cognit. Every action contributes to your overall level!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { act: "Complete a Pomodoro session", pts: "+50 XP" },
                  { act: "Finish a checklist item", pts: "+10 XP" },
                  { act: "Add a new note", pts: "+5 XP" },
                  { act: "Daily login streak", pts: "+XP Multiplier" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-sm text-dim">{item.act}</span>
                    <span className="text-sm font-bold text-[#00C896]">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h4 className="font-bold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00C896]">moving</span>
                  Leveling Up
                </h4>
                <p className="text-sm text-muted">
                  Every 1000 XP, you level up. Higher levels unlock new avatar borders and profile themes. 
                  Currently, you are Level <span className="font-bold text-[#00C896]">{Math.floor((stats?.xp || 0) / 1000) + 1}</span> with <span className="font-bold text-[#00C896]">{stats?.xp || 0} XP</span>.
                </p>
              </div>
              <div className="glass-card p-6">
                <h4 className="font-bold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f97316]">local_fire_department</span>
                  Daily Streaks
                </h4>
                <p className="text-sm text-muted">
                  Logging in and completing at least one task or pomodoro session every day increases your streak. 
                  Higher streaks multiply the XP you earn from all activities!
                </p>
              </div>
            </div>
          </motion.div>
        );
      case "badges":
        return (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
            <div className="glass-card p-6 border-l-4" style={{borderColor: "#8b5cf6"}}>
              <h3 className="text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">workspace_premium</span>
                Achievements & Badges
              </h3>
              <p className="text-muted text-sm leading-relaxed mb-4">
                Badges are special milestones you unlock by hitting specific goals. They are displayed permanently on your profile.
              </p>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {[
                  { icon: "local_fire_department", name: "On Fire", desc: "Reach a 7-day streak", col: "#f97316" },
                  { icon: "timer", name: "Deep Focus", desc: "Complete 100 Pomodoros", col: "#00C896" },
                  { icon: "edit_note", name: "Scholar", desc: "Write 50 notes", col: "#3b82f6" },
                  { icon: "star", name: "Elite", desc: "Reach Level 50", col: "#eab308" }
                ].map((b, i) => (
                  <div key={i} className="min-w-[140px] flex-shrink-0 bg-white/5 rounded-xl p-4 text-center border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{background: `${b.col}20`, color: b.col}}>
                      <span className="material-symbols-outlined text-2xl">{b.icon}</span>
                    </div>
                    <div className="text-sm font-bold text-on-surface">{b.name}</div>
                    <div className="text-[10px] text-dim">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case "social":
        return (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
            <div className="glass-card p-6 border-l-4" style={{borderColor: "#3b82f6"}}>
              <h3 className="text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3b82f6]">group</span>
                Friends & Social
              </h3>
              <p className="text-muted text-sm leading-relaxed mb-4">
                Studying is better with friends. Connect with others to stay motivated and track each other's progress.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-[#3b82f6] text-2xl mt-1">person_add</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Adding Friends</h4>
                    <p className="text-xs text-dim mt-1">Search for your friends using their exact email address in the Friends tab. Send a request, and once they accept, you're connected!</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-[#3b82f6] text-2xl mt-1">monitoring</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Activity Visibility</h4>
                    <p className="text-xs text-dim mt-1">Your friends can see your current Level, XP, and any Badges you've earned on their Friends dashboard. Use this for friendly competition!</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "tools":
        return (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { i: "timer", t: "Pomodoro", d: "Use the built-in Pomodoro timer to focus. You can configure work, short break, and long break intervals in its settings." },
              { i: "music_note", t: "Music", d: "Play lo-fi, classical, or ambient noises. Music persists across all pages using the floating mini-player." },
              { i: "calendar_month", t: "Timetable & Calendar", d: "Organize your classes and daily schedule. Sync your deadlines to stay on top of your work." },
              { i: "auto_awesome", t: "AI Chat", d: "Need help? Click the floating Premium AI Chat button on the bottom right to get instant tutoring or answers." }
            ].map((t, i) => (
              <div key={i} className="glass-card p-5 hover:bg-white/[0.08] transition-colors group cursor-pointer border border-white/5">
                <span className="material-symbols-outlined text-[var(--ac)] text-3xl mb-3 group-hover:scale-110 transition-transform">{t.i}</span>
                <h4 className="text-sm font-bold text-on-surface mb-1">{t.t}</h4>
                <p className="text-xs text-dim leading-relaxed">{t.d}</p>
              </div>
            ))}
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <span className="material-symbols-outlined text-[var(--ac)] text-4xl">help</span>
            Platform Guide
          </h1>
          <p className="text-muted text-sm mt-2">Learn how to maximize your productivity on Cognit.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { sfx.click(); setActiveTab(tab.id); }}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border
                  ${isActive ? 'bg-white/10 text-white shadow-lg' : 'bg-transparent text-dim hover:bg-white/5 border-transparent'}
                `}
                style={isActive ? { borderColor: `${tab.color}50`, borderLeftWidth: '4px', borderLeftColor: tab.color } : {}}
              >
                <span className="material-symbols-outlined" style={{ color: isActive ? tab.color : 'inherit' }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
