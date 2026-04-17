import { getLevel, LEVEL_NAMES, LEVEL_ICONS, XP_THRESHOLDS } from "../context/StatsContext";
import { ProgressBar } from "./ui";

export default function XPBar({ xp, compact }) {
  const lv=getLevel(xp), lo=XP_THRESHOLDS[lv]||0, hi=XP_THRESHOLDS[lv+1]||lo+500;

  if (compact) return (
    <div className="p-3 bg-bg-2 rounded-xl border border-white/5">
      <div className="flex justify-between text-[11px] text-muted mb-1.5">
        <span>XP {xp}</span><span>Lv.{lv+1} {LEVEL_NAMES[lv]}</span>
      </div>
      <ProgressBar value={xp-lo} max={hi-lo} color="#a78bfa" height={4} glow/>
    </div>
  );

  const pct=((xp-lo)/(hi-lo))*100;
  return (
    <div className="bg-gradient-to-r from-purple/10 to-info/10 border border-purple/20
      rounded-2xl p-5 flex gap-5 items-center">
      <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{background:`conic-gradient(#a78bfa ${pct}%,rgba(255,255,255,.07) 0)`}}>
        <div className="w-[46px] h-[46px] rounded-full bg-surface-mid flex items-center justify-center
          text-lg font-bold text-purple">{lv+1}</div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-2">
          <span className="font-bold text-on-surface text-sm">{LEVEL_ICONS[lv]} {LEVEL_NAMES[lv]} Level {lv+1}</span>
          <span className="text-xs text-muted">{xp}/{hi} XP</span>
        </div>
        <ProgressBar value={xp-lo} max={hi-lo} color="#a78bfa" glow/>
        <div className="text-[11px] text-dim mt-1.5">{hi-xp} XP to next level</div>
      </div>
    </div>
  );
}
