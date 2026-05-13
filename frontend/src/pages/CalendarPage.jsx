import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import { Card, Modal, Input, Btn, Badge, Toast } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ── Relative time helper ── */
function relTime(date) {
  const diff = new Date(date) - Date.now();
  const mins = Math.round(diff / 60000);
  const hrs  = Math.round(diff / 3600000);
  const days = Math.round(diff / 86400000);
  if (mins < 0) return "Past";
  if (mins < 60) return `in ${mins}m`;
  if (hrs < 24) return `in ${hrs}h`;
  if (days === 1) return "Tomorrow";
  return `in ${days}d`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [deadlines,  setDeadlines]  = useState([]);
  const [timetable,  setTimetable]  = useState([]);
  const [reminders,  setReminders]  = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [modal,      setModal]      = useState(false);
  const [toast,      setToast]      = useState(null);
  const [form,       setForm]       = useState({ title:"", body:"", fireAt:"", repeat:"none" });

  useEffect(() => {
    api.getDeadlines().then(setDeadlines).catch(()=>{});
    api.getTimetable().then(setTimetable).catch(()=>{});
    api.getReminders().then(setReminders).catch(()=>{});
  },[]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const events = [];
    deadlines.forEach(d => {
      const ds = new Date(d.dueDate).toISOString().split("T")[0];
      if (ds===dateStr && !d.done) events.push({ type:"deadline", title:d.title, color:"var(--clr-danger, #f87171)", icon:"notifications", date:d.dueDate });
    });
    const dayName = DAYS_OF_WEEK[new Date(year,month,day).getDay()];
    const shortDay = dayName.slice(0,3);
    timetable.filter(e=>e.day===shortDay).forEach(e => events.push({ type:"class", title:`${e.subject} ${e.startTime}`, color:"var(--ac)", icon:"event" }));
    reminders.forEach(r => {
      const rs = new Date(r.fireAt).toISOString().split("T")[0];
      if (rs===dateStr && !r.done) events.push({ type:"reminder", title:r.title, color:"var(--clr-purple, #8b5cf6)", icon:"alarm", date:r.fireAt });
    });
    return events;
  };

  /* Upcoming events across all days */
  const upcoming = useMemo(() => {
    const all = [];
    deadlines.filter(d => !d.done && new Date(d.dueDate) >= Date.now()).forEach(d => {
      all.push({ type:"deadline", title:d.title, color:"var(--clr-danger, #f87171)", icon:"notifications", date:d.dueDate });
    });
    reminders.filter(r => !r.done && new Date(r.fireAt) >= Date.now()).forEach(r => {
      all.push({ type:"reminder", title:r.title, color:"var(--clr-purple, #8b5cf6)", icon:"alarm", date:r.fireAt });
    });
    return all.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  }, [deadlines, reminders]);

  const addReminder = async () => {
    if (!form.title || !form.fireAt) return;
    try {
      await api.addReminder(form);
      sfx.success();
      setToast({ msg:"Reminder set!", color:"var(--ac)" });
      setModal(false);
      setForm({ title:"", body:"", fireAt:"", repeat:"none" });
      api.getReminders().then(setReminders).catch(()=>{});
    } catch(e) { sfx.error(); setToast({ msg:e.message, color:"var(--clr-danger, #f87171)" }); }
  };

  const deleteReminder = async (id) => {
    await api.deleteReminder(id);
    sfx.click();
    api.getReminders().then(setReminders).catch(()=>{});
  };

  const selectedEvents = selected ? getEventsForDay(selected) : [];

  return (
    <div className="page-container">
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}

      <motion.div className="flex justify-between items-center mb-8" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
        <div>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[var(--ac)] text-3xl filled">calendar_month</span>
            Calendar
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>View deadlines, classes, and reminders</p>
        </div>
        <Btn color="var(--ac)" onClick={()=>setModal(true)}>
          <span className="material-symbols-outlined text-base">add</span> Add Reminder
        </Btn>
      </motion.div>

      {/* Month nav */}
      <motion.div className="flex items-center gap-4 mb-6" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}}>
        <button onClick={()=>{ sfx.click(); if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center transition-all duration-200 hover:brightness-125"
          style={{ background: 'var(--card)', color: 'var(--text)' }}>
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <div className="text-lg font-bold min-w-[180px] text-center" style={{ color: 'var(--text)' }}>{MONTHS[month]} {year}</div>
        <button onClick={()=>{ sfx.click(); if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center transition-all duration-200 hover:brightness-125"
          style={{ background: 'var(--card)', color: 'var(--text)' }}>
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
        <button onClick={()=>{ sfx.click(); setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:brightness-125"
          style={{ background: 'color-mix(in srgb, var(--ac) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 25%, transparent)', color: 'var(--ac)' }}>
          Today
        </button>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
        {/* Calendar grid */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
            {DAYS_OF_WEEK.map(d=>(
              <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{d}</div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7" style={{minWidth:300}}>
              {cells.map((day,i) => {
                const events = getEventsForDay(day);
                const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                const isSel   = day===selected;
                return (
                  <div key={i} onClick={()=>{ if(day){sfx.click();setSelected(day===selected?null:day);} }}
                    className="min-h-[85px] p-2 transition-colors duration-200 relative group"
                    style={{
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      cursor: day ? 'pointer' : 'default',
                      background: isSel ? 'color-mix(in srgb, var(--ac) 8%, transparent)' : isToday ? 'color-mix(in srgb, var(--ac) 4%, transparent)' : 'transparent'
                    }}>
                    {day && (
                      <>
                        <div className="text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1 transition-all"
                          style={{
                            background: isToday ? 'color-mix(in srgb, var(--ac) 20%, transparent)' : 'transparent',
                            color: isToday ? 'var(--ac)' : isSel ? 'var(--ac)' : 'var(--text)',
                            fontWeight: isToday || isSel ? 'bold' : 'normal'
                          }}>
                          {day}
                        </div>
                        <div className="flex flex-col gap-1">
                          {events.slice(0,2).map((ev,ei)=>(
                            <div key={ei} className="text-[10px] truncate rounded px-1.5 py-[2px] flex items-center gap-1 font-medium"
                              style={{color:ev.color,background:`color-mix(in srgb, ${ev.color} 12%, transparent)`}}>
                              <span className="material-symbols-outlined" style={{fontSize:10}}>{ev.icon}</span>
                              <span className="truncate">{ev.title}</span>
                            </div>
                          ))}
                          {events.length>2 && <div className="text-[9px]" style={{ color: 'var(--dim)' }}>+{events.length-2} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {/* Selected day events */}
            {selected ? (
              <motion.div key="selected" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}}>
                <Card>
                  <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: 'var(--ac)' }}>event</span>
                    {MONTHS[month]} {selected}, {year}
                  </div>
                  {selectedEvents.length===0
                    ? <div className="text-xs py-3" style={{ color: 'var(--dim)' }}>Nothing scheduled</div>
                    : selectedEvents.map((ev,i)=>(
                      <div key={i} className="p-3 rounded-xl mb-2"
                        style={{background:`color-mix(in srgb, ${ev.color} 5%, transparent)`,borderLeft:`3px solid ${ev.color}`}}>
                        <div className="text-sm font-semibold flex items-center gap-1.5" style={{color:ev.color}}>
                          <span className="material-symbols-outlined text-sm">{ev.icon}</span>{ev.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] capitalize" style={{ color: 'var(--muted)' }}>{ev.type}</span>
                          {ev.date && <span className="text-[10px] font-semibold" style={{color:ev.color}}>{relTime(ev.date)}</span>}
                        </div>
                      </div>
                    ))
                  }
                </Card>
              </motion.div>
            ) : (
              <motion.div key="unselected" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="text-center py-5">
                  <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: 'var(--dim)' }}>touch_app</span>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Click a day to see events</div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming section */}
          {upcoming.length > 0 && (
            <Card>
              <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <span className="material-symbols-outlined text-lg" style={{ color: 'var(--clr-streak, #f97316)' }}>upcoming</span>
                Upcoming
              </div>
              {upcoming.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 py-2 last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{background:`color-mix(in srgb, ${ev.color} 10%, transparent)`}}>
                    <span className="material-symbols-outlined text-sm" style={{color:ev.color}}>{ev.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{ev.title}</div>
                    <div className="text-[10px] capitalize" style={{ color: 'var(--muted)' }}>{ev.type}</div>
                  </div>
                  <span className="text-[10px] font-bold flex-shrink-0" style={{color:ev.color}}>
                    {relTime(ev.date)}
                  </span>
                </div>
              ))}
            </Card>
          )}

          {/* Reminders */}
          <Card>
            <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span className="material-symbols-outlined text-lg" style={{ color: 'var(--clr-purple, #8b5cf6)' }}>alarm</span>
              Reminders
            </div>
            {reminders.length===0
              ? <div className="text-xs" style={{ color: 'var(--dim)' }}>No reminders set</div>
              : reminders.slice(0,5).map(r=>(
                <div key={r._id} className="flex justify-between items-start py-2.5 last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--clr-purple, #8b5cf6)' }}/>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{r.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        {new Date(r.fireAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>deleteReminder(r._id)}
                    className="p-1 transition-colors hover:brightness-150" style={{ color: 'var(--dim)' }}>
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))
            }
            <button onClick={()=>setModal(true)}
              className="mt-3 w-full rounded-xl py-2 text-xs font-semibold transition-all duration-200"
              style={{ background: 'color-mix(in srgb, var(--ac) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 20%, transparent)', color: 'var(--ac)' }}>
              + Add Reminder
            </button>
          </Card>

          {/* Legend */}
          <Card>
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Legend</div>
            {[{color:"var(--clr-danger, #f87171)",label:"Deadline",icon:"notifications"},{color:"var(--ac)",label:"Class",icon:"event"},{color:"var(--clr-purple, #8b5cf6)",label:"Reminder",icon:"alarm"}].map(l=>(
              <div key={l.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:l.color}}/>
                <span className="material-symbols-outlined text-xs" style={{color:l.color}}>{l.icon}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{l.label}</span>
              </div>
            ))}
          </Card>
        </div>
      </motion.div>

      {modal && (
        <Modal title="Add Reminder" onClose={()=>setModal(false)}>
          <Input label="Title" placeholder="e.g. Study for exam" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <Input label="Note (optional)" placeholder="Any details" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/>
          <div className="mb-4">
            <div className="text-xs font-semibold mb-1.5 ml-1" style={{ color: 'var(--muted)' }}>Date & Time</div>
            <input type="datetime-local" value={form.fireAt} onChange={e=>setForm({...form,fireAt:e.target.value})}
              className="input-field" style={{colorScheme:"dark"}}/>
          </div>
          <div className="mb-5">
            <div className="text-xs font-semibold mb-2 ml-1" style={{ color: 'var(--muted)' }}>Repeat</div>
            <div className="flex gap-2">
              {["none","daily","weekly"].map(r=>(
                <button key={r} onClick={()=>setForm({...form,repeat:r})}
                  className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200"
                  style={{
                    border:`1px solid ${form.repeat===r?"var(--ac)":"var(--border)"}`,
                    background:form.repeat===r?"color-mix(in srgb, var(--ac) 15%, transparent)":"transparent",
                    color:form.repeat===r?"var(--ac)":"var(--muted)"
                  }}>{r}</button>
              ))}
            </div>
          </div>
          <Btn full color="var(--ac)" onClick={addReminder}>Set Reminder</Btn>
        </Modal>
      )}
    </div>
  );
}
