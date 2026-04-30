import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useStats, getLevel, LEVEL_NAMES, XP_THRESHOLDS, BADGES } from "../context/StatsContext";
import { api } from "../api";
import { Card, Btn, Toast, Spinner, ProgressBar } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import SparklesWrapper from "../components/ui/SparklesWrapper";

/* ── Avatar Upload Service ────────────────────────────────
 * Currently stores as base64. To switch to cloud storage (S3/Cloudinary),
 * replace uploadAvatar() with an API call that returns a URL.
 * The rest of the component uses `avatarUrl` generically.
 */
async function uploadAvatar(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 1024 * 1024) return reject(new Error("Image must be under 1MB"));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // base64 string
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, refreshUser, applyUser } = useAuth();
  const { stats } = useStats();
  const fileRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");

  const avatar = user?.avatar || user?.googleAvatar;
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";
  const lv = getLevel(stats.xp || 0);
  const lo = XP_THRESHOLDS[lv] || 0;
  const hi = XP_THRESHOLDS[lv + 1] || lo + 500;
  const earnedBadges = BADGES.filter(b => b.check(stats));

  const toast_ok  = (msg) => { sfx.success(); setToast({ msg, color:"#00C896" }); };
  const toast_err = (msg) => { sfx.error(); setToast({ msg, color:"#f87171" }); };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const avatarData = await uploadAvatar(file);
      const updated = await api.updateProfile({ avatar: avatarData });
      applyUser(updated);
      await refreshUser();
      toast_ok("Avatar updated!");
    } catch(err) {
      toast_err(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, username: username || undefined });
      applyUser(updated);
      await refreshUser();
      setEditing(false);
      toast_ok("Profile saved!");
    } catch(e) { toast_err(e.message); }
    finally { setSaving(false); }
  };

  const STAT_ITEMS = [
    { icon:"bolt", label:"Total XP", value:stats.xp || 0, color:"#fbbf24" },
    { icon:"local_fire_department", label:"Streak", value:`${stats.streak || 0}d`, color:"#f97316" },
    { icon:"timer", label:"Pomodoros", value:stats.pomodoros || 0, color:"#f87171" },
    { icon:"schedule", label:"Total Hours", value:`${Math.floor((stats.totalMins||0)/60)}h`, color:"#3b82f6" },
  ];

  return (
    <div className="page-container max-w-3xl">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}

      {/* ── Hero Profile Card ── */}
      <div className="hero-card p-8 mb-6 fade-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#00C896]/30
              flex-shrink-0 bg-white/5 cursor-pointer"
              onClick={() => fileRef.current?.click()}>
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center
                    text-2xl font-bold text-on-surface">{initials}</div>
              }
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="material-symbols-outlined text-white text-lg">photo_camera</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={handleAvatarChange}/>
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size={20}/>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <div className="space-y-2 mb-3">
                <input value={name} onChange={e=>setName(e.target.value)}
                  className="bg-transparent text-xl font-extrabold text-on-surface outline-none
                    border-b border-white/20 focus:border-[#00C896]/50 w-full transition-colors"
                  placeholder="Your name"/>
                <input value={username} onChange={e=>setUsername(e.target.value)}
                  className="bg-transparent text-sm text-muted outline-none
                    border-b border-white/20 focus:border-[#00C896]/50 w-full transition-colors"
                  placeholder="@username"/>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-on-surface mb-0.5">{user?.name}</h1>
                <div className="text-sm text-muted mb-1">@{user?.username || user?.email?.split("@")[0]}</div>
              </>
            )}
            <SparklesWrapper count={7} colors={["#f59e0b", "#8b5cf6"]}>
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-3
                px-3 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                <span className="material-symbols-outlined text-[#8b5cf6] text-base filled">workspace_premium</span>
                <span className="text-xs font-bold text-[#8b5cf6]">Level {lv+1} — {LEVEL_NAMES[lv]}</span>
              </div>
            </SparklesWrapper>
            <div className="flex gap-2 justify-center sm:justify-start">
              {editing ? (
                <>
                  <Btn color="#00C896" size="sm" onClick={saveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={()=>{setEditing(false);setName(user?.name||"");setUsername(user?.username||"");}}>
                    Cancel
                  </Btn>
                </>
              ) : (
                <Btn color="#3b82f6" size="sm" variant="outline" onClick={()=>setEditing(true)}>
                  <span className="material-symbols-outlined text-sm mr-1">edit</span>Edit Profile
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── XP Progress ── */}
      <Card className="mb-6 fade-up" style={{animationDelay:".1s"}}>
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-[#8b5cf6] text-lg filled">workspace_premium</span>
          <div>
            <div className="text-sm font-bold text-on-surface">Level {lv+1} — {LEVEL_NAMES[lv]}</div>
            <div className="text-[11px] text-muted">{stats.xp||0} / {hi} XP · {hi-(stats.xp||0)} to next level</div>
          </div>
        </div>
        <ProgressBar value={(stats.xp||0)-lo} max={hi-lo} color="#8b5cf6" glow />
      </Card>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STAT_ITEMS.map((s,i) => (
          <Card key={i} className="fade-up text-center" style={{animationDelay:`${.15+i*.05}s`}}>
            <span className="material-symbols-outlined text-2xl mb-2 block" style={{color:s.color}}>{s.icon}</span>
            <div className="text-lg font-extrabold" style={{color:s.color}}>{s.value}</div>
            <div className="text-[10px] text-muted mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Badges ── */}
      <Card className="mb-6 fade-up" style={{animationDelay:".35s"}}>
        <div className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fbbf24] filled">military_tech</span>
          Earned Badges ({earnedBadges.length}/{BADGES.length})
        </div>
        {earnedBadges.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined text-dim text-3xl mb-2 block">emoji_events</span>
            <div className="text-xs text-muted">No badges yet — keep studying!</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {earnedBadges.map(b => (
              <div key={b.id} className="p-3 rounded-xl flex gap-2 items-center"
                style={{background:b.color+"0a", border:`1px solid ${b.color}25`}}>
                <span className="material-symbols-outlined text-lg" style={{color:b.color}}>{b.icon}</span>
                <div className="text-xs font-semibold" style={{color:b.color}}>{b.label}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Account Info ── */}
      <Card className="fade-up" style={{animationDelay:".4s"}}>
        <div className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#3b82f6]">info</span>
          Account Details
        </div>
        <div className="space-y-3">
          {[
            {label:"Email", value:user?.email, icon:"mail"},
            {label:"Login Methods", value:[user?.hasPassword&&"Password",user?.hasGoogle&&"Google"].filter(Boolean).join(", ")||"None", icon:"key"},
          ].map((r,i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
              <span className="material-symbols-outlined text-dim text-base">{r.icon}</span>
              <span className="text-xs text-muted flex-1">{r.label}</span>
              <span className="text-xs text-on-surface font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
