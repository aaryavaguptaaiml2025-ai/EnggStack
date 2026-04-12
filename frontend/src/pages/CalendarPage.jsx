import { useState, useEffect } from "react";
import { api } from "../api";
import { Card, Modal, Input, Btn, Badge, Toast } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [deadlines,  setDeadlines]  = useState([]);
  const [timetable,  setTimetable]  = useState([]);
  const [reminders,  setReminders]  = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [modal,      setModal]       = useState(false);
  const [toast,      setToast]       = useState(null);
  const [form,       setForm]        = useState({ title:"", body:"", fireAt:"", repeat:"none" });

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
      if (ds===dateStr && !d.done) events.push({ type:"deadline", title:d.title, color:"#f87171", icon:"🔔" });
    });
    const dayName = DAYS_OF_WEEK[new Date(year,month,day).getDay()];
    const shortDay = dayName.slice(0,3);
    timetable.filter(e=>e.day===shortDay).forEach(e => events.push({ type:"class", title:`${e.subject} ${e.startTime}`, color:"#60a5fa", icon:"📅" }));
    reminders.forEach(r => {
      const rs = new Date(r.fireAt).toISOString().split("T")[0];
      if (rs===dateStr && !r.done) events.push({ type:"reminder", title:r.title, color:"#a78bfa", icon:"⏰" });
    });
    return events;
  };

  const addReminder = async () => {
    if (!form.title || !form.fireAt) return;
    try {
      await api.addReminder(form);
      sfx.success();
      setToast({ msg:"Reminder set!", color:"#4ade80" });
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
    <div style={{ padding:"24px 28px" }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onClose={()=>setToast(null)}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <h1 style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:0 }}>🗓️ Calendar</h1>
        <Btn color="var(--ac)" onClick={()=>setModal(true)}>+ Add Reminder</Btn>
      </div>

      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
        <button onClick={()=>{ sfx.click(); if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,width:36,height:36,cursor:"pointer",color:"var(--text)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)", minWidth:180, textAlign:"center" }}>{MONTHS[month]} {year}</div>
        <button onClick={()=>{ sfx.click(); if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,width:36,height:36,cursor:"pointer",color:"var(--text)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
        <button onClick={()=>{ sfx.click(); setYear(today.getFullYear()); setMonth(today.getMonth()); }} style={{ background:"var(--ac-dim)",border:"1px solid var(--ac)44",borderRadius:8,padding:"6px 14px",color:"var(--ac)",fontSize:12,fontWeight:600,cursor:"pointer" }}>Today</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
        {/* Calendar grid */}
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden" }}>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid var(--border)" }}>
            {DAYS_OF_WEEK.map(d=>(
              <div key={d} style={{ padding:"10px 4px", textAlign:"center", fontSize:12, fontWeight:600, color:"var(--muted)" }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ overflowX:"auto"}}><div style={{display:"grid", gridTemplateColumns:"repeat(7,minmax(44px,1fr))", minWidth:300}}>
            {cells.map((day,i) => {
              const events = getEventsForDay(day);
              const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
              const isSel   = day===selected;
              return (
                <div key={i} onClick={()=>{ if(day){sfx.click();setSelected(day===selected?null:day);} }}
                  style={{
                    minHeight:72, padding:"6px 8px",
                    borderRight:`1px solid var(--border)`,
                    borderBottom:`1px solid var(--border)`,
                    background: isSel?"var(--ac-dim)":isToday?"rgba(74,222,128,.05)":"transparent",
                    cursor:day?"pointer":"default",
                    transition:"background .15s",
                  }}
                  onMouseEnter={e=>{ if(day&&!isSel) e.currentTarget.style.background="var(--card2)"; }}
                  onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background=isToday?"rgba(74,222,128,.05)":"transparent"; }}
                >
                  {day && (
                    <>
                      <div style={{ fontSize:13, fontWeight:isToday?700:400, color:isToday?"var(--ac)":isSel?"var(--ac)":"var(--text)", width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:isToday?"var(--ac)22":"transparent",marginBottom:3 }}>{day}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                        {events.slice(0,2).map((ev,ei)=>(
                          <div key={ei} style={{ fontSize:9, color:ev.color, background:ev.color+"15", borderRadius:3, padding:"1px 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.icon} {ev.title}</div>
                        ))}
                        {events.length>2 && <div style={{ fontSize:9, color:"var(--muted)" }}>+{events.length-2} more</div>}
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
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Selected day events */}
          {selected ? (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:12 }}>
                {MONTHS[month]} {selected}, {year}
              </div>
              {selectedEvents.length===0
                ? <div style={{ fontSize:12, color:"var(--muted)", padding:"12px 0" }}>Nothing scheduled</div>
                : selectedEvents.map((ev,i)=>(
                  <div key={i} style={{ padding:"9px 10px", borderRadius:9, background:ev.color+"10", border:`1px solid ${ev.color}28`, marginBottom:7 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:ev.color }}>{ev.icon} {ev.title}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:2, textTransform:"capitalize" }}>{ev.type}</div>
                  </div>
                ))
              }
            </Card>
          ) : (
            <Card><div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"16px 0" }}>Click a day to see events</div></Card>
          )}

          {/* Upcoming reminders */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Reminders</div>
            {reminders.length===0
              ? <div style={{ fontSize:12, color:"var(--muted)" }}>No reminders set</div>
              : reminders.slice(0,5).map(r=>(
                <div key={r._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>{r.title}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{new Date(r.fireAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                  <button onClick={()=>deleteReminder(r._id)} style={{ background:"none",border:"none",color:"var(--dim)",cursor:"pointer",fontSize:14,padding:2 }} onMouseEnter={e=>e.currentTarget.style.color="#f87171"} onMouseLeave={e=>e.currentTarget.style.color="var(--dim)"}>×</button>
                </div>
              ))
            }
            <button onClick={()=>setModal(true)} style={{ marginTop:10,width:"100%",background:"var(--ac-dim)",border:"1px solid var(--ac)33",borderRadius:8,padding:"7px",color:"var(--ac)",fontSize:12,cursor:"pointer",fontWeight:600 }}>+ Add Reminder</button>
          </Card>

          {/* Legend */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:10 }}>Legend</div>
            {[{color:"#f87171",label:"Deadline"},{color:"#60a5fa",label:"Class"},{color:"#a78bfa",label:"Reminder"}].map(l=>(
              <div key={l.label} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                <div style={{ width:10,height:10,borderRadius:2,background:l.color,flexShrink:0 }}/>
                <span style={{ fontSize:12,color:"var(--muted)" }}>{l.label}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {modal && (
        <Modal title="Add Reminder" onClose={()=>setModal(false)}>
          <Input label="Title" placeholder="e.g. Study for exam" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <Input label="Note (optional)" placeholder="Any details" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12,color:"var(--muted)",marginBottom:6,fontWeight:500 }}>Date & Time</div>
            <input type="datetime-local" value={form.fireAt} onChange={e=>setForm({...form,fireAt:e.target.value})} style={{ width:"100%",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:10,padding:"11px 14px",color:"var(--text)",fontSize:13,outline:"none",colorScheme:"dark" }} onFocus={e=>e.target.style.borderColor="var(--ac)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:12,color:"var(--muted)",marginBottom:6,fontWeight:500 }}>Repeat</div>
            <div style={{ display:"flex",gap:8 }}>
              {["none","daily","weekly"].map(r=>(
                <button key={r} onClick={()=>setForm({...form,repeat:r})} style={{ flex:1,padding:"8px",borderRadius:8,border:`1px solid ${form.repeat===r?"var(--ac)44":"var(--border)"}`,background:form.repeat===r?"var(--ac-dim)":"var(--bg2)",color:form.repeat===r?"var(--ac)":"var(--muted)",fontSize:12,fontWeight:form.repeat===r?600:400,cursor:"pointer",textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>
          </div>
          <Btn full color="var(--ac)" onClick={addReminder}>Set Reminder</Btn>
        </Modal>
      )}
    </div>
  );
}
