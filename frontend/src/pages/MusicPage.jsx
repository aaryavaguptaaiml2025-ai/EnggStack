import { useMusic, PLAYLISTS, AMBIENT_SOUNDS } from "../context/MusicContext";
import { sfx } from "../hooks/useSfx";

export default function MusicPage() {
  const { activePL, playing, ambient, studyTime, timerOn, setTimerOn, setStudyTime, handlePlaylist, handleAmbient } = useMusic();
  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="page-container max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">music_note</span>
            Music
          </h1>
          <p className="text-xs text-muted mt-1">Study playlists and ambient sounds</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-3">
          <span className="font-mono text-lg min-w-[82px]"
            style={{color:timerOn?"#4be277":"#6b7280"}}>{fmt(studyTime)}</span>
          <button onClick={()=>{sfx.click();setTimerOn(t=>!t);}}
            className="px-3 py-1 rounded-lg text-[11px] font-bold text-black"
            style={{background:timerOn?"#f87171":"#4be277"}}>
            {timerOn?"STOP":"START"}
          </button>
          <button onClick={()=>{setStudyTime(0);setTimerOn(false);sfx.click();}}
            className="text-dim hover:text-on-surface transition-colors p-1">
            <span className="material-symbols-outlined text-base">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-5
        flex items-center gap-2 text-xs text-primary">
        <span className="material-symbols-outlined text-sm">info</span>
        Music keeps playing when you switch pages — look for the mini player in the bottom-right corner.
      </div>

      {/* Now playing */}
      {activePL && playing && (
        <div className="slide-up glass-card p-5 mb-6" style={{borderTop:`3px solid ${activePL.color}`}}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activePL.icon}</span>
              <div>
                <div className="text-base font-bold text-on-surface">{activePL.name}</div>
                <div className="text-xs text-muted">Now playing via YouTube</div>
              </div>
              <div className="flex gap-0.5 items-end h-5">
                {[1,1.5,0.8,1.3,1].map((h,i)=>(
                  <div key={i} className="w-[3px] rounded-sm h-full" style={{
                    background:activePL.color,
                    animation:`musicBar .8s ease-in-out infinite ${i*.12}s alternate`,
                    transformOrigin:"bottom"
                  }}/>
                ))}
              </div>
            </div>
            <button onClick={()=>{handlePlaylist(activePL);sfx.click();}}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10
                flex items-center justify-center text-dim hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="rounded-xl overflow-hidden">
            <iframe src={`https://www.youtube.com/embed/${activePL.ytId}?autoplay=1&loop=1&playlist=${activePL.ytId}&rel=0&modestbranding=1`}
              width="100%" height="100" className="border-none block" allow="autoplay; encrypted-media" title={activePL.name}/>
          </div>
        </div>
      )}

      {/* Playlists grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {PLAYLISTS.map(pl=>{
          const active=activePL?.id===pl.id&&playing;
          return (
            <div key={pl.id} onClick={()=>{handlePlaylist(pl);sfx.click();}}
              className="glass-card p-5 cursor-pointer transition-all duration-200 hover:bg-card-2"
              style={{borderTop:`3px solid ${active?pl.color:"transparent"}`,
                boxShadow:active?`0 0 24px ${pl.color}22`:"none"}}>
              <div className="text-3xl mb-3 text-center">{pl.icon}</div>
              <div className="text-sm font-bold text-on-surface text-center mb-1">{pl.name}</div>
              <div className="text-[11px] text-muted text-center mb-4 leading-relaxed">{pl.desc}</div>
              <div className="text-center">
                <span className="inline-block px-5 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background:active?pl.color:"transparent",
                    color:active?"#000":pl.color,
                    border:`1px solid ${pl.color}66`
                  }}>
                  {active?"Pause":"Play"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ambient sounds */}
      <div className="glass-card p-5 mb-5">
        <div className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">headphones</span>
          Ambient Sounds
        </div>
        <div className="text-xs text-muted mb-4">Generated by Web Audio — no internet needed. Stack with a YouTube playlist for the perfect mix.</div>
        <div className="flex gap-2.5 flex-wrap">
          {AMBIENT_SOUNDS.map(a=>(
            <button key={a.id} onClick={()=>{handleAmbient(a.id);sfx.click();}}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background:ambient===a.id?"rgba(75,226,119,.1)":"rgba(17,24,39,.5)",
                border:`1px solid ${ambient===a.id?"rgba(75,226,119,.3)":"rgba(255,255,255,.05)"}`,
                color:ambient===a.id?"#4be277":"#6b7280"
              }}>
              <span className="text-base">{a.icon}</span>{a.label}
              {ambient===a.id&&a.id!=="off"&&<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"/>}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {icon:"🎧",title:"Use Headphones",tip:"Binaural beats require headphones to work properly — they create different tones in each ear."},
          {icon:"🧩",title:"Match to Task",tip:"Lo-Fi for reading, Classical for maths, Nature for writing, Binaural for deep focus."},
          {icon:"🔄",title:"Keeps Playing",tip:"Music continues when you navigate. The mini player bottom-right lets you control it anywhere."},
        ].map((t,i)=>(
          <div key={i} className="glass-card p-5">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-semibold text-on-surface mb-1.5">{t.title}</div>
            <div className="text-xs text-muted leading-relaxed">{t.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
