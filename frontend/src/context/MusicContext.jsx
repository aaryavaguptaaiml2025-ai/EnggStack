import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicCtx = createContext(null);

export const PLAYLISTS = [
  { id:"lofi",      name:"Lo-Fi Beats",     color:"#60a5fa", desc:"Beats to relax/study to",          spotifyId:"0vvXsWCC9xrXsKd4FyS8kM" },
  { id:"classical", name:"Classical Focus", color:"#a78bfa", desc:"Bach & Mozart for deep focus",      spotifyId:"37i9dQZF1DWWEJlNEYEYfl" },
  { id:"nature",    name:"Nature Sounds",   color:"#34d399", desc:"Rain, forest, ocean sounds",        spotifyId:"37i9dQZF1DWXLeA8Omikj7" },
  { id:"hiphop",    name:"Study Hip-Hop",   color:"#fbbf24", desc:"Upbeat tracks to stay motivated",   spotifyId:"37i9dQZF1DWZeKCadgRdKQ" },
  { id:"ambient",   name:"Ambient Study",   color:"#f472b6", desc:"Atmospheric space soundscapes",     spotifyId:"37i9dQZF1DX3Ogo9pFvBkY" },
  { id:"jazz",      name:"Jazz Vibes",      color:"#fb923c", desc:"Smooth jazz for focused work",      spotifyId:"37i9dQZF1DX0b1hHYQtJso" },
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
  const [customLink, setCustomLink] = useState(null);
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
    setCustomLink(null);
    if (activePL?.id === pl.id && playing) {
      setPlaying(false);
      setActivePL(null);
    } else {
      setActivePL(pl);
      setPlaying(true);
    }
  };

  const playCustom = (spotifyUrl) => {
    try {
      const match = spotifyUrl.match(/(track|album|playlist|episode|show)[\/:]([a-zA-Z0-9]+)/);
      if (match) {
        setActivePL(null);
        setCustomLink({ type: match[1], id: match[2] });
        setPlaying(true);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const stopAll = () => {
    setPlaying(false);
    setActivePL(null);
    setCustomLink(null);
    handleAmbient("off");
  };

  return (
    <MusicCtx.Provider value={{
      activePL, playing, ambient, studyTime, timerOn, customLink,
      setTimerOn, setStudyTime,
      handlePlaylist, handleAmbient, playCustom, stopAll,
    }}>
      {children}
      <PersistentPlayer />
    </MusicCtx.Provider>
  );
}

function PersistentPlayer() {
  const { activePL, playing, ambient, timerOn, setTimerOn, studyTime, stopAll, customLink } = useMusic();
  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const showMini = playing || ambient !== "off";
  const showIframe = playing && (activePL || customLink);

  return (
    <>
      {/* Spotify iframe — always mounted when playing */}
      <div 
        className="fixed bottom-20 right-6 z-[499] rounded-[14px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300"
        style={{ 
          width: 320, 
          height: showIframe ? 80 : 0, 
          opacity: showIframe ? 1 : 0, 
          pointerEvents: showIframe ? 'auto' : 'none',
          transform: showIframe ? 'translateY(0)' : 'translateY(20px)'
        }}
      >
        {showIframe && (activePL || customLink) && (
          <iframe
            src={customLink 
              ? `https://open.spotify.com/embed/${customLink.type}/${customLink.id}?utm_source=generator&theme=0` 
              : `https://open.spotify.com/embed/playlist/${activePL?.spotifyId}?utm_source=generator&theme=0`}
            width="100%" height="80"
            className="border-none block bg-transparent"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Player"
          />
        )}
      </div>

      {/* Mini player controls wrapper */}
      {showMini && (
        <div style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 500,
          background: "rgba(11,19,43,0.9)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 14, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          backdropFilter: "blur(20px)",
          animation: "slideIn .3s ease",
          minWidth: 260,
        }}>
          {/* Animated playing indicator */}
          {playing && (activePL || customLink) && (
            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:16, flexShrink:0 }}>
              {[1,1.5,0.8,1.3,1].map((h,i) => (
                <div key={i} style={{
                  width:3, background: activePL?.color || "#1DB954",
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
              {playing ? (customLink ? "Custom Spotify Link" : activePL.name) : `Ambient: ${ambient}`}
            </div>
            <div style={{ fontSize:10, color:"#8892a8", fontFamily:"monospace" }}>{fmt(studyTime)}</div>
          </div>

          <button onClick={() => setTimerOn(t => !t)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors duration-200"
            style={{ background:"none", border:"none", cursor:"pointer" }}
            title={timerOn?"Pause timer":"Start timer"}>
            <span className="material-symbols-outlined text-sm" style={{color:timerOn ? "#f87171" : "#8892a8"}}>
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
