import { useState } from "react";
import { useMusic, PLAYLISTS, AMBIENT_SOUNDS } from "../context/MusicContext";
import { sfx } from "../hooks/useSfx";

export default function MusicPage() {
  const { activePL, playing, ambient, studyTime, timerOn, setTimerOn, setStudyTime, handlePlaylist, handleAmbient, playCustom, customLink } = useMusic();
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
      setSearchErr("Please enter a valid Spotify track, album, or playlist link.");
      sfx.error();
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Green.png" alt="Spotify" className="h-7 object-contain opacity-90 brightness-110" />
            Integration
          </h1>
          <p className="text-xs text-muted mt-2">Listen to curated study playlists or paste any Spotify link.</p>
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
      <div className="glass-card p-6 mb-8 border border-[#1DB954]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1DB954]/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1DB954]">search</span>
          Play Any Spotify Link
        </h3>
        <p className="text-xs text-muted mb-4 max-w-lg">
          Want to listen to your own music? Paste a link to any track, album, or playlist from Spotify to play it directly in the dashboard.
        </p>
        <div className="flex gap-3">
          <input 
            value={searchUrl} 
            onChange={(e) => setSearchUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="https://open.spotify.com/track/..." 
            className="input-field flex-1 pl-4"
          />
          <button 
            onClick={handleSearch}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-6 rounded-xl transition-colors shadow-[0_0_15px_rgba(29,185,84,0.3)] hover:shadow-[0_0_25px_rgba(29,185,84,0.5)] active:scale-95"
          >
            Play
          </button>
        </div>
        {searchErr && <div className="text-[var(--clr-danger)] text-xs mt-2">{searchErr}</div>}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs font-bold text-dim uppercase tracking-widest">Curated Playlists</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      {/* Playlists grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {PLAYLISTS.map(pl=>{
          const active = activePL?.id === pl.id && playing;
          return (
            <div key={pl.id} onClick={()=>{handlePlaylist(pl);sfx.click();}}
              className="glass-card p-6 cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              style={{
                borderTop:`3px solid ${active ? pl.color : "transparent"}`,
                boxShadow:active ? `0 0 24px ${pl.color}15` : "none",
                background: active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)"
              }}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{background: `${pl.color}20`, color: pl.color}}>
                  <span className="material-symbols-outlined text-3xl">headphones</span>
                </div>
              </div>
              <div className="text-sm font-bold text-on-surface text-center mb-1">{pl.name}</div>
              <div className="text-[11px] text-muted text-center mb-4 leading-relaxed">{pl.desc}</div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
                  style={{
                    background:active?pl.color:"transparent",
                    color:active?"#000":pl.color,
                    border:`1px solid ${pl.color}44`
                  }}>
                  <span className="material-symbols-outlined text-sm">{active ? "pause" : "play_arrow"}</span>
                  {active?"Playing":"Play"}
                </span>
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
      <div className="glass-card p-6 mb-6 border border-white/5 relative overflow-hidden">
        <div className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00C896] text-lg">graphic_eq</span>
          Ambient Noises
        </div>
        <div className="text-xs text-muted mb-4 max-w-2xl">Generated mathematically via Web Audio API. Perfect for blocking out background noise without the distraction of music. You can stack this with a Spotify playlist!</div>
        <div className="flex gap-3 flex-wrap">
          {AMBIENT_SOUNDS.map(a=>(
            <button key={a.id} onClick={()=>{handleAmbient(a.id);sfx.click();}}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background:ambient===a.id?"rgba(0,200,150,.15)":"rgba(255,255,255,.03)",
                border:`1px solid ${ambient===a.id?"rgba(0,200,150,.4)":"rgba(255,255,255,.05)"}`,
                color:ambient===a.id?"#00C896":"#8892a8"
              }}>
              <span className="material-symbols-outlined text-base">
                {a.id==="off"?"volume_off":
                 a.id==="rain"?"water_drop":
                 a.id==="forest"?"forest":
                 a.id==="ocean"?"waves":
                 a.id==="fire"?"local_fire_department":
                 a.id==="wind"?"air":
                 a.id==="cafe"?"coffee":"headphones"}
              </span>
              {a.label}
              {ambient===a.id&&a.id!=="off"&&<span className="w-1.5 h-1.5 rounded-full bg-[#00C896] animate-pulse"/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
