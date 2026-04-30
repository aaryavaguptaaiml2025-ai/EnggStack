import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import { MusicProvider } from "./context/MusicContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage    from "./pages/DashboardPage";
import PomodoroPage     from "./pages/PomodoroPage";
import FocusModePage    from "./pages/FocusModePage";
import AnalyticsPage    from "./pages/AnalyticsPage";
import SettingsPage     from "./pages/SettingsPage";
import MusicPage        from "./pages/MusicPage";
import CalendarPage     from "./pages/CalendarPage";
import CalculatorPage   from "./pages/CalculatorPage";
import AIChatPage       from "./pages/AIChatPage";
import ProfilePage      from "./pages/ProfilePage";
import FriendsPage      from "./pages/FriendsPage";
import { DeadlinesPage, NotesPage, ChecklistPage, SubjectsPage, TimetablePage, GamificationPage } from "./pages/OtherPages";

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
      <Layout>
        <Routes>
          <Route path="/dashboard"    element={<DashboardPage/>}/>
          <Route path="/pomodoro"     element={<PomodoroPage/>}/>
          <Route path="/focus"        element={<FocusModePage/>}/>
          <Route path="/deadlines"    element={<DeadlinesPage/>}/>
          <Route path="/notes"        element={<NotesPage/>}/>
          <Route path="/checklist"    element={<ChecklistPage/>}/>
          <Route path="/subjects"     element={<SubjectsPage/>}/>
          <Route path="/timetable"    element={<TimetablePage/>}/>
          <Route path="/gamification" element={<GamificationPage/>}/>
          <Route path="/analytics"    element={<AnalyticsPage/>}/>
          <Route path="/settings"     element={<SettingsPage/>}/>
          <Route path="/music"        element={<MusicPage/>}/>
          <Route path="/calendar"     element={<CalendarPage/>}/>
          <Route path="/calculator"   element={<CalculatorPage/>}/>
          <Route path="/ai-chat"      element={<AIChatPage/>}/>
          <Route path="/profile"      element={<ProfilePage/>}/>
          <Route path="/friends"      element={<FriendsPage/>}/>
          <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </Layout>
    </MusicProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <StatsProvider>
            <Routes>
              <Route path="/login"    element={<LoginPage/>}/>
              <Route path="/register" element={<RegisterPage/>}/>
              <Route path="/*"        element={<AppLayout/>}/>
            </Routes>
          </StatsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
