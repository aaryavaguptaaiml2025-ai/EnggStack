import { useState } from "react";
import { useMusic, PLAYLISTS, AMBIENT_SOUNDS } from "../context/MusicContext";
import { sfx } from "../hooks/useSfx";

export default function MusicPage() {
  const { currentUrl, playing, ambient, studyTime, timerOn, setTimerOn, setStudyTime, handlePlaylist, handleAmbient, playCustom } = useMusic();
  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  
  const [searchUrl, setSearchUrl] = useState("");
  const [searchErr, setSearchErr] = useState("");

  const handleSearch = () => {
    sfx.click();
    setSearchErr("");
    if (!searchUrl.trim()) return;
    const success = playCustom(searchUrl.trim());
    if (success) {
      setSearchUrl("");
      sfx.success();
    } else {
      setSearchErr("Please enter a valid YouTube, SoundCloud, or Twitch link.");
      sfx.error();
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-[#00C896]">graphic_eq</span>
            Music Studio
          </h1>
          <p className="text-xs text-muted mt-2">Play curated playlists or paste any streaming link.</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-3 self-end md:self-auto">
          <span className="font-mono text-lg min-w-[82px]"
            style={{color:timerOn?"#00C896":"#4a5568"}}>{fmt(studyTime)}</span>
          <button onClick={()=>{sfx.click();setTimerOn(t=>!t);}}
            className="px-3 py-1 rounded-lg text-[11px] font-bold text-black"
            style={{background:timerOn?"#f87171":"#00C896"}}>
            {timerOn?"STOP":"START"}
          </button>
          <button onClick={()=>{setStudyTime(0);setTimerOn(false);sfx.click();}}
            className="text-dim hover:text-on-surface transition-colors duration-200 p-1">
            <span className="material-symbols-outlined text-base">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Search / Custom Link Input */}
      <div className="glass-card p-6 mb-8 border border-[#00C896]/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C896]/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-[#00C896]/20 transition-all duration-500" />
        <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00C896]">search</span>
          Play Any Link
        </h3>
        <p className="text-xs text-muted mb-4 max-w-lg">
          Paste a link to any YouTube video, YouTube Music playlist, or SoundCloud track to play it directly in your dashboard.
        </p>
        <div className="flex gap-3 relative z-10">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8892a8]">link</span>
            <input 
              value={searchUrl} 
              onChange={(e) => setSearchUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="https://www.youtube.com/watch?v=..." 
              className="input-field w-full pl-12 pr-4 py-3 bg-black/20 focus:bg-black/40 border border-white/10 focus:border-[#00C896]/50 transition-all shadow-inner rounded-xl"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-[#00C896] hover:bg-[#00f2fe] text-black font-bold px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(0,200,150,0.3)] hover:shadow-[0_0_25px_rgba(0,200,150,0.5)] active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span> Play
          </button>
        </div>
        {searchErr && <div className="text-[var(--clr-danger)] text-xs mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span> {searchErr}</div>}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs font-bold text-dim uppercase tracking-widest">Curated Playlists</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      {/* Playlists grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {PLAYLISTS.map(pl=>{
          const active = currentUrl === pl.url && playing;
          return (
            <div key={pl.id} onClick={()=>{handlePlaylist(pl);sfx.click();}}
              className="glass-card p-6 cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
              style={{
                borderTop:`2px solid ${active ? pl.color : "transparent"}`,
                boxShadow:active ? `0 0 24px ${pl.color}15` : "none",
                background: active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)"
              }}>
              {active && <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 pointer-events-none" />}
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg" style={{background: `${pl.color}20`, color: pl.color, border: `1px solid ${pl.color}30`}}>
                  <span className="material-symbols-outlined text-3xl">queue_music</span>
                </div>
                {active && (
                  <div className="flex gap-1 items-end h-4 mt-2 mr-2">
                    {[1, 2, 1.5, 2.5].map((h, i) => (
                      <div key={i} className="w-1 bg-[#00C896] rounded-t-full" style={{ height: `${(h/2.5)*100}%`, animation:`musicBar .8s ease-in-out infinite ${i*.15}s alternate`, transformOrigin:"bottom" }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="text-base font-bold text-on-surface mb-1 group-hover:text-white transition-colors relative z-10">{pl.name}</div>
              <div className="text-xs text-muted mb-5 leading-relaxed relative z-10">{pl.desc}</div>
              <div className="flex items-center justify-between relative z-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                  style={{
                    background:active?pl.color:"rgba(255,255,255,0.05)",
                    color:active?"#000":pl.color,
                  }}>
                  <span className="material-symbols-outlined text-sm">{active ? "pause" : "play_arrow"}</span>
                  {active?"Playing":"Play Track"}
                </span>
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-dim hover:text-white hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-sm">favorite</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs font-bold text-dim uppercase tracking-widest">Focus Ambiance</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      {/* Ambient sounds */}
      <div className="glass-card p-6 mb-24 border border-white/5 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#00C896]/5 rounded-full blur-[80px] -mr-20 -mb-20 pointer-events-none" />
        <div className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2 relative z-10">
          <span className="material-symbols-outlined text-[#00C896] text-xl">blur_on</span>
          Ambient Generators
        </div>
        <div className="text-xs text-[#8892a8] mb-6 max-w-2xl relative z-10 leading-relaxed">
          Generated mathematically via the Web Audio API. Perfect for blocking out background noise without the distraction of lyrics. You can seamlessly layer these with your YouTube tracks!
        </div>
        <div className="flex gap-3 flex-wrap relative z-10">
          {AMBIENT_SOUNDS.map(a=>(
            <button key={a.id} onClick={()=>{handleAmbient(a.id);sfx.click();}}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm"
              style={{
                background:ambient===a.id?"rgba(0,200,150,.15)":"rgba(255,255,255,.04)",
                border:`1px solid ${ambient===a.id?"rgba(0,200,150,.4)":"rgba(255,255,255,.08)"}`,
                color:ambient===a.id?"#00C896":"#e0e6f0",
                boxShadow:ambient===a.id?"0 0 20px rgba(0,200,150,0.1)":"none"
              }}>
              <span className="material-symbols-outlined text-lg">
                {a.id==="off"?"volume_off":
                 a.id==="rain"?"water_drop":
                 a.id==="forest"?"forest":
                 a.id==="ocean"?"waves":
                 a.id==="fire"?"local_fire_department":
                 a.id==="wind"?"air":
                 a.id==="cafe"?"coffee":"headphones"}
              </span>
              {a.label}
              {ambient===a.id&&a.id!=="off"&&<span className="w-1.5 h-1.5 rounded-full bg-[#00C896] animate-pulse ml-1"/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
