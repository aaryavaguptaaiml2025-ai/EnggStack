import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

/* ── Ambient Background ─────────────────────────────────── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Primary green orb */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%]
        bg-[#00C896]/5 blur-[140px] rounded-full" style={{animation:"floatOrb1 18s ease-in-out infinite"}}/>
      {/* Secondary blue orb for depth */}
      <div className="absolute top-[40%] -right-[5%] w-[40%] h-[40%]
        bg-[#3b82f6]/3 blur-[120px] rounded-full" style={{animation:"floatOrb2 22s ease-in-out infinite"}}/>
      {/* Tertiary purple orb */}
      <div className="absolute -bottom-[10%] left-[30%] w-[35%] h-[35%]
        bg-[#8b5cf6]/2 blur-[120px] rounded-full" style={{animation:"floatOrb3 26s ease-in-out infinite"}}/>
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
    <header className="h-16 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.07]
      flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle}
          className="md:hidden p-2 text-dim hover:text-on-surface hover:bg-white/5
            rounded-xl transition-all duration-200">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden md:flex items-center gap-3 text-dim text-sm">
          <img src="/cognit-logo.png" alt="Cognit"
            className="w-7 h-7 object-contain flex-shrink-0" />
          <span className="font-bold text-on-surface tracking-tight text-[15px]">Cognit</span>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/dashboard")}
          className="p-2 text-dim hover:text-[#00C896] hover:bg-white/5
          rounded-xl transition-all duration-200" title="Dashboard">
          <span className="material-symbols-outlined text-xl">bolt</span>
        </button>
        <button onClick={() => navigate("/gamification")}
          className="p-2 text-dim hover:text-[#8b5cf6] hover:bg-white/5
          rounded-xl transition-all duration-200" title="Achievements">
          <span className="material-symbols-outlined text-xl">workspace_premium</span>
        </button>
        <div onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10
          hover:border-[#00C896]/40 transition-colors duration-200 cursor-pointer ml-1">
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
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden relative"
      style={{ background: "#0B1220" }}>
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
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>

        {/* Premium AI Chat FAB */}
        <button
          onClick={() => navigate("/ai-chat")}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3
            rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-[0_8px_32px_rgba(139,92,246,0.4)]
            hover:shadow-[0_8px_40px_rgba(139,92,246,0.6)] hover:scale-105 transition-all duration-300
            border border-white/20 group"
        >
          <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">auto_awesome</span>
          <div className="flex flex-col items-start leading-none pr-1">
            <span className="text-[13px] font-bold">Ask AI</span>
            <span className="text-[9px] uppercase tracking-wider opacity-80 font-semibold">Premium</span>
          </div>
        </button>
      </div>
    </div>
  );
}
