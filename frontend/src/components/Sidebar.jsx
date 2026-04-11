import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";
import XPBar from "./XPBar";
import { sfx } from "../hooks/useSfx";

const NAV = [
<<<<<<< HEAD
  { to:"/dashboard",    icon:"⊞", label:"Dashboard"    },
  { to:"/timetable",    icon:"📅", label:"Timetable"    },
  { to:"/checklist",    icon:"✅", label:"Checklist"    },
  { to:"/pomodoro",     icon:"🍅", label:"Pomodoro"     },
  { to:"/focus",        icon:"🌙", label:"Focus Mode"   },
  { to:"/notes",        icon:"📝", label:"Notes"        },
  { to:"/subjects",     icon:"📚", label:"Subjects"     },
  { to:"/deadlines",    icon:"🔔", label:"Deadlines"    },
  { to:"/analytics",    icon:"📊", label:"Analytics"    },
  { to:"/calendar",     icon:"🗓️", label:"Calendar"     },
  { to:"/gamification", icon:"🏆", label:"Achievements" },
  { to:"/music",        icon:"🎵", label:"Music"        },
  { to:"/settings",     icon:"⚙️", label:"Settings"     },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { stats }        = useStats();
  const navigate         = useNavigate();

  const avatar   = user?.avatar || user?.googleAvatar;
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";

  const handleNav = () => {
    sfx.click();
    if (onClose) onClose(); // close on mobile after tap
  };

  return (
    <aside style={{
      width: 224,
      background: "var(--bg2)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo + close button (close only shows on mobile via CSS) */}
      <div style={{ padding:"16px 14px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:"var(--ac)", borderRadius:9,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, fontWeight:900, color:"#000", boxShadow:"0 0 12px var(--ac-dim)" }}>E</div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>EnggStack</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>Study Platform</div>
          </div>
        </div>
        {/* Close button — only relevant on mobile */}
        {onClose && (
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:20, padding:4, lineHeight:1 }}>×</button>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:"4px 8px", overflowY:"auto" }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} onClick={handleNav}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap:10,
              padding: "9px 11px", borderRadius:10, marginBottom:1,
              background: isActive ? "var(--ac-dim)" : "transparent",
              border: `1px solid ${isActive ? "rgba(74,222,128,.2)" : "transparent"}`,
              color: isActive ? "var(--ac)" : "var(--muted)",
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              transition: "all .15s", textDecoration: "none",
            })}
          >
            <span style={{ fontSize:15, width:20, textAlign:"center", flexShrink:0 }}>{n.icon}</span>
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.label}</span>
=======
  { to:"/dashboard",icon:"grid",label:"Dashboard" },
  { to:"/timetable",icon:"cal",label:"Timetable" },
  { to:"/checklist",icon:"check",label:"Checklist" },
  { to:"/pomodoro",icon:"timer",label:"Pomodoro" },
  { to:"/focus",icon:"moon",label:"Focus Mode" },
  { to:"/notes",icon:"note",label:"Notes" },
  { to:"/subjects",icon:"book",label:"Subjects" },
  { to:"/deadlines",icon:"bell",label:"Deadlines" },
  { to:"/analytics",icon:"chart",label:"Analytics" },
  { to:"/calendar",icon:"date",label:"Calendar" },
  { to:"/gamification",icon:"trophy",label:"Achievements" },
  { to:"/music",icon:"music",label:"Music" },
  //{ to:"/ai-chat",icon:"bot",label:"AI Chat" },
  { to:"/settings",icon:"gear",label:"Settings" },
];

