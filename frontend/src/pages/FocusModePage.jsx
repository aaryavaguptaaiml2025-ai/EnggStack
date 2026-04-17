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
    <div className="page-container flex flex-col items-center gap-6 min-h-[calc(100vh-65px)] transition-colors duration-1000">
      {toast&&<Toast msg={toast} color="#4be277" onClose={()=>setToast(null)}/>}

      <h1 className="section-title" style={{color:on?"#4be277":undefined}}>
        Focus Mode {on && <span className="text-primary/60">— Active</span>}
      </h1>

      {!on && (
        <div className="w-full max-w-md space-y-3">
          <div className="glass-card p-5">
            <div className="text-sm text-muted mb-3">
              Session: <b className="text-on-surface">{len} min</b>
            </div>
            <input type="range" min={5} max={120} step={5} value={len}
              onChange={e=>setLen(+e.target.value)}
              className="w-full" style={{accentColor:"#4be277"}}/>
            <div className="flex justify-between text-[11px] text-dim mt-1">
              <span>5m</span><span>120m</span>
            </div>
          </div>
          <div className="glass-card p-4 flex gap-5">
            <div className="text-center">
              <div className="text-xl font-bold text-purple">+{len}</div>
              <div className="text-[11px] text-muted">XP</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{len}m</div>
              <div className="text-[11px] text-muted">logged</div>
            </div>
          </div>
        </div>
      )}

      {/* Timer ring */}
      <div className="relative w-[298px] h-[298px] flex items-center justify-center">
        <svg width={298} height={298} className="absolute" style={{transform:"rotate(-90deg)"}}>
          <circle cx={149} cy={149} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={12}/>
          <circle cx={149} cy={149} r={R} fill="none" stroke="#4be277" strokeWidth={12}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-prog/100)}
            style={{transition:"stroke-dashoffset 1s linear",filter:on?"drop-shadow(0 0 14px rgba(75,226,119,.6))":"none"}}/>
        </svg>
        <div className="text-center">
          <div className="text-6xl font-extrabold font-mono transition-colors duration-500"
            style={{color:on?"#4be277":"#6b7280"}}>{mins}:{secs}</div>
          {on&&<div className="text-xs text-primary/50 mt-2 uppercase tracking-[3px] animate-pulse">Focusing</div>}
          {done&&<div className="text-sm text-warning mt-2 font-semibold">Well done!</div>}
        </div>
      </div>

      <button onClick={on?stop:start}
        className="px-14 py-4 rounded-2xl text-base font-bold transition-all duration-300"
        style={{
          background:on?"rgba(248,113,113,.12)":"rgba(75,226,119,.12)",
          border:`2px solid ${on?"#f87171":"#4be277"}`,
          color:on?"#f87171":"#4be277",
          boxShadow:on?"0 0 22px rgba(248,113,113,.25)":"0 0 22px rgba(75,226,119,.25)"
        }}>
        {on?"Stop Session":"Start Focus Session"}
      </button>

      {on&&(
        <div className="text-sm text-muted text-center leading-7">
          Stay focused. Every minute counts.<br/>
          <span className="text-primary text-xs">+{len} XP on completion</span>
        </div>
      )}
    </div>
  );
}
