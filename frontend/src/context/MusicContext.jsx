import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import { motion, AnimatePresence } from "framer-motion";

const MusicCtx = createContext(null);

export const PLAYLISTS = [
  { id:"lofi",      name:"Lo-Fi Beats",     color:"#60a5fa", desc:"Lofi Girl - beats to relax/study to", url:"https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { id:"synth",     name:"Synthwave",       color:"#a78bfa", desc:"Dark cyberpunk / synthwave mix",      url:"https://www.youtube.com/watch?v=MVPTGNGiI-4" },
  { id:"nature",    name:"Nature Sounds",   color:"#34d399", desc:"Rain & forest sounds (4K)",           url:"https://www.youtube.com/watch?v=q76bMs-NwRk" },
  { id:"coding",    name:"Coding Hacker",   color:"#fbbf24", desc:"Upbeat electronic coding mix",        url:"https://www.youtube.com/watch?v=M5QY2_8704o" },
  { id:"ambient",   name:"Deep Space",      color:"#f472b6", desc:"Atmospheric space soundscapes",       url:"https://www.youtube.com/watch?v=vPHJeOcpk14" },
  { id:"jazz",      name:"Jazz Cafe",       color:"#fb923c", desc:"Smooth jazz in a cozy cafe",          url:"https://www.youtube.com/watch?v=Dx5qFachd3A" },
];

const AMBIENT_SOUNDS = [
  { id:"off",        label:"Off" },
  { id:"rain",       label:"Rain" },
  { id:"whitenoise", label:"White Noise" },
  { id:"lofi",       label:"Lo-Fi Hum" },
  { id:"binaural",   label:"Binaural Beats" },
  { id:"fire",       label:"Fireplace" },
];
export { AMBIENT_SOUNDS };

// Section 4.1: Validate YouTube ID format
const isValidYouTubeId = (id) => /^[a-zA-Z0-9_-]{11}$/.test(id);

export function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  if (match && match[2].length === 11 && isValidYouTubeId(match[2])) return match[2];
  return null;
}

export function MusicProvider({ children }) {
  const [activePL,  setActivePL]  = useState(null);
  const [customLink, setCustomLink] = useState(null);
  
  const [playing,   setPlaying]   = useState(false);
  const [volume,    setVolume]    = useState(() => Number(localStorage.getItem("cognit-volume") || 0.5));
  const [muted,     setMuted]     = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [seeking,   setSeeking]   = useState(false);
  const [speed,     setSpeed]     = useState(1);
  
  const [queue,     setQueue]     = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cognit-recent-music") || "[]"); } catch { return []; }
  });
  const [buffering, setBuffering] = useState(false);
  
  const [ambient,   setAmbient]   = useState("off");
  const [studyTime, setStudyTime] = useState(0);
  const [timerOn,   setTimerOn]   = useState(false);
  
  const timerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("cognit-volume", volume.toString());
  }, [volume]);

  // Web Audio ambient
  const acRef    = useRef(null);
  const nodesRef = useRef([]);

  const stopAmbient = useCallback(() => {
    nodesRef.current.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    nodesRef.current = [];
  }, []);

  // Section 2.5: Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
      if (acRef.current) {
        try { acRef.current.close(); } catch {}
        acRef.current = null;
      }
    };
  }, [stopAmbient]);

  const playAmbient = useCallback((type) => {
    stopAmbient();
    if (type === "off") return;
    try {
      if (!acRef.current) acRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ac = acRef.current;
      // Section 2.5: Always resume suspended AudioContext (browsers require user gesture)
      if (ac.state === "suspended") ac.resume();
      const master = ac.createGain();
      master.gain.value = 0.16;
      master.connect(ac.destination);
      nodesRef.current.push(master);

      if (type === "rain" || type === "whitenoise" || type === "fire") {
        const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf; src.loop = true;
        if (type === "rain") {
          const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 350; f.Q.value = 0.4;
          src.connect(f); f.connect(master);
        } else if (type === "fire") {
          const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 200;
          src.connect(f); f.connect(master);
        } else {
          src.connect(master);
        }
        src.start(); nodesRef.current.push(src);
      } else if (type === "binaural") {
        const l = ac.createOscillator(); const r = ac.createOscillator();
        const m = ac.createChannelMerger(2);
        l.frequency.value = 200; r.frequency.value = 240;
        l.connect(m, 0, 0); r.connect(m, 0, 1); m.connect(master);
        l.start(); r.start(); nodesRef.current.push(l, r);
      } else if (type === "lofi") {
        [80, 160, 240].forEach((f, i) => {
          const o = ac.createOscillator(); const g = ac.createGain();
          o.type = "sine"; o.frequency.value = f; g.gain.value = 0.025 / (i + 1);
          o.connect(g); g.connect(master); o.start(); nodesRef.current.push(o);
        });
      }
    } catch {}
  }, [stopAmbient]);

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setStudyTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  const handleAmbient = (id) => {
    setAmbient(id);
    playAmbient(id);
  };

  const addToRecent = useCallback((item) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(r => r.id !== item.id && r.url !== item.url);
      const updated = [item, ...filtered].slice(0, 10);
      localStorage.setItem("cognit-recent-music", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handlePlaylist = (pl) => {
    setCustomLink(null);
    if (activePL?.id === pl.id) {
      setPlaying(!playing);
    } else {
      setActivePL(pl);
      setPlaying(true);
      addToRecent({ id: pl.id, name: pl.name, url: pl.url, color: pl.color });
    }
  };

  const addToQueue = (pl) => {
    setQueue(prev => [...prev, pl]);
  };

  const playNext = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setActivePL(next);
      setCustomLink(null);
      setPlaying(true);
      addToRecent({ id: next.id, name: next.name, url: next.url, color: next.color });
    } else {
      setPlaying(false);
    }
  }, [queue, addToRecent]);

  const playCustom = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("soundcloud") || url.includes("twitch.tv") || url.includes("vimeo.com")) {
      setActivePL(null);
      setCustomLink(url);
      setPlaying(true);
      return true;
    }
    return false;
  };

  const stopAll = () => {
    setPlaying(false);
    setActivePL(null);
    setCustomLink(null);
    handleAmbient("off");
    setTimerOn(false);
  };

  const currentUrl = customLink || activePL?.url;

  return (
    <MusicCtx.Provider value={{
      activePL, playing, ambient, studyTime, timerOn, customLink, currentUrl,
      volume, muted, progress, duration, seeking, speed, queue, recentlyPlayed, buffering,
      setTimerOn, setStudyTime, setPlaying, setVolume, setMuted, setProgress, setSeeking,
      setSpeed, setQueue, setBuffering,
      handlePlaylist, handleAmbient, playCustom, stopAll, playerRef, addToQueue, playNext
    }}>
      {children}
      <PersistentPlayer />
    </MusicCtx.Provider>
  );
}

