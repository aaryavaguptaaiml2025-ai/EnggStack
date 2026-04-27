import { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const CHIPS = [
  "Explain Big O notation",
  "TCP vs UDP differences",
  "Binary search algorithm",
  "Process scheduling in OS",
  "Dynamic programming basics",
  "OSI model layers",
  "Database normalization",
  "Dijkstra's algorithm",
];

const SUGGESTED_PROMPTS = [
  { icon: "code", text: "Explain recursion with an example", color: "#00C896" },
  { icon: "memory", text: "How does virtual memory work?", color: "#3b82f6" },
  { icon: "analytics", text: "Time complexity of sorting algorithms", color: "#8b5cf6" },
  { icon: "hub", text: "What is TCP/IP handshake?", color: "#f97316" },
];

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
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Hi! I'm **Cognit AI**, your study assistant powered by **GPT-4o**.\n\nAsk me anything about engineering — algorithms, networks, OS, DBMS, maths, physics."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const bottom = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [msgs, loading]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setErr("");
    const h = [...msgs, { role: "user", content: q }];
    setMsgs(h);
    setInput("");
    setLoading(true);
    sfx.click();
    try {
      const { reply } = await api.chat(h);
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
      sfx.notify();
    } catch (e) {
      setErr(e.message);
      sfx.error();
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const clearChat = () => {
    setMsgs([{
      role: "assistant",
      content: "Chat cleared! Ask me anything — I'm ready to help."
    }]);
    setErr("");
    sfx.click();
  };

  const isFirstMsg = msgs.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="section-title flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#00C896] text-xl">psychology</span>
          </div>
          <div>
            <div className="text-lg font-extrabold text-on-surface">Cognit AI</div>
            <div className="text-[10px] text-muted font-normal">Powered by GPT-4o</div>
          </div>
        </h1>
        {msgs.length > 1 && (
          <button onClick={clearChat}
            className="text-xs text-dim hover:text-on-surface flex items-center gap-1
              px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200">
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-3 pr-1">
        {msgs.map((m, i) => (
          <div key={i} className="fade-up flex gap-3"
            style={{ flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: m.role === "assistant" ? "rgba(0,200,150,.1)" : "rgba(59,130,246,.1)" }}>
              <span className="material-symbols-outlined text-sm"
                style={{ color: m.role === "assistant" ? "#00C896" : "#3b82f6" }}>
                {m.role === "assistant" ? "smart_toy" : "person"}
              </span>
            </div>
            <div className="max-w-[78%] px-4 py-3 text-sm text-on-surface leading-relaxed"
              style={{
                borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                background: m.role === "user" ? "rgba(0,200,150,.06)" : "rgba(255,255,255,.05)",
                border: `1px solid ${m.role === "user" ? "rgba(0,200,150,.15)" : "rgba(255,255,255,.1)"}`,
              }}
              dangerouslySetInnerHTML={{ __html: md(m.content) }} />
          </div>
        ))}

        {/* Loading indicator with animated dots */}
        {loading && (
          <div className="flex gap-3 items-start fade-in">
            <div className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-sm text-[#00C896]">smart_toy</span>
            </div>
            <div className="px-4 py-3 glass-card rounded-2xl flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#00C896]"
                    style={{
                      animation: "bounce 1.2s infinite",
                      animationDelay: `${i * 0.15}s`,
                    }} />
                ))}
              </div>
              <span className="text-xs text-muted ml-1">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error fallback */}
        {err && (
          <div className="p-4 bg-[#f87171]/8 border border-[#f87171]/20 rounded-xl fade-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#f87171] text-base">error</span>
              <span className="text-xs font-bold text-[#f87171]">Something went wrong</span>
            </div>
            <div className="text-xs text-muted mb-2">{err}</div>
            <button onClick={() => { setErr(""); send(msgs[msgs.length - 1]?.content); }}
              className="text-[11px] text-[#00C896] font-semibold hover:underline">
              Try again
            </button>
          </div>
        )}

        <div ref={bottom} />
      </div>

      {/* Suggested prompts (shown on first message only) */}
      {isFirstMsg && (
        <div className="mb-3 flex-shrink-0">
          <div className="text-[10px] text-dim mb-2 font-bold uppercase tracking-wider">Suggestions</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {SUGGESTED_PROMPTS.map((s, i) => (
              <button key={i} onClick={() => send(s.text)}
                className="flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-200
                  hover:bg-white/[.04]"
                style={{
                  background: s.color + "08",
                  border: `1px solid ${s.color}15`,
                }}>
                <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: s.color }}>
                  {s.icon}
                </span>
                <span className="text-xs text-on-surface font-medium">{s.text}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {CHIPS.map((c, i) => (
              <button key={i} onClick={() => send(c)}
                className="glass-card px-3 py-1.5 text-xs text-dim
                  hover:border-[#00C896]/30 hover:text-[#00C896] transition-all duration-200">
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 flex-shrink-0">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask any engineering question... (Enter to send)"
          disabled={loading}
          className="input-field flex-1" />
        <button onClick={() => send()} disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            transition-all duration-200"
          style={{
            background: input.trim() && !loading ? "#00C896" : "#374151",
            cursor: input.trim() && !loading ? "pointer" : "default",
            boxShadow: input.trim() && !loading ? "0 4px 16px rgba(0,200,150,0.3)" : "none",
          }}>
          {loading
            ? <Spinner color="#000" size={18} />
            : <span className="material-symbols-outlined text-black text-xl">send</span>
          }
        </button>
      </div>
    </div>
  );
}
