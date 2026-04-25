// AIChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const CHIPS = ["Explain Big O notation","TCP vs UDP","Binary search algorithm","Process scheduling","Dynamic programming","OSI model layers","Database normalization","Dijkstra's algorithm"];

function md(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g,(_,lang,code)=>`<pre class="bg-white/[.03] border border-white/10 rounded-xl p-4 overflow-x-auto text-xs font-mono text-[#00C896] leading-relaxed my-2">${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g,`<code class="bg-purple/15 px-1.5 py-0.5 rounded font-mono text-xs text-purple">$1</code>`)
    .replace(/\*\*(.*?)\*\*/g,"<strong class='text-on-surface'>$1</strong>")
    .replace(/^### (.+)$/gm,"<div class='text-sm font-bold text-on-surface my-3'>$1</div>")
    .replace(/^## (.+)$/gm,"<div class='text-base font-extrabold text-on-surface my-3'>$1</div>")
    .replace(/^- (.+)$/gm,"<div class='pl-4 my-1 text-on-surface'>• $1</div>")
    .replace(/\n/g,"<br/>");
}

export default function AIChatPage() {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:"Hi! I'm your AI study assistant powered by **GPT-4o**.\n\nAsk me anything about engineering — algorithms, networks, OS, DBMS, maths, physics." }]);
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
    <div className="flex flex-col h-[calc(100vh-64px)] p-6">
      <h1 className="section-title mb-4 flex-shrink-0 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#00C896] text-2xl">psychology</span>
        AI Study Assistant
        <span className="text-sm text-muted font-normal ml-1">Powered by GPT-4o</span>
      </h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-3 pr-1">
        {msgs.map((m,i)=>(
          <div key={i} className="fade-up flex gap-3" style={{flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{background:m.role==="assistant"?"rgba(0,200,150,.1)":"rgba(96,165,250,.1)"}}>
              <span className="material-symbols-outlined text-sm"
                style={{color:m.role==="assistant"?"#00C896":"#60a5fa"}}>
                {m.role==="assistant"?"smart_toy":"person"}
              </span>
            </div>
            <div className="max-w-[78%] px-4 py-3 text-sm text-on-surface leading-relaxed"
              style={{
                borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px",
                background:m.role==="user"?"rgba(0,200,150,.06)":"rgba(255,255,255,.05)",
                border:`1px solid ${m.role==="user"?"rgba(0,200,150,.15)":"rgba(255,255,255,.1)"}`
              }}
              dangerouslySetInnerHTML={{__html:md(m.content)}}/>
          </div>
        ))}
        {loading&&(
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-[#00C896]">smart_toy</span>
            </div>
            <div className="flex gap-1.5 px-4 py-3 glass-card rounded-2xl">
              {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-[#00C896] animate-bounce-dot"
                style={{animationDelay:`${i*.15}s`}}/>)}
            </div>
          </div>
        )}
        {err&&<div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-xs text-danger">
          Error: {err} — check your backend OPENAI_API_KEY
        </div>}
        <div ref={bottom}/>
      </div>

      {/* Chips */}
      {msgs.length<=1&&(
        <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
          {CHIPS.map((c,i)=>(
            <button key={i} onClick={()=>send(c)}
              className="glass-card px-3 py-1.5 text-xs text-dim
                hover:border-[#00C896]/30 hover:text-[#00C896] transition-all duration-200">
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 flex-shrink-0">
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask any engineering question... (Enter to send)"
          className="input-field flex-1"/>
        <button onClick={()=>send()} disabled={!input.trim()||loading}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            transition-all duration-200"
          style={{background:input.trim()&&!loading?"#00C896":"#374151",
            cursor:input.trim()&&!loading?"pointer":"default"}}>
          {loading?<Spinner color="#000" size={18}/>:
            <span className="material-symbols-outlined text-black text-xl">send</span>}
        </button>
      </div>
    </div>
  );
}
