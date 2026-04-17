import { useState, useEffect } from "react";
import { api } from "../api";
import { Card, Modal, Input, Btn, Badge, Toast, Spinner, Tabs, ProgressBar } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { useAuth } from "../context/AuthContext";
import { useStats, BADGES, getLevel, LEVEL_NAMES, LEVEL_ICONS, XP_THRESHOLDS } from "../context/StatsContext";
import XPBar from "../components/XPBar";

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
      setToast({ msg:"Deadline added!", color:"#4be277" });
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
    return diff < 0 ? "#ef4444" : diff <= 1 ? "#f87171" : diff <= 3 ? "#fbbf24" : "#4be277";
  };

  const pending = items.filter(x => !x.done);
  const done    = items.filter(x =>  x.done);

  return (
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="section-title">Deadlines</h1>
          <p className="text-xs text-muted mt-1">Track your upcoming tasks and submissions</p>
        </div>
        <Btn color="#fbbf24" onClick={() => setModal(true)}>
          <span className="material-symbols-outlined text-base">add</span> Add Deadline
        </Btn>
      </div>

      {loading ? (
        <div className="text-center py-20"><Spinner /></div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-dim mb-4 block">event_available</span>
          <div className="text-muted text-sm mb-4">No deadlines! Add one to stay on track.</div>
          <Btn color="#fbbf24" onClick={() => setModal(true)}>
            <span className="material-symbols-outlined text-base">add</span> Add Deadline
          </Btn>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <div className="label-text mb-3 ml-1">Pending ({pending.length})</div>
              <div className="space-y-2">
                {pending.map(it => (
                  <div key={it._id} className="fade-up glass-card flex items-center gap-4 p-4
                    hover:bg-card-2 transition-all duration-200"
                    style={{ borderLeft:`3px solid ${urgencyColor(it.dueDate)}` }}>
                    <div onClick={() => toggle(it)}
                      className="w-5 h-5 rounded-full border-2 cursor-pointer flex-shrink-0
                        hover:scale-110 transition-transform"
                      style={{borderColor:urgencyColor(it.dueDate)}}/>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-on-surface">{it.title}</div>
                      {it.subject && <div className="text-xs text-muted mt-0.5">{it.subject}</div>}
                    </div>
                    <Badge color={urgencyColor(it.dueDate)}>{daysLeft(it.dueDate)}</Badge>
                    <div className="text-[11px] text-dim min-w-[80px] text-right">
                      {new Date(it.dueDate).toLocaleDateString("en-IN")}
                    </div>
                    <button onClick={() => del(it._id)}
                      className="text-dim hover:text-danger transition-colors p-1">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <div className="label-text mb-3 ml-1 text-dim">Completed ({done.length})</div>
              <div className="space-y-2">
                {done.map(it => (
                  <div key={it._id} className="flex items-center gap-4 p-3 bg-bg-2 rounded-xl opacity-50">
                    <div onClick={() => toggle(it)}
                      className="w-5 h-5 rounded-full bg-primary cursor-pointer flex-shrink-0
                        flex items-center justify-center text-[11px]">✓</div>
                    <span className="flex-1 text-sm text-muted line-through">{it.title}</span>
                    <button onClick={() => del(it._id)}
                      className="text-dim hover:text-danger transition-colors p-1">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title="Add Deadline" onClose={() => setModal(false)}>
          <Input label="Title" placeholder="e.g. Submit Maths Assignment" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
          <Input label="Subject (optional)" placeholder="e.g. Calculus" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} />
          <div className="mb-4">
            <div className="label-text mb-2 ml-1">Priority</div>
            <div className="flex gap-2">
              {["low","medium","high"].map(p => {
                const c = {low:"#4be277",medium:"#fbbf24",high:"#f87171"}[p];
                return <button key={p} onClick={() => setForm({...form, priority:p})}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200"
                  style={{
                    border:`1px solid ${form.priority===p?c+"66":"rgba(255,255,255,.05)"}`,
                    background:form.priority===p?c+"15":"transparent",
                    color:form.priority===p?c:"#6b7280"
                  }}>{p}</button>;
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
      setToast({ msg:"Note created!", color:"#4be277" });
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
      setToast({ msg:"Saved!", color:"#4be277" });
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

  const exportPDF = async (id) => {
    try {
      await api.exportNote(id);
    } catch(e) {
      setToast({ msg:"PDF export failed: " + e.message, color:"#f87171" });
    }
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.subject||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <style>{`
        @media (min-width: 769px) {
          .notes-layout { flex-direction: row !important; }
          .notes-list {
            width: 300px !important;
            border-right: 1px solid rgba(255,255,255,.05) !important;
            border-bottom: none !important;
            height: 100% !important;
            max-height: none !important;
          }
        }
      `}</style>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

      <div className="notes-layout flex flex-1 overflow-hidden flex-col">
        {/* Note list */}
        <div className="notes-list border-b border-white/5 flex flex-col flex-shrink-0 bg-bg max-h-[40vh]">
          <div className="p-4 pb-3 border-b border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-base text-on-surface">Notes</span>
              <button onClick={() => setModal(true)}
                className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5
                  text-primary text-xs font-semibold hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-sm align-middle mr-1">add</span>New
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                text-dim text-base">search</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="input-field pl-10 py-2.5 text-xs"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {loading ? <div className="text-center py-6"><Spinner /></div> :
             filtered.length === 0 ? <div className="text-dim text-xs text-center py-6">No notes found</div> :
             filtered.map(n => (
              <div key={n._id} onClick={() => { setActive(n); setEditing(false); sfx.click(); }}
                className={`p-3 rounded-xl cursor-pointer mb-1 transition-all duration-200
                  ${active?._id===n._id
                    ? "bg-primary/10 border border-primary/20"
                    : "border border-transparent hover:bg-white/5"}`}>
                <div className="text-sm font-semibold text-on-surface truncate mb-1">
                  {n.pinned ? "📌 " : ""}{n.title}
                </div>
                <div className="text-[11px] text-muted truncate mb-1.5">
                  {n.content?.slice(0,50) || "Empty note"}
                </div>
                <div className="flex justify-between items-center">
                  {n.subject && <Badge color="#60a5fa">{n.subject}</Badge>}
                  <span className="text-[10px] text-dim">{new Date(n.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-dim">
              <span className="material-symbols-outlined text-5xl">edit_note</span>
              <div className="text-sm">Select a note or create a new one</div>
              <button onClick={() => setModal(true)}
                className="bg-primary/10 border border-primary/20 rounded-xl px-6 py-3
                  text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-base align-middle mr-1">add</span>Create Note
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex justify-between items-start mb-4 flex-shrink-0">
                <div className="flex-1">
                  {editing ? (
                    <input value={active.title} onChange={e => setActive({...active, title:e.target.value})}
                      className="text-xl font-bold bg-transparent text-on-surface outline-none w-full"/>
                  ) : (
                    <div className="text-xl font-bold text-on-surface">{active.title}</div>
                  )}
                  <div className="text-[11px] text-dim mt-1">
                    Updated {new Date(active.updatedAt || Date.now()).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  {editing ? (
                    <>
                      <Btn color="#4be277" size="sm" onClick={save}>Save</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
                    </>
                  ) : (
                    <Btn color="#60a5fa" size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Btn>
                  )}
                  <Btn color="#4be277" size="sm" variant="outline" onClick={() => exportPDF(active._id)}>PDF</Btn>
                  <Btn color="#f87171" size="sm" variant="outline" onClick={() => del(active._id)}>Delete</Btn>
                </div>
              </div>

              {editing && (
                <input value={active.subject || ""} onChange={e => setActive({...active, subject:e.target.value})}
                  placeholder="Subject (optional)"
                  className="input-field mb-3 py-2 text-xs flex-shrink-0"/>
              )}

              <div className="flex-1 overflow-hidden">
                {editing ? (
                  <textarea value={active.content || ""} onChange={e => setActive({...active, content:e.target.value})}
                    placeholder="Start writing your notes here..."
                    className="input-field h-full resize-none leading-7 text-sm"/>
                ) : (
                  <div className="h-full overflow-y-auto text-sm text-on-surface leading-7
                    p-4 bg-bg-2 rounded-2xl border border-white/5 whitespace-pre-wrap">
                    {active.content || <span className="text-dim">Empty — click Edit to add content</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal title="New Note" onClose={() => setModal(false)}>
          <Input label="Title" placeholder="e.g. Binary Search Trees" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
          <Input label="Subject (optional)" placeholder="e.g. Data Structures" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
          <div className="mb-4">
            <div className="text-xs text-muted mb-1.5 font-medium ml-1">Content</div>
            <textarea value={form.content} onChange={e => setForm({...form, content:e.target.value})} rows={5}
              className="input-field resize-none"/>
          </div>
          <Btn full color="#4be277" onClick={add}>Create Note</Btn>
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
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <div className="mb-6">
        <h1 className="section-title">Checklist</h1>
        <p className="text-xs text-muted mt-1">Track your daily tasks</p>
      </div>

      <Card className="mb-5">
        <div className="flex gap-3">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==="Enter" && add()}
            placeholder="Add a task... (press Enter)"
            className="input-field flex-1"/>
          <input value={sub} onChange={e => setSub(e.target.value)} placeholder="Subject"
            className="input-field w-[120px]"/>
          <Btn color="#4be277" onClick={add}>
            <span className="material-symbols-outlined text-base">add</span> Add
          </Btn>
        </div>
      </Card>

      {loading ? <div className="text-center py-20"><Spinner /></div> : (
        <>
          {items.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between mb-2 px-1">
                <span className="text-xs text-muted">{done.length} / {items.length} completed</span>
                <span className="text-xs text-primary font-bold">{Math.round((done.length / items.length) * 100)}%</span>
              </div>
              <ProgressBar value={done.length} max={items.length} color="#4be277" glow />
            </div>
          )}

          <div className="space-y-2 mb-5">
            {pending.map(it => (
              <div key={it._id} className="fade-up glass-card flex items-center gap-3 p-4
                hover:bg-card-2 transition-all duration-200">
                <div onClick={() => toggle(it)}
                  className="w-5 h-5 rounded-md border-2 border-primary cursor-pointer flex-shrink-0
                    hover:bg-primary/20 transition-all"/>
                <span className="flex-1 text-sm text-on-surface">{it.text}</span>
                {it.subject && <Badge color="#60a5fa">{it.subject}</Badge>}
                <button onClick={() => del(it._id)}
                  className="text-dim hover:text-danger transition-colors p-1">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <div>
              <div className="label-text mb-3 ml-1 text-dim">Done ({done.length})</div>
              <div className="space-y-2">
                {done.map(it => (
                  <div key={it._id} className="flex items-center gap-3 p-3 bg-bg-2 rounded-xl opacity-50">
                    <div onClick={() => toggle(it)}
                      className="w-5 h-5 rounded-md bg-primary cursor-pointer flex-shrink-0
                        flex items-center justify-center text-[11px]">✓</div>
                    <span className="flex-1 text-sm text-muted line-through">{it.text}</span>
                    <button onClick={() => del(it._id)}
                      className="text-dim hover:text-danger transition-colors">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ))}
              </div>
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
const SC = ["#60a5fa","#4be277","#fbbf24","#a78bfa","#f87171","#f472b6","#34d399","#fb923c"];
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
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="section-title">Subjects</h1>
          <p className="text-xs text-muted mt-1">Track your syllabus coverage</p>
        </div>
        <Btn color="#60a5fa" onClick={() => setModal(true)}>
          <span className="material-symbols-outlined text-base">add</span> Add Subject
        </Btn>
      </div>

      {loading ? <div className="text-center py-20"><Spinner /></div> :
       subs.length === 0 ? (
        <Card className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-dim mb-4 block">library_books</span>
          <div className="text-muted text-sm mb-4">No subjects yet</div>
          <Btn color="#60a5fa" onClick={() => setModal(true)}>Add First Subject</Btn>
        </Card>
       ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((s, i) => {
            const pct = s.totalTopics > 0 ? Math.round((s.doneTopics / s.totalTopics) * 100) : 0;
            const c = s.color || SC[i % SC.length];
            return (
              <Card key={s._id} className="fade-up" style={{borderLeft:`3px solid ${c}`,animationDelay:`${i*.06}s`}}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{s.icon || "📚"}</span>
                    <div className="text-base font-bold text-on-surface">{s.name}</div>
                  </div>
                  <button onClick={() => del(s._id)}
                    className="text-dim hover:text-danger transition-colors p-1">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-muted">{s.doneTopics} / {s.totalTopics} topics</span>
                  <span className="text-xs font-bold" style={{color:c}}>{pct}%</span>
                </div>
                <ProgressBar value={pct} max={100} color={c} glow />
                <button onClick={() => inc(s)} disabled={s.doneTopics >= s.totalTopics}
                  className="mt-3 w-full rounded-xl py-2 text-xs font-semibold transition-all duration-200"
                  style={{
                    background:c+"14", border:`1px solid ${c}33`, color:c,
                    opacity:s.doneTopics>=s.totalTopics?.5:1
                  }}>
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
          <div className="mb-3">
            <div className="text-xs text-muted mb-2 font-medium ml-1">Icon</div>
            <div className="flex gap-2 flex-wrap">
              {ICONS_LIST.map(ic => (
                <button key={ic} onClick={() => setForm({...form, icon:ic})}
                  className="text-xl w-10 h-10 rounded-xl transition-all duration-200"
                  style={{
                    background:form.icon===ic?"rgba(75,226,119,.15)":"rgba(17,24,39,.5)",
                    border:`2px solid ${form.icon===ic?"#4be277":"rgba(255,255,255,.05)"}`
                  }}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-muted mb-1.5 font-medium ml-1">Total Topics</div>
            <input type="number" min={0} value={form.totalTopics}
              onChange={e => setForm({...form, totalTopics:+e.target.value})}
              className="input-field"/>
          </div>
          <div className="mb-4">
            <div className="text-xs text-muted mb-2 font-medium ml-1">Color</div>
            <div className="flex gap-2 flex-wrap">
              {SC.map(c => (
                <div key={c} onClick={() => setForm({...form, color:c})}
                  className="w-7 h-7 rounded-full cursor-pointer transition-all duration-200"
                  style={{
                    background:c,
                    border:`3px solid ${form.color===c?"#fff":"transparent"}`,
                    boxShadow:form.color===c?`0 0 8px ${c}`:""
                  }}/>
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
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="section-title">Timetable</h1>
          <p className="text-xs text-muted mt-1">Your weekly class schedule</p>
        </div>
        <Btn color="#60a5fa" onClick={() => setModal(true)}>
          <span className="material-symbols-outlined text-base">add</span> Add Class
        </Btn>
      </div>

      {loading ? <div className="text-center py-20"><Spinner /></div> : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-3" style={{minWidth:600}}>
            {DAYS.map(day => {
              const dayEntries = entries.filter(e => e.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
              const isToday = day === todayShort;
              return (
                <div key={day}>
                  <div className={`text-center py-2 rounded-xl mb-2 text-sm font-medium transition-all
                    ${isToday
                      ? "bg-primary/10 border border-primary/20 text-primary font-bold"
                      : "bg-surface-low border border-white/5 text-muted"}`}>
                    {day}{isToday ? " ✦" : ""}
                  </div>
                  <div className="space-y-2">
                    {dayEntries.map(e => (
                      <div key={e._id} className="glass-card p-3 relative"
                        style={{borderLeft:`3px solid ${e.color||"#60a5fa"}`}}>
                        <div className="text-xs font-semibold text-on-surface truncate mb-0.5">{e.subject}</div>
                        <div className="text-[10px] text-muted">{e.startTime}–{e.endTime}</div>
                        {e.room && <div className="text-[10px] text-dim mt-0.5">{e.room}</div>}
                        <button onClick={() => del(e._id)}
                          className="absolute top-1 right-1 text-dim hover:text-danger
                            transition-colors p-0.5">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    {dayEntries.length === 0 && (
                      <div className="text-[11px] text-dim text-center py-3">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal && (
        <Modal title="Add Class" onClose={() => setModal(false)}>
          <div className="mb-4">
            <div className="text-xs text-muted mb-2 font-medium ml-1">Day</div>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button key={d} onClick={() => setForm({...form, day:d})}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{
                    background:form.day===d?"rgba(75,226,119,.15)":"transparent",
                    border:`1px solid ${form.day===d?"rgba(75,226,119,.4)":"rgba(255,255,255,.05)"}`,
                    color:form.day===d?"#4be277":"#6b7280"
                  }}>{d}</button>
              ))}
            </div>
          </div>
          <Input label="Subject" placeholder="e.g. Data Structures" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-muted mb-1.5 font-medium ml-1">Start Time</div>
              <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime:e.target.value})}
                className="input-field" style={{colorScheme:"dark"}}/>
            </div>
            <div>
              <div className="text-xs text-muted mb-1.5 font-medium ml-1">End Time</div>
              <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime:e.target.value})}
                className="input-field" style={{colorScheme:"dark"}}/>
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
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-title">Achievements</h1>
        <p className="text-xs text-muted mt-1">Track your progress and earn badges</p>
      </div>

      {/* Level hero */}
      <div className="fade-up bg-gradient-to-r from-purple/10 to-info/10
        border border-purple/20 rounded-2xl p-7 mb-6 flex gap-6 items-center">
        <div className="text-5xl">{LEVEL_ICONS[lv]}</div>
        <div className="flex-1">
          <div className="text-2xl font-extrabold text-on-surface mb-1">Level {lv+1} — {LEVEL_NAMES[lv]}</div>
          <div className="text-sm text-muted mb-3">{stats.xp||0} XP · {hi-(stats.xp||0)} XP to next level</div>
          <ProgressBar value={(stats.xp||0)-lo} max={hi-lo} color="#a78bfa" glow />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { l:"Total XP",  v:stats.xp||0,                              i:"bolt", c:"#fbbf24" },
          { l:"Streak",    v:`${stats.streak||0}d`,                    i:"local_fire_department", c:"#f97316" },
          { l:"Pomodoros", v:stats.pomodoros||0,                       i:"timer", c:"#f87171" },
          { l:"Hours",     v:`${Math.floor((stats.totalMins||0)/60)}h`,i:"schedule", c:"#4be277" },
        ].map((s,i) => (
          <div key={i} className="fade-up glass-card text-center p-5"
            style={{borderTop:`2px solid ${s.c}`,animationDelay:`${i*.08}s`}}>
            <span className="material-symbols-outlined text-3xl mb-2 block" style={{color:s.c}}>{s.i}</span>
            <div className="text-xl font-extrabold" style={{color:s.c}}>{s.v}</div>
            <div className="text-[11px] text-muted mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <Card className="mb-5">
        <div className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary filled">workspace_premium</span>Badges
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BADGES.map(b => {
            const earned = b.check(stats);
            return (
              <div key={b.id} className="p-3 rounded-xl flex gap-3 items-center transition-all duration-300"
                style={{
                  border:`1px solid ${earned?b.color+"55":"rgba(255,255,255,.05)"}`,
                  background:earned?b.color+"0e":"rgba(17,24,39,.5)",
                  opacity:earned?1:.35
                }}>
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="text-xs font-semibold" style={{color:earned?"#dae2fd":"#6b7280"}}>{b.label}</div>
                  <div className="text-[10px] mt-0.5" style={{color:earned?b.color:"#6b7280"}}>
                    {earned?"✓ Earned":"Locked"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <div className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-warning filled">leaderboard</span>Leaderboard
        </div>
        <div className="space-y-2">
          {board.map((u, i) => (
            <div key={u.name} className={`flex items-center gap-3 p-3 rounded-xl transition-all
              ${u.you ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5"}`}>
              <span className="text-lg w-7 text-center">{RANK[i] || `${i+1}.`}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{background:u.you?"rgba(75,226,119,.2)":"rgba(255,255,255,.08)",color:u.you?"#4be277":"#6b7280"}}>
                {u.name[0]}
              </div>
              <span className={`flex-1 text-sm ${u.you ? "text-primary font-bold" : "text-on-surface"}`}>
                {u.name}{u.you ? " (You)" : ""}
              </span>
              <span className="text-sm text-warning font-bold">{u.xp} XP</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
