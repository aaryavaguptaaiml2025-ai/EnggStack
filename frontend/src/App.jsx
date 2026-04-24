import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import { MusicProvider } from "./context/MusicContext";
import Layout from "./components/Layout";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage    from "./pages/DashboardPage";
import PomodoroPage     from "./pages/PomodoroPage";
import FocusModePage    from "./pages/FocusModePage";
import AnalyticsPage    from "./pages/AnalyticsPage";
import SettingsPage     from "./pages/SettingsPage";
import MusicPage        from "./pages/MusicPage";
import CalendarPage     from "./pages/CalendarPage";
import { DeadlinesPage, NotesPage, ChecklistPage, SubjectsPage, TimetablePage, GamificationPage } from "./pages/OtherPages";

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B132B] relative">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%]
          bg-[#00C896]/5 blur-[140px] rounded-full"/>
      </div>
      <div className="text-center z-10">
        <img src="/cognit-logo.png" alt="Cognit" className="w-16 h-16 object-contain mb-5" />
        <div className="text-muted text-sm mb-3">Loading Cognit...</div>
        <div className="flex gap-1.5 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#00C896] animate-bounce-dot"
              style={{animationDelay:`${i*0.2}s`}}/>
          ))}
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
          <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </Layout>
    </MusicProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StatsProvider>
          <Routes>
            <Route path="/login"    element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/*"        element={<AppLayout/>}/>
          </Routes>
        </StatsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
