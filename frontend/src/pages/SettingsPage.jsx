import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Input, Btn, Toast, Spinner, Tabs } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const THEMES = [
  { id:"dark", label:"Dark", bg:"#0B132B", ac:"#00FFB2" },
  { id:"midnight", label:"Midnight", bg:"#060818", ac:"#60a5fa" },
  { id:"forest", label:"Forest", bg:"#080d08", ac:"#34d399" },
  { id:"ocean", label:"Ocean", bg:"#050d14", ac:"#38bdf8" },
  { id:"candy", label:"Candy", bg:"#0f0a1a", ac:"#e879f9" },
];

const ACCENTS = [
  "#00FFB2","#60a5fa","#a78bfa","#fbbf24","#f87171","#f472b6",
  "#34d399","#38bdf8","#fb923c","#e879f9","#facc15","#a3e635",
];

export default function SettingsPage() {
  const { user, refreshUser, applyUser } = useAuth();
  const [tab, setTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [accent, setAccent] = useState(user?.accentColor || "#00FFB2");

  const [goalMins, setGoalMins] = useState(user?.dailyGoalMins || 120);
  const [goalPomos, setGoalPomos] = useState(user?.dailyGoalPomos || 4);
  const [quotes, setQuotes] = useState((user?.customQuotes || []).join("\n"));

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const toast_ok  = (msg) => { sfx.success(); setToast({ msg, color:"#00FFB2" }); };
  const toast_err = (msg) => { sfx.error(); setToast({ msg, color:"#f87171" }); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, username: username || undefined, theme, accentColor: accent });
      applyUser(updated);
      await refreshUser();
      toast_ok("Profile saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const qs = quotes.split("\n").map(q=>q.trim()).filter(Boolean);
      const updated = await api.updateProfile({ dailyGoalMins:goalMins, dailyGoalPomos:goalPomos, customQuotes:qs });
      applyUser(updated);
      toast_ok("Goals saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ theme, accentColor: accent });
      applyUser(updated);
      toast_ok("Theme applied!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
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

  const setNewPin = async () => {
    if (pin !== pinConfirm) return toast_err("PINs do not match");
    if (!/^\d{4}$/.test(pin)) return toast_err("PIN must be exactly 4 digits");
    setSaving(true);
    try {
      await api.setPin({ pin });
      setPin(""); setPinConfirm("");
      await refreshUser();
      toast_ok("PIN set! You can now log in with it.");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const removePin = async () => {
    setSaving(true);
    try {
      await api.removePin();
      await refreshUser();
      toast_ok("PIN removed.");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const TABS = [
    { id:"profile", label:"Profile", icon:"person" },
    { id:"theme", label:"Theme", icon:"palette" },
    { id:"goals", label:"Goals", icon:"flag" },
    { id:"security", label:"Security", icon:"lock" },
  ];

  return (
    <div className="page-container max-w-2xl">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00FFB2] text-2xl">settings</span>
          Settings
        </h1>
        <p className="text-xs text-muted mt-1">Customize your EnggStack experience</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      <div className="mt-6">
        {/* PROFILE */}
        {tab === "profile" && (
          <Card>
            <div className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">person</span> Profile
            </div>
            <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
            <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username"/>

            <div className="flex items-center gap-4 mb-6 p-4 bg-white/[.03] rounded-2xl border border-white/10">
              <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold
                border-[3px] border-[#00FFB2]/30 overflow-hidden bg-white/5 text-on-surface">
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full"/> : (name?.[0]?.toUpperCase() || "?")}
              </div>
              <div>
                <div className="text-sm font-semibold text-on-surface">{name || "Your Name"}</div>
                <div className="text-xs text-muted">@{username || user?.email?.split("@")[0] || "username"}</div>
              </div>
            </div>

            <Btn full color="#00FFB2" onClick={saveProfile} disabled={saving}>
              {saving ? <><Spinner size={14}/> Saving...</> : "Save Profile"}
            </Btn>
          </Card>
        )}

        {/* THEME */}
        {tab === "theme" && (
          <Card>
            <div className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">palette</span> Theme & Colors
            </div>

            <div className="mb-6">
              <div className="text-xs text-muted mb-3 font-medium ml-1">Theme</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {THEMES.map(t=>(
                  <button key={t.id} onClick={()=>{setTheme(t.id);document.documentElement.setAttribute("data-theme",t.id);sfx.click();}}
                    className="rounded-xl p-3 text-center transition-all duration-200"
                    style={{
                      background:t.bg,
                      border:`2px solid ${theme===t.id?t.ac:"rgba(255,255,255,.05)"}`,
                      boxShadow:theme===t.id?`0 0 14px ${t.ac}25`:""
                    }}>
                    <div className="w-5 h-5 rounded-full mx-auto mb-2" style={{background:t.ac,boxShadow:`0 0 6px ${t.ac}44`}}/>
                    <div className="text-xs" style={{color:theme===t.id?t.ac:"#6b7280",fontWeight:theme===t.id?700:400}}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-muted mb-3 font-medium ml-1">Accent Color</div>
              <div className="flex gap-2.5 flex-wrap">
                {ACCENTS.map(c=>(
                  <div key={c} onClick={()=>{setAccent(c);document.documentElement.style.setProperty("--ac",c);document.documentElement.style.setProperty("--ac-dim",c+"15");sfx.click();}}
                    className="w-8 h-8 rounded-full cursor-pointer transition-all duration-200"
                    style={{
                      background:c,
                      border:`3px solid ${accent===c?"#fff":"transparent"}`,
                      boxShadow:accent===c?`0 0 10px ${c}`:""
                    }}/>
                ))}
              </div>
            </div>

            <Btn full color={accent} onClick={saveTheme} disabled={saving}>
              {saving ? <><Spinner size={14}/> Saving...</> : "Apply Theme"}
            </Btn>
          </Card>
        )}

        {/* GOALS */}
        {tab === "goals" && (
          <Card>
            <div className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">flag</span> Study Goals
            </div>

            <div className="mb-6">
              <div className="text-xs text-muted mb-2 font-medium ml-1">
                Daily Study Goal: <b className="text-on-surface">{goalMins} min</b> ({Math.floor(goalMins/60)}h {goalMins%60}m)
              </div>
              <input type="range" min={15} max={480} step={15} value={goalMins} onChange={e=>setGoalMins(+e.target.value)}
                className="w-full" style={{accentColor:"#00FFB2"}}/>
              <div className="flex justify-between text-[11px] text-dim mt-1"><span>15m</span><span>8h</span></div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-muted mb-2 font-medium ml-1">
                Daily Pomodoro Goal: <b className="text-on-surface">{goalPomos} sessions</b>
              </div>
              <input type="range" min={1} max={20} step={1} value={goalPomos} onChange={e=>setGoalPomos(+e.target.value)}
                className="w-full" style={{accentColor:"#f87171"}}/>
              <div className="flex justify-between text-[11px] text-dim mt-1"><span>1</span><span>20</span></div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-muted mb-1.5 font-medium ml-1">Custom Motivational Quotes</div>
              <div className="text-[11px] text-dim mb-1.5 ml-1">One per line. Shown on your dashboard.</div>
              <textarea value={quotes} onChange={e=>setQuotes(e.target.value)} rows={4}
                placeholder={"Consistency beats motivation.\nSmall steps every day."}
                className="input-field resize-none"/>
            </div>

            <Btn full color="#00FFB2" onClick={saveGoals} disabled={saving}>
              {saving ? <><Spinner size={14}/> Saving...</> : "Save Goals"}
            </Btn>
          </Card>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <div className="space-y-5">
            <Card>
              <div className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">key</span> Change Password
              </div>
              {user?.hasPassword && (
                <Input label="Current Password" type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} placeholder="Current password"/>
              )}
              <Input label="New Password" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters"/>
              <Btn full color="#60a5fa" onClick={changePassword} disabled={saving}>
                {saving ? <><Spinner size={14}/> Saving...</> : user?.hasPassword ? "Change Password" : "Set Password"}
              </Btn>
            </Card>

            <Card>
              <div className="text-base font-bold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">pin</span> Quick PIN Login
              </div>
              <div className="text-xs text-muted mb-6">Set a 4-digit PIN for fast login.</div>

              {user?.hasPin ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00FFB2]"/>
                    <span className="text-sm text-on-surface">PIN is active</span>
                  </div>
                  <Btn color="#f87171" size="sm" variant="outline" onClick={removePin} disabled={saving}>Remove PIN</Btn>
                </div>
              ) : (
                <>
                  <Input label="New PIN (4 digits)" type="password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="e.g. 1234"/>
                  <Input label="Confirm PIN" type="password" value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Re-enter PIN"/>
                  <Btn full color="#00FFB2" onClick={setNewPin} disabled={saving}>
                    {saving ? <><Spinner size={14}/> Saving...</> : "Set PIN"}
                  </Btn>
                </>
              )}
            </Card>

            <Card>
              <div className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">info</span> Account Info
              </div>
              <div className="space-y-3">
                {[
                  {label:"Email",value:user?.email},
                  {label:"Login Methods",value:[user?.hasPassword&&"Password",user?.hasGoogle&&"Google",user?.hasPin&&"PIN"].filter(Boolean).join(", ")||"None"},
                ].map((r,i)=>(
                  <div key={i} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-muted">{r.label}</span>
                    <span className="text-xs text-on-surface font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}