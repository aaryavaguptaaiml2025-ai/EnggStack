import { useEffect, useState, useRef } from "react";

export function ProgressBar({ value, max, color = "#00C896", height = 7, glow = false }) {
  const [w, setW] = useState(0);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,.06)", height }}>
      <div className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
        style={{ width:`${w}%`, background:color, boxShadow:glow?`0 0 10px ${color}66`:"none" }}>
        <div className="absolute inset-0" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)",backgroundSize:"200% 100%",animation:"shimmer 2s infinite"}}/>
      </div>
    </div>
  );
}

export function Card({ children, style, accent, onClick, className="" }) {
  return (
    <div onClick={onClick}
      className={`glass-card p-6 transition-all duration-200 hover:bg-white/[.08]
        ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ borderTop:accent?`2px solid ${accent}`:undefined, ...style }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = "#00C896", dot }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold
      px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background:color+"15", color, border:`1px solid ${color}25` }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:color}}/>}
      {children}
    </span>
  );
}

export function Toast({ msg, color = "#00C896", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="slide-in fixed top-5 right-5 z-[9999] bg-[#111827]
      border border-white/10 rounded-xl shadow-lg px-5 py-3.5
      flex items-center gap-3 max-w-[340px]"
      style={{ borderColor:color+"40" }}>
      <span className="flex-1 text-sm" style={{color}}>{msg}</span>
      <button onClick={onClose} className="text-dim hover:text-on-surface transition-colors duration-200">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div className="fade-in fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000] p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up bg-[#0B1220] border border-white/10
        rounded-2xl shadow-xl p-8 w-full max-h-[90vh] overflow-y-auto"
        style={{ maxWidth:width }}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-bold text-on-surface">{title}</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10
              flex items-center justify-center text-dim hover:text-on-surface transition-colors duration-200">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, error, style, className="", ...props }) {
  return (
    <div className="mb-4">
      {label && <div className="text-xs text-muted mb-1.5 font-medium ml-1">{label}</div>}
      <input {...props}
        className={`input-field ${className}`}
        style={style}/>
      {error && <div className="text-danger text-[11px] mt-1 ml-1">{error}</div>}
    </div>
  );
}

export function Btn({ children, color, onClick, disabled, full, variant="fill", style, size="md" }) {
  const c = color || "#00C896";
  const sizeClasses = {
    sm: "text-xs px-3.5 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
  }[size];

  const base = `inline-flex items-center justify-center gap-2 font-semibold
    rounded-xl whitespace-nowrap transition-all duration-200
    ${full ? "w-full" : ""} ${sizeClasses}
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}`;

  if (variant === "fill") return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} text-[#0B1220] hover:brightness-110`}
      style={{ background:disabled?"#374151":c, boxShadow:disabled?"none":`0 2px 4px rgba(0,0,0,0.1)`, ...style }}>
      {children}
    </button>
  );
  if (variant === "outline") return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} bg-transparent hover:bg-white/5`}
      style={{ color:disabled?"#4a5568":c, border:`1px solid ${disabled?"#374151":c+"44"}`, ...style }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} bg-transparent border border-white/10 text-dim hover:text-on-surface hover:bg-white/5`}
      style={style}>
      {children}
    </button>
  );
}

export function Spinner({ color="#00C896", size=20 }) {
  return <div className="inline-block flex-shrink-0 rounded-full animate-spin"
    style={{width:size,height:size,border:"2px solid rgba(255,255,255,.08)",borderTopColor:color}}/>;
}

export function AnimNum({ value, duration=800 }) {
  const [disp,setDisp]=useState(0); const prev=useRef(0);
  useEffect(()=>{const s=prev.current;const e=value;prev.current=value;let st=null;const step=(ts)=>{if(!st)st=ts;const p=Math.min((ts-st)/duration,1);setDisp(Math.round(s+(e-s)*p));if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);},[value,duration]);
  return <>{disp}</>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-1 gap-1">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200
            flex items-center gap-2
            ${active === t.id
              ? "bg-white/10 border border-white/10 text-on-surface shadow-lg"
              : "text-dim hover:text-on-surface"}`}>
          {t.icon && <span className="material-symbols-outlined text-base">{t.icon}</span>}{t.label}
        </button>
      ))}
    </div>
  );
}

export function Heatmap({ data = {} }) {
  const today = new Date();
  const weeks = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 363);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  let d = new Date(startDate);
  while (d <= today) {
    const week = [];
    for (let i=0;i<7;i++) {
      const key=d.toISOString().split("T")[0];
      week.push({ key, mins:Number(data[key])||0, date:new Date(d) });
      d.setDate(d.getDate()+1);
    }
    weeks.push(week);
  }
  const maxMins = Math.max(...Object.values(data).map(Number),1);
  const opacity = (m) => m?Math.max(0.15,Math.min(1,m/Math.min(maxMins,120))):0;
  const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS=["S","M","T","W","T","F","S"];
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] items-start" style={{minWidth:"max-content"}}>
        <div className="flex flex-col gap-[3px] mt-[22px]">
          {DAYS.map((day,i)=><div key={i} className="h-3 text-[9px] text-dim w-3 text-center leading-3">{day}</div>)}
        </div>
        <div>
          <div className="flex gap-[3px] mb-1">
            {weeks.map((w,i)=>{const f=w.find(c=>c.date.getDate()<=7);return <div key={i} className="w-3 text-[9px] text-dim text-center">{f&&f.date.getDate()<=7?MONTHS[f.date.getMonth()][0]:""}</div>;})}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week,wi)=>(
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map(cell=>(
                  <div key={cell.key} title={`${cell.key}: ${cell.mins}m`}
                    className="w-3 h-3 rounded-sm cursor-default transition-transform duration-100
                      hover:scale-150"
                    style={{background:cell.mins?`rgba(0,200,150,${opacity(cell.mins)})`:"rgba(255,255,255,.04)"}}/>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-dim">Less</span>
        {[0,.25,.5,.75,1].map(v=><div key={v} className="w-2.5 h-2.5 rounded-sm"
          style={{background:v?`rgba(0,200,150,${v})`:"rgba(255,255,255,.04)"}}/>)}
        <span className="text-[10px] text-dim">More</span>
      </div>
    </div>
  );
}
