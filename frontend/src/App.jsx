import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import { MusicProvider } from "./context/MusicContext";
import { ToastProvider } from "./context/ToastContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import CommandPalette from "./components/CommandPalette";
import ShortcutsHelp from "./components/ShortcutsHelp";
import OfflineBanner from "./components/OfflineBanner";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage    from "./pages/DashboardPage";
import PomodoroPage     from "./pages/PomodoroPage";
import AnalyticsPage    from "./pages/AnalyticsPage";
import SettingsPage     from "./pages/SettingsPage";
import HelpPage         from "./pages/HelpPage";
import MusicPage        from "./pages/MusicPage";
import CalendarPage     from "./pages/CalendarPage";
import CalculatorPage   from "./pages/CalculatorPage";
import AIChatPage       from "./pages/AIChatPage";
import ProfilePage      from "./pages/ProfilePage";
import FriendsPage      from "./pages/FriendsPage";
import FlashcardsPage   from "./pages/FlashcardsPage";
import { DeadlinesPage, NotesPage, ChecklistPage, SubjectsPage, TimetablePage, GamificationPage } from "./pages/OtherPages";

/* ── Mouse-follow glow effect ── */
function MouseGlow() {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const handleMove = useCallback((e) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [handleMove]);

  return <div className="mouse-glow" style={{ left: pos.x, top: pos.y }} />;
}

/* ── Page transition wrapper ── */
const pageVariants = {
  initial:  { opacity: 0, y: 16, scale: 0.99 },
  animate:  { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.2, ease: "easeIn" } },
};

function PageWrap({ children }) {
  const reduced = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) return <ErrorBoundary>{children}</ErrorBoundary>;

  return (
    <ErrorBoundary>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: "100%", minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </ErrorBoundary>
  );
}

/* ── Animated Routes inside Layout ── */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard"    element={<PageWrap><DashboardPage/></PageWrap>}/>
        <Route path="/pomodoro"     element={<PageWrap><PomodoroPage/></PageWrap>}/>
        <Route path="/deadlines"    element={<PageWrap><DeadlinesPage/></PageWrap>}/>
        <Route path="/notes"        element={<PageWrap><NotesPage/></PageWrap>}/>
        <Route path="/checklist"    element={<PageWrap><ChecklistPage/></PageWrap>}/>
        <Route path="/subjects"     element={<PageWrap><SubjectsPage/></PageWrap>}/>
        <Route path="/timetable"    element={<PageWrap><TimetablePage/></PageWrap>}/>
        <Route path="/gamification" element={<PageWrap><GamificationPage/></PageWrap>}/>
        <Route path="/analytics"    element={<PageWrap><AnalyticsPage/></PageWrap>}/>
        <Route path="/settings"     element={<PageWrap><SettingsPage/></PageWrap>}/>
        <Route path="/music"        element={<PageWrap><MusicPage/></PageWrap>}/>
        <Route path="/calendar"     element={<PageWrap><CalendarPage/></PageWrap>}/>
        <Route path="/calculator"   element={<PageWrap><CalculatorPage/></PageWrap>}/>
        <Route path="/ai-chat"      element={<PageWrap><AIChatPage/></PageWrap>}/>
        <Route path="/profile"      element={<PageWrap><ProfilePage/></PageWrap>}/>
        <Route path="/friends"      element={<PageWrap><FriendsPage/></PageWrap>}/>
        <Route path="/help"         element={<PageWrap><HelpPage/></PageWrap>}/>
        <Route path="/flashcards"   element={<PageWrap><FlashcardsPage/></PageWrap>}/>
        <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--bg, #0B1220)' }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%]
          blur-[140px] rounded-full" style={{ background: 'color-mix(in srgb, var(--ac) 5%, transparent)' }}/>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%]
          blur-[120px] rounded-full" style={{ background: 'color-mix(in srgb, var(--glow, #8b5cf6) 5%, transparent)' }}/>
      </div>
      <div className="text-center z-10 loading-fade-in">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src="/cognit-logo.png" alt="Cognit" className="w-16 h-16 object-contain mx-auto mb-5" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Cognit</div>
          <div className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Preparing your workspace...</div>
        </motion.div>
        <div className="w-40 h-1 rounded-full mx-auto overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full loading-bar" style={{ background: 'var(--ac)' }} />
        </div>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace/>;

  return (
    <MusicProvider>
      <PomodoroProvider>
        <Layout>
          <AnimatedRoutes />
        </Layout>
        <MouseGlow />
        <CommandPalette onShortcuts={() => setShortcutsOpen(true)} />
        <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <OfflineBanner />
        <button
          onClick={() => setShortcutsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] w-9 h-9 rounded-full
            flex items-center justify-center text-sm font-bold backdrop-blur-sm
            transition-all duration-200 hover:scale-110 glow-pulse"
          style={{
            background: 'color-mix(in srgb, var(--ac) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--ac) 25%, transparent)',
            color: 'var(--muted)',
          }}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      </PomodoroProvider>
    </MusicProvider>
  );
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' && window.__GOOGLE_CLIENT_ID__) || "dummy_client_id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
          <AuthProvider>
            <StatsProvider>
              <Routes>
                <Route path="/login"    element={<PageWrap><LoginPage/></PageWrap>}/>
                <Route path="/register" element={<PageWrap><RegisterPage/></PageWrap>}/>
                <Route path="/*"        element={<AppLayout/>}/>
              </Routes>
            </StatsProvider>
          </AuthProvider>
        </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
