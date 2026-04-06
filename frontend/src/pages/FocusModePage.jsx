import { useState, useEffect, useRef } from "react";
import { useStats } from "../context/StatsContext";
import { Toast } from "../components/ui";
import { sfx } from "../hooks/useSfx";
export default function FocusModePage() {
  const { logFocus } = useStats();
  const [len,setLen]=useState(25); const [time,setTime]=useState(25*60);
  const [on,setOn]=useState(false); const [done,setDone]=useState(false); const [toast,setToast]=useState(null);
  const ref=useRef(null);
  useEffect(()=>{ if(!on) setTime(len*60); },[len]);
  const start=()=>{
    setOn(true);setDone(false);setTime(len*60); sfx.click();
    ref.current=setInterval(()=>{ setTime(t=>{ if(t<=1){clearInterval(ref.current);setOn(false);setDone(true);logFocus(len);setToast(`Session done! +${len} XP`);return 0;} return t-1; }); },1000);
  };
  const stop=()=>{ clearInterval(ref.current);setOn(false);setTime(len*60);sfx.click(); };
  useEffect(()=>()=>clearInterval(ref.current),[]);
  const mins=String(Math.floor(time/60)).padStart(2,"0"); const secs=String(time%60).padStart(2,"0");
  const prog=((len*60-time)/(len*60))*100; const R=124; const circ=2*Math.PI*R;
  return (
    <div style={{padding:"40px",display:"flex",flexDirection:"column",alignItems:"center",gap:28,minHeight:"calc(100vh - 65px)",background:on?"var(--bg)":"var(--bg)",transition:"background 1.2s ease"}}>
      {toast&&<Toast msg={toast} color="#4ade80" onClose={()=>setToast(null)}/>}
      <h1 style={{color:on?"#4ade80":"var(--text)",fontSize:22,fontWeight:800,margin:0,transition:"color .6s"}}>Focus Mode {on&&"— Active"}</h1>
      {!on&&<div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:20}}>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:10}}>Session: <b style={{color:"var(--text)"}}>{len} min</b></div>
          <input type="range" min={5} max={120} step={5} value={len} onChange={e=>setLen(+e.target.value)} style={{width:"100%",accentColor:"#4ade80"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--dim)",marginTop:4}}><span>5m</span><span>120m</span></div>
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:16,display:"flex",gap:20}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:"#a78bfa"}}>+{len}</div><div style={{fontSize:11,color:"var(--muted)"}}>XP</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:"#4ade80"}}>{len}m</div><div style={{fontSize:11,color:"var(--muted)"}}>logged</div></div>
        </div>
      </div>}
      <div style={{position:"relative",width:298,height:298,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width={298} height={298} style={{position:"absolute",transform:"rotate(-90deg)"}}>
          <circle cx={149} cy={149} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={12}/>
          <circle cx={149} cy={149} r={R} fill="none" stroke="#4ade80" strokeWidth={12} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-prog/100)} style={{transition:"stroke-dashoffset 1s linear",filter:on?"drop-shadow(0 0 14px #4ade8099)":"none"}}/>
        </svg>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:58,fontWeight:800,color:on?"#4ade80":"var(--muted)",fontFamily:"'JetBrains Mono',monospace",transition:"color .5s"}}>{mins}:{secs}</div>
          {on&&<div style={{fontSize:12,color:"#4ade8077",marginTop:6,letterSpacing:2,animation:"pulse 2s infinite"}}>FOCUSING</div>}
          {done&&<div style={{fontSize:14,color:"#fbbf24",marginTop:6}}>Well done!</div>}
        </div>
      </div>
      <button onClick={on?stop:start} style={{background:on?"rgba(248,113,113,.12)":"rgba(74,222,128,.12)",border:`2px solid ${on?"#f87171":"#4ade80"}`,borderRadius:16,padding:"14px 52px",cursor:"pointer",color:on?"#f87171":"#4ade80",fontSize:15,fontWeight:700,transition:"all .3s",boxShadow:on?"0 0 22px rgba(248,113,113,.25)":"0 0 22px rgba(74,222,128,.25)"}}>
        {on?"Stop Session":"Start Focus Session"}
      </button>
      {on&&<div style={{fontSize:13,color:"var(--muted)",textAlign:"center",lineHeight:1.8}}>Stay focused. Every minute counts.<br/><span style={{color:"#4ade80",fontSize:12}}>+{len} XP on completion</span></div>}
    </div>
  );
}
