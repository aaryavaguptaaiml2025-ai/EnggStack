import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicCtx = createContext(null);

export const PLAYLISTS = [
  { id:"lofi",      name:"Lo-Fi Hip Hop",   color:"#60a5fa", desc:"Chill beats to study to",          ytId:"jfKfPfyJRdk" },
  { id:"classical", name:"Classical Focus", color:"#a78bfa", desc:"Bach & Mozart for deep focus",      ytId:"4Tr0otuiQuU" },
  { id:"nature",    name:"Nature & Rain",   color:"#34d399", desc:"Rain, forest, ocean sounds",        ytId:"q76bMs-NwRk" },
  { id:"hiphop",    name:"Study Hip-Hop",   color:"#fbbf24", desc:"Upbeat tracks to stay motivated",   ytId:"36YnV9STBqc" },
  { id:"ambient",   name:"Ambient Space",   color:"#f472b6", desc:"Atmospheric space soundscapes",     ytId:"F9L4q-0Pi4E" },
  { id:"jazz",      name:"Study Jazz",      color:"#fb923c", desc:"Smooth jazz for focused work",      ytId:"Dx5qFachd3A" },
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

export function MusicProvider({ children }) {
  const [activePL,  setActivePL]  = useState(null);
  const [playing,   setPlaying]   = useState(false);
  const [ambient,   setAmbient]   = useState("off");
  const [studyTime, setStudyTime] = useState(0);
  const [timerOn,   setTimerOn]   = useState(false);
  const timerRef = useRef(null);

  // Web Audio ambient
  const acRef    = useRef(null);
  const nodesRef = useRef([]);

  const stopAmbient = useCallback(() => {
    nodesRef.current.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    nodesRef.current = [];
  }, []);

  const playAmbient = useCallback((type) => {
    stopAmbient();
    if (type === "off") return;
    try {
      if (!acRef.current) acRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ac = acRef.current;
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

  // Study timer — persists across routes
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

  const handlePlaylist = (pl) => {
    if (activePL?.id === pl.id && playing) {
      setPlaying(false);
      setActivePL(null);
    } else {
      setActivePL(pl);
      setPlaying(true);
    }
  };

  const stopAll = () => {
    setPlaying(false);
    setActivePL(null);
    handleAmbient("off");
  };

  return (
    <MusicCtx.Provider value={{
      activePL, playing, ambient, studyTime, timerOn,
      setTimerOn, setStudyTime,
      handlePlaylist, handleAmbient, stopAll,
    }}>
      {children}

      {/* ── Persistent layout-level player ──
          This component lives at the layout level (inside MusicProvider which
          wraps Layout in App.jsx). It never unmounts during route navigation,
          so the YouTube iframe stays alive and music continues playing. */}
      <PersistentPlayer />
    </MusicCtx.Provider>
  );
}

/* ── Persistent Player ──────────────────────────────────────────────────────
   Renders at the layout level. Contains:
   - The actual YouTube iframe (when a playlist is active)
   - Mini player controls (visible when playing or ambient is on)
   This survives all route changes cleanly. */
function PersistentPlayer() {
  const { activePL, playing, ambient, timerOn, setTimerOn, studyTime, stopAll } = useMusic();
  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const showMini = playing || ambient !== "off";

  return (
    <>
      {/* YouTube iframe — always mounted when a playlist is active.
          Positioned off-screen when user is on MusicPage (MusicPage shows its own UI),
          and as part of the mini player otherwise. */}
      {playing && activePL && (
        <div className="fixed bottom-20 right-4 z-[499] rounded-xl overflow-hidden shadow-2xl"
          style={{ width: 280, height: 58 }}>
          <iframe
            src={`https://www.youtube.com/embed/${activePL.ytId}?autoplay=1&loop=1&playlist=${activePL.ytId}&rel=0&modestbranding=1`}
            width="280" height="58"
            className="border-none block"
            allow="autoplay; encrypted-media"
            title={activePL.name}
          />
        </div>
      )}

      {/* Mini player controls */}
      {showMini && (
        <div style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 500,
          background: "rgba(11,19,43,0.9)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 14, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          backdropFilter: "blur(20px)",
          animation: "slideIn .3s ease",
          minWidth: 220,
        }}>
          {/* Animated playing indicator */}
          {playing && activePL && (
            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:16, flexShrink:0 }}>
              {[1,1.5,0.8,1.3,1].map((h,i) => (
                <div key={i} style={{
                  width:3, background: activePL.color,
                  borderRadius:2, height:"100%",
                  animation:`musicBar .8s ease-in-out infinite ${i*.12}s alternate`,
                  transformOrigin:"bottom",
                }}/>
              ))}
            </div>
          )}
          {ambient !== "off" && !playing && (
            <span className="material-symbols-outlined text-[#00C896]" style={{fontSize:16}}>volume_up</span>
          )}

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#e0e6f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {playing && activePL ? activePL.name : `Ambient: ${ambient}`}
            </div>
            <div style={{ fontSize:10, color:"#8892a8", fontFamily:"monospace" }}>{fmt(studyTime)}</div>
          </div>

          <button onClick={() => setTimerOn(t => !t)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors duration-200"
            style={{ background:"none", border:"none", cursor:"pointer" }}
            title={timerOn?"Pause timer":"Start timer"}>
            <span className="material-symbols-outlined text-sm" style={{color:"#8892a8"}}>
              {timerOn ? "pause" : "play_arrow"}
            </span>
          </button>
          <button onClick={stopAll}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors duration-200"
            style={{ background:"none", border:"none", cursor:"pointer" }}
            title="Stop all">
            <span className="material-symbols-outlined text-sm" style={{color:"#8892a8"}}>close</span>
          </button>
        </div>
      )}
    </>
  );
}

export const useMusic = () => useContext(MusicCtx);
