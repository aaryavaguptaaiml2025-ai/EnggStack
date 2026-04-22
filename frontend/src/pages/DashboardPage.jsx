import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats, BADGES, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Badge, AnimNum } from "../components/ui";
import XPBar from "../components/XPBar";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const STAT_CONFIG = [
  { icon:"local_fire_department", label:"Streak",    color:"#fbbf24", filled:true },
  { icon:"schedule",              label:"Mins Today", color:"#60a5fa" },
  { icon:"timer",                 label:"Pomodoros",  color:"#f87171" },
  { icon:"emoji_events",          label:"Level",      color:"#a78bfa", filled:true },
];

function StatCard({ icon, label, value, color, delay=0, sub, filled }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="stat-card"
      style={{ opacity:v?1:0, transform:v?"translateY(0)":"translateY(16px)",
        transition:"opacity .5s ease, transform .5s ease, background .2s", borderTop:`2px solid ${color}` }}>
      {/* Decorative glow */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-0
        group-hover:opacity-100 transition-opacity duration-500"
        style={{background:`${color}10`}}/>
      <div className="flex items-center gap-3 relative">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:`${color}15`}}>
          <span className={`material-symbols-outlined text-xl ${filled?"filled":""}`}
            style={{color}}>{icon}</span>
        </div>
        <div>
          <div className="label-text mb-0.5">{label}</div>
          <div className="text-xl font-extrabold text-on-surface">{value}</div>
          {sub && <div className="text-[10px] mt-0.5" style={{color}}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const [subjects,  setSubjects]  = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [notes,     setNotes]     = useState([]);
  const quotes = user?.customQuotes?.length ? user.customQuotes : [
    "Consistency beats motivation.","Small steps every day.",
    "Focus on progress, not perfection.","Push yourself — no one else will.",
  ];
  const [quote] = useState(quotes[Math.floor(Math.random()*quotes.length)]);

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(()=>{});
    api.getDeadlines().then(d=>setDeadlines(d.filter(x=>!x.done).slice(0,4))).catch(()=>{});
    api.getNotes().then(n=>setNotes(n.slice(0,3))).catch(()=>{});
  },[]);

  const hour = new Date().getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const todayIdx = new Date().getDay();
  const wMins = stats.weeklyMins || [0,0,0,0,0,0,0];
  const maxMins = Math.max(...wMins, 1);
  const lv = getLevel(stats.xp||0);
  const goal = user?.dailyGoalMins || 120;
  const goalPct = Math.min(100, Math.round(((stats.minsToday||0)/goal)*100));

  const suggestions = [];
  const urgent = deadlines.find(d=>Math.ceil((new Date(d.dueDate)-Date.now())/86400000)<=2);
  if (urgent) suggestions.push({icon:"bolt",text:`"${urgent.title}" due soon!`,color:"#f87171"});
  const weak = subjects.find(s=>s.totalTopics>0&&(s.doneTopics/s.totalTopics)<0.4);
  if (weak) suggestions.push({icon:"trending_up",text:`${weak.name} needs attention`,color:"#fbbf24"});
  if ((stats.minsToday||0)<30) suggestions.push({icon:"target",text:"Start a study session today!",color:"#60a5fa"});
  if (!suggestions.length) suggestions.push({icon:"auto_awesome",text:"Great job! Keep the streak alive.",color:"#00FFB2"});

  const daysLeft = (d) => {
    const diff=Math.ceil((new Date(d)-Date.now())/86400000);
    return diff<=0?"Today":diff===1?"1d":`${diff}d`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-dim font-mono mb-1">
          {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mb-1">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-[#00FFB2]/70 italic">"{quote}"</p>
      </div>

      {/* Daily goal */}
      <div className="glass-card p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00FFB2]/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#00FFB2]">flag</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-on-surface">
              Daily Goal — {stats.minsToday||0}/{goal} mins
            </span>
            <span className="text-xs text-[#00FFB2] font-bold">{goalPct}%</span>
          </div>
          <ProgressBar value={stats.minsToday||0} max={goal} color="#00FFB2" height={7} glow/>
        </div>
        {goalPct>=100 && (
          <span className="material-symbols-outlined text-warning text-2xl filled">check_circle</span>
        )}
      </div>

      {/* Stat cards — bento grid */}
      <div className="stagger grid-4 grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={STAT_CONFIG[0].icon} label={STAT_CONFIG[0].label}
          value={`${stats.streak||0}d`} color={STAT_CONFIG[0].color}
          delay={0} filled={STAT_CONFIG[0].filled}/>
        <StatCard icon={STAT_CONFIG[1].icon} label={STAT_CONFIG[1].label}
          value={<AnimNum value={stats.minsToday||0}/>} color={STAT_CONFIG[1].color}
          delay={80}/>
        <StatCard icon={STAT_CONFIG[2].icon} label={STAT_CONFIG[2].label}
          value={stats.pomodoros||0} color={STAT_CONFIG[2].color}
          delay={160}/>
        <StatCard icon={STAT_CONFIG[3].icon} label={STAT_CONFIG[3].label}
          value={lv+1} color={STAT_CONFIG[3].color}
          delay={240} sub={LEVEL_NAMES[lv]} filled={STAT_CONFIG[3].filled}/>
      </div>

      {/* XP bar */}
      <div className="mb-6"><XPBar xp={stats.xp||0}/></div>

      {/* Row 1 — 3 cols */}
      <div className="grid-3 grid grid-cols-3 gap-5 mb-5">
        {/* Suggestions */}
        <Card accent="#f97316">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-orange-400 text-lg filled">local_fire_department</span>
            <span className="text-sm font-bold text-on-surface">Smart Suggestions</span>
          </div>
          <div className="space-y-2">
            {suggestions.map((s,i)=>(
              <div key={i} className="p-3 rounded-xl flex gap-3 items-start"
                style={{background:s.color+"0d",border:`1px solid ${s.color}20`}}>
                <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5"
                  style={{color:s.color}}>{s.icon}</span>
                <span className="text-xs text-on-surface leading-relaxed">{s.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subject progress */}
        <Card accent="#60a5fa">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-info text-lg">menu_book</span>
              <span className="text-sm font-bold text-on-surface">Subjects</span>
            </div>
            <button onClick={()=>navigate("/subjects")}
              className="text-[11px] text-[#00FFB2] hover:underline font-semibold">Manage</button>
          </div>
          {subjects.length===0?(
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-3 block">library_books</span>
              <div className="text-xs text-muted mb-3">No subjects yet</div>
              <button onClick={()=>navigate("/subjects")}
                className="bg-[#00FFB2]/10 border border-[#00FFB2]/20 rounded-xl px-4 py-2
                  text-[#00FFB2] text-xs font-semibold hover:bg-[#00FFB2]/15 transition-all duration-200">
                Add Subjects
              </button>
            </div>
          ):subjects.slice(0,5).map((s,i)=>{
            const pct=s.totalTopics>0?Math.round((s.doneTopics/s.totalTopics)*100):0;
            return <div key={i} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-on-surface">{s.name}</span>
                <span className="text-xs font-bold" style={{color:s.color||"#60a5fa"}}>{pct}%</span>
              </div>
              <ProgressBar value={pct} max={100} color={s.color||"#60a5fa"}/>
            </div>;
          })}
        </Card>

        {/* Weekly chart */}
        <Card accent="#00FFB2">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#00FFB2] text-lg">bar_chart</span>
            <span className="text-sm font-bold text-on-surface">This Week</span>
          </div>
          <div className="flex items-end gap-1 h-20 mb-2">
            {wMins.map((m,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="flex-1 w-full flex items-end">
                  <div className="w-full rounded-t transition-all duration-1000 ease-out"
                    style={{
                      minHeight:3,
                      height:`${Math.round((m/maxMins)*100)}%`,
                      background:i===todayIdx
                        ?"linear-gradient(180deg, #00FFB2, #00FFB288)"
                        :"rgba(255,255,255,.08)",
                      boxShadow:i===todayIdx?"0 0 10px rgba(0,255,178,.3)":"none"
                    }}/>
                </div>
                <span className={`text-[8px] ${i===todayIdx?"text-[#00FFB2] font-bold":"text-dim"}`}>
                  {DAYS[i]}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-2 flex justify-between">
            <span className="text-[11px] text-muted">Total</span>
            <span className="text-[11px] text-[#00FFB2] font-bold">
              {wMins.reduce((a,b)=>a+b,0)} mins
            </span>
          </div>
        </Card>
      </div>

      {/* Row 2 — 3 cols */}
      <div className="grid-3 grid grid-cols-[1.3fr_1fr_1fr] gap-5 mb-5">
        {/* Notes */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-info text-lg">edit_note</span>
              <span className="text-sm font-bold text-on-surface">Recent Notes</span>
            </div>
            <button onClick={()=>navigate("/notes")}
              className="text-[11px] text-[#00FFB2] hover:underline font-semibold">View all</button>
          </div>
          {notes.length===0?(
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-3 block">note_add</span>
              <div className="text-xs text-muted">
                No notes.{" "}
                <button onClick={()=>navigate("/notes")} className="text-[#00FFB2] hover:underline">Add one</button>
              </div>
            </div>
          ):notes.map((n,i)=>(
            <div key={i} onClick={()=>navigate("/notes")}
              className="p-3 rounded-xl border border-white/5 bg-white/[.03] mb-2 cursor-pointer
                hover:border-[#00FFB2]/20 transition-all duration-200">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-semibold text-on-surface truncate max-w-[70%]">{n.title}</span>
                <Badge color="#60a5fa">{n.subject||"--"}</Badge>
              </div>
              <div className="text-[11px] text-muted truncate">{n.content?.slice(0,50)||"Empty"}</div>
            </div>
          ))}
        </Card>

        {/* Deadlines */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-warning text-lg">notifications_active</span>
              <span className="text-sm font-bold text-on-surface">Deadlines</span>
            </div>
            <button onClick={()=>navigate("/deadlines")}
              className="text-[11px] text-[#00FFB2] hover:underline font-semibold">View all</button>
          </div>
          {deadlines.length===0?(
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-3 block">event_available</span>
              <div className="text-xs text-muted">
                No deadlines.{" "}
                <button onClick={()=>navigate("/deadlines")} className="text-[#00FFB2] hover:underline">Add one</button>
              </div>
            </div>
          ):deadlines.map((d,i)=>{
            const diff=Math.ceil((new Date(d.dueDate)-Date.now())/86400000);
            const c=diff<=1?"#f87171":diff<=3?"#fbbf24":"#00FFB2";
            return <div key={i} className="flex justify-between items-center p-2.5 rounded-xl
              bg-white/[.03] mb-2">
              <div className="min-w-0 flex-1 mr-2">
                <div className="text-xs text-on-surface font-medium truncate">{d.title}</div>
                <div className="text-[10px] text-muted">{d.subject}</div>
              </div>
              <Badge color={c}>{daysLeft(d.dueDate)}</Badge>
            </div>;
          })}
        </Card>

        {/* Badges */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple text-lg filled">workspace_premium</span>
              <span className="text-sm font-bold text-on-surface">Badges</span>
            </div>
            <button onClick={()=>navigate("/gamification")}
              className="text-[11px] text-[#00FFB2] hover:underline font-semibold">All</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.slice(0,6).map(b=>{
              const e=b.check(stats);
              return <div key={b.id} title={b.label}
                className="p-2.5 rounded-xl flex gap-2 items-center transition-all duration-200"
                style={{
                  border:`1px solid ${e?b.color+"30":"rgba(255,255,255,.05)"}`,
                  background:e?b.color+"0a":"rgba(255,255,255,.03)",
                  opacity:e?1:.35
                }}>
                <span className="material-symbols-outlined text-base" style={{color:e?b.color:"#4a5568"}}>
                  {b.icon}
                </span>
                <div className="text-[10px] font-semibold leading-tight truncate"
                  style={{color:e?b.color:"#4a5568"}}>{b.label}</div>
              </div>;
            })}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#00FFB2] text-lg">bolt</span>
          <span className="text-sm font-bold text-on-surface">Quick Actions</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[
            {icon:"timer",label:"Pomodoro",to:"/pomodoro",c:"#f87171"},
            {icon:"dark_mode",label:"Focus",to:"/focus",c:"#60a5fa"},
            {icon:"checklist",label:"Checklist",to:"/checklist",c:"#00FFB2"},
            {icon:"notifications",label:"Deadlines",to:"/deadlines",c:"#fbbf24"},
            {icon:"analytics",label:"Analytics",to:"/analytics",c:"#a78bfa"},
          ].map((a,i)=>(
            <button key={i} onClick={()=>navigate(a.to)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl min-w-[90px]
                flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5"
              style={{background:a.c+"0d",border:`1px solid ${a.c}20`,color:a.c}}>
              <span className="material-symbols-outlined text-xl">{a.icon}</span>
              <span className="text-[11px] font-semibold">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
