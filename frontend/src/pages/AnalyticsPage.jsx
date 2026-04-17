import { useState, useEffect } from "react";
import { useStats, getLevel, LEVEL_NAMES, XP_THRESHOLDS } from "../context/StatsContext";
import { api } from "../api";
import { Card, ProgressBar, Heatmap, Tabs } from "../components/ui";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const COLORS = ["#60a5fa","#4be277","#fbbf24","#a78bfa","#f87171","#f472b6","#34d399","#fb923c"];

function BarChart({ data, labels, color = "#4be277", height = 120, unit = "" }) {
  const max = Math.max(...data.map(Number), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((v,i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
          {v>0 && <div className="text-[9px] text-muted mb-0.5">{v}{unit}</div>}
          <div className="flex-1 w-full flex items-end">
            <div title={`${labels[i]}: ${v}${unit}`}
              className="w-full rounded-t relative overflow-hidden transition-all duration-1000"
              style={{minHeight:4, height:`${Math.round((Number(v)/max)*100)}%`,
                background:color, boxShadow:`0 0 6px ${color}44`}}>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15"/>
            </div>
          </div>
          <span className="text-[9px] text-dim whitespace-nowrap">{labels[i]}</span>
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
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
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
  const last4Weeks = [wMins.reduce((a,b)=>a+b,0)-20, wMins.reduce((a,b)=>a+b,0)-50, wMins.reduce((a,b)=>a+b,0)+15, wMins.reduce((a,b)=>a+b,0)];

  return (
    <div className="page-container max-w-5xl">
      <div className="mb-6">
        <h1 className="section-title">Analytics</h1>
        <p className="text-xs text-muted mt-1">Deep dive into your study patterns</p>
      </div>

      <Tabs tabs={[
        {id:"overview",label:"Overview",icon:"📊"},
        {id:"heatmap",label:"Study Heatmap",icon:"🔥"},
        {id:"subjects",label:"Subjects",icon:"📚"}
      ]} active={tab} onChange={setTab}/>

      <div className="mt-5">
        {tab==="overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {label:"Total Study Time",value:`${Math.floor((stats.totalMins||0)/60)}h ${(stats.totalMins||0)%60}m`,icon:"schedule",color:"#60a5fa"},
                {label:"Total XP",value:(stats.xp||0).toLocaleString(),icon:"bolt",color:"#fbbf24"},
                {label:"Current Streak",value:`${stats.streak||0} days`,icon:"local_fire_department",color:"#f97316"},
                {label:"Pomodoros Done",value:stats.pomodoros||0,icon:"timer",color:"#f87171"},
              ].map((s,i)=>(
                <div key={i} className="glass-card p-5" style={{borderLeft:`3px solid ${s.color}`}}>
                  <span className="material-symbols-outlined text-2xl mb-2 block" style={{color:s.color}}>{s.icon}</span>
                  <div className="text-xl font-extrabold" style={{color:s.color}}>{s.value}</div>
                  <div className="text-[11px] text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                  Daily Study (this week)
                </div>
                <BarChart data={wMins} labels={DAYS} color="#4be277" unit="m"/>
              </Card>
              <Card>
                <div className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-info text-lg">show_chart</span>
                  Weekly Trend (last 4 weeks)
                </div>
                <LineChart data={last4Weeks.map(v=>Math.max(0,v))} labels={["3w ago","2w ago","Last w","This w"]} color="#60a5fa" height={110}/>
                <div className="flex gap-3 mt-3 flex-wrap">
                  {last4Weeks.map((v,i)=><div key={i} className="text-[11px] text-muted">{["3w ago","2w ago","Last w","This w"][i]}: <b className="text-primary">{Math.max(0,v)}m</b></div>)}
                </div>
              </Card>
            </div>

            <Card>
              <div className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple text-lg">trending_up</span>
                XP Progress Across Levels
              </div>
              <div className="space-y-3">
                {XP_THRESHOLDS.slice(0,-1).map((lo,i)=>{
                  const hi=XP_THRESHOLDS[i+1]; const done=Math.min(stats.xp||0,hi)-lo; const total=hi-lo;
                  const current=lv===i;
                  return <div key={i} style={{opacity:i>lv+1?.3:1}}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs ${current?"text-primary font-semibold":"text-muted"}`}>
                        {current?"→ ":""}{LEVEL_NAMES[i]} (Lv.{i+1})
                      </span>
                      <span className="text-[11px] text-dim">{Math.min(stats.xp||0,hi)}/{hi} XP</span>
                    </div>
                    <ProgressBar value={done} max={total} color={current?"#4be277":"rgba(255,255,255,.15)"} height={5} glow={current}/>
                  </div>;
                })}
              </div>
            </Card>
          </div>
        )}

        {tab==="heatmap" && (
          <div className="space-y-4">
            <Card>
              <div className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg filled">local_fire_department</span>
                Study Activity — Last 12 Months
              </div>
              <div className="text-xs text-muted mb-4">Each square = one day. Darker = more minutes studied.</div>
              <Heatmap data={typeof heatmapData==="object"?heatmapData:{}}/>
            </Card>
            <div className="grid grid-cols-3 gap-4">
              {[
                {label:"Total days studied",value:Object.values(heatmapData).filter(v=>Number(v)>0).length},
                {label:"Best day (mins)",value:Math.max(...Object.values(heatmapData).map(Number),0)},
                {label:"Study days this month",value:Object.entries(heatmapData).filter(([k])=>k.startsWith(new Date().toISOString().slice(0,7))).filter(([,v])=>Number(v)>0).length},
              ].map((s,i)=>(
                <div key={i} className="glass-card text-center p-5">
                  <div className="text-2xl font-extrabold text-primary mb-1">{s.value}</div>
                  <div className="text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="subjects" && (
          <div className="space-y-4">
            {subjects.length===0?<Card className="text-center py-10"><div className="text-muted">No subjects yet. Add them in the Subjects page.</div></Card>:(
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((s,i)=>{
                    const pct=s.totalTopics>0?Math.round((s.doneTopics/s.totalTopics)*100):0;
                    const c=COLORS[i%COLORS.length];
                    return <Card key={s._id} style={{borderLeft:`3px solid ${c}`}}>
                      <div className="text-lg mb-1.5">{s.icon||"📚"}</div>
                      <div className="text-sm font-bold text-on-surface mb-0.5">{s.name}</div>
                      <div className="text-xs text-muted mb-3">{s.doneTopics}/{s.totalTopics} topics</div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-muted">Progress</span>
                        <span className="text-xs font-bold" style={{color:c}}>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} max={100} color={c} glow/>
                    </Card>;
                  })}
                </div>
                <Card>
                  <div className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple text-lg">analytics</span>
                    Subject-wise Progress
                  </div>
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
