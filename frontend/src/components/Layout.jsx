import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

/* ── Ambient Background ─────────────────────────────────── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Primary green orb — softer, larger */}
      <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%]
        bg-[#00C896]/[0.035] blur-[180px] rounded-full" style={{animation:"floatOrb1 20s ease-in-out infinite"}}/>
      {/* Secondary blue orb */}
      <div className="absolute top-[35%] -right-[8%] w-[45%] h-[45%]
        bg-[#3b82f6]/[0.025] blur-[160px] rounded-full" style={{animation:"floatOrb2 25s ease-in-out infinite"}}/>
      {/* Tertiary purple orb */}
      <div className="absolute -bottom-[15%] left-[25%] w-[40%] h-[40%]
        bg-[#8b5cf6]/[0.02] blur-[160px] rounded-full" style={{animation:"floatOrb3 28s ease-in-out infinite"}}/>
      {/* Subtle dot grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] bg-[length:40px_40px] opacity-60" />
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
    <header className="h-16 bg-[#111827]/30 backdrop-blur-2xl border-b border-white/[0.06]
      flex items-center justify-between px-6 md:px-8 sticky top-0 z-30
      shadow-[0_1px_0_rgba(255,255,255,0.03)]">
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
      <div className="flex items-center gap-1">
        <button onClick={() => navigate("/dashboard")}
          className="p-2.5 text-dim hover:text-[#00C896] hover:bg-white/[0.04]
          rounded-xl transition-all duration-200" title="Dashboard">
          <span className="material-symbols-outlined text-[20px]">bolt</span>
        </button>
        <button onClick={() => navigate("/gamification")}
          className="p-2.5 text-dim hover:text-[#8b5cf6] hover:bg-white/[0.04]
          rounded-xl transition-all duration-200" title="Achievements">
          <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
        </button>
        <button onClick={() => navigate("/help")}
          className="p-2.5 text-dim hover:text-white hover:bg-white/[0.04]
          rounded-xl transition-all duration-200" title="Help & Guide">
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>
        <div className="w-px h-6 bg-white/[0.06] mx-1.5" />
        <div onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/[0.08]
          hover:border-[#00C896]/40 hover:scale-105 transition-all duration-300 cursor-pointer">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full bg-white/5 flex items-center justify-center
                text-[11px] font-bold text-on-surface">{initials}</div>
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
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-5 py-3.5
            rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white
            shadow-[0_8px_30px_-5px_rgba(139,92,246,0.5)]
            hover:shadow-[0_12px_40px_-5px_rgba(139,92,246,0.6)] hover:scale-[1.03]
            active:scale-[0.97] transition-all duration-300
            border border-white/20 group"
        >
          <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform duration-300">auto_awesome</span>
          <div className="flex flex-col items-start leading-none pr-0.5">
            <span className="text-[13px] font-bold tracking-wide">Ask AI</span>
            <span className="text-[9px] uppercase tracking-wider opacity-70 font-semibold">Premium</span>
          </div>
        </button>
      </div>
    </div>
  );
}
