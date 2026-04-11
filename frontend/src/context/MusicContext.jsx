import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicCtx = createContext(null);

export const PLAYLISTS = [
  { id:"lofi",      name:"Lo-Fi Hip Hop",   icon:"🎵", color:"#60a5fa", desc:"Chill beats to study to",          ytId:"jfKfPfyJRdk" },
  { id:"classical", name:"Classical Focus", icon:"🎻", color:"#a78bfa", desc:"Bach & Mozart for deep focus",      ytId:"4Tr0otuiQuU" },
  { id:"nature",    name:"Nature & Rain",   icon:"🌧️", color:"#34d399", desc:"Rain, forest, ocean sounds",        ytId:"q76bMs-NwRk" },
  { id:"hiphop",    name:"Study Hip-Hop",   icon:"🎤", color:"#fbbf24", desc:"Upbeat tracks to stay motivated",   ytId:"36YnV9STBqc" },
  { id:"ambient",   name:"Ambient Space",   icon:"🚀", color:"#f472b6", desc:"Atmospheric space soundscapes",     ytId:"F9L4q-0Pi4E" },
  { id:"jazz",      name:"Study Jazz",      icon:"🎷", color:"#fb923c", desc:"Smooth jazz for focused work",      ytId:"Dx5qFachd3A" },
];

const AMBIENT_SOUNDS = [
  { id:"off",        icon:"🔇", label:"Off" },
  { id:"rain",       icon:"🌧️", label:"Rain" },
  { id:"whitenoise", icon:"〰️", label:"White Noise" },
  { id:"lofi",       icon:"🎵", label:"Lo-Fi Hum" },
  { id:"binaural",   icon:"🧠", label:"Binaural Beats" },
  { id:"fire",       icon:"🔥", label:"Fireplace" },
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

      {/* Persistent mini player — always visible when music is playing */}
      {(playing || ambient !== "off") && (
        <MiniPlayer/>
      )}
    </MusicCtx.Provider>
  );
}

function MiniPlayer() {
  const { activePL, playing, ambient, timerOn, setTimerOn, studyTime, stopAll } = useMusic();
  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 500,
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,.5)",
      backdropFilter: "blur(10px)",
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
      {ambient !== "off" && !playing && <span style={{fontSize:16}}>🔊</span>}

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {playing && activePL ? activePL.name : `Ambient: ${ambient}`}
        </div>
        <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"monospace" }}>{fmt(studyTime)}</div>
      </div>

      <button onClick={() => setTimerOn(t => !t)} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14, padding:3 }} title={timerOn?"Pause timer":"Start timer"}>
        {timerOn ? "⏸" : "▶"}
      </button>
      <button onClick={stopAll} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14, padding:3 }} title="Stop all">✕</button>
    </div>
  );
}

export const useMusic = () => useContext(MusicCtx);
