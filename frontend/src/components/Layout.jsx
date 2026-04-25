import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

/* ── Ambient Background ─────────────────────────────────── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%]
        bg-[#00C896]/5 blur-[140px] rounded-full" style={{animation:"floatOrb1 18s ease-in-out infinite"}}/>
      <div className="absolute top-[40%] -right-[5%] w-[40%] h-[40%]
        bg-[#00C896]/3 blur-[120px] rounded-full" style={{animation:"floatOrb2 22s ease-in-out infinite"}}/>
      <div className="absolute -bottom-[10%] left-[30%] w-[35%] h-[35%]
        bg-[#00C896]/2 blur-[120px] rounded-full" style={{animation:"floatOrb3 26s ease-in-out infinite"}}/>
    </div>
  );
}

/* ── Top Navbar ─────────────────────────────────────────── */
function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const avatar   = user?.avatar || user?.googleAvatar;
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";

  return (
    <header className="h-16 bg-[#0B132B]/60 backdrop-blur-xl border-b border-white/10
      flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle}
          className="md:hidden p-2 text-dim hover:text-on-surface transition-colors duration-200">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden md:flex items-center gap-2 text-dim text-sm">
          <img src="/cognit-logo.png" alt="Cognit" className="w-6 h-6 object-contain" />
          <span className="font-semibold text-on-surface">Cognit</span>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")}
          className="p-2 text-dim hover:text-[#00C896] hover:bg-white/5
          rounded-xl transition-all duration-200" title="Dashboard">
          <span className="material-symbols-outlined text-xl">bolt</span>
        </button>
        <button onClick={() => navigate("/gamification")}
          className="p-2 text-dim hover:text-[#00C896] hover:bg-white/5
          rounded-xl transition-all duration-200" title="Achievements">
          <span className="material-symbols-outlined text-xl">workspace_premium</span>
        </button>
        <div onClick={() => navigate("/settings")}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10
          hover:border-[#00C896]/40 transition-colors duration-200 cursor-pointer">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full bg-white/5 flex items-center justify-center
                text-xs font-bold text-on-surface">{initials}</div>
          }
        </div>
      </div>
    </header>
  );
}

/* ── Layout Shell ─────────────────────────────────────── */
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B132B] relative">
      <AmbientBackground />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          className="mobile-overlay" />
      )}

      {/* Sidebar */}
      <div className={`sidebar-wrap ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
