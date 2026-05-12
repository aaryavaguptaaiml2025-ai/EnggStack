import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Toast, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { motion, AnimatePresence } from "framer-motion";

const THEMES = [
  { id:"dark", label:"Dark", bg:"#0B1220" },
  { id:"midnight", label:"Midnight", bg:"#060818" },
  { id:"forest", label:"Forest", bg:"#080d08" },
  { id:"ocean", label:"Ocean", bg:"#050d14" },
  { id:"candy", label:"Candy", bg:"#0f0a1a" },
];

const ACCENTS = [
  "#00C896","#60a5fa","#a78bfa","#fbbf24",
  "#f87171","#f472b6","#34d399","#38bdf8"
];

const EMOJIS = ["👨‍💻","👩‍💻","🚀","🧠","☕","🦉","📚","🎯","⚡","💡","🎓","🎧"];

export default function SettingsPage() {
  const { user, refreshUser, applyUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Profile
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  
  // Appearance
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [accent, setAccent] = useState(user?.accentColor || "#00C896");

  // Goals
  const [goalMins, setGoalMins] = useState(user?.dailyGoalMins || 120);
  const [quotes, setQuotes] = useState(user?.customQuotes || ["Consistency beats motivation."]);
  const [newQuote, setNewQuote] = useState("");

  // Account
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const toast_ok  = (msg) => { sfx.success(); setToast({ msg, color:"#00C896" }); };
  const toast_err = (msg) => { sfx.error(); setToast({ msg, color:"#f87171" }); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, username: username || undefined, avatar, bio });
      applyUser(updated);
      await refreshUser();
      toast_ok("Profile saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const saveAppearance = async (newTheme, newAccent) => {
    const t = newTheme || theme;
    const a = newAccent || accent;
    if (newTheme) {
      setTheme(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    if (newAccent) {
      setAccent(newAccent);
      document.documentElement.style.setProperty("--ac", newAccent);
      document.documentElement.style.setProperty("--ac-dim", newAccent+"15");
    }
    sfx.click();
    try {
      const updated = await api.updateProfile({ theme: t, accentColor: a });
      applyUser(updated);
    } catch(e) { console.error(e); }
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ dailyGoalMins: goalMins, customQuotes: quotes });
      applyUser(updated);
      toast_ok("Goals saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const addQuote = () => {
    if(!newQuote.trim()) return;
    setQuotes([...quotes, newQuote.trim()]);
    setNewQuote("");
  };

  const removeQuote = (idx) => {
    setQuotes(quotes.filter((_, i) => i !== idx));
  };

  const changePassword = async () => {
    if (!newPass || newPass.length < 6) return toast_err("New password too short");
    setSaving(true);
    try {
      await api.changePassword({ currentPassword: curPass, newPassword: newPass });
      setCurPass(""); setNewPass("");
      toast_ok("Password changed!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const TABS = [
    { id:"profile", label:"Profile", icon:"person" },
    { id:"appearance", label:"Appearance", icon:"palette" },
    { id:"goals", label:"Goals", icon:"flag" },
    { id:"notifications", label:"Notifications", icon:"notifications" },
    { id:"account", label:"Account", icon:"lock" },
  ];

  return (
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-3xl grad-text">settings</span>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight">Settings</h1>
        </div>
        <p className="text-muted text-sm">Preferences & customization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        
        {/* Left Column: Navigation */}
        <div className="flex flex-col gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { sfx.click(); setActiveTab(t.id); }}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border
                ${activeTab === t.id 
                  ? "bg-[var(--ac)]/10 border-[var(--ac)]/30 text-[var(--ac)]" 
                  : "glass-card border-white/5 text-muted hover:text-[var(--text)] hover:border-white/10 hover:bg-white/[0.04]"}`}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-xl ${activeTab === t.id ? 'filled' : ''}`}>{t.icon}</span>
                <span className={`text-sm font-semibold ${activeTab === t.id ? 'text-[var(--text)]' : ''}`}>{t.label}</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Right Column: Content */}
        <div className="glass-card p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* PROFILE SECTION */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--text)] mb-6">Edit Profile</h2>
                
                <div>
                  <label className="label-text ml-1 mb-2 block">Avatar</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
                    {EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => setAvatar(emoji)}
                        className={`text-2xl h-12 rounded-xl flex items-center justify-center transition-all bg-white/5 border ${avatar === emoji ? "border-[var(--ac)] bg-[var(--ac)]/10" : "border-white/10 hover:bg-white/10"}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label-text ml-1 mb-2 block">Display Name</label>
                    <input value={name} onChange={e=>setName(e.target.value)} className="input-field w-full" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="label-text ml-1 mb-2 block">Username</label>
                    <input value={username} onChange={e=>setUsername(e.target.value)} className="input-field w-full" placeholder="@username" />
                  </div>
                  <div>
                    <label className="label-text ml-1 mb-2 block">Bio</label>
                    <textarea value={bio} onChange={e=>setBio(e.target.value)} className="input-field w-full resize-none h-24" placeholder="Tell us about yourself..." />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button onClick={saveProfile} disabled={saving} className="btn-primary px-8">
                    {saving ? <Spinner size={16}/> : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* APPEARANCE SECTION */}
            {activeTab === "appearance" && (
              <motion.div key="appearance" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="space-y-8">
                <h2 className="text-xl font-bold text-[var(--text)] mb-6">Appearance</h2>
                
                <div>
                  <label className="label-text ml-1 mb-3 block">App Theme</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => saveAppearance(t.id, null)}
                        className={`h-[60px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all
                          ${theme === t.id ? "border-2 border-[var(--ac)]" : "border border-white/10"}`}
                        style={{ background: t.bg }}>
                        <div className="text-xs font-semibold" style={{ color: theme === t.id ? "var(--text)" : "var(--muted)" }}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-text ml-1 mb-3 block">Accent Color</label>
                  <div className="flex flex-wrap gap-3">
                    {ACCENTS.map(c => (
                      <button key={c} onClick={() => saveAppearance(null, c)}
                        className={`w-[28px] h-[28px] rounded-full transition-all 
                          ${accent === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0B1220]" : ""}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Auto-save enabled</div>
                    <div className="text-xs text-muted">Theme changes apply instantly</div>
                  </div>
                  <span className="material-symbols-outlined text-[var(--ac)]">check_circle</span>
                </div>
              </motion.div>
            )}

            {/* GOALS SECTION */}
            {activeTab === "goals" && (
              <motion.div key="goals" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--text)] mb-6">Study Goals</h2>
                
                <div className="p-5 rounded-2xl border border-[var(--ac)]/20 bg-[var(--ac)]/5 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-[var(--text)]">Daily Study Goal</label>
                    <span className="text-[var(--ac)] font-bold">{goalMins} mins</span>
                  </div>
                  <input type="range" min={30} max={360} step={30} value={goalMins} onChange={e=>setGoalMins(Number(e.target.value))} 
                    className="w-full mb-2" style={{ accentColor: "var(--ac)" }} />
                  <div className="flex justify-between text-[10px] text-muted font-mono">
                    <span>30m</span><span>6h</span>
                  </div>
                </div>

                <div>
                  <label className="label-text ml-1 mb-2 block">Custom Motivational Quotes</label>
                  <div className="flex gap-2 mb-4">
                    <textarea value={newQuote} onChange={e=>setNewQuote(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addQuote();}}}
                      className="input-field flex-1 resize-none h-10 py-2.5" placeholder="Add a new quote..." rows={1} />
                    <button onClick={addQuote} className="btn-primary px-4"><span className="material-symbols-outlined text-sm">add</span></button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {quotes.map((q, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-sm text-[var(--text)] truncate">{q}</span>
                        <button onClick={() => removeQuote(i)} className="text-muted hover:text-[var(--clr-danger)] transition-colors p-1">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {quotes.length === 0 && <div className="text-xs text-muted italic text-center py-4">No custom quotes added.</div>}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button onClick={saveGoals} disabled={saving} className="btn-primary px-8">
                    {saving ? <Spinner size={16}/> : "Save Goals"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--text)] mb-6">Notifications & Sound</h2>
                
                {/* Sound Toggle (Section 3.4) */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-sm text-[var(--text)] font-medium">Sound effects</span>
                    <div className="text-xs text-muted mt-0.5">Play sounds for level-ups, badges, and interactions</div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const updated = await api.updateProfile({ soundEnabled: !user?.soundEnabled });
                        applyUser(updated);
                        toast_ok(updated.soundEnabled ? "Sounds enabled" : "Sounds disabled");
                      } catch (e) { toast_err(e.message); }
                    }}
                    className={`w-10 h-6 rounded-full relative transition-colors ${user?.soundEnabled ? 'bg-[var(--ac)]' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${user?.soundEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  {["Daily reminders", "Deadline alerts", "Weekly summary", "Achievement unlocked"].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm text-[var(--text)]">{item}</span>
                      <button className="w-10 h-6 rounded-full relative transition-colors bg-[var(--ac)]">
                        <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform translate-x-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ACCOUNT SECTION */}
            {activeTab === "account" && (
              <motion.div key="account" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}} className="space-y-8">
                <h2 className="text-xl font-bold text-[var(--text)] mb-6">Account Security</h2>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Change Password</h3>
                  {user?.hasPassword && (
                    <input type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} className="input-field w-full" placeholder="Current Password" />
                  )}
                  <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="input-field w-full" placeholder="New Password (min 6 chars)" />
                  <button onClick={changePassword} disabled={saving} className="btn-outline px-6">
                    {saving ? <Spinner size={16} color="currentColor"/> : "Update Password"}
                  </button>
                </div>

                {/* Data Export (Section 4.3) */}
                <div className="pt-8 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Export Data</h3>
                  <p className="text-xs text-muted mb-4">Download all your data (notes, deadlines, sessions, analytics) as a JSON file.</p>
                  <button
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const data = await api.exportData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `cognit-export-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast_ok('Data exported successfully!');
                      } catch (e) { toast_err(e.message); }
                      finally { setSaving(false); }
                    }}
                    disabled={saving}
                    className="btn-outline px-6 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    {saving ? <Spinner size={16} color="currentColor"/> : 'Export My Data'}
                  </button>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-[var(--clr-danger)] mb-2">Danger Zone</h3>
                  <p className="text-xs text-muted mb-4">Permanently delete your account and all data. This cannot be undone.</p>
                  
                  {deleteConfirm ? (
                    <div className="p-4 rounded-xl border border-[var(--clr-danger)]/30 bg-[var(--clr-danger)]/10">
                      <p className="text-xs text-[var(--text)] mb-3 font-semibold">Are you absolutely sure?</p>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg bg-[var(--clr-danger)] text-white text-xs font-bold hover:bg-[var(--clr-danger)]/80">Yes, Delete Everything</button>
                        <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 rounded-lg bg-white/10 text-[var(--text)] text-xs font-semibold hover:bg-white/20">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 rounded-lg border border-[var(--clr-danger)]/50 text-[var(--clr-danger)] text-xs font-bold hover:bg-[var(--clr-danger)]/10 transition-colors">
                      Delete Account
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
