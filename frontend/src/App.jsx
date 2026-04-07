import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import { MusicProvider } from "./context/MusicContext";
import Sidebar from "./components/Sidebar";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage from "./pages/DashboardPage";
import PomodoroPage from "./pages/PomodoroPage";
//import AIChatPage from "./pages/AIChatPage";
import FocusModePage from "./pages/FocusModePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import MusicPage from "./pages/MusicPage";
import CalendarPage from "./pages/CalendarPage";
import { DeadlinesPage, NotesPage, ChecklistPage, SubjectsPage, TimetablePage, GamificationPage } from "./pages/OtherPages";

// Permanent ambient background animations — always visible
function AmbientBackground() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {/* Slow moving gradient orbs */}
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.04),transparent 65%)", top:"-15%", left:"10%", animation:"floatOrb1 18s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,.04),transparent 65%)", top:"40%", right:"-10%", animation:"floatOrb2 22s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.03),transparent 65%)", bottom:"-10%", left:"30%", animation:"floatOrb3 26s ease-in-out infinite" }}/>

      {/* Floating particles */}
      {[...Array(8)].map((_,i) => (
        <div key={i} style={{
          position:"absolute",
          width: 2 + (i%3),
          height: 2 + (i%3),
          borderRadius:"50%",
          background:`rgba(74,222,128,${0.08 + (i%4)*0.04})`,
          left: `${10 + i*11}%`,
          top: `${20 + (i%5)*15}%`,
          animation:`floatParticle ${8+i*2}s ease-in-out infinite ${i*1.2}s`,
        }}/>
      ))}
    </div>
  );
}

function Layout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",position:"relative"}}>
      <AmbientBackground/>
      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{width:64,height:64,background:"var(--ac)",borderRadius:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:900,color:"#000",marginBottom:18,boxShadow:"0 0 32px var(--ac-dim)",animation:"glow 2s ease-in-out infinite"}}>E</div>
        <div style={{color:"var(--muted)",fontSize:14,marginBottom:8}}>Loading EnggStack...</div>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"var(--ac)",animation:`bounce .9s infinite ${i*.2}s`}}/>)}
        </div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace/>;
  return (
    <MusicProvider>
      <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--bg)",position:"relative"}}>
        <AmbientBackground/>
        <Sidebar/>
        <main style={{flex:1,overflowY:"auto",background:"transparent",position:"relative",zIndex:1}}>
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
        </main>
      </div>
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
            <Route path="/*"        element={<Layout/>}/>
          </Routes>
        </StatsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