const ICONS = {
  grid:"⊞",cal:"📅",check:"✅",timer:"🍅",moon:"🌙",note:"📝",book:"📚",bell:"🔔",
  chart:"📊",date:"🗓️",trophy:"🏆",music:"🎵",bot:"🤖",gear:"⚙️"
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const avatar = user?.avatar || user?.googleAvatar;
  const initials = user?.name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";

  return (
    <aside style={{ width:224,background:"var(--bg2)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,flexShrink:0,overflowY:"auto" }}>
      <div style={{padding:"18px 16px 10px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,background:"var(--ac)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#000",boxShadow:"0 0 14px var(--ac-dim)"}}>E</div>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"var(--text)"}}>EnggStack</div>
          <div style={{fontSize:10,color:"var(--muted)"}}>Study Platform</div>
        </div>
      </div>

      <nav style={{flex:1,padding:"6px 8px",overflowY:"auto"}}>
        {NAV.map(n=>(
          <NavLink key={n.to} to={n.to} onClick={()=>sfx.click()}
            style={({isActive})=>({ display:"flex",alignItems:"center",gap:10,padding:"8px 11px",borderRadius:10,marginBottom:1,background:isActive?"var(--ac-dim)":"transparent",border:`1px solid ${isActive?"rgba(74,222,128,.2)":"transparent"}`,color:isActive?"var(--ac)":"var(--muted)",fontSize:13,fontWeight:isActive?600:400,transition:"all .15s",textDecoration:"none" })}
          >
            <span style={{fontSize:14,width:18,textAlign:"center",flexShrink:0}}>{ICONS[n.icon]}</span>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.label}</span>
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
          </NavLink>
        ))}
      </nav>

<<<<<<< HEAD
      {/* XP bar */}
      <div style={{ padding:"0 10px 8px" }}>
        <XPBar xp={stats.xp || 0} compact />
      </div>

      {/* Streak */}
      {(stats.streak || 0) > 0 && (
        <div style={{ margin:"0 10px 8px", background:"rgba(249,115,22,.1)", border:"1px solid rgba(249,115,22,.25)", borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>🔥</span>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:"#f97316" }}>{stats.streak}d streak!</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>Keep it up</div>
          </div>
        </div>
      )}

      {/* User + sign out */}
      <div style={{ padding:"10px 12px 14px", borderTop:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:"2px solid var(--ac)" }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <div style={{ width:"100%", height:"100%", background:"#a78bfa22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#a78bfa" }}>{user?.avatarEmoji || initials}</div>
            }
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
            <div style={{ fontSize:10, color:"var(--dim)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>@{user?.username || user?.email?.split("@")[0]}</div>
          </div>
        </div>
        <button onClick={() => { sfx.click(); logout(); navigate("/login"); }}
          style={{ width:"100%", background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"7px", color:"var(--dim)", fontSize:12, cursor:"pointer", transition:"all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#f87171"; e.currentTarget.style.color="#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--dim)"; }}
        >Sign out</button>
=======
      <div style={{padding:"0 10px 8px"}}>
        <XPBar xp={stats.xp||0} compact/>
      </div>

      {(stats.streak||0)>0&&(
        <div style={{margin:"0 10px 8px",background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.25)",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>🔥</span>
          <div><div style={{fontSize:12,fontWeight:600,color:"#f97316"}}>{stats.streak}d streak!</div><div style={{fontSize:10,color:"var(--muted)"}}>Keep it up</div></div>
        </div>
      )}

      <div style={{padding:"10px 12px 14px",borderTop:"1px solid var(--border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,overflow:"hidden",border:"2px solid var(--ac)"}}>
            {avatar
              ? <img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <div style={{width:"100%",height:"100%",background:"#a78bfa22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#a78bfa"}}>{user?.avatarEmoji||initials}</div>
            }
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
            <div style={{fontSize:10,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>@{user?.username||user?.email?.split("@")[0]}</div>
          </div>
        </div>
        <button onClick={()=>{sfx.click();logout();navigate("/login");}} style={{width:"100%",background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"7px",color:"var(--dim)",fontSize:12,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#f87171";e.currentTarget.style.color="#f87171";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--dim)";}}>Sign out</button>
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
      </div>
    </aside>
  );
}
