import { useMusic, PLAYLISTS, AMBIENT_SOUNDS } from "../context/MusicContext";
import { sfx } from "../hooks/useSfx";

export default function MusicPage() {
  const { activePL, playing, ambient, studyTime, timerOn, setTimerOn, setStudyTime, handlePlaylist, handleAmbient } = useMusic();
  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div style={{padding:"24px 28px",maxWidth:1000,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,margin:0}}>Music</h1>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,color:timerOn?"var(--ac)":"var(--muted)",minWidth:82}}>{fmt(studyTime)}</span>
          <button onClick={()=>{sfx.click();setTimerOn(t=>!t);}} style={{background:timerOn?"#f87171":"var(--ac)",border:"none",borderRadius:6,padding:"4px 12px",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>{timerOn?"STOP":"START"}</button>
          <button onClick={()=>{setStudyTime(0);setTimerOn(false);sfx.click();}} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:16}}>o</button>
        </div>
      </div>

      <div style={{background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:10,padding:"10px 16px",marginBottom:20,fontSize:12,color:"var(--ac)",display:"flex",alignItems:"center",gap:8}}>
        <span>Music keeps playing when you switch pages — look for the mini player in the bottom-right corner.</span>
      </div>

      {activePL && playing && (
        <div className="slide-up" style={{background:"var(--card)",border:`1px solid ${activePL.color}44`,borderTop:`3px solid ${activePL.color}`,borderRadius:16,padding:20,marginBottom:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>{activePL.icon}</span>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{activePL.name}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>Now playing via YouTube</div>
              </div>
              <div style={{display:"flex",gap:2,alignItems:"flex-end",height:18}}>
                {[1,1.5,0.8,1.3,1].map((h,i)=>(
                  <div key={i} style={{width:3,background:activePL.color,borderRadius:2,height:"100%",animation:`musicBar .8s ease-in-out infinite ${i*.12}s alternate`,transformOrigin:"bottom"}}/>
                ))}
              </div>
            </div>
            <button onClick={()=>{handlePlaylist(activePL);sfx.click();}} style={{background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,cursor:"pointer",color:"var(--muted)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
          </div>
          <div style={{borderRadius:12,overflow:"hidden"}}>
            <iframe src={`https://www.youtube.com/embed/${activePL.ytId}?autoplay=1&loop=1&playlist=${activePL.ytId}&rel=0&modestbranding=1`} width="100%" height="100" style={{border:"none",display:"block"}} allow="autoplay; encrypted-media" title={activePL.name}/>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:24}}>
        {PLAYLISTS.map(pl=>{
          const active=activePL?.id===pl.id&&playing;
          return (
            <div key={pl.id} onClick={()=>{handlePlaylist(pl);sfx.click();}} style={{background:active?`${pl.color}12`:"var(--card)",border:`1px solid ${active?pl.color+"55":"var(--border)"}`,borderTop:`3px solid ${active?pl.color:"transparent"}`,borderRadius:16,padding:20,cursor:"pointer",transition:"all .2s",boxShadow:active?`0 0 24px ${pl.color}22`:"none"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--card2)";}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="var(--card)";}}}
            >
              <div style={{fontSize:32,marginBottom:10,textAlign:"center"}}>{pl.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)",textAlign:"center",marginBottom:4}}>{pl.name}</div>
              <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginBottom:14,lineHeight:1.4}}>{pl.desc}</div>
              <div style={{textAlign:"center"}}>
                <span style={{display:"inline-block",background:active?pl.color:"transparent",color:active?"#000":pl.color,border:`1px solid ${pl.color}66`,borderRadius:20,padding:"5px 18px",fontSize:12,fontWeight:700}}>
                  {active?"Pause":"Play"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:18}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:6}}>Ambient Sounds</div>
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Generated by Web Audio — no internet needed. Stack with a YouTube playlist for the perfect mix.</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {AMBIENT_SOUNDS.map(a=>(
            <button key={a.id} onClick={()=>{handleAmbient(a.id);sfx.click();}} style={{background:ambient===a.id?"var(--ac-dim)":"var(--bg2)",border:`1px solid ${ambient===a.id?"var(--ac)44":"var(--border)"}`,borderRadius:10,padding:"10px 18px",cursor:"pointer",color:ambient===a.id?"var(--ac)":"var(--muted)",fontSize:13,fontWeight:ambient===a.id?600:400,transition:"all .15s",display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:16}}>{a.icon}</span>{a.label}
              {ambient===a.id&&a.id!=="off"&&<span style={{width:6,height:6,borderRadius:"50%",background:"var(--ac)",animation:"pulse 1s infinite",display:"inline-block"}}/>}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
        {[
          {icon:"🎧",title:"Use Headphones",tip:"Binaural beats require headphones to work properly — they create different tones in each ear."},
          {icon:"🧩",title:"Match to Task",tip:"Lo-Fi for reading, Classical for maths, Nature for writing, Binaural for deep focus."},
          {icon:"🔄",title:"Keeps Playing",tip:"Music continues when you navigate. The mini player bottom-right lets you control it anywhere."},
        ].map((t,i)=>(
          <div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 18px"}}>
            <div style={{fontSize:24,marginBottom:8}}>{t.icon}</div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:5}}>{t.title}</div>
            <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{t.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
