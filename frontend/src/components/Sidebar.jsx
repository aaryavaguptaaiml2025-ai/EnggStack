import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";
import XPBar from "./XPBar";
import { sfx } from "../hooks/useSfx";

const NAV = [
  { to:"/dashboard",    icon:"dashboard",       label:"Dashboard"    },
  { to:"/timetable",    icon:"calendar_month",   label:"Timetable"    },
  { to:"/checklist",    icon:"checklist",        label:"Checklist"    },
  { to:"/pomodoro",     icon:"timer",            label:"Pomodoro"     },
  { to:"/focus",        icon:"dark_mode",        label:"Focus Mode"   },
  { to:"/notes",        icon:"edit_note",        label:"Notes"        },
  { to:"/subjects",     icon:"menu_book",        label:"Subjects"     },
  { to:"/deadlines",    icon:"notifications",    label:"Deadlines"    },
  { to:"/analytics",    icon:"analytics",        label:"Analytics"    },
  { to:"/calendar",     icon:"event",            label:"Calendar"     },
  { to:"/gamification", icon:"emoji_events",     label:"Achievements" },
  { to:"/music",        icon:"music_note",       label:"Music"        },
  { to:"/settings",     icon:"settings",         label:"Settings"     },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { stats }        = useStats();
  const navigate         = useNavigate();

  const avatar   = user?.avatar || user?.googleAvatar;
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";

  const handleNav = () => {
    sfx.click();
    if (onClose) onClose();
  };

  return (
    <aside className="glass-sidebar w-[240px] flex flex-col h-screen overflow-y-auto">
      {/* Logo + close */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-container rounded-xl
            flex items-center justify-center shadow-[0_0_20px_rgba(75,226,119,0.2)]">
            <span className="material-symbols-outlined text-black text-lg font-bold">terminal</span>
          </div>
          <div>
            <div className="text-sm font-extrabold text-on-surface tracking-tight">EnggStack</div>
            <div className="text-[9px] text-dim uppercase tracking-[0.15em] font-bold">Study Platform</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="text-dim hover:text-on-surface p-1 transition-colors duration-200">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} onClick={handleNav}
            className={({ isActive }) => isActive ? "nav-link-active" : "nav-link"}
          >
            <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
            <span className="text-[13px] font-medium truncate">{n.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* XP bar */}
      <div className="px-3 pb-2">
        <XPBar xp={stats.xp || 0} compact />
      </div>

      {/* Streak */}
      {(stats.streak || 0) > 0 && (
        <div className="mx-3 mb-2 bg-orange-500/10 border border-orange-500/20 rounded-xl
          px-3 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400 text-lg filled">local_fire_department</span>
          <div>
            <div className="text-xs font-bold text-orange-400">{stats.streak}d streak!</div>
            <div className="text-[10px] text-dim">Keep it up</div>
          </div>
        </div>
      )}

      {/* User + sign out */}
      <div className="p-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-primary/30">
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full bg-purple/10 flex items-center justify-center
                  text-xs font-bold text-purple">{user?.avatarEmoji || initials}</div>
            }
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-on-surface truncate">{user?.name}</div>
            <div className="text-[10px] text-dim truncate">@{user?.username || user?.email?.split("@")[0]}</div>
          </div>
        </div>
        <button onClick={() => { sfx.click(); logout(); navigate("/login"); }}
          className="w-full border border-white/10 rounded-xl py-2 text-dim text-xs
            hover:border-danger/50 hover:text-danger transition-all duration-200">
          Sign out
        </button>
      </div>
    </aside>
  );
}
