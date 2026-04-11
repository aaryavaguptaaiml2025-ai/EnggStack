import { useEffect, useState, useRef } from "react";

export function ProgressBar({ value, max, color = "var(--ac)", height = 7, glow = false }) {
  const [w, setW] = useState(0);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ background:"rgba(255,255,255,.07)", borderRadius:99, height, overflow:"hidden" }}>
      <div style={{ width:`${w}%`, height:"100%", background:color, borderRadius:99, transition:"width 1s cubic-bezier(.4,0,.2,1)", boxShadow:glow?`0 0 8px ${color}`:"none", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)",backgroundSize:"200% 100%",animation:"shimmer 2s infinite" }}/>
      </div>
    </div>
  );
}

export function Card({ children, style, accent, onClick }) {
  return (
    <div onClick={onClick} style={{ background:"var(--card)",border:`1px solid ${accent?accent+"33":"var(--border)"}`,borderRadius:16,padding:20,borderTop:accent?`2px solid ${accent}`:undefined,cursor:onClick?"pointer":"default",transition:"all .2s ease",...style }}
      onMouseEnter={e=>{e.currentTarget.style.background="var(--card2)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="var(--card)";}}
    >{children}</div>
  );
}

export function Badge({ children, color = "var(--ac)", dot }) {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,background:color+"22",color,padding:"3px 9px",borderRadius:20,border:`1px solid ${color}33`,whiteSpace:"nowrap" }}>{dot&&<span style={{width:5,height:5,borderRadius:"50%",background:color,animation:"pulse 1.5s infinite"}}/>}{children}</span>;
}

export function Toast({ msg, color = "var(--ac)", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="slide-in" style={{ position:"fixed",top:20,right:20,zIndex:9999,background:"var(--card)",border:`1px solid ${color}`,borderRadius:14,padding:"13px 20px",color,fontSize:14,maxWidth:340,boxShadow:`0 8px 32px rgba(0,0,0,.5),0 0 16px ${color}33`,display:"flex",alignItems:"center",gap:10 }}>
      <span style={{flex:1}}>{msg}</span>
      <button onClick={onClose} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:18}}>x</button>
    </div>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div className="fade-in" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="slide-up" style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:28,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <span style={{ fontSize:17,fontWeight:700,color:"var(--text)" }}>{title}</span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",color:"var(--muted)",fontSize:16,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, error, style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{marginBottom:14}}>
      {label&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:6,fontWeight:500}}>{label}</div>}
      <input {...props} onFocus={e=>{setFocus(true);props.onFocus?.(e);}} onBlur={e=>{setFocus(false);props.onBlur?.(e);}} style={{ width:"100%",background:"var(--bg2)",color:"var(--text)",border:`1px solid ${focus?"var(--ac)":"var(--border)"}`,borderRadius:10,padding:"11px 14px",fontSize:13,outline:"none",transition:"border-color .2s,box-shadow .2s",boxShadow:focus?"0 0 0 3px var(--ac-dim)":"none",...style }}/>
      {error&&<div style={{color:"#f87171",fontSize:11,marginTop:4}}>{error}</div>}
    </div>
  );
}

export function Btn({ children, color, onClick, disabled, full, variant="fill", style, size="md" }) {
  const c = color||"var(--ac)";
  const pad = size==="sm"?"7px 14px":size==="lg"?"13px 28px":"10px 20px";
  const fs  = size==="sm"?12:size==="lg"?15:13;
  const base = { borderRadius:10,fontSize:fs,fontWeight:600,cursor:disabled?"default":"pointer",width:full?"100%":"auto",padding:pad,transition:"all .15s ease",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,whiteSpace:"nowrap",...style };
  if(variant==="fill")    return <button onClick={onClick} disabled={disabled} style={{...base,background:disabled?"var(--border)":c,color:disabled?"var(--dim)":"#000",border:"none",boxShadow:disabled?"none":`0 4px 14px ${c}44`}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.filter="brightness(1.1)";}} onMouseLeave={e=>e.currentTarget.style.filter=""}>{children}</button>;
  if(variant==="outline") return <button onClick={onClick} disabled={disabled} style={{...base,background:"transparent",color:disabled?"var(--dim)":c,border:`1px solid ${disabled?"var(--border)":c+"66"}`}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background=c+"15";}} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{...base,background:"transparent",color:disabled?"var(--dim)":"var(--muted)",border:"1px solid var(--border)"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.color="var(--text)";}} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>{children}</button>;
}

export function Spinner({ color="var(--ac)", size=20 }) {
  return <div style={{width:size,height:size,border:"2px solid rgba(255,255,255,.1)",borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}/>;
}

export function AnimNum({ value, duration=800 }) {
  const [disp,setDisp]=useState(0); const prev=useRef(0);
  useEffect(()=>{const s=prev.current;const e=value;prev.current=value;let st=null;const step=(ts)=>{if(!st)st=ts;const p=Math.min((ts-st)/duration,1);setDisp(Math.round(s+(e-s)*p));if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);},[value,duration]);
  return <>{disp}</>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{display:"flex",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:12,padding:4,gap:3}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{ background:active===t.id?"var(--card)":"transparent",border:`1px solid ${active===t.id?"var(--border)":"transparent"}`,borderRadius:9,padding:"7px 16px",cursor:"pointer",color:active===t.id?"var(--text)":"var(--muted)",fontSize:13,fontWeight:active===t.id?600:400,transition:"all .18s",display:"flex",alignItems:"center",gap:6,boxShadow:active===t.id?"0 2px 8px rgba(0,0,0,.3)":"none" }}>{t.icon&&<span>{t.icon}</span>}{t.label}</button>
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
    <div style={{overflowX:"auto"}}>
      <div style={{display:"flex",gap:3,alignItems:"flex-start",minWidth:"max-content"}}>
        <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:22}}>
          {DAYS.map((day,i)=><div key={i} style={{height:12,fontSize:9,color:"var(--dim)",width:12,textAlign:"center",lineHeight:"12px"}}>{day}</div>)}
        </div>
        <div>
          <div style={{display:"flex",gap:3,marginBottom:4}}>
            {weeks.map((w,i)=>{const f=w.find(c=>c.date.getDate()<=7);return <div key={i} style={{width:12,fontSize:9,color:"var(--dim)",textAlign:"center"}}>{f&&f.date.getDate()<=7?MONTHS[f.date.getMonth()][0]:""}</div>;})}
          </div>
          <div style={{display:"flex",gap:3}}>
            {weeks.map((week,wi)=>(
              <div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>
                {week.map(cell=>(
                  <div key={cell.key} title={`${cell.key}: ${cell.mins}m`} style={{ width:12,height:12,borderRadius:2,background:cell.mins?`rgba(74,222,128,${opacity(cell.mins)})`:"rgba(255,255,255,.04)",transition:"transform .1s",cursor:"default" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.5)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,justifyContent:"flex-end"}}>
        <span style={{fontSize:10,color:"var(--dim)"}}>Less</span>
        {[0,.25,.5,.75,1].map(v=><div key={v} style={{width:10,height:10,borderRadius:2,background:v?`rgba(74,222,128,${v})`:"rgba(255,255,255,.04)"}}/>)}
        <span style={{fontSize:10,color:"var(--dim)"}}>More</span>
      </div>
    </div>
  );
}
