import { useEffect, useRef, useState } from "react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Bar Chart ─────────────────────────────────────────────
export function BarChart({ data, color, label = "mins", height = 120 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);
  const max = Math.max(...data.map(d => d.value), 1);
  const todayIdx = new Date().getDay();

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height, marginBottom:6 }}>
        {data.map((d, i) => {
          const isToday = i === todayIdx;
          const h = animated ? `${Math.round((d.value / max) * 100)}%` : "0%";
          const c = color || (isToday ? "#00C896" : "rgba(255,255,255,.08)");
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, height:"100%" }}>
              <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end", position:"relative" }}>
                {d.value > 0 && (
                  <div style={{
                    position:"absolute", bottom:"100%", left:"50%", transform:"translateX(-50%)",
                    fontSize:9, color:"var(--muted)", whiteSpace:"nowrap", marginBottom:2,
                    opacity: animated ? 1 : 0, transition:"opacity .5s .6s",
                  }}>{d.value}{label==="mins"?"m":""}</div>
                )}
                <div style={{
                  width:"100%", height:h, minHeight:3,
                  background: isToday && !color
                    ? `linear-gradient(180deg, #00C896, #00C89688)`
                    : c,
                  borderRadius:"5px 5px 0 0",
                  transition:"height 1s cubic-bezier(.34,1.56,.64,1)",
                  boxShadow: isToday ? `0 0 10px #00C89644` : "none",
                }}/>
              </div>
              <span style={{ fontSize:9, color: isToday ? "#00C896" : "var(--dim)", fontWeight: isToday ? 700 : 400 }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Line Sparkline ────────────────────────────────────────
export function Sparkline({ data, color, width = 200, height = 50 }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");

  const areaPath = data.reduce((acc, v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 8) - 4;
    return acc + (i===0 ? `M${x},${height} L${x},${y}` : ` L${x},${y}`);
  }, "") + ` L${width},${height} Z`;

  const c = color || "#00C896";
  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity=".25"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={c} strokeWidth={2}
        style={{ filter:`drop-shadow(0 0 4px ${c})` }}/>
      {data[data.length-1] > 0 && (
        <circle cx={(data.length-1)/(data.length-1)*width} cy={height-(data[data.length-1]/max)*(height-8)-4}
          r={4} fill={c} style={{ filter:`drop-shadow(0 0 6px ${c})` }}/>
      )}
    </svg>
  );
}

// ── Study Heatmap (GitHub-style) ──────────────────────────
export function StudyHeatmap({ heatmap = {} }) {
  const [tooltip, setTooltip] = useState(null);

  // Build last 16 weeks (112 days)
  const today = new Date();
  const days  = [];
  for (let i = 111; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const mins = heatmap[key] || 0;
    days.push({ key, date: d, mins });
  }

  // Pad start so grid starts on Sunday
  const firstDay = days[0].date.getDay();
  const padded   = [...Array(firstDay).fill(null), ...days];

  const getColor = (mins) => {
    if (!mins)  return "rgba(255,255,255,.04)";
    if (mins < 20)  return "rgba(0,200,150,.2)";
    if (mins < 60)  return "rgba(0,200,150,.45)";
    if (mins < 120) return "rgba(0,200,150,.7)";
    return "#00C896";
  };

  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i+7));

  return (
    <div style={{ position:"relative" }}>
      {/* Day labels */}
      <div style={{ display:"flex", gap:3, marginBottom:3, paddingLeft:28 }}>
        {weeks.slice(-4).map((_, i) => {
          const w = weeks[weeks.length-4+i];
          const first = w?.find(d=>d);
          return first ? (
            <div key={i} style={{ flex:1, fontSize:9, color:"var(--dim)", textAlign:"center" }}>
              {MONTHS[first.date.getMonth()]}
            </div>
          ) : <div key={i} style={{ flex:1 }}/>;
        })}
      </div>

      <div style={{ display:"flex", gap:3 }}>
        {/* Row labels */}
        <div style={{ display:"flex", flexDirection:"column", gap:3, paddingTop:2 }}>
          {["S","M","T","W","T","F","S"].map((d,i) => (
            <div key={i} style={{ height:11, fontSize:8, color:"var(--dim)", width:16, textAlign:"right", paddingRight:2, lineHeight:"11px" }}>
              {i%2===1 ? d : ""}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display:"flex", gap:3, flex:1, justifyContent:"flex-end" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {week.map((day, di) => (
                <div key={di}
                  onMouseEnter={e => day && setTooltip({ day, x:e.clientX, y:e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width:11, height:11, borderRadius:2,
                    background: day ? getColor(day.mins) : "transparent",
                    cursor: day ? "default" : "none",
                    transition:"transform .1s",
                  }}
                  onMouseOver={e => { if(day) e.currentTarget.style.transform="scale(1.5)"; }}
                  onMouseOut={e  => { e.currentTarget.style.transform="scale(1)"; }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip?.day && (
        <div style={{
          position:"fixed", top:tooltip.y-44, left:tooltip.x-60,
          background:"rgba(15,26,54,0.95)", border:"1px solid rgba(255,255,255,.1)",
          borderRadius:8, padding:"6px 10px", fontSize:11, color:"var(--text)",
          zIndex:9999, pointerEvents:"none", whiteSpace:"nowrap",
          boxShadow:"0 4px 16px rgba(0,0,0,.5)", backdropFilter:"blur(12px)",
        }}>
          <div style={{ fontWeight:600, color:"#00C896" }}>
            {tooltip.day.mins > 0 ? `${tooltip.day.mins} mins studied` : "No study"}
          </div>
          <div style={{ color:"var(--muted)", fontSize:10, marginTop:2 }}>
            {tooltip.day.date.toLocaleDateString("en-IN",{weekday:"short",month:"short",day:"numeric"})}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:8, justifyContent:"flex-end" }}>
        <span style={{ fontSize:9, color:"var(--dim)" }}>Less</span>
        {["rgba(255,255,255,.04)","rgba(0,200,150,.2)","rgba(0,200,150,.45)","rgba(0,200,150,.7)","#00C896"].map(c=>(
          <div key={c} style={{ width:11,height:11,borderRadius:2,background:c }}/>
        ))}
        <span style={{ fontSize:9, color:"var(--dim)" }}>More</span>
      </div>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────
export function DonutChart({ segments, size = 120, strokeWidth = 16 }) {
  const r  = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      {segments.map((seg, i) => {
        const len    = (seg.value / total) * circ;
        const dash   = `${len} ${circ - len}`;
        const start  = offset;
        offset      += len;
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r}
            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={dash} strokeDashoffset={-start}
            style={{ filter:`drop-shadow(0 0 3px ${seg.color}66)`, transition:"stroke-dashoffset 1s ease" }}/>
        );
      })}
      <circle cx={size/2} cy={size/2} r={r-strokeWidth/2} fill="rgba(255,255,255,.03)"/>
    </svg>
  );
}
