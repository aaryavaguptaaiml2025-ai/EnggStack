import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Input, Btn, Toast, Spinner, Tabs } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const THEMES = [
  { id:"dark", label:"Dark", bg:"#0d0d0d", ac:"#4ade80" },
  { id:"midnight", label:"Midnight", bg:"#060818", ac:"#60a5fa" },
  { id:"forest", label:"Forest", bg:"#080d08", ac:"#34d399" },
  { id:"ocean", label:"Ocean", bg:"#050d14", ac:"#38bdf8" },
  { id:"candy", label:"Candy", bg:"#0f0a1a", ac:"#e879f9" },
];

const ACCENTS = [
  "#4ade80","#60a5fa","#a78bfa","#fbbf24","#f87171","#f472b6",
  "#34d399","#38bdf8","#fb923c","#e879f9","#facc15","#a3e635",
];

const EMOJIS = ["🎓","⚡","🚀","💡","🔥","🎯","📚","🧠","👑","🌟","💎","⭐"];

export default function SettingsPage() {
  const { user, refreshUser, applyUser } = useAuth();
  const [tab, setTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [emoji, setEmoji] = useState(user?.avatarEmoji || "🎓");
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [accent, setAccent] = useState(user?.accentColor || "#4ade80");

  const [goalMins, setGoalMins] = useState(user?.dailyGoalMins || 120);
  const [goalPomos, setGoalPomos] = useState(user?.dailyGoalPomos || 4);
  const [quotes, setQuotes] = useState((user?.customQuotes || []).join("\n"));

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const toast_ok  = (msg) => { sfx.success(); setToast({ msg, color:"#4ade80" }); };
  const toast_err = (msg) => { sfx.error(); setToast({ msg, color:"#f87171" }); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name,
        username: username || undefined,
        avatarEmoji: emoji,
        theme,
        accentColor: accent,
      });
      applyUser(updated);
      await refreshUser();
      toast_ok("✅ Profile saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const qs = quotes.split("\n").map(q=>q.trim()).filter(Boolean);
      const updated = await api.updateProfile({
        dailyGoalMins:goalMins,
        dailyGoalPomos:goalPomos,
        customQuotes:qs
      });
      applyUser(updated);
      toast_ok("✅ Goals saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ theme, accentColor: accent });
      applyUser(updated);
      toast_ok("✅ Theme applied!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!newPass || newPass.length < 6) return toast_err("New password too short");
    setSaving(true);
    try {
      await api.changePassword({ currentPassword: curPass, newPassword: newPass });
      setCurPass(""); setNewPass("");
      toast_ok("✅ Password changed!");
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
      toast_ok("✅ PIN set! You can now log in with it.");
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
    { id:"profile", label:"Profile", icon:"👤" },
    { id:"theme", label:"Theme", icon:"🎨" },
    { id:"goals", label:"Goals", icon:"🎯" },
    { id:"security", label:"Security", icon:"🔒" },
  ];

  return (
    <div style={{ padding:"24px 28px", maxWidth:720, margin:"0 auto" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}
      <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:"0 0 20px" }}>⚙️ Settings</h1>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      <div style={{ marginTop:20 }}>
        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <Card>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:18}}>Profile</div>
            <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
            <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username"/>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:8,fontWeight:500}}>Avatar Emoji</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {EMOJIS.map(em=>(
                  <button key={em} onClick={()=>setEmoji(em)} style={{fontSize:22,width:40,height:40,borderRadius:9,cursor:"pointer",background:emoji===em?"var(--ac-dim)":"var(--bg2)",border:`2px solid ${emoji===em?"var(--ac)":"var(--border)"}`,transition:"all .15s"}}>{em}</button>
                ))}
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:52,height:52,borderRadius:"50%",border:"3px solid var(--ac)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,background:"var(--bg2)",flexShrink:0}}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/> : emoji}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{name || "Your Name"}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>@{username || user?.email?.split("@")[0] || "username"}</div>
              </div>
            </div>

            <Btn full color="var(--ac)" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Btn>
          </Card>
        )}

        {/* ── THEME TAB ── */}
        {tab === "theme" && (
          <Card>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:18}}>Theme & Colors</div>

            <div style={{marginBottom:18}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,fontWeight:500}}>Theme</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10}}>
                {THEMES.map(t=>(
                  <button key={t.id} onClick={()=>{setTheme(t.id);document.documentElement.setAttribute("data-theme",t.id);sfx.click();}}
                    style={{background:t.bg,border:`2px solid ${theme===t.id?t.ac:"var(--border)"}`,borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center",transition:"all .2s",boxShadow:theme===t.id?`0 0 14px ${t.ac}33`:"none"}}
                  >
                    <div style={{width:18,height:18,borderRadius:"50%",background:t.ac,margin:"0 auto 8px",boxShadow:`0 0 6px ${t.ac}66`}}/>
                    <div style={{fontSize:12,color:theme===t.id?t.ac:"#888",fontWeight:theme===t.id?700:400}}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:18}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,fontWeight:500}}>Accent Color</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {ACCENTS.map(c=>(
                  <div key={c} onClick={()=>{setAccent(c);document.documentElement.style.setProperty("--ac",c);document.documentElement.style.setProperty("--ac-dim",c+"20");sfx.click();}}
                    style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${accent===c?"#fff":"transparent"}`,transition:"all .15s",boxShadow:accent===c?`0 0 10px ${c}`:""}}
                  />
                ))}
              </div>
            </div>

            <Btn full color={accent} onClick={saveTheme} disabled={saving}>
              {saving ? "Saving..." : "Apply Theme"}
            </Btn>
          </Card>
        )}

        {/* ── GOALS TAB ── */}
        {tab === "goals" && (
          <Card>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:18}}>Study Goals</div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:8,fontWeight:500}}>
                Daily Study Goal: <b style={{color:"var(--text)"}}>{goalMins} min</b> ({Math.floor(goalMins/60)}h {goalMins%60}m)
              </div>
              <input type="range" min={15} max={480} step={15} value={goalMins} onChange={e=>setGoalMins(+e.target.value)}
                style={{width:"100%",accentColor:"var(--ac)"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--dim)",marginTop:4}}><span>15m</span><span>8h</span></div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:8,fontWeight:500}}>
                Daily Pomodoro Goal: <b style={{color:"var(--text)"}}>{goalPomos} sessions</b>
              </div>
              <input type="range" min={1} max={20} step={1} value={goalPomos} onChange={e=>setGoalPomos(+e.target.value)}
                style={{width:"100%",accentColor:"#f87171"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--dim)",marginTop:4}}><span>1</span><span>20</span></div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:6,fontWeight:500}}>Custom Motivational Quotes</div>
              <div style={{fontSize:11,color:"var(--dim)",marginBottom:6}}>One per line. Shown on your dashboard.</div>
              <textarea value={quotes} onChange={e=>setQuotes(e.target.value)} rows={4} placeholder={"Consistency beats motivation.\nSmall steps every day."}
                style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",color:"var(--text)",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor="var(--ac)44"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}
              />
            </div>

            <Btn full color="var(--ac)" onClick={saveGoals} disabled={saving}>
              {saving ? "Saving..." : "Save Goals"}
            </Btn>
          </Card>
        )}

        {/* ── SECURITY TAB ── */}
        {tab === "security" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Password */}
            <Card>
              <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:18}}>🔑 Change Password</div>
              {user?.hasPassword && (
                <Input label="Current Password" type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} placeholder="Current password"/>
              )}
              <Input label="New Password" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters"/>
              <Btn full color="#60a5fa" onClick={changePassword} disabled={saving}>
                {saving ? "Saving..." : user?.hasPassword ? "Change Password" : "Set Password"}
              </Btn>
            </Card>

            {/* PIN */}
            <Card>
              <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:4}}>📱 Quick PIN Login</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Set a 4-digit PIN for fast login.</div>

              {user?.hasPin ? (
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#4ade80"}}/>
                    <span style={{fontSize:13,color:"var(--text)"}}>PIN is active</span>
                  </div>
                  <Btn color="#f87171" size="sm" variant="outline" onClick={removePin} disabled={saving}>Remove PIN</Btn>
                </div>
              ) : (
                <>
                  <Input label="New PIN (4 digits)" type="password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="e.g. 1234"/>
                  <Input label="Confirm PIN" type="password" value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Re-enter PIN"/>
                  <Btn full color="var(--ac)" onClick={setNewPin} disabled={saving}>
                    {saving ? "Saving..." : "Set PIN"}
                  </Btn>
                </>
              )}
            </Card>

            {/* Account info */}
            <Card>
              <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:14}}>📋 Account Info</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {label:"Email",value:user?.email},
                  {label:"Login Methods",value:[user?.hasPassword&&"Password",user?.hasGoogle&&"Google",user?.hasPin&&"PIN"].filter(Boolean).join(", ")||"None"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:12,color:"var(--muted)"}}>{r.label}</span>
                    <span style={{fontSize:12,color:"var(--text)",fontWeight:500}}>{r.value}</span>
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