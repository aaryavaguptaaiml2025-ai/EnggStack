import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Input, Btn, Toast, Spinner, Tabs } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const THEMES = [
  { id:"dark",     label:"Dark",     bg:"#0d0d0d", ac:"#4ade80" },
  { id:"midnight", label:"Midnight", bg:"#060818", ac:"#60a5fa" },
  { id:"forest",   label:"Forest",   bg:"#080d08", ac:"#34d399" },
  { id:"ocean",    label:"Ocean",    bg:"#050d14", ac:"#38bdf8" },
  { id:"candy",    label:"Candy",    bg:"#0f0a1a", ac:"#e879f9" },
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

  // Profile fields
  const [name,     setName]     = useState(user?.name     || "");
  const [username, setUsername] = useState(user?.username || "");
  const [emoji,    setEmoji]    = useState(user?.avatarEmoji || "🎓");
  const [theme,    setTheme]    = useState(user?.theme    || "dark");
  const [accent,   setAccent]   = useState(user?.accentColor || "#4ade80");

  // Goals
  const [goalMins,  setGoalMins]  = useState(user?.dailyGoalMins  || 120);
  const [goalPomos, setGoalPomos] = useState(user?.dailyGoalPomos || 4);
  const [quotes,    setQuotes]    = useState((user?.customQuotes || []).join("\n"));

  // Security
  const [curPass,  setCurPass]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [pin,      setPin]      = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const toast_ok  = (msg) => { sfx.success(); setToast({ msg, color:"#4ade80" }); };
  const toast_err = (msg) => { sfx.error();   setToast({ msg, color:"#f87171" }); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name, username: username || undefined,
        avatarEmoji: emoji,
        theme, accentColor: accent,
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
      const updated = await api.updateProfile({ dailyGoalMins:goalMins, dailyGoalPomos:goalPomos, customQuotes:qs });
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
    { id:"profile",  label:"Profile",  icon:"👤" },
    { id:"theme",    label:"Theme",    icon:"🎨" },
    { id:"goals",    label:"Goals",    icon:"🎯" },
    { id:"security", label:"Security", icon:"🔒" },
  ];

  return (
<<<<<<< HEAD
    <div style={{ padding:"24px 28px", maxWidth:720, margin:"0 auto" }}>
=======
    <div style={{ padding:"28px 32px", maxWidth:720, margin:"0 auto" }}>
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}
      <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:"0 0 20px" }}>⚙️ Settings</h1>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      <div style={{ marginTop:20 }}>

        {/* ── Profile ─────────────────────────────────────────────────── */}
        {tab==="profile" && (
          <Card>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:18 }}>Profile Information</div>

            {/* Avatar emoji picker */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8, fontWeight:500 }}>Avatar Emoji</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {EMOJIS.map(e=>(
                  <button key={e} onClick={()=>setEmoji(e)} style={{
                    fontSize:24, width:44, height:44, borderRadius:10, cursor:"pointer",
                    background: emoji===e ? "var(--ac-dim)" : "var(--bg2)",
                    border:`2px solid ${emoji===e?"var(--ac)":"var(--border)"}`,
                    transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{e}</button>
                ))}
              </div>
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:56,height:56,borderRadius:"50%",border:"2px solid var(--ac)",background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28 }}>{emoji}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{name || "Your Name"}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>@{username || user?.email?.split("@")[0]}</div>
                </div>
              </div>
            </div>

            <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/>
<<<<<<< HEAD
            <Input label="Username" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="e.g. aaryava"/>
=======
            <Input label="Username" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="e.g. name"/>
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12,color:"var(--muted)",marginBottom:6,fontWeight:500 }}>Email</div>
              <div style={{ background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:10,padding:"11px 14px",fontSize:13,color:"var(--dim)" }}>{user?.email}</div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:4, padding:"10px 14px", background:"var(--bg2)", borderRadius:10, border:"1px solid var(--border)", marginBottom:18, fontSize:12, color:"var(--muted)" }}>
              <span>Connected:</span>
              {user?.hasGoogle && <span style={{color:"#4ade80"}}>✓ Google</span>}
              {user?.hasPassword && <span style={{color:"#60a5fa"}}>✓ Password</span>}
              {user?.hasPin && <span style={{color:"#a78bfa"}}>✓ PIN</span>}
            </div>
            <Btn color="var(--ac)" onClick={saveProfile} disabled={saving}>
              {saving?<Spinner color="#000" size={16}/>:"Save Profile"}
            </Btn>
          </Card>
        )}

        {/* ── Theme ────────────────────────────────────────────────────── */}
        {tab==="theme" && (
          <Card>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:18 }}>Appearance</div>

            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10, fontWeight:500 }}>Theme</div>
