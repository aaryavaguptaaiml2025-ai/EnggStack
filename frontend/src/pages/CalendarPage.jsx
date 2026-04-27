import { useState, useEffect, useMemo } from "react";
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
      if (ds===dateStr && !d.done) events.push({ type:"deadline", title:d.title, color:"#f87171", icon:"notifications", date:d.dueDate });
    });
    const dayName = DAYS_OF_WEEK[new Date(year,month,day).getDay()];
    const shortDay = dayName.slice(0,3);
    timetable.filter(e=>e.day===shortDay).forEach(e => events.push({ type:"class", title:`${e.subject} ${e.startTime}`, color:"#3b82f6", icon:"event" }));
    reminders.forEach(r => {
      const rs = new Date(r.fireAt).toISOString().split("T")[0];
      if (rs===dateStr && !r.done) events.push({ type:"reminder", title:r.title, color:"#8b5cf6", icon:"alarm", date:r.fireAt });
    });
    return events;
  };

  /* Upcoming events across all days */
  const upcoming = useMemo(() => {
    const all = [];
    deadlines.filter(d => !d.done && new Date(d.dueDate) >= Date.now()).forEach(d => {
      all.push({ type:"deadline", title:d.title, color:"#f87171", icon:"notifications", date:d.dueDate });
    });
    reminders.filter(r => !r.done && new Date(r.fireAt) >= Date.now()).forEach(r => {
      all.push({ type:"reminder", title:r.title, color:"#8b5cf6", icon:"alarm", date:r.fireAt });
    });
    return all.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  }, [deadlines, reminders]);

  const addReminder = async () => {
    if (!form.title || !form.fireAt) return;
    try {
      await api.addReminder(form);
      sfx.success();
      setToast({ msg:"Reminder set!", color:"#00C896" });
      setModal(false);
      setForm({ title:"", body:"", fireAt:"", repeat:"none" });
      api.getReminders().then(setReminders).catch(()=>{});
    } catch(e) { sfx.error(); setToast({ msg:e.message, color:"#f87171" }); }
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

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00C896] text-2xl">calendar_month</span>
            Calendar
          </h1>
          <p className="text-xs text-muted mt-1">View deadlines, classes, and reminders</p>
        </div>
        <Btn color="#00C896" onClick={()=>setModal(true)}>
          <span className="material-symbols-outlined text-base">add</span> Add Reminder
        </Btn>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={()=>{ sfx.click(); if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center
            text-on-surface hover:bg-white/[.08] transition-all duration-200">
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <div className="text-lg font-bold text-on-surface min-w-[180px] text-center">{MONTHS[month]} {year}</div>
        <button onClick={()=>{ sfx.click(); if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center
            text-on-surface hover:bg-white/[.08] transition-all duration-200">
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
        <button onClick={()=>{ sfx.click(); setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          className="bg-[#00C896]/10 border border-[#00C896]/25 rounded-xl px-3 py-1.5
            text-[#00C896] text-xs font-semibold hover:bg-[#00C896]/15 transition-all duration-200">
          Today
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Calendar grid */}
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/10">
            {DAYS_OF_WEEK.map(d=>(
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-muted">{d}</div>
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
                    className={`min-h-[72px] p-1.5 border-r border-b border-white/5 transition-colors duration-150
                      ${day ? "cursor-pointer hover:bg-white/[.03]" : ""}
                      ${isSel ? "bg-[#00C896]/8" : isToday ? "bg-[#00C896]/5" : ""}`}>
                    {day && (
                      <>
                        <div className={`text-sm w-6 h-6 flex items-center justify-center rounded-full mb-1
                          ${isToday ? "bg-[#00C896]/20 text-[#00C896] font-bold" : isSel ? "text-[#00C896]" : "text-on-surface"}`}>
                          {day}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {events.slice(0,2).map((ev,ei)=>(
                            <div key={ei} className="text-[9px] truncate rounded px-1 py-[1px] flex items-center gap-0.5"
                              style={{color:ev.color,background:ev.color+"10"}}>
                              <span className="material-symbols-outlined" style={{fontSize:8}}>{ev.icon}</span>
                              <span className="truncate">{ev.title}</span>
                            </div>
                          ))}
                          {events.length>2 && <div className="text-[9px] text-muted">+{events.length-2} more</div>}
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
          {/* Selected day events */}
          {selected ? (
            <Card>
              <div className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00C896] text-lg">event</span>
                {MONTHS[month]} {selected}, {year}
              </div>
              {selectedEvents.length===0
                ? <div className="text-xs text-muted py-3">Nothing scheduled</div>
                : selectedEvents.map((ev,i)=>(
                  <div key={i} className="p-3 rounded-xl mb-2"
                    style={{background:ev.color+"0a",borderLeft:`3px solid ${ev.color}`}}>
                    <div className="text-sm font-semibold flex items-center gap-1.5" style={{color:ev.color}}>
                      <span className="material-symbols-outlined text-sm">{ev.icon}</span>{ev.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted capitalize">{ev.type}</span>
                      {ev.date && <span className="text-[10px] font-semibold" style={{color:ev.color}}>{relTime(ev.date)}</span>}
                    </div>
                  </div>
                ))
              }
            </Card>
          ) : (
            <Card className="text-center py-5">
              <span className="material-symbols-outlined text-dim text-3xl mb-2 block">touch_app</span>
              <div className="text-xs text-muted">Click a day to see events</div>
            </Card>
          )}

          {/* Upcoming section */}
          {upcoming.length > 0 && (
            <Card>
              <div className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f97316] text-lg">upcoming</span>
                Upcoming
              </div>
              {upcoming.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{background:ev.color+"12"}}>
                    <span className="material-symbols-outlined text-sm" style={{color:ev.color}}>{ev.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-on-surface truncate">{ev.title}</div>
                    <div className="text-[10px] text-muted capitalize">{ev.type}</div>
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
            <div className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8b5cf6] text-lg">alarm</span>
              Reminders
            </div>
            {reminders.length===0
              ? <div className="text-xs text-muted">No reminders set</div>
              : reminders.slice(0,5).map(r=>(
                <div key={r._id} className="flex justify-between items-start py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] mt-1.5 flex-shrink-0"/>
                    <div>
                      <div className="text-xs font-semibold text-on-surface">{r.title}</div>
                      <div className="text-[10px] text-muted mt-0.5">
                        {new Date(r.fireAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>deleteReminder(r._id)}
                    className="text-dim hover:text-danger transition-colors duration-200 p-1">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))
            }
            <button onClick={()=>setModal(true)}
              className="mt-3 w-full bg-[#00C896]/10 border border-[#00C896]/20 rounded-xl py-2
                text-[#00C896] text-xs font-semibold hover:bg-[#00C896]/15 transition-all duration-200">
              + Add Reminder
            </button>
          </Card>

          {/* Legend */}
          <Card>
            <div className="text-sm font-semibold text-on-surface mb-3">Legend</div>
            {[{color:"#f87171",label:"Deadline",icon:"notifications"},{color:"#3b82f6",label:"Class",icon:"event"},{color:"#8b5cf6",label:"Reminder",icon:"alarm"}].map(l=>(
              <div key={l.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:l.color}}/>
                <span className="material-symbols-outlined text-xs" style={{color:l.color}}>{l.icon}</span>
                <span className="text-xs text-muted">{l.label}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {modal && (
        <Modal title="Add Reminder" onClose={()=>setModal(false)}>
          <Input label="Title" placeholder="e.g. Study for exam" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <Input label="Note (optional)" placeholder="Any details" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/>
          <div className="mb-4">
            <div className="text-xs text-muted mb-1.5 font-medium ml-1">Date & Time</div>
            <input type="datetime-local" value={form.fireAt} onChange={e=>setForm({...form,fireAt:e.target.value})}
              className="input-field" style={{colorScheme:"dark"}}/>
          </div>
          <div className="mb-5">
            <div className="text-xs text-muted mb-2 font-medium ml-1">Repeat</div>
            <div className="flex gap-2">
              {["none","daily","weekly"].map(r=>(
                <button key={r} onClick={()=>setForm({...form,repeat:r})}
                  className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    border:`1px solid ${form.repeat===r?"rgba(0,200,150,.3)":"rgba(255,255,255,.05)"}`,
                    background:form.repeat===r?"rgba(0,200,150,.08)":"transparent",
                    color:form.repeat===r?"#00C896":"#4a5568"
                  }}>{r}</button>
              ))}
            </div>
          </div>
          <Btn full color="#00C896" onClick={addReminder}>Set Reminder</Btn>
        </Modal>
      )}
    </div>
  );
}
