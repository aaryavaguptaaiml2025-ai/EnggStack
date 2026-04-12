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
        {/* keep rest UI exactly same as your HEAD version */}
      </div>
    </div>
  );
}