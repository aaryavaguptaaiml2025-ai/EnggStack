import { useState, useEffect } from "react";
import { api } from "../api";
import { Card, Modal, Input, Btn, Badge, Toast, Spinner, Tabs, ProgressBar } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { useAuth } from "../context/AuthContext";
import { useStats, BADGES, getLevel, LEVEL_NAMES, LEVEL_ICONS, XP_THRESHOLDS } from "../context/StatsContext";
import XPBar from "../components/XPBar";

const X = () => <span style={{fontSize:18,lineHeight:1}}>&#10005;</span>;

// ─────────────────────────────────────────────────────────────────────────────
// DEADLINES
// ─────────────────────────────────────────────────────────────────────────────
export function DeadlinesPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ title:"", subject:"", dueDate:"", priority:"medium" });

  const load = async () => {
    setLoad(true);
    try { setItems(await api.getDeadlines()); } catch(e) { console.error(e); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title || !form.dueDate) return;
    try {
      await api.addDeadline(form);
      sfx.success();
      setToast({ msg:"Deadline added!", color:"#4ade80" });
      setModal(false);
      setForm({ title:"", subject:"", dueDate:"", priority:"medium" });
      load();
    } catch(e) { sfx.error(); setToast({ msg:e.message, color:"#f87171" }); }
  };
  const toggle = async (it) => {
    try { await api.updateDeadline(it._id, { done:!it.done }); sfx.xp(); load(); } catch {}
  };
  const del = async (id) => {
    try { await api.deleteDeadline(id); sfx.click(); load(); } catch {}
  };

  const daysLeft = (d) => {
    const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
    return diff < 0 ? "Overdue" : diff === 0 ? "Today" : `${diff}d`;
  };
  const urgencyColor = (d) => {
    const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
    return diff < 0 ? "#ef4444" : diff <= 1 ? "#f87171" : diff <= 3 ? "#fbbf24" : "#4ade80";
  };

  const pending = items.filter(x => !x.done);
  const done    = items.filter(x =>  x.done);

  return (
    <div style={{ padding:"28px 32px" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:0 }}>Deadlines</h1>
        <Btn color="#fbbf24" onClick={() => setModal(true)}>+ Add Deadline</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60 }}><Spinner /></div>
      ) : items.length === 0 ? (
        <Card style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:44, marginBottom:12 }}>🎉</div>
          <div style={{ color:"var(--muted)", fontSize:14 }}>No deadlines! Add one to stay on track.</div>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>
                Pending ({pending.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {pending.map(it => (
                  <div key={it._id} className="fade-up" style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:13, borderLeft:`3px solid ${urgencyColor(it.dueDate)}`, transition:"background .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--card2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--card)"}
                  >
                    <div onClick={() => toggle(it)} style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${urgencyColor(it.dueDate)}`, cursor:"pointer", flexShrink:0, transition:"all .2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = urgencyColor(it.dueDate) + "44"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{it.title}</div>
                      {it.subject && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{it.subject}</div>}
                    </div>
                    <Badge color={urgencyColor(it.dueDate)}>{daysLeft(it.dueDate)}</Badge>
                    <div style={{ fontSize:11, color:"var(--dim)", minWidth:80, textAlign:"right" }}>
                      {new Date(it.dueDate).toLocaleDateString("en-IN")}
                    </div>
                    <button onClick={() => del(it._id)} style={{ background:"none", border:"none", color:"var(--dim)", cursor:"pointer", padding:4, fontSize:14, transition:"color .15s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--dim)"}
                    ><X /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:"var(--dim)", fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>Completed ({done.length})</div>
              {done.map(it => (
                <div key={it._id} style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 18px", background:"var(--bg2)", borderRadius:11, marginBottom:6, opacity:.5 }}>
                  <div onClick={() => toggle(it)} style={{ width:20, height:20, borderRadius:"50%", background:"#4ade80", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>&#10003;</div>
                  <span style={{ flex:1, fontSize:13, color:"var(--muted)", textDecoration:"line-through" }}>{it.title}</span>
                  <button onClick={() => del(it._id)} style={{ background:"none", border:"none", color:"var(--dim)", cursor:"pointer", fontSize:14 }}><X /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title="Add Deadline" onClose={() => setModal(false)}>
          <Input label="Title" placeholder="e.g. Submit Maths Assignment" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
          <Input label="Subject (optional)" placeholder="e.g. Calculus" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} />
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Priority</div>
            <div style={{ display:"flex", gap:8 }}>
              {["low","medium","high"].map(p => {
                const c = {low:"#4ade80",medium:"#fbbf24",high:"#f87171"}[p];
                return <button key={p} onClick={() => setForm({...form, priority:p})} style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${form.priority===p?c+"66":"var(--border)"}`, background:form.priority===p?c+"15":"var(--bg2)", color:form.priority===p?c:"var(--muted)", fontSize:12, fontWeight:form.priority===p?600:400, cursor:"pointer", textTransform:"capitalize" }}>{p}</button>;
              })}
            </div>
          </div>
          <Btn full color="#fbbf24" onClick={add}>Add Deadline</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTES
// ─────────────────────────────────────────────────────────────────────────────
export function NotesPage() {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [active,  setActive]  = useState(null);
  const [editing, setEditing] = useState(false);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [form,    setForm]    = useState({ title:"", subject:"", content:"" });

  const load = async () => {
    setLoad(true);
    try { setNotes(await api.getNotes()); } catch(e) { console.error(e); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title) return;
    try {
      const n = await api.addNote(form);
      sfx.success();
      setModal(false);
      setForm({ title:"", subject:"", content:"" });
      setToast({ msg:"Note created!", color:"#4ade80" });
      await load();
      setActive(n);
      setEditing(false);
    } catch(e) { sfx.error(); setToast({ msg:e.message, color:"#f87171" }); }
  };

  const save = async () => {
    if (!active) return;
    try {
      await api.updateNote(active._id, { title:active.title, content:active.content, subject:active.subject });
      sfx.xp();
      setEditing(false);
      setToast({ msg:"Saved!", color:"#4ade80" });
      load();
    } catch(e) { sfx.error(); }
  };

  const del = async (id) => {
    try {
      await api.deleteNote(id);
      sfx.click();
      if (active?._id === id) setActive(null);
      load();
    } catch {}
  };

  const exportPDF = (id) => window.open(`/api/export/notes/${id}?token=${localStorage.getItem("es_token")}`, "_blank");

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.subject||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

      {/* Note list sidebar */}
      <div style={{ width:280, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", flexShrink:0, background:"var(--bg2)" }}>
        <div style={{ padding:"18px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:15, color:"var(--text)" }}>Notes</span>
            <button onClick={() => setModal(true)} style={{ background:"var(--ac-dim)", border:"1px solid var(--ac)44", borderRadius:8, padding:"5px 12px", color:"var(--ac)", fontSize:12, fontWeight:600, cursor:"pointer" }}>+ New</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:9, padding:"8px 12px", color:"var(--text)", fontSize:12, outline:"none" }}
            onFocus={e => e.target.style.borderColor = "var(--ac)44"}
            onBlur={e  => e.target.style.borderColor = "var(--border)"}
          />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px" }}>
          {loading ? <div style={{ textAlign:"center", padding:20 }}><Spinner /></div> :
           filtered.length === 0 ? <div style={{ color:"var(--dim)", fontSize:12, textAlign:"center", padding:20 }}>No notes found</div> :
           filtered.map(n => (
            <div key={n._id} onClick={() => { setActive(n); setEditing(false); sfx.click(); }}
              style={{ padding:"11px 10px", borderRadius:10, cursor:"pointer", marginBottom:3, background:active?._id===n._id?"var(--ac-dim)":"transparent", border:`1px solid ${active?._id===n._id?"var(--ac)33":"transparent"}`, transition:"all .15s" }}
              onMouseEnter={e => { if (active?._id !== n._id) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
              onMouseLeave={e => { if (active?._id !== n._id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
                {n.pinned ? "📌 " : ""}{n.title}
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4 }}>
                {n.content?.slice(0,50) || "Empty note"}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                {n.subject && <Badge color="#60a5fa">{n.subject}</Badge>}
                <span style={{ fontSize:10, color:"var(--dim)" }}>{new Date(n.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor pane */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {!active ? (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, color:"var(--dim)" }}>
            <div style={{ fontSize:48 }}>📝</div>
            <div style={{ fontSize:14 }}>Select a note or create a new one</div>
            <button onClick={() => setModal(true)} style={{ background:"var(--ac-dim)", border:"1px solid var(--ac)44", borderRadius:10, padding:"10px 24px", color:"var(--ac)", fontSize:13, cursor:"pointer", fontWeight:600 }}>+ Create Note</button>
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"22px 26px", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexShrink:0 }}>
              <div style={{ flex:1 }}>
                {editing ? (
                  <input value={active.title} onChange={e => setActive({...active, title:e.target.value})}
                    style={{ fontSize:20, fontWeight:700, background:"transparent", border:"none", color:"var(--text)", outline:"none", width:"100%" }} />
                ) : (
                  <div style={{ fontSize:20, fontWeight:700, color:"var(--text)" }}>{active.title}</div>
                )}
                <div style={{ fontSize:11, color:"var(--dim)", marginTop:3 }}>
                  Updated {new Date(active.updatedAt || Date.now()).toLocaleString()}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:12 }}>
                {editing ? (
                  <>
                    <Btn color="var(--ac)" size="sm" onClick={save}>Save</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
                  </>
                ) : (
                  <Btn color="#60a5fa" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Btn>
                )}
                <Btn color="#4ade80" size="sm" variant="outline" onClick={() => exportPDF(active._id)}>PDF</Btn>
                <Btn color="#f87171" size="sm" variant="outline" onClick={() => del(active._id)}>Delete</Btn>
              </div>
            </div>

            {editing && (
              <input value={active.subject || ""} onChange={e => setActive({...active, subject:e.target.value})}
                placeholder="Subject (optional)"
                style={{ marginBottom:10, background:"var(--card)", border:"1px solid var(--border)", borderRadius:9, padding:"7px 12px", color:"var(--muted)", fontSize:12, outline:"none", flexShrink:0 }} />
            )}

            <div style={{ flex:1, overflow:"hidden" }}>
              {editing ? (
                <textarea value={active.content || ""} onChange={e => setActive({...active, content:e.target.value})}
                  placeholder="Start writing your notes here..."
                  style={{ width:"100%", height:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", color:"var(--text)", fontSize:13, lineHeight:1.7, outline:"none", resize:"none", fontFamily:"inherit" }}
                  onFocus={e => e.target.style.borderColor = "var(--ac)44"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"}
                />
              ) : (
                <div style={{ height:"100%", overflowY:"auto", fontSize:13, color:"var(--text)", lineHeight:1.8, padding:"14px", background:"var(--bg2)", borderRadius:12, border:"1px solid var(--border)", whiteSpace:"pre-wrap", fontFamily:"inherit" }}>
                  {active.content || <span style={{ color:"var(--dim)" }}>Empty — click Edit to add content</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <Modal title="New Note" onClose={() => setModal(false)}>
          <Input label="Title" placeholder="e.g. Binary Search Trees" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
          <Input label="Subject (optional)" placeholder="e.g. Data Structures" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Content</div>
            <textarea value={form.content} onChange={e => setForm({...form, content:e.target.value})} rows={5}
              style={{ width:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", color:"var(--text)", fontSize:13, outline:"none", resize:"none", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = "var(--ac)44"}
              onBlur={e  => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <Btn full color="var(--ac)" onClick={add}>Create Note</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────
export function ChecklistPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [text,    setText]    = useState("");
  const [sub,     setSub]     = useState("");
  const [toast,   setToast]   = useState(null);

  const load = async () => {
    setLoad(true);
    try { setItems(await api.getChecklist()); } catch(e) { console.error(e); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    try { await api.addCheck({ text, subject:sub }); sfx.click(); setText(""); setSub(""); load(); }
    catch(e) { sfx.error(); setToast({ msg:e.message, color:"#f87171" }); }
  };
  const toggle = async (it) => {
    try { await api.updateCheck(it._id, { done:!it.done }); if (!it.done) sfx.xp(); else sfx.click(); load(); } catch {}
  };
  const del = async (id) => { try { await api.deleteCheck(id); sfx.click(); load(); } catch {} };

  const pending = items.filter(x => !x.done);
  const done    = items.filter(x =>  x.done);

  return (
    <div style={{ padding:"28px 32px" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:"0 0 18px" }}>Checklist</h1>

      <Card style={{ marginBottom:18 }}>
        <div style={{ display:"flex", gap:10 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==="Enter" && add()}
            placeholder="Add a task... (press Enter)"
            style={{ flex:1, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", color:"var(--text)", fontSize:13, outline:"none" }}
            onFocus={e => e.target.style.borderColor = "var(--ac)44"}
            onBlur={e  => e.target.style.borderColor = "var(--border)"}
          />
          <input value={sub} onChange={e => setSub(e.target.value)} placeholder="Subject"
            style={{ width:120, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", color:"var(--text)", fontSize:13, outline:"none" }}
            onFocus={e => e.target.style.borderColor = "var(--ac)44"}
            onBlur={e  => e.target.style.borderColor = "var(--border)"}
          />
          <Btn color="var(--ac)" onClick={add}>Add</Btn>
        </div>
      </Card>

      {loading ? <div style={{ textAlign:"center", padding:60 }}><Spinner /></div> : (
        <>
          {items.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"var(--muted)" }}>{done.length} / {items.length} completed</span>
                <span style={{ fontSize:12, color:"var(--ac)", fontWeight:600 }}>{Math.round((done.length / items.length) * 100)}%</span>
              </div>
              <ProgressBar value={done.length} max={items.length} color="var(--ac)" glow />
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
            {pending.map(it => (
              <div key={it._id} className="fade-up" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, transition:"background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--card2)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--card)"}
              >
                <div onClick={() => toggle(it)} style={{ width:20, height:20, borderRadius:5, border:"2px solid var(--ac)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ac)33"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                />
                <span style={{ flex:1, fontSize:13, color:"var(--text)" }}>{it.text}</span>
                {it.subject && <Badge color="#60a5fa">{it.subject}</Badge>}
                <button onClick={() => del(it._id)} style={{ background:"none", border:"none", color:"var(--dim)", cursor:"pointer", fontSize:14, transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--dim)"}
                ><X /></button>
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:"var(--dim)", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Done ({done.length})</div>
              {done.map(it => (
                <div key={it._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"var(--bg2)", borderRadius:10, marginBottom:5, opacity:.5 }}>
                  <div onClick={() => toggle(it)} style={{ width:20, height:20, borderRadius:5, background:"var(--ac)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>&#10003;</div>
                  <span style={{ flex:1, fontSize:13, color:"var(--muted)", textDecoration:"line-through" }}>{it.text}</span>
                  <button onClick={() => del(it._id)} style={{ background:"none", border:"none", color:"var(--dim)", cursor:"pointer", fontSize:14 }}><X /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────
const SC = ["#60a5fa","#4ade80","#fbbf24","#a78bfa","#f87171","#f472b6","#34d399","#fb923c"];
const ICONS_LIST = ["📚","🔬","📐","💻","⚗️","🧮","🌍","📖","🎯","🧲"];

export function SubjectsPage() {
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoad]    = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ name:"", color:"#60a5fa", totalTopics:0, icon:"📚" });

  const load = async () => {
    setLoad(true);
    try { setSubs(await api.getSubjects()); } catch(e) { console.error(e); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name) return;
    try {
      await api.addSubject(form);
      sfx.success();
      setModal(false);
      setForm({ name:"", color:"#60a5fa", totalTopics:0, icon:"📚" });
      load();
    } catch(e) { sfx.error(); setToast({ msg:e.message, color:"#f87171" }); }
  };
  const inc = async (s) => {
    const d = Math.min(s.doneTopics + 1, s.totalTopics);
    await api.updateSubject(s._id, { doneTopics:d });
    sfx.xp();
    load();
  };
  const del = async (id) => { await api.deleteSubject(id); sfx.click(); load(); };

  return (
    <div style={{ padding:"28px 32px" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:0 }}>Subjects</h1>
        <Btn color="#60a5fa" onClick={() => setModal(true)}>+ Add Subject</Btn>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:60 }}><Spinner /></div> :
       subs.length === 0 ? (
        <Card style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:44, marginBottom:14 }}>📚</div>
          <div style={{ color:"var(--muted)", fontSize:14, marginBottom:14 }}>No subjects yet</div>
          <Btn color="#60a5fa" onClick={() => setModal(true)}>Add First Subject</Btn>
        </Card>
       ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
          {subs.map((s, i) => {
            const pct = s.totalTopics > 0 ? Math.round((s.doneTopics / s.totalTopics) * 100) : 0;
            const c = s.color || SC[i % SC.length];
            return (
              <Card key={s._id} className="fade-up" style={{ borderLeft:`3px solid ${c}`, animationDelay:`${i*.06}s` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:24 }}>{s.icon || "📚"}</span>
                    <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{s.name}</div>
                  </div>
                  <button onClick={() => del(s._id)} style={{ background:"none", border:"none", color:"var(--dim)", cursor:"pointer", fontSize:14, transition:"color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--dim)"}
                  ><X /></button>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                  <span style={{ fontSize:12, color:"var(--muted)" }}>{s.doneTopics} / {s.totalTopics} topics</span>
                  <span style={{ fontSize:12, color:c, fontWeight:700 }}>{pct}%</span>
                </div>
                <ProgressBar value={pct} max={100} color={c} glow />
                <button onClick={() => inc(s)} disabled={s.doneTopics >= s.totalTopics} style={{ marginTop:12, width:"100%", background:c+"14", border:`1px solid ${c}33`, borderRadius:9, padding:"8px", color:c, fontSize:12, cursor:"pointer", fontWeight:600, opacity:s.doneTopics>=s.totalTopics?0.5:1, transition:"all .15s" }}>
                  {s.doneTopics >= s.totalTopics ? "✓ All Done" : "+ Mark Topic Done"}
                </button>
              </Card>
            );
          })}
        </div>
       )}

      {modal && (
        <Modal title="Add Subject" onClose={() => setModal(false)}>
          <Input label="Subject Name" placeholder="e.g. Data Structures" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Icon</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {ICONS_LIST.map(ic => (
                <button key={ic} onClick={() => setForm({...form, icon:ic})} style={{ fontSize:22, width:40, height:40, borderRadius:9, cursor:"pointer", background:form.icon===ic?"var(--ac-dim)":"var(--bg2)", border:`2px solid ${form.icon===ic?"var(--ac)":"var(--border)"}`, transition:"all .15s" }}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Total Topics</div>
            <input type="number" min={0} value={form.totalTopics} onChange={e => setForm({...form, totalTopics:+e.target.value})} style={{ width:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", color:"var(--text)", fontSize:13, outline:"none" }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8, fontWeight:500 }}>Color</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {SC.map(c => (
                <div key={c} onClick={() => setForm({...form, color:c})} style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${form.color===c?"#fff":"transparent"}`, transition:"all .15s", boxShadow:form.color===c?`0 0 8px ${c}`:""}} />
              ))}
            </div>
          </div>
          <Btn full color={form.color} onClick={add}>Add Subject</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────────────────────────────────────
export function TimetablePage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoad]    = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ day:"Mon", subject:"", startTime:"09:00", endTime:"10:00", room:"", color:"#60a5fa" });

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const todayShort = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const load = async () => {
    setLoad(true);
    try { setEntries(await api.getTimetable()); } catch(e) { console.error(e); }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.subject) return;
    try { await api.addEntry(form); sfx.success(); setModal(false); load(); }
    catch(e) { sfx.error(); setToast({ msg:e.message, color:"#f87171" }); }
  };
  const del = async (id) => { await api.deleteEntry(id); sfx.click(); load(); };

  return (
    <div style={{ padding:"28px 32px" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:0 }}>Timetable</h1>
        <Btn color="#60a5fa" onClick={() => setModal(true)}>+ Add Class</Btn>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:60 }}><Spinner /></div> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
          {DAYS.map(day => {
            const dayEntries = entries.filter(e => e.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
            const isToday = day === todayShort;
            return (
              <div key={day}>
                <div style={{ textAlign:"center", padding:"8px 4px", borderRadius:10, background:isToday?"var(--ac-dim)":"var(--card)", border:`1px solid ${isToday?"var(--ac)44":"var(--border)"}`, fontSize:13, fontWeight:isToday?700:500, color:isToday?"var(--ac)":"var(--muted)", marginBottom:8 }}>
                  {day}{isToday ? " ✦" : ""}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {dayEntries.map(e => (
                    <div key={e._id} style={{ background:"var(--card)", border:`1px solid ${e.color||"#60a5fa"}33`, borderLeft:`3px solid ${e.color||"#60a5fa"}`, borderRadius:9, padding:"9px 8px", position:"relative" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.subject}</div>
                      <div style={{ fontSize:10, color:"var(--muted)" }}>{e.startTime}–{e.endTime}</div>
                      {e.room && <div style={{ fontSize:10, color:"var(--dim)", marginTop:1 }}>{e.room}</div>}
                      <button onClick={() => del(e._id)} style={{ position:"absolute", top:4, right:4, background:"none", border:"none", color:"var(--dim)", cursor:"pointer", fontSize:13, transition:"color .15s" }}
                        onMouseEnter={ev => ev.currentTarget.style.color = "#f87171"}
                        onMouseLeave={ev => ev.currentTarget.style.color = "var(--dim)"}
                      ><X /></button>
                    </div>
                  ))}
                  {dayEntries.length === 0 && (
                    <div style={{ fontSize:11, color:"var(--dim)", textAlign:"center", padding:"10px 4px" }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Add Class" onClose={() => setModal(false)}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:7, fontWeight:500 }}>Day</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => setForm({...form, day:d})} style={{ background:form.day===d?"var(--ac-dim)":"var(--bg2)", border:`1px solid ${form.day===d?"var(--ac)66":"var(--border)"}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", color:form.day===d?"var(--ac)":"var(--muted)", fontSize:12, fontWeight:form.day===d?600:400 }}>{d}</button>
              ))}
            </div>
          </div>
          <Input label="Subject" placeholder="e.g. Data Structures" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Start Time</div>
              <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime:e.target.value})} style={{ width:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:9, padding:"10px 12px", color:"var(--text)", fontSize:13, outline:"none", colorScheme:"dark" }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>End Time</div>
              <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime:e.target.value})} style={{ width:"100%", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:9, padding:"10px 12px", color:"var(--text)", fontSize:13, outline:"none", colorScheme:"dark" }} />
            </div>
          </div>
          <Input label="Room (optional)" placeholder="e.g. LT-3" value={form.room} onChange={e => setForm({...form, room:e.target.value})} />
          <Btn full color="#60a5fa" onClick={add}>Add Class</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAMIFICATION
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_BOARD = [
  { name:"Rahul Sharma", xp:420 },
  { name:"Priya Singh",  xp:380 },
  { name:"Arjun Mehta",  xp:290 },
];
const RANK = ["🥇","🥈","🥉","4️⃣","5️⃣"];

export function GamificationPage() {
  const { stats }  = useStats();
  const { user }   = useAuth();

  const lv = getLevel(stats.xp || 0);
  const lo = XP_THRESHOLDS[lv] || 0;
  const hi = XP_THRESHOLDS[lv + 1] || lo + 500;

  const board = [
    { name: user?.name || "You", xp: stats.xp || 0, you:true },
    ...MOCK_BOARD,
  ].sort((a,b) => b.xp - a.xp);

  return (
    <div style={{ padding:"28px 32px" }}>
      <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:"0 0 22px" }}>Achievements</h1>

      {/* Level hero */}
      <div className="fade-up" style={{ background:"linear-gradient(135deg,rgba(167,139,250,.1),rgba(96,165,250,.1))", border:"1px solid rgba(167,139,250,.2)", borderRadius:20, padding:28, marginBottom:22, display:"flex", gap:22, alignItems:"center" }}>
        <div style={{ fontSize:52 }}>{LEVEL_ICONS[lv]}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:4 }}>Level {lv+1} — {LEVEL_NAMES[lv]}</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginBottom:12 }}>{stats.xp||0} XP · {hi-(stats.xp||0)} XP to next level</div>
          <ProgressBar value={(stats.xp||0)-lo} max={hi-lo} color="#a78bfa" glow />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[
          { l:"Total XP",  v:stats.xp||0,                              i:"⚡", c:"#fbbf24" },
          { l:"Streak",    v:`${stats.streak||0}d`,                    i:"🔥", c:"#f97316" },
          { l:"Pomodoros", v:stats.pomodoros||0,                       i:"🍅", c:"#f87171" },
          { l:"Hours",     v:`${Math.floor((stats.totalMins||0)/60)}h`,i:"⏱️", c:"#4ade80" },
        ].map((s,i) => (
          <div key={i} className="fade-up" style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:14, padding:"18px", textAlign:"center", borderTop:`2px solid ${s.c}`, animationDelay:`${i*.08}s` }}>
            <div style={{ fontSize:26, marginBottom:6 }}>{s.i}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Badges</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {BADGES.map(b => {
            const earned = b.check(stats);
            return (
              <div key={b.id} style={{ border:`1px solid ${earned?b.color+"55":"var(--border)"}`, borderRadius:12, padding:"14px 10px", display:"flex", gap:9, alignItems:"center", background:earned?b.color+"0e":"var(--bg2)", opacity:earned?1:.35, transition:"all .3s" }}>
                <span style={{ fontSize:24 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:earned?"var(--text)":"var(--muted)" }}>{b.label}</div>
                  <div style={{ fontSize:10, color:earned?b.color:"var(--dim)", marginTop:1 }}>{earned?"✓ Earned":"Locked"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:24 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Leaderboard</div>
        {board.map((u, i) => (
          <div key={u.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, marginBottom:6, background:u.you?"var(--ac-dim)":"transparent", border:`1px solid ${u.you?"var(--ac)30":"transparent"}`, transition:"background .15s" }}>
            <span style={{ fontSize:18, width:26, textAlign:"center" }}>{RANK[i] || `${i+1}.`}</span>
            <div style={{ width:32, height:32, borderRadius:"50%", background:u.you?"var(--ac)33":"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:u.you?"var(--ac)":"var(--muted)" }}>
              {u.name[0]}
            </div>
            <span style={{ flex:1, fontSize:13, color:u.you?"var(--ac)":"var(--text)", fontWeight:u.you?700:400 }}>
              {u.name}{u.you ? " (You)" : ""}
            </span>
            <span style={{ fontSize:13, color:"#fbbf24", fontWeight:700 }}>{u.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