<<<<<<< HEAD
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))", gap:10, marginBottom:20 }}>
=======
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
              {THEMES.map(t=>(
                <button key={t.id} onClick={()=>{setTheme(t.id);document.documentElement.setAttribute("data-theme",t.id);}} style={{
                  padding:"14px 6px", borderRadius:12, cursor:"pointer",
                  background:t.bg, border:`2px solid ${theme===t.id?t.ac:"rgba(255,255,255,.1)"}`,
                  display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                  transition:"all .2s",
                }}>
                  <div style={{ width:24,height:24,borderRadius:"50%",background:t.ac,boxShadow:`0 0 8px ${t.ac}` }}/>
                  <span style={{ fontSize:11, color:theme===t.id?t.ac:"rgba(255,255,255,.5)", fontWeight:theme===t.id?600:400 }}>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10, fontWeight:500 }}>Accent Color</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
              {ACCENTS.map(c=>(
                <button key={c} onClick={()=>{setAccent(c);document.documentElement.style.setProperty("--ac",c);document.documentElement.style.setProperty("--ac-dim",c+"20");}} style={{ width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${accent===c?"#fff":"transparent"}`,transition:"all .15s",boxShadow:accent===c?`0 0 10px ${c}`:""}}/>
              ))}
            </div>

            {/* Live preview */}
            <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:18 }}>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>Preview</div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:`${accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{emoji}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{name||"Your Name"}</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>Level 5 — Expert</div>
                </div>
                <div style={{ marginLeft:"auto", background:`${accent}22`,border:`1px solid ${accent}44`,borderRadius:8,padding:"5px 12px",color:accent,fontSize:12,fontWeight:600 }}>+30 XP</div>
              </div>
            </div>

            <Btn color="var(--ac)" onClick={saveTheme} disabled={saving}>
              {saving?<Spinner color="#000" size={16}/>:"Apply Theme"}
            </Btn>
          </Card>
        )}

        {/* ── Goals ────────────────────────────────────────────────────── */}
        {tab==="goals" && (
          <Card>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:18 }}>Study Goals & Personalization</div>

            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8, fontWeight:500 }}>Daily Study Goal: <b style={{color:"var(--text)"}}>{goalMins} minutes</b></div>
              <input type="range" min={15} max={480} step={15} value={goalMins} onChange={e=>setGoalMins(+e.target.value)} style={{width:"100%",accentColor:"var(--ac)"}}/>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--dim)",marginTop:4 }}><span>15 min</span><span>8 hours</span></div>
            </div>

            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8, fontWeight:500 }}>Daily Pomodoro Goal: <b style={{color:"var(--text)"}}>{goalPomos} sessions</b></div>
              <input type="range" min={1} max={12} step={1} value={goalPomos} onChange={e=>setGoalPomos(+e.target.value)} style={{width:"100%",accentColor:"var(--ac)"}}/>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--dim)",marginTop:4 }}><span>1</span><span>12</span></div>
            </div>

            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Custom Motivational Quotes <span style={{color:"var(--dim)"}}>(one per line)</span></div>
              <textarea value={quotes} onChange={e=>setQuotes(e.target.value)} rows={5}
                placeholder={"Consistency beats motivation.\nSmall steps every day.\nPush yourself — no one else will."}
                style={{ width:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", color:"var(--text)", fontSize:12, outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.6 }}
                onFocus={e=>{e.target.style.borderColor="var(--ac)";}} onBlur={e=>{e.target.style.borderColor="var(--border)";}}
              />
              <div style={{ fontSize:11, color:"var(--dim)", marginTop:4 }}>These appear as random quotes on your dashboard.</div>
            </div>

            <Btn color="var(--ac)" onClick={saveGoals} disabled={saving}>
              {saving?<Spinner color="#000" size={16}/>:"Save Goals"}
            </Btn>
          </Card>
        )}

        {/* ── Security ─────────────────────────────────────────────────── */}
        {tab==="security" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* PIN */}
            <Card>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:6 }}>PIN Login</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>
                Set a 4-digit PIN to log in quickly from any device — just enter your email + PIN.
                {user?.hasPin && <span style={{color:"#4ade80",marginLeft:8}}>✓ PIN is active</span>}
              </div>
<<<<<<< HEAD
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:10 }}>
=======
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
                <Input label="New PIN (4 digits)" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••" style={{letterSpacing:8,textAlign:"center",fontSize:20}}/>
                <Input label="Confirm PIN" type="password" inputMode="numeric" maxLength={4} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••" style={{letterSpacing:8,textAlign:"center",fontSize:20}}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn color="var(--ac)" onClick={setNewPin} disabled={saving||pin.length!==4}>{saving?<Spinner color="#000" size={16}/>:user?.hasPin?"Update PIN":"Set PIN"}</Btn>
                {user?.hasPin && <Btn variant="outline" color="#f87171" onClick={removePin} disabled={saving}>Remove PIN</Btn>}
              </div>
            </Card>

            {/* Password */}
            {user?.hasPassword && (
              <Card>
                <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Change Password</div>
                <Input label="Current Password" type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} placeholder="Current password"/>
                <Input label="New Password" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" style={{marginBottom:0}}/>
                <Btn color="var(--ac)" onClick={changePassword} disabled={saving||!curPass||!newPass} style={{marginTop:14}}>
                  {saving?<Spinner color="#000" size={16}/>:"Change Password"}
                </Btn>
              </Card>
            )}

            {/* Account info */}
            <Card>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Login Methods</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { label:"Email/Password", active:user?.hasPassword, color:"#60a5fa", icon:"📧" },
                  { label:"Google OAuth",   active:user?.hasGoogle,   color:"#4ade80", icon:"🔍" },
                  { label:"PIN Login",      active:user?.hasPin,      color:"#a78bfa", icon:"🔢" },
                ].map(m=>(
                  <div key={m.label} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--bg2)",borderRadius:10,border:`1px solid ${m.active?m.color+"33":"var(--border)"}` }}>
                    <span style={{fontSize:18}}>{m.icon}</span>
                    <span style={{flex:1,fontSize:13,color:"var(--text)",fontWeight:500}}>{m.label}</span>
                    <span style={{fontSize:12,fontWeight:600,color:m.active?m.color:"var(--dim)"}}>{m.active?"✓ Active":"Not set"}</span>
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