function PersistentPlayer() {
  const { 
    activePL, playing, customLink, currentUrl,
    volume, muted, progress, duration, seeking, speed, buffering,
    setPlaying, setVolume, setMuted, setProgress, setSeeking, setSpeed, setBuffering,
    stopAll, playerRef, ambient, timerOn, setTimerOn, studyTime, playNext
  } = useMusic();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(Math.floor(s % 60)).padStart(2,"0")}`;
  const fmtStudy = (s) => `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const hasMedia = !!currentUrl;
  const showPlayer = hasMedia || ambient !== "off";

  const handleSeekChange = (e) => {
    setProgress(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    if (playerRef.current) playerRef.current.seekTo(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const ytId = getYouTubeId(currentUrl);
  const coverArt = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "/cognit-logo.png";
  const title = customLink ? "Custom Stream" : (activePL?.name || `Ambient: ${ambient}`);

  return (
    <>
      {hasMedia && (
        <div style={{ display: "none" }}>
          <ReactPlayer
            ref={playerRef}
            url={currentUrl}
            playing={playing}
            volume={volume}
            muted={muted}
            playbackRate={speed}
            onProgress={({ played }) => {
              if (!seeking) setProgress(played);
            }}
            onDuration={(d) => setDuration(d)}
            onEnded={() => playNext()}
            onBuffer={() => setBuffering(true)}
            onBufferEnd={() => setBuffering(false)}
            onReady={() => setBuffering(false)}
            width="0"
            height="0"
            config={{ youtube: { playerVars: { autoplay: 1, origin: window.location.origin } } }}
          />
        </div>
      )}

      <AnimatePresence>
        {showPlayer && (
          <motion.div 
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center pb-6 px-4 pointer-events-none"
          >
            <div className={`pointer-events-auto backdrop-blur-2xl rounded-2xl transition-all duration-300 ${isExpanded ? 'w-full max-w-3xl' : 'w-auto'}`}
              style={{
                background: 'color-mix(in srgb, var(--bg, #0B1220) 85%, transparent)',
                border: '1px solid color-mix(in srgb, var(--ac) 20%, transparent)',
                boxShadow: `0 10px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 30px color-mix(in srgb, var(--ac) 8%, transparent)`,
              }}>
              
              {/* Progress Bar */}
              {hasMedia && isExpanded && (
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden group cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  onMouseDown={handleSeekMouseDown} onMouseUp={handleSeekMouseUp} onMouseLeave={() => setSeeking(false)}>
                  <div className="h-full relative transition-all duration-100"
                    style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, var(--ac), color-mix(in srgb, var(--ac) 60%, #00f2fe))` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform"
                      style={{ boxShadow: '0 0 10px var(--ac)' }}/>
                  </div>
                  <input type="range" min={0} max={0.999999} step="any" value={progress}
                    onChange={handleSeekChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}

              <div className="p-4 flex items-center justify-between gap-4">
                
                {/* Left: Info & Art */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  {hasMedia && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                      <img src={coverArt} alt="Cover" className={`w-full h-full object-cover transition-all duration-[4s] ${playing ? 'scale-110' : 'scale-100'}`} />
                      {playing && <div className="absolute inset-0 bg-[#00C896]/20 mix-blend-overlay" />}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-xl">{isExpanded ? 'close_fullscreen' : 'open_in_full'}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm truncate flex items-center gap-2" style={{ color: 'var(--text)' }}>
                      {title}
                      {playing && !buffering && (
                        <span className="flex items-end gap-[2px] h-3">
                          {[1,2,3,4].map(i => <span key={i} className="equalizer-bar" />)}
                        </span>
                      )}
                      {buffering && <span className="inline-block w-3 h-3 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--ac)' }} />}
                    </span>
                    <span className="text-xs font-mono mt-0.5 truncate flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                      {hasMedia ? `${fmt(progress * duration)} / ${fmt(duration)}` : "Ambient Noise"}
                      {timerOn && <span className="ml-2" style={{ color: 'var(--ac)' }}>| Study: {fmtStudy(studyTime)}</span>}
                    </span>
                  </div>
                </div>

                {/* Center: Controls (Only if Expanded or always if no media) */}
                {(isExpanded || !hasMedia) && (
                  <div className="flex items-center justify-center gap-6">
                    {hasMedia && (
                      <button className="text-[#8892a8] hover:text-white transition-colors" onClick={() => { if (playerRef.current) playerRef.current.seekTo(0); }}>
                        <span className="material-symbols-outlined text-2xl">skip_previous</span>
                      </button>
                    )}
                    <button 
                      className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                      style={{
                        background: 'var(--ac)',
                        color: 'var(--bg)',
                        boxShadow: `0 0 20px color-mix(in srgb, var(--ac) 30%, transparent)`,
                      }}
                      onClick={() => setPlaying(!playing)}
                    >
                      <span className="material-symbols-outlined text-3xl ml-0.5">
                        {playing ? "pause" : "play_arrow"}
                      </span>
                    </button>
                    {hasMedia && (
                      <button className="text-[#8892a8] hover:text-white transition-colors" onClick={() => { if (playerRef.current) playerRef.current.seekTo(duration); }}>
                        <span className="material-symbols-outlined text-2xl">skip_next</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Right: Volume & Extras */}
                {(isExpanded || !hasMedia) && (
                  <div className="flex items-center gap-4 min-w-[200px] justify-end">
                    <div className="flex items-center gap-2 group">
                      <button onClick={() => setMuted(!muted)} className="text-[#8892a8] hover:text-[#00C896] transition-colors">
                        <span className="material-symbols-outlined text-lg">
                          {muted || volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
                        </span>
                      </button>
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer flex items-center group-hover:w-24 transition-all"
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                          }
                        }}>
                        <div className="h-full rounded-full pointer-events-none" style={{ width: `${muted ? 0 : volume * 100}%`, background: `linear-gradient(90deg, var(--ac), color-mix(in srgb, var(--ac) 60%, #00f2fe))` }} />
                      </div>
                    </div>
                    
                    <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />
                    
                    {/* Playback Speed */}
                    <div className="relative">
                      <button onClick={() => setShowSpeed(!showSpeed)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-xs font-bold"
                        style={{ color: speed !== 1 ? 'var(--ac)' : 'var(--muted)', background: speed !== 1 ? 'color-mix(in srgb, var(--ac) 10%, transparent)' : 'transparent' }}
                        title="Playback Speed">
                        {speed}x
                      </button>
                      <AnimatePresence>
                        {showSpeed && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-xl flex flex-col gap-1 z-50"
                            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                              <button key={s} onClick={() => { setSpeed(s); setShowSpeed(false); }}
                                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:bg-white/10 whitespace-nowrap"
                                style={{ color: speed === s ? 'var(--ac)' : 'var(--text)' }}>
                                {s}x
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button onClick={() => setTimerOn(t => !t)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all`}
                      style={{
                        color: timerOn ? 'var(--clr-danger, #f87171)' : 'var(--muted)',
                        background: timerOn ? 'rgba(248,113,113,0.1)' : 'transparent',
                      }}
                      title={timerOn ? "Pause Study Timer" : "Start Study Timer"}>
                      <span className="material-symbols-outlined text-sm">{timerOn ? "timer_pause" : "timer"}</span>
                    </button>
                    
                    <button onClick={stopAll}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--muted)' }}
                      title="Close Player">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const useMusic = () => useContext(MusicCtx);
