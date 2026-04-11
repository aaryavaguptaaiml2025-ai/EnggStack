import { getLevel, LEVEL_NAMES, LEVEL_ICONS, XP_THRESHOLDS } from "../context/StatsContext";
import { ProgressBar } from "./ui";

export default function XPBar({ xp, compact }) {
  const lv=getLevel(xp), lo=XP_THRESHOLDS[lv]||0, hi=XP_THRESHOLDS[lv+1]||lo+500;
  if (compact) return (
    <div style={{padding:"10px 12px",background:"var(--bg2)",borderRadius:10,border:"1px solid var(--border)"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:5}}>
        <span>XP {xp}</span><span>Lv.{lv+1} {LEVEL_NAMES[lv]}</span>
      </div>
      <ProgressBar value={xp-lo} max={hi-lo} color="#a78bfa" height={4} glow/>
    </div>
  );
  const pct=((xp-lo)/(hi-lo))*100;
  return (
    <div style={{background:"linear-gradient(135deg,rgba(167,139,250,.1),rgba(96,165,250,.1))",border:"1px solid rgba(167,139,250,.2)",borderRadius:16,padding:"20px 24px",display:"flex",gap:20,alignItems:"center"}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:`conic-gradient(#a78bfa ${pct}%,rgba(255,255,255,.07) 0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <div style={{width:46,height:46,borderRadius:"50%",background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#a78bfa"}}>{lv+1}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontWeight:700,color:"var(--text)",fontSize:14}}>{LEVEL_ICONS[lv]} {LEVEL_NAMES[lv]} Level {lv+1}</span>
          <span style={{fontSize:12,color:"var(--muted)"}}>{xp}/{hi} XP</span>
        </div>
        <ProgressBar value={xp-lo} max={hi-lo} color="#a78bfa" glow/>
        <div style={{fontSize:11,color:"var(--dim)",marginTop:5}}>{hi-xp} XP to next level</div>
      </div>
    </div>
  );
}
