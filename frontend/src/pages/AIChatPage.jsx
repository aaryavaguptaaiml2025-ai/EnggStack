// AIChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const CHIPS = ["Explain Big O notation","TCP vs UDP","Binary search algorithm","Process scheduling","Dynamic programming","OSI model layers","Database normalization","Dijkstra's algorithm"];

function md(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g,(_,lang,code)=>`<pre style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px;overflow-x:auto;font-size:12px;margin:8px 0;font-family:'JetBrains Mono',monospace;color:#4ade80;line-height:1.6">${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g,`<code style="background:rgba(167,139,250,.15);padding:2px 6px;border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#a78bfa">$1</code>`)
    .replace(/\*\*(.*?)\*\*/g,"<strong style='color:var(--text)'>$1</strong>")
    .replace(/^### (.+)$/gm,"<div style='font-size:14px;font-weight:700;color:var(--text);margin:12px 0 4px'>$1</div>")
    .replace(/^## (.+)$/gm,"<div style='font-size:15px;font-weight:800;color:var(--text);margin:14px 0 6px'>$1</div>")
    .replace(/^- (.+)$/gm,"<div style='padding-left:16px;margin:3px 0;color:var(--text)'>• $1</div>")
    .replace(/\n/g,"<br/>");
}

export default function AIChatPage() {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:"Hi! I'm your AI study assistant powered by **GPT-4o**.\n\nAsk me anything about engineering — algorithms, networks, OS, DBMS, maths, physics. 🚀" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const bottom = useRef(null); const inputRef = useRef(null);
  useEffect(()=>bottom.current?.scrollIntoView({behavior:"smooth"}),[msgs,loading]);
  const send = async (text) => {
    const q=(text||input).trim(); if(!q||loading) return;
    setErr(""); const h=[...msgs,{role:"user",content:q}]; setMsgs(h); setInput(""); setLoading(true); sfx.click();
    try { const {reply}=await api.chat(h); setMsgs(prev=>[...prev,{role:"assistant",content:reply}]); sfx.notify(); }
    catch(e) { setErr(e.message); sfx.error(); } finally { setLoading(false); setTimeout(()=>inputRef.current?.focus(),80); }
  };
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",padding:"20px 28px"}}>
      <h1 style={{color:"var(--text)",fontSize:20,fontWeight:800,margin:"0 0 14px",flexShrink:0}}>AI Study Assistant <span style={{fontSize:13,color:"var(--muted)",fontWeight:400}}>Powered by GPT-4o</span></h1>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,marginBottom:12,paddingRight:4}}>
        {msgs.map((m,i)=>(
          <div key={i} className="fade-up" style={{display:"flex",gap:10,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:m.role==="assistant"?"var(--ac-dim)":"rgba(96,165,250,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{m.role==="assistant"?"E":"U"}</div>
            <div style={{maxWidth:"78%",padding:"11px 15px",borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px",background:m.role==="user"?"rgba(74,222,128,.1)":"var(--card)",border:`1px solid ${m.role==="user"?"rgba(74,222,128,.25)":"var(--border)"}`,fontSize:13,color:"var(--text)",lineHeight:1.65}} dangerouslySetInnerHTML={{__html:md(m.content)}}/>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"var(--ac-dim)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>E</div>
          <div style={{display:"flex",gap:5,padding:"12px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"4px 16px 16px 16px"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"var(--ac)",animation:`bounce .9s infinite ${i*.15}s`}}/>)}</div>
        </div>}
        {err&&<div style={{padding:"10px 14px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,fontSize:12,color:"#f87171"}}>Error: {err} — check your backend OPENAI_API_KEY</div>}
        <div ref={bottom}/>
      </div>
      {msgs.length<=1&&<div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10,flexShrink:0}}>{CHIPS.map((c,i)=><button key={i} onClick={()=>send(c)} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"var(--muted)",fontSize:12,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--ac)55";e.currentTarget.style.color="var(--ac)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>{c}</button>)}</div>}
      <div style={{display:"flex",gap:10,flexShrink:0}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask any engineering question... (Enter to send)" style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",color:"var(--text)",fontSize:13,outline:"none",transition:"border-color .2s,box-shadow .2s"}} onFocus={e=>{e.target.style.borderColor="var(--ac)55";e.target.style.boxShadow="0 0 0 3px var(--ac-dim)";}} onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none";}}/>
        <button onClick={()=>send()} disabled={!input.trim()||loading} style={{background:input.trim()&&!loading?"var(--ac)":"var(--border)",border:"none",borderRadius:12,width:48,height:48,cursor:input.trim()&&!loading?"pointer":"default",fontSize:16,color:"#000",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s",flexShrink:0}}>{loading?<Spinner color="#000" size={18}/>:">"}</button>
      </div>
    </div>
  );
}
