import { useState, useEffect, useRef, useCallback } from "react";
import { useStats } from "../context/StatsContext";
import { Toast } from "../components/ui";
import { sfx } from "../hooks/useSfx";
const DUR = { focus:25*60, short:5*60, long:15*60 };
const CLR = { focus:"#60a5fa", short:"#4ade80", long:"#a78bfa" };
const LBL = { focus:"Focus Session", short:"Short Break", long:"Long Break" };
export default function PomodoroPage() {
  const { logPomodoro } = useStats();
  const [mode,setMode]=useState("focus"); const [tl,setTl]=useState(DUR.focus);
  const [run,setRun]=useState(false); const [sess,setSess]=useState(0); const [toast,setToast]=useState(null);
  const ref=useRef(null);
  const color=CLR[mode];
  const sw=(m)=>{ clearInterval(ref.current); setRun(false); setMode(m); setTl(DUR[m]); };
  const done=useCallback(async()=>{
    clearInterval(ref.current); setRun(false);
    if(mode==="focus"){ await logPomodoro(25); setSess(s=>s+1); setToast("🎉 Focus done! +30 XP — take a break."); setMode("short"); setTl(DUR.short); }
    else { sfx.notify(); setToast("Break over! Ready to focus?"); setMode("focus"); setTl(DUR.focus); }
  },[mode,logPomodoro]);
  useEffect(()=>{
    if(run){ ref.current=setInterval(()=>{ setTl(t=>{ if(t<=1){done();return 0;} return t-1; }); },1000); }
    else clearInterval(ref.current);
    return ()=>clearInterval(ref.current);
  },[run,done]);
  const progress=((DUR[mode]-tl)/DUR[mode])*100;
  const mins=String(Math.floor(tl/60)).padStart(2,"0"); const secs=String(tl%60).padStart(2,"0");
  const R=110; const circ=2*Math.PI*R;
  return (
    <div style={{padding:"32px 40px",display:"flex",flexDirection:"column",alignItems:"center",gap:26}}>
      {toast&&<Toast msg={toast} color={color} onClose={()=>setToast(null)}/>}
      <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,margin:0}}>Pomodoro Timer</h1>
      <div style={{display:"flex",background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:4,gap:3}}>
        {Object.entries(LBL).map(([m,label])=><button key={m} onClick={()=>{sfx.click();sw(m);}} style={{background:mode===m?color+"22":"transparent",border:`1px solid ${mode===m?color+"88":"transparent"}`,borderRadius:8,padding:"8px 18px",cursor:"pointer",color:mode===m?color:"var(--muted)",fontSize:13,fontWeight:mode===m?600:400,transition:"all .2s"}}>{label}</button>)}
      </div>
      <div style={{position:"relative",width:264,height:264,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width={264} height={264} style={{position:"absolute",transform:"rotate(-90deg)"}}>
          <circle cx={132} cy={132} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={10}/>
          <circle cx={132} cy={132} r={R} fill="none" stroke={color} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={circ*(1-progress/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear",filter:`drop-shadow(0 0 8px ${color}88)`}}/>
        </svg>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:54,fontWeight:800,color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>{mins}:{secs}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:4}}>{LBL[mode]}</div>
          <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:8}}>{[0,1,2,3].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<(sess%4)?color:"rgba(255,255,255,.1)",transition:"background .3s",boxShadow:i<(sess%4)?`0 0 4px ${color}`:""}}/>)}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <button onClick={()=>{sfx.click();clearInterval(ref.current);setRun(false);setTl(DUR[mode]);}} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"50%",width:46,height:46,cursor:"pointer",color:"var(--muted)",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.color=color;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>o</button>
        <button onClick={()=>{sfx.click();setRun(r=>!r);}} style={{background:color,border:"none",borderRadius:"50%",width:66,height:66,cursor:"pointer",fontSize:22,color:"#000",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 22px ${color}66`,transition:"transform .1s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.92)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>{run?"||":">"}</button>
        <button onClick={()=>{sfx.click();sw(mode==="focus"?"short":"focus");}} title="Skip (no XP)" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"50%",width:46,height:46,cursor:"pointer",color:"var(--muted)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";}}>skip</button>
      </div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"20px 48px",textAlign:"center"}}>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>Sessions today</div>
        <div style={{fontSize:44,fontWeight:800,color:"var(--text)",fontFamily:"'JetBrains Mono',monospace"}}>{sess}</div>
        <div style={{fontSize:13,color:"var(--muted)",marginTop:4}}>{sess*25} minutes of deep work</div>
        {sess>0&&<div style={{marginTop:8,fontSize:12,color:"#4ade80"}}>+{sess*30} XP earned</div>}
        <div style={{marginTop:10,fontSize:10,color:"var(--dim)"}}>Skip does NOT award XP — only completing counts</div>
      </div>
    </div>
  );
}
