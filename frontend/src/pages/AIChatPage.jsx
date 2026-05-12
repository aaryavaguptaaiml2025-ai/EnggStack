import { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";

const SUGGESTIONS = [
  "Explain recursion",
  "Help me study for exams",
  "Solve this problem"
];

// Section 1.6: Sanitize all rendered HTML
function md(text) {
  const raw = text
    .replace(/```(\w*)\n?([\s\S]*?)```/g,(_,lang,code)=>`<pre class="bg-black/30 border border-white/10 rounded-xl p-4 overflow-x-auto text-xs font-mono text-[var(--ac)] leading-relaxed my-2">${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g,`<code class="bg-[var(--ac)]/15 px-1.5 py-0.5 rounded font-mono text-xs text-[var(--ac)]">$1</code>`)
    .replace(/\*\*(.*?)\*\*/g,"<strong class='text-[var(--text)]'>$1</strong>")
    .replace(/^### (.+)$/gm,"<div class='text-sm font-bold text-[var(--text)] my-3'>$1</div>")
    .replace(/^## (.+)$/gm,"<div class='text-base font-extrabold text-[var(--text)] my-3'>$1</div>")
    .replace(/^- (.+)$/gm,"<div class='pl-4 my-1 text-[var(--text)]'>• $1</div>")
    .replace(/\n/g,"<br/>");
  return DOMPurify.sanitize(raw);
}

export default function AIChatPage() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const bottom = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  // Load recent sessions on mount (Section 3.5)
  useEffect(() => {
    api.getChatSessions().then(setSessions).catch(() => {});
  }, []);

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setErr("");
    const newMsg = { role: "user", content: q, time: new Date() };
    const h = [...msgs, newMsg];
    setMsgs(h);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    sfx.click();
    try {
      // Need to send only role/content to API
      const apiHistory = h.map(({ role, content }) => ({ role, content }));
      const result = await api.chat(apiHistory, sessionId);
      setMsgs(prev => [...prev, { role: "assistant", content: result.reply, time: new Date() }]);
      if (result.sessionId) setSessionId(result.sessionId);
      sfx.notify();
      // Refresh sessions list
      api.getChatSessions().then(setSessions).catch(() => {});
    } catch (e) {
      setErr(e.message);
      sfx.error();
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  };

  const clearChat = () => {
    setMsgs([]);
    setSessionId(null);
    setErr("");
    sfx.click();
  };

  const loadSession = async (sid) => {
    try {
      const session = await api.getChatSession(sid);
      setMsgs(session.messages.map(m => ({ ...m, time: new Date(m.timestamp) })));
      setSessionId(sid);
      setShowSessions(false);
      sfx.click();
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="page-container h-[calc(100vh-2rem)] flex flex-col p-0 md:p-0">
      {/* Header */}
      <div className="h-[60px] flex justify-between items-center px-6 flex-shrink-0 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl grad-text">psychology</span>
          <div>
            <h1 className="text-lg font-bold grad-text tracking-tight leading-tight">AI Chat</h1>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Powered by GPT-4o</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Session History Toggle (Section 3.5) */}
          <button onClick={() => { setShowSessions(!showSessions); sfx.click(); }}
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">history</span> History
          </button>
          {msgs.length > 0 && (
            <button onClick={clearChat} className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> New chat
            </button>
          )}
        </div>
      </div>

      {/* Session History Sidebar (Section 3.5) */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-[60px] bottom-0 w-72 z-50 glass-card border-l border-[var(--border)] overflow-y-auto p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[var(--text)]">Recent Chats</h3>
              <button onClick={() => setShowSessions(false)} className="text-muted hover:text-[var(--text)]">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No previous chats</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <button key={s._id} onClick={() => loadSession(s._id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all hover:bg-white/5 ${sessionId === s._id ? "bg-[var(--ac)]/10 border border-[var(--ac)]/20" : "border border-white/5"}`}>
                    <div className="text-[var(--text)] font-medium truncate">{s.title}</div>
                    <div className="text-muted mt-1">{new Date(s.updatedAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar relative">
        {msgs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "rgba(0,200,150,0.2)" }}>psychology</span>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Ask me anything</h2>
            <p className="text-muted text-sm mb-8 max-w-md">I can help with concepts, problems, and study plans</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="px-4 py-2 rounded-full glass-card text-sm text-[var(--text)] hover:text-[var(--ac)] hover:border-[var(--ac)]/40 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 w-full ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-[28px] h-[28px] rounded-full bg-[var(--ac)]/10 flex-shrink-0 flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-sm text-[var(--ac)]">psychology</span>
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-[75%] md:max-w-[80%]`}>
                    <div className={`px-4 py-3 text-sm leading-[1.7] ${m.role === "user" ? "bg-[var(--ac)]/15 border border-[var(--ac)]/20 rounded-2xl rounded-tr-sm text-[var(--text)]" : "glass-card rounded-2xl rounded-tl-sm text-[var(--text)]"}`}
                      dangerouslySetInnerHTML={{ __html: md(m.content) }} 
                    />
                    <div className="text-[10px] text-dim mt-1.5 mx-1">
                      {m.time ? new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 w-full">
                  <div className="w-[28px] h-[28px] rounded-full bg-[var(--ac)]/10 flex-shrink-0 flex items-center justify-center mt-1">
                    <span className="material-symbols-outlined text-sm text-[var(--ac)]">psychology</span>
                  </div>
                  <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-4 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        animate={{ scale: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--ac)]"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {err && (
              <div className="glass-card border-[var(--clr-danger)]/30 p-4 rounded-xl max-w-md mx-auto text-center">
                <div className="text-[var(--clr-danger)] text-sm mb-2">{err}</div>
                <button onClick={() => { setErr(""); send(msgs[msgs.length - 1]?.content); }} className="btn-outline text-xs px-3 py-1">Try again</button>
              </div>
            )}
            <div ref={bottom} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto glass-card p-2 flex items-end gap-2 rounded-2xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask anything..."
            className="input-field flex-1 resize-none bg-transparent border-none focus:ring-0 shadow-none text-sm py-2.5 max-h-[120px] custom-scrollbar"
            rows={1}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors mb-0.5 ${input.trim() && !loading ? "bg-[var(--ac)] text-[#0B1220]" : "bg-white/10 text-dim"}`}>
            {loading ? <Spinner size={16} color="currentColor" /> : <span className="material-symbols-outlined text-lg">send</span>}
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-dim">
          Press Enter to send, Shift + Enter for new line. AI can make mistakes.
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
