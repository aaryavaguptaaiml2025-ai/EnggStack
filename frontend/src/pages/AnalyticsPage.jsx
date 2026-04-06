import { useState, useEffect } from "react";
import { useStats, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Heatmap, Tabs } from "../components/ui";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const COLORS = ["#60a5fa","#4ade80","#fbbf24","#a78bfa","#f87171","#f472b6","#34d399","#fb923c"];

function BarChart({ data, labels, color = "#4ade80", height = 120, unit = "" }) {
  const max = Math.max(...data.map(Number), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:5, height }}>
      {data.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%" }}>
          {v>0 && <div style={{fontSize:9,color:"var(--muted)",marginBottom:2}}>{v}{unit}</div>}
          <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
            <div title={`${labels[i]}: ${v}${unit}`} style={{
              width:"100%", minHeight:4,
              height:`${Math.round((Number(v)/max)*100)}%`,
              background:color, borderRadius:"4px 4px 0 0",
              transition:"height 1.2s cubic-bezier(.4,0,.2,1)",
              boxShadow:`0 0 6px ${color}44`,
              position:"relative", overflow:"hidden",
            }}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,transparent,rgba(255,255,255,.15))"}}/>
            </div>
          </div>
          <span style={{fontSize:9,color:"var(--dim)",whiteSpace:"nowrap"}}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, labels, color = "#60a5fa", height = 100 }) {
  const max = Math.max(...data.map(Number), 1);
  const pts = data.map((v,i) => ({
    x: (i / (data.length-1)) * 100,
    y: 100 - Math.round((Number(v)/max)*100),
  }));
  const path = pts.map((p,i) => `${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area = `M ${pts[0].x} 100 ` + pts.map(p=>`L ${p.x} ${p.y}`).join(" ") + ` L ${pts[pts.length-1].x} 100 Z`;
  return (
    <div style={{ position:"relative", height }}>
      <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{width:"100%",height:"100%",overflow:"visible"}}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lg)"/>
        <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2" fill={color} vectorEffect="non-scaling-stroke"><title>{labels[i]}: {data[i]}</title></circle>)}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const { stats } = useStats();
  const [subjects, setSubjects] = useState([]);
  const [tab, setTab] = useState("overview");
  useEffect(()=>{ api.getSubjects().then(setSubjects).catch(()=>{}); },[]);

  const lv = getLevel(stats.xp||0);
  const wMins = stats.weeklyMins||[0,0,0,0,0,0,0];
  const heatmapData = stats.heatmap||{};

  // Simulate last 8 weeks from weeklyMins (for demo shape — real data from heatmap)
  const last4Weeks = [wMins.reduce((a,b)=>a+b,0)-20, wMins.reduce((a,b)=>a+b,0)-50, wMins.reduce((a,b)=>a+b,0)+15, wMins.reduce((a,b)=>a+b,0)];

  return (
    <div style={{padding:"28px 32px",maxWidth:1100,margin:"0 auto"}}>
      <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Analytics</h1>

      <Tabs tabs={[{id:"overview",label:"Overview",icon:"📊"},{id:"heatmap",label:"Study Heatmap",icon:"🔥"},{id:"subjects",label:"Subjects",icon:"📚"}]} active={tab} onChange={setTab}/>

      <div style={{marginTop:20}}>
        {tab==="overview" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
              {[
                {label:"Total Study Time",value:`${Math.floor((stats.totalMins||0)/60)}h ${(stats.totalMins||0)%60}m`,icon:"⏱️",color:"#60a5fa"},
                {label:"Total XP",value:(stats.xp||0).toLocaleString(),icon:"⚡",color:"#fbbf24"},
                {label:"Current Streak",value:`${stats.streak||0} days`,icon:"🔥",color:"#f97316"},
                {label:"Pomodoros Done",value:stats.pomodoros||0,icon:"🍅",color:"#f87171"},
              ].map((s,i)=>(
                <div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"18px 16px",borderLeft:`3px solid ${s.color}`}}>
                  <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Weekly bar + line */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <Card>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>Daily Study (this week)</div>
                <BarChart data={wMins} labels={DAYS} color="#4ade80" unit="m"/>
              </Card>
              <Card>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>Weekly Trend (last 4 weeks)</div>
                <LineChart data={last4Weeks.map(v=>Math.max(0,v))} labels={["3w ago","2w ago","Last w","This w"]} color="#60a5fa" height={110}/>
                <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
                  {last4Weeks.map((v,i)=><div key={i} style={{fontSize:11,color:"var(--muted)"}}>{["3w ago","2w ago","Last w","This w"][i]}: <b style={{color:"var(--ac)"}}>{Math.max(0,v)}m</b></div>)}
                </div>
              </Card>
            </div>

            {/* Level progress */}
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>XP Progress Across Levels</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {XP_THRESHOLDS.slice(0,-1).map((lo,i)=>{
                  const hi=XP_THRESHOLDS[i+1]; const done=Math.min(stats.xp||0,hi)-lo; const total=hi-lo;
                  const pct=Math.max(0,Math.min(100,Math.round((done/total)*100)));
                  const current=lv===i;
                  return <div key={i} style={{opacity:i>lv+1?.3:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:current?"var(--ac)":"var(--muted)",fontWeight:current?600:400}}>
                        {current?"→ ":""}{LEVEL_NAMES[i]} (Lv.{i+1})
                      </span>
                      <span style={{fontSize:11,color:"var(--dim)"}}>{Math.min(stats.xp||0,hi)}/{hi} XP</span>
                    </div>
                    <ProgressBar value={done} max={total} color={current?"var(--ac)":"rgba(255,255,255,.15)"} height={5} glow={current}/>
                  </div>;
                })}
              </div>
            </Card>
          </div>
        )}

        {tab==="heatmap" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:6}}>Study Activity — Last 12 Months</div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Each square = one day. Darker = more minutes studied.</div>
              <Heatmap data={typeof heatmapData==="object"?heatmapData:{}}/>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              {[
                {label:"Total days studied",value:Object.values(heatmapData).filter(v=>Number(v)>0).length},
                {label:"Best day (mins)",value:Math.max(...Object.values(heatmapData).map(Number),0)},
                {label:"Study days this month",value:Object.entries(heatmapData).filter(([k])=>k.startsWith(new Date().toISOString().slice(0,7))).filter(([,v])=>Number(v)>0).length},
              ].map((s,i)=>(
                <div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 18px",textAlign:"center"}}>
                  <div style={{fontSize:26,fontWeight:800,color:"var(--ac)",marginBottom:4}}>{s.value}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="subjects" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {subjects.length===0?<Card style={{textAlign:"center",padding:40}}><div style={{color:"var(--muted)"}}>No subjects yet. Add them in the Subjects page.</div></Card>:(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
                  {subjects.map((s,i)=>{
                    const pct=s.totalTopics>0?Math.round((s.doneTopics/s.totalTopics)*100):0;
                    const c=COLORS[i%COLORS.length];
                    return <Card key={s._id} style={{borderLeft:`3px solid ${c}`}}>
                      <div style={{fontSize:16,marginBottom:6}}>{s.icon||"📚"}</div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:2}}>{s.name}</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>{s.doneTopics}/{s.totalTopics} topics</div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:12,color:"var(--muted)"}}>Progress</span>
                        <span style={{fontSize:12,color:c,fontWeight:700}}>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} max={100} color={c} glow/>
                    </Card>;
                  })}
                </div>
                {/* Subject chart */}
                <Card>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>Subject-wise Progress</div>
                  <BarChart data={subjects.map(s=>s.totalTopics>0?Math.round((s.doneTopics/s.totalTopics)*100):0)} labels={subjects.map(s=>s.name.slice(0,6))} color="#a78bfa" unit="%"/>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
