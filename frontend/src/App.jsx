import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import { MusicProvider } from "./context/MusicContext";
import { ToastProvider } from "./context/ToastContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Layout from "./components/Layout";
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
import { DeadlinesPage, NotesPage, ChecklistPage, SubjectsPage, TimetablePage, GamificationPage } from "./pages/OtherPages";

/* ── Page transition wrapper ── */
const pageVariants = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.15, ease: "easeIn" } },
};

function PageWrap({ children }) {
  /* Respect prefers-reduced-motion */
  const reduced = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: "100%", minHeight: "100%" }}
    >
      {children}
    </motion.div>
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
        <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] relative">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%]
          bg-[#00C896]/5 blur-[140px] rounded-full"/>
      </div>
      <div className="text-center z-10 loading-fade-in">
        <img src="/cognit-logo.png" alt="Cognit" className="w-16 h-16 object-contain mx-auto mb-5" />
        <div className="text-on-surface text-lg font-bold mb-1">Cognit</div>
        <div className="text-muted text-sm mb-5">Preparing your workspace...</div>
        <div className="w-40 h-1 rounded-full bg-white/5 mx-auto overflow-hidden">
          <div className="h-full bg-[#00C896] rounded-full loading-bar" />
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
      </PomodoroProvider>
    </MusicProvider>
  );
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' && window.__GOOGLE_CLIENT_ID__) || "dummy_client_id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
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
    </BrowserRouter>
  </GoogleOAuthProvider>
  );
}
