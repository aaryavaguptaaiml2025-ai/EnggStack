import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, THEMES } from "../context/ThemeContext";
import { api } from "../api";
import { Toast, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { motion, AnimatePresence } from "framer-motion";

const ACCENTS = [
  "#00C896","#60a5fa","#a78bfa","#fbbf24",
  "#f87171","#f472b6","#34d399","#38bdf8"
];

/* ── Animated Toggle ── */
function Toggle({ active, onToggle }) {
  return (
    <button onClick={onToggle}
      className={`toggle-switch ${active ? 'active' : ''}`} />
  );
}

export default function SettingsPage() {
  const { user, refreshUser, applyUser, logout } = useAuth();
  const { themeId, accentColor, changeTheme, changeAccent } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  
  // Goals
  const [goalMins, setGoalMins] = useState(user?.dailyGoalMins || 120);
  const [quotes, setQuotes] = useState(user?.customQuotes || ["Consistency beats motivation."]);
  const [newQuote, setNewQuote] = useState("");

  // Account
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePin, setDeletePin] = useState("");

  const toast_ok  = (msg) => { sfx.success(); setToast({ msg, color:"var(--ac)" }); };
  const toast_err = (msg) => { sfx.error(); setToast({ msg, color:"#f87171" }); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, username: username || undefined, bio });
      applyUser(updated);
      await refreshUser();
      toast_ok("Profile saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const handleThemeChange = async (newThemeId) => {
    changeTheme(newThemeId);
    sfx.click();
    try {
      const updated = await api.updateProfile({ theme: newThemeId, accentColor });
      applyUser(updated);
    } catch(e) { console.error(e); }
  };

  const handleAccentChange = async (newAccent) => {
    changeAccent(newAccent);
    sfx.click();
    try {
      const updated = await api.updateProfile({ theme: themeId, accentColor: newAccent });
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

  const removeQuote = (idx) => setQuotes(quotes.filter((_, i) => i !== idx));

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

  const tabVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  return (
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}

      {/* Header */}
      <motion.div className="mb-8"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined text-3xl grad-text">settings</span>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight">Settings</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Preferences & customization</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        
        {/* Left Column: Navigation */}
        <motion.div className="flex flex-col gap-2"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          {TABS.map(t => (
            <motion.button key={t.id}
              variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
              onClick={() => { sfx.click(); setActiveTab(t.id); }}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border
                ${activeTab === t.id 
                  ? "border-glow" 
                  : "glass-card text-muted hover:border-white/10"}`}
              style={activeTab === t.id ? {
                background: 'color-mix(in srgb, var(--ac) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--ac) 30%, transparent)',
                color: 'var(--ac)',
              } : {}}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-xl ${activeTab === t.id ? 'filled' : ''}`}>{t.icon}</span>
                <span className={`text-sm font-semibold ${activeTab === t.id ? '' : ''}`}
                  style={activeTab === t.id ? { color: 'var(--text)' } : {}}>{t.label}</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Right Column: Content */}
        <div className="glass-card p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* PROFILE SECTION — No avatar */}
            {activeTab === "profile" && (
              <motion.div key="profile" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Edit Profile</h2>
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
                <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary px-8">
                    {saving ? <Spinner size={16}/> : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* APPEARANCE SECTION — Fixed theme system */}
            {activeTab === "appearance" && (
              <motion.div key="appearance" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Appearance</h2>
                
                <div>
                  <label className="label-text ml-1 mb-3 block">App Theme</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.values(THEMES).map(t => (
                      <motion.button key={t.id}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleThemeChange(t.id)}
                        className="h-[72px] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-hidden group"
                        style={{
                          background: t.bg,
                          border: themeId === t.id ? `2px solid var(--ac)` : `1px solid var(--border)`,
                          boxShadow: themeId === t.id ? `0 0 20px color-mix(in srgb, var(--ac) 20%, transparent)` : 'none',
                        }}>
                        {themeId === t.id && (
                          <motion.div
                            layoutId="activeTheme"
                            className="absolute inset-0 rounded-xl"
                            style={{ border: '2px solid var(--ac)', boxShadow: `0 0 15px color-mix(in srgb, var(--ac) 25%, transparent)` }}
                          />
                        )}
                        <div className="w-4 h-4 rounded-full mb-0.5" style={{ background: t.glow || t.accent, boxShadow: `0 0 8px ${t.glow || t.accent}` }} />
                        <div className="text-xs font-semibold" style={{ color: themeId === t.id ? "var(--text)" : "var(--muted)" }}>{t.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-text ml-1 mb-3 block">Accent Color</label>
                  <div className="flex flex-wrap gap-3">
                    {ACCENTS.map(c => (
                      <motion.button key={c}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAccentChange(c)}
                        className="w-[32px] h-[32px] rounded-full transition-all"
                        style={{
                          background: c,
                          boxShadow: accentColor === c ? `0 0 16px ${c}, 0 0 0 3px var(--bg), 0 0 0 5px ${c}` : `0 0 8px ${c}44`,
                        }} />
                    ))}
                  </div>
                </div>
                
                <motion.div
                  className="p-5 rounded-2xl flex items-center justify-between"
                  style={{ background: 'color-mix(in srgb, var(--ac) 5%, transparent)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Instant Preview</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>Theme changes apply instantly across the entire app</div>
                  </div>
                  <span className="material-symbols-outlined filled" style={{ color: 'var(--ac)' }}>check_circle</span>
                </motion.div>
              </motion.div>
            )}

            {/* GOALS SECTION */}
            {activeTab === "goals" && (
              <motion.div key="goals" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Study Goals</h2>
                
                <div className="p-5 rounded-2xl" style={{ border: '1px solid color-mix(in srgb, var(--ac) 20%, transparent)', background: 'color-mix(in srgb, var(--ac) 5%, transparent)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold" style={{ color: 'var(--text)' }}>Daily Study Goal</label>
                    <span className="font-bold" style={{ color: 'var(--ac)' }}>{goalMins} mins</span>
                  </div>
                  <input type="range" min={30} max={360} step={30} value={goalMins} onChange={e=>setGoalMins(Number(e.target.value))} 
                    className="w-full mb-2" />
                  <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    <span>30m</span><span>6h</span>
                  </div>
                </div>

                <div>
                  <label className="label-text ml-1 mb-2 block">Custom Motivational Quotes</label>
                  <div className="flex gap-2 mb-4">
                    <textarea value={newQuote} onChange={e=>setNewQuote(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addQuote();}}}
                      className="input-field flex-1 resize-none h-10 py-2.5" placeholder="Add a new quote..." rows={1} />
                    <button onClick={addQuote} className="btn-primary px-4"><span className="material-symbols-outlined text-sm">add</span></button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {quotes.map((q, i) => (
                      <motion.div key={i} layout
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center p-3 rounded-xl"
                        style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
                        <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{q}</span>
                        <button onClick={() => removeQuote(i)} className="p-1 transition-colors hover:text-[var(--clr-danger)]" style={{ color: 'var(--muted)' }}>
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </motion.div>
                    ))}
                    {quotes.length === 0 && <div className="text-xs italic text-center py-4" style={{ color: 'var(--muted)' }}>No custom quotes added.</div>}
                  </div>
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={saveGoals} disabled={saving} className="btn-primary px-8">
                    {saving ? <Spinner size={16}/> : "Save Goals"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Notifications & Sound</h2>
                
                <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Sound effects</span>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Play sounds for level-ups, badges, and interactions</div>
                  </div>
                  <Toggle active={user?.soundEnabled} onToggle={async () => {
                    try {
                      const updated = await api.updateProfile({ soundEnabled: !user?.soundEnabled });
                      applyUser(updated);
                      toast_ok(updated.soundEnabled ? "Sounds enabled" : "Sounds disabled");
                    } catch (e) { toast_err(e.message); }
                  }} />
                </div>

                <div className="space-y-2">
                  {["Daily reminders", "Deadline alerts", "Weekly summary", "Achievement unlocked"].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-2xl"
                      style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{item}</span>
                      <Toggle active={true} onToggle={() => {}} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ACCOUNT SECTION */}
            {activeTab === "account" && (
              <motion.div key="account" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Account Security</h2>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Change Password</h3>
                  {user?.hasPassword && (
                    <input type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} className="input-field w-full" placeholder="Current Password" />
                  )}
                  <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="input-field w-full" placeholder="New Password (min 6 chars)" />
                  <button onClick={changePassword} disabled={saving} className="btn-outline px-6">
                    {saving ? <Spinner size={16} color="currentColor"/> : "Update Password"}
                  </button>
                </div>

                {/* Data Export */}
                <div className="pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Export Data</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Download all your data as a JSON file.</p>
                  <button
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const data = await api.exportData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `cognit-export-${new Date().toISOString().split('T')[0]}.json`;
                        a.click(); URL.revokeObjectURL(url);
                        toast_ok('Data exported successfully!');
                      } catch (e) { toast_err(e.message); }
                      finally { setSaving(false); }
                    }}
                    disabled={saving} className="btn-outline px-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>
                    {saving ? <Spinner size={16} color="currentColor"/> : 'Export My Data'}
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold text-[var(--clr-danger)] mb-2">Danger Zone</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Permanently delete your account and all data.</p>
                  
                  {deleteConfirm ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-[var(--clr-danger)]/30 bg-[var(--clr-danger)]/10">
                      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text)' }}>Enter your PIN to confirm:</p>
                      <input type="password" value={deletePin} onChange={e => setDeletePin(e.target.value)} 
                        placeholder="Your PIN" maxLength={6} className="input-field w-full mb-3" />
                      <div className="flex gap-3">
                        <button disabled={saving}
                          onClick={async () => {
                            try {
                              setSaving(true);
                              await api.deleteAccount(deletePin || undefined);
                              toast_ok("Account deleted. Goodbye!");
                              setTimeout(() => { logout(); window.location.href = "/login"; }, 1500);
                            } catch (e) { toast_err(e.message); }
                            finally { setSaving(false); }
                          }}
                          className="px-4 py-2 rounded-lg bg-[var(--clr-danger)] text-white text-xs font-bold hover:bg-[var(--clr-danger)]/80">
                          {saving ? <Spinner size={14} color="white"/> : "Yes, Delete Everything"}
                        </button>
                        <button onClick={() => { setDeleteConfirm(false); setDeletePin(""); }}
                          className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--card2)', color: 'var(--text)' }}>Cancel</button>
                      </div>
                    </motion.div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(true)}
                      className="px-4 py-2 rounded-lg border border-[var(--clr-danger)]/50 text-[var(--clr-danger)] text-xs font-bold hover:bg-[var(--clr-danger)]/10 transition-colors">
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
