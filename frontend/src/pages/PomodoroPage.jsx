import { useState, useEffect, useRef, useCallback } from "react";
import { useStats } from "../context/StatsContext";
import { Toast } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const DUR = { focus:25*60, short:5*60, long:15*60 };
const CLR = { focus:"#60a5fa", short:"#4be277", long:"#a78bfa" };
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
    <div className="page-container flex flex-col items-center gap-6">
      {toast&&<Toast msg={toast} color={color} onClose={()=>setToast(null)}/>}

      <h1 className="section-title">Pomodoro Timer</h1>

      {/* Mode tabs */}
      <div className="glass-card flex p-1 gap-1">
        {Object.entries(LBL).map(([m,label])=>(
          <button key={m} onClick={()=>{sfx.click();sw(m);}}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${mode===m ? "font-semibold" : "text-dim hover:text-on-surface"}`}
            style={{background:mode===m?color+"22":"transparent",
              border:`1px solid ${mode===m?color+"88":"transparent"}`,
              color:mode===m?color:undefined}}>
            {label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative w-[264px] h-[264px] flex items-center justify-center">
        <svg width={264} height={264} className="absolute" style={{transform:"rotate(-90deg)"}}>
          <circle cx={132} cy={132} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={10}/>
          <circle cx={132} cy={132} r={R} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={circ*(1-progress/100)}
            strokeLinecap="round"
            style={{transition:"stroke-dashoffset 1s linear",filter:`drop-shadow(0 0 8px ${color}88)`}}/>
        </svg>
        <div className="text-center">
          <div className="text-5xl font-extrabold font-mono tracking-wider" style={{color}}>{mins}:{secs}</div>
          <div className="text-sm text-muted mt-1">{LBL[mode]}</div>
          <div className="flex gap-1.5 justify-center mt-2">
            {[0,1,2,3].map(i=>(
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{background:i<(sess%4)?color:"rgba(255,255,255,.1)",
                  boxShadow:i<(sess%4)?`0 0 4px ${color}`:""}}/>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <button onClick={()=>{sfx.click();clearInterval(ref.current);setRun(false);setTl(DUR[mode]);}}
          className="w-12 h-12 rounded-full glass-card flex items-center justify-center
            text-dim hover:text-primary hover:border-primary/30 transition-all duration-200">
          <span className="material-symbols-outlined text-xl">restart_alt</span>
        </button>
        <button onClick={()=>{sfx.click();setRun(r=>!r);}}
          className="w-16 h-16 rounded-full flex items-center justify-center text-black text-xl
            transition-transform active:scale-90"
          style={{background:color,boxShadow:`0 0 22px ${color}66`}}>
          <span className="material-symbols-outlined text-2xl">{run?"pause":"play_arrow"}</span>
        </button>
        <button onClick={()=>{sfx.click();sw(mode==="focus"?"short":"focus");}} title="Skip (no XP)"
          className="w-12 h-12 rounded-full glass-card flex items-center justify-center
            text-dim hover:text-on-surface transition-all duration-200">
          <span className="material-symbols-outlined text-xl">skip_next</span>
        </button>
      </div>

      {/* Session stats */}
      <div className="glass-card px-12 py-5 text-center">
        <div className="text-xs text-muted mb-1">Sessions today</div>
        <div className="text-4xl font-extrabold text-on-surface font-mono">{sess}</div>
        <div className="text-sm text-muted mt-1">{sess*25} minutes of deep work</div>
        {sess>0&&<div className="text-xs text-primary mt-2">+{sess*30} XP earned</div>}
        <div className="text-[10px] text-dim mt-2">Skip does NOT award XP — only completing counts</div>
      </div>
    </div>
  );
}
