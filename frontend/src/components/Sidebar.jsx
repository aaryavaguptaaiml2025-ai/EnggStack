import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
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
  { to:"/calculator",   icon:"calculate",        label:"Calculator"   },
  { to:"/ai-chat",      icon:"psychology",       label:"AI Chat"      },
  { to:"/friends",      icon:"group",            label:"Friends"      },
  { to:"/settings",     icon:"settings",         label:"Settings"     },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { stats }        = useStats();
  const navigate         = useNavigate();
  const location         = useLocation();
  const reduced          = useReducedMotion();

  const avatar   = user?.avatar || user?.googleAvatar;
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";

  const handleNav = () => {
    sfx.click();
    if (onClose) onClose();
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <aside className="glass-sidebar w-[250px] flex flex-col h-screen overflow-y-auto">
      {/* Logo + close */}
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/cognit-logo.png" alt="Cognit" className="w-7 h-7 object-contain flex-shrink-0" />
          <span className="text-[15px] font-extrabold text-on-surface tracking-tight">Cognit</span>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="text-dim hover:text-on-surface hover:bg-white/5
              p-1.5 rounded-lg transition-all duration-200">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {NAV.map(n => {
          const active = isActive(n.to);
          return (
            <NavLink key={n.to} to={n.to} onClick={handleNav}
              className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200"
              style={{ color: active ? "#00C896" : undefined }}
            >
              {/* Animated active pill background */}
              {active && (
                reduced ? (
                  <div className="absolute inset-0 rounded-lg bg-[#00C896]/10"
                    style={{ boxShadow: "0 0 12px rgba(0,200,150,0.15)" }} />
                ) : (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-[#00C896]/10"
                    style={{ boxShadow: "0 0 12px rgba(0,200,150,0.15)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )
              )}
              {/* Icon with gradient when active */}
              <span
                className="material-symbols-outlined text-[20px] relative z-10"
                style={active ? {
                  background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                } : { color: "#6b7280" }}
              >
                {n.icon}
              </span>
              <span className={`text-[13px] font-medium truncate relative z-10 ${
                active ? "text-[#00C896]" : "text-muted hover:text-on-surface"
              }`}>
                {n.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* XP bar */}
      <div className="px-3 pb-2">
        <XPBar xp={stats.xp || 0} compact />
      </div>

      {/* Streak */}
      {(stats.streak || 0) > 0 && (
        <div className="mx-3 mb-2 bg-[#f97316]/5 border border-[#f97316]/15 rounded-xl
          px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
          <span className="material-symbols-outlined text-[#f97316] text-lg filled">local_fire_department</span>
          <div>
            <div className="text-xs font-bold text-[#f97316]">{stats.streak}d streak</div>
            <div className="text-[10px] text-dim">Keep it up</div>
          </div>
        </div>
      )}

      {/* User + sign out */}
      <div className="p-4 pt-2 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white/5
          rounded-xl p-1.5 -mx-1.5 transition-all duration-200"
          onClick={() => { sfx.click(); navigate("/profile"); if (onClose) onClose(); }}>
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-white/10">
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full bg-white/5 flex items-center justify-center
                  text-xs font-bold text-on-surface">{initials}</div>
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
