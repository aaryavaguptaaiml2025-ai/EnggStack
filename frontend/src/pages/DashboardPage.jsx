import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats, BADGES, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Badge, AnimNum } from "../components/ui";
import XPBar from "../components/XPBar";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function StatCard({ icon, label, value, color, delay=0, sub }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background:"var(--card)", border:`1px solid var(--border)`,
      borderTop:`3px solid ${color}`, borderRadius:16,
      padding:"16px 18px",
      opacity: v?1:0, transform: v?"translateY(0)":"translateY(16px)",
      transition:"opacity .5s ease, transform .5s ease, background .2s",
      position:"relative", overflow:"hidden",
    }}
      onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
      onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}
    >
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:11,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
        <div>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>{label}</div>
          <div style={{fontSize:20,fontWeight:800,color:"var(--text)"}}>{value}</div>
          {sub && <div style={{fontSize:10,color:color,marginTop:1}}>{sub}</div>}
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
  if (urgent) suggestions.push({icon:"⚡",text:`"${urgent.title}" due soon!`,color:"#f87171"});
  const weak = subjects.find(s=>s.totalTopics>0&&(s.doneTopics/s.totalTopics)<0.4);
  if (weak) suggestions.push({icon:"📈",text:`${weak.name} needs attention`,color:"#fbbf24"});
  if ((stats.minsToday||0)<30) suggestions.push({icon:"🎯",text:"Start a study session today!",color:"#60a5fa"});
  if (!suggestions.length) suggestions.push({icon:"✨",text:"Great job! Keep the streak alive.",color:"#4ade80"});

  const daysLeft = (d) => {
    const diff=Math.ceil((new Date(d)-Date.now())/86400000);
    return diff<=0?"Today":diff===1?"1d":`${diff}d`;
  };

  return (
    <div className="page-pad" style={{padding:"24px 28px",maxWidth:1280,margin:"0 auto"}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:"var(--muted)",fontFamily:"monospace",marginBottom:4}}>
          {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        </div>
        <div style={{fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>{greeting}, {user?.name?.split(" ")[0]} 👋</div>
        <div style={{fontSize:13,color:"var(--ac)",fontStyle:"italic"}}>"{quote}"</div>
      </div>

      {/* Daily goal */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:20}}>🎯</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>Daily Goal — {stats.minsToday||0}/{goal} mins</span>
            <span style={{fontSize:12,color:"var(--ac)",fontWeight:700}}>{goalPct}%</span>
          </div>
          <ProgressBar value={stats.minsToday||0} max={goal} color="var(--ac)" height={7} glow/>
        </div>
        {goalPct>=100 && <span style={{fontSize:20}}>🎉</span>}
      </div>

      {/* Stat cards — 2 cols on mobile, 4 on desktop */}
      <div className="stagger grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        <StatCard icon="⚡" label="Streak"     value={`${stats.streak||0}d`}    color="#fbbf24" delay={0}  />
        <StatCard icon="⏱️" label="Mins Today" value={<AnimNum value={stats.minsToday||0}/>} color="#60a5fa" delay={80} />
        <StatCard icon="🍅" label="Pomodoros"  value={stats.pomodoros||0}        color="#f87171" delay={160}/>
        <StatCard icon="🏆" label="Level"       value={lv+1}                     color="#a78bfa" delay={240} sub={LEVEL_NAMES[lv]}/>
      </div>

      {/* XP bar */}
      <div style={{marginBottom:16}}><XPBar xp={stats.xp||0}/></div>

      {/* Row 1 — 3 cols desktop, 1 col mobile */}
      <div className="grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
        {/* Suggestions */}
        <Card style={{borderTop:"2px solid #f97316"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12}}>🔥 Smart Suggestions</div>
          {suggestions.map((s,i)=>(
            <div key={i} style={{padding:"9px 12px",borderRadius:10,background:s.color+"11",border:`1px solid ${s.color}28`,display:"flex",gap:9,alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontSize:14,flexShrink:0}}>{s.icon}</span>
              <span style={{fontSize:12,color:"var(--text)",lineHeight:1.5}}>{s.text}</span>
            </div>
          ))}
        </Card>

        {/* Subject progress */}
        <Card style={{borderTop:"2px solid #60a5fa"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span>📚 Subjects</span>
            <span onClick={()=>navigate("/subjects")} style={{fontSize:11,color:"var(--ac)",cursor:"pointer"}}>Manage →</span>
          </div>
          {subjects.length===0?(
            <div style={{textAlign:"center",padding:"14px 0"}}>
              <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>No subjects yet</div>
              <button onClick={()=>navigate("/subjects")} style={{background:"var(--ac-dim)",border:"1px solid var(--ac)44",borderRadius:8,padding:"6px 14px",color:"var(--ac)",fontSize:12,cursor:"pointer"}}>Add Subjects</button>
            </div>
          ):subjects.slice(0,5).map((s,i)=>{
            const pct=s.totalTopics>0?Math.round((s.doneTopics/s.totalTopics)*100):0;
            return <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:"var(--text)"}}>{s.icon||"📚"} {s.name}</span>
                <span style={{fontSize:12,color:s.color||"#60a5fa",fontWeight:700}}>{pct}%</span>
              </div>
              <ProgressBar value={pct} max={100} color={s.color||"#60a5fa"}/>
            </div>;
          })}
        </Card>

        {/* Weekly chart */}
        <Card style={{borderTop:"2px solid #4ade80"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12}}>📊 This Week</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80,marginBottom:8}}>
            {wMins.map((m,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,height:"100%"}}>
                <div style={{flex:1,width:"100%",display:"flex",alignItems:"flex-end"}}>
                  <div style={{width:"100%",minHeight:3,height:`${Math.round((m/maxMins)*100)}%`,background:i===todayIdx?"var(--ac)":"rgba(255,255,255,.1)",borderRadius:"3px 3px 0 0",transition:"height 1s ease"}}/>
                </div>
                <span style={{fontSize:8,color:i===todayIdx?"var(--ac)":"var(--dim)"}}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid var(--border)",paddingTop:8,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:"var(--muted)"}}>Total</span>
            <span style={{fontSize:11,color:"var(--ac)",fontWeight:700}}>{wMins.reduce((a,b)=>a+b,0)} mins</span>
          </div>
        </Card>
      </div>

      {/* Row 2 — 3 cols desktop, 1 col mobile */}
      <div className="grid-3" style={{display:"grid",gridTemplateColumns:"1.3fr 1fr 1fr",gap:14,marginBottom:14}}>
        {/* Notes */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span>📝 Recent Notes</span>
            <span onClick={()=>navigate("/notes")} style={{fontSize:11,color:"var(--ac)",cursor:"pointer"}}>View all →</span>
          </div>
          {notes.length===0?<div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"14px 0"}}>No notes. <span onClick={()=>navigate("/notes")} style={{color:"var(--ac)",cursor:"pointer"}}>Add one</span></div>:
          notes.map((n,i)=>(
            <div key={i} onClick={()=>navigate("/notes")} style={{padding:"9px 11px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg2)",marginBottom:7,cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ac)44"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:12,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n.title}</span>
                <Badge color="#60a5fa">{n.subject||"—"}</Badge>
              </div>
              <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.content?.slice(0,50)||"Empty"}</div>
            </div>
          ))}
        </Card>

        {/* Deadlines */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span>🔔 Deadlines</span>
            <span onClick={()=>navigate("/deadlines")} style={{fontSize:11,color:"var(--ac)",cursor:"pointer"}}>View all →</span>
          </div>
          {deadlines.length===0?<div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"14px 0"}}>No deadlines. <span onClick={()=>navigate("/deadlines")} style={{color:"var(--ac)",cursor:"pointer"}}>Add one</span></div>:
          deadlines.map((d,i)=>{
            const diff=Math.ceil((new Date(d.dueDate)-Date.now())/86400000);
            const c=diff<=1?"#f87171":diff<=3?"#fbbf24":"#4ade80";
            return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:9,background:"var(--bg2)",marginBottom:7}}>
              <div style={{minWidth:0,flex:1,marginRight:8}}>
                <div style={{fontSize:12,color:"var(--text)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{d.subject}</div>
              </div>
              <Badge color={c}>{daysLeft(d.dueDate)}</Badge>
            </div>;
          })}
        </Card>

        {/* Badges */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span>🎖️ Badges</span>
            <span onClick={()=>navigate("/gamification")} style={{fontSize:11,color:"var(--ac)",cursor:"pointer"}}>All →</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {BADGES.slice(0,6).map(b=>{
              const e=b.check(stats);
              return <div key={b.id} title={b.label} style={{padding:"9px 8px",borderRadius:9,border:`1px solid ${e?b.color+"44":"var(--border)"}`,background:e?b.color+"0e":"var(--bg2)",display:"flex",gap:7,alignItems:"center",opacity:e?1:.35,transition:"all .3s"}}>
                <span style={{fontSize:17}}>{b.icon}</span>
                <div style={{fontSize:10,color:e?b.color:"var(--muted)",fontWeight:600,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis"}}>{b.label}</div>
              </div>;
            })}
          </div>
        </Card>
      </div>

      {/* Quick actions — 5 cols desktop, scrollable row on mobile */}
      <Card>
        <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12}}>⚡ Quick Actions</div>
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
          {[
            {icon:"🍅",label:"Pomodoro",to:"/pomodoro",c:"#f87171"},
            {icon:"🌙",label:"Focus",to:"/focus",c:"#60a5fa"},
            {icon:"✅",label:"Checklist",to:"/checklist",c:"#4ade80"},
            {icon:"🔔",label:"Deadlines",to:"/deadlines",c:"#fbbf24"},
            {icon:"📊",label:"Analytics",to:"/analytics",c:"#a78bfa"},
          ].map((a,i)=>(
            <button key={i} onClick={()=>navigate(a.to)} style={{background:a.c+"11",border:`1px solid ${a.c}28`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,color:a.c,transition:"all .2s",flexShrink:0,minWidth:80}} onMouseEnter={e=>{e.currentTarget.style.background=a.c+"22";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.background=a.c+"11";e.currentTarget.style.transform="translateY(0)";}}>
              <span style={{fontSize:20}}>{a.icon}</span>
              <span style={{fontSize:11,fontWeight:600}}>{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
