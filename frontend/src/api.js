<<<<<<< HEAD
// In production (Vercel), VITE_API_URL = https://enggstack-1.onrender.com/api
// In development, falls back to /api which Vite proxies to localhost:5000
=======
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
const BASE = import.meta.env.VITE_API_URL || "/api";
const tok  = () => localStorage.getItem("es_token") || "";

async function req(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
<<<<<<< HEAD
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${tok()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle non-JSON responses (e.g. PDF blobs, 502 HTML errors from Render)
  const contentType = r.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!r.ok) throw new Error(`Server error ${r.status} — is the backend running?`);
    return r;
  }

=======
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const api = {
  // auth
<<<<<<< HEAD
  register:    (b) => req("POST",  "/auth/register",  b),
  login:       (b) => req("POST",  "/auth/login",     b),
  googleAuth:  (b) => req("POST",  "/auth/google",    b),
  pinLogin:    (b) => req("POST",  "/auth/pin-login", b),
  me:          ()  => req("GET",   "/auth/me"),

  // user / settings
  updateProfile:  (b)    => req("PATCH",  "/user/profile",  b),
  changePassword: (b)    => req("PATCH",  "/user/password", b),
  setPin:         (b)    => req("PATCH",  "/user/pin",      b),
  removePin:      ()     => req("DELETE", "/user/pin"),

  // stats
  getStats:    ()  => req("GET",  "/stats"),
  logPomodoro: (b) => req("POST", "/stats/pomodoro", b),
  logFocus:    (b) => req("POST", "/stats/focus",    b),

  // deadlines
  getDeadlines:   ()      => req("GET",    "/deadlines"),
  addDeadline:    (b)     => req("POST",   "/deadlines",     b),
  updateDeadline: (id, b) => req("PATCH",  `/deadlines/${id}`, b),
  deleteDeadline: (id)    => req("DELETE", `/deadlines/${id}`),

  // notes
  getNotes:    ()      => req("GET",    "/notes"),
  addNote:     (b)     => req("POST",   "/notes",      b),
  updateNote:  (id, b) => req("PATCH",  `/notes/${id}`, b),
  deleteNote:  (id)    => req("DELETE", `/notes/${id}`),

  // checklist
  getChecklist: ()      => req("GET",    "/checklist"),
  addCheck:     (b)     => req("POST",   "/checklist",      b),
  updateCheck:  (id, b) => req("PATCH",  `/checklist/${id}`, b),
  deleteCheck:  (id)    => req("DELETE", `/checklist/${id}`),

  // timetable
  getTimetable: ()   => req("GET",    "/timetable"),
  addEntry:     (b)  => req("POST",   "/timetable",     b),
  deleteEntry:  (id) => req("DELETE", `/timetable/${id}`),

  // subjects
  getSubjects:   ()      => req("GET",    "/subjects"),
  addSubject:    (b)     => req("POST",   "/subjects",      b),
  updateSubject: (id, b) => req("PATCH",  `/subjects/${id}`, b),
  deleteSubject: (id)    => req("DELETE", `/subjects/${id}`),

  // reminders
  getReminders:   ()   => req("GET",    "/reminders"),
  addReminder:    (b)  => req("POST",   "/reminders",     b),
  deleteReminder: (id) => req("DELETE", `/reminders/${id}`),

  // export PDFs — sends token in Authorization header via fetch
  exportNote: async (id) => {
    const r = await fetch(`${BASE}/export/notes/${id}`, {
      headers: { "Authorization": `Bearer ${tok()}` },
    });
    if (!r.ok) throw new Error("Export failed");
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `note_${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },
  exportAllNotes: async () => {
    const r = await fetch(`${BASE}/export/notes-all`, {
      headers: { "Authorization": `Bearer ${tok()}` },
    });
    if (!r.ok) throw new Error("Export failed");
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "EnggStack_All_Notes.pdf"; a.click();
    URL.revokeObjectURL(url);
  },
=======
  register:   (b) => req("POST","/auth/register",b),
  login:      (b) => req("POST","/auth/login",b),
  googleAuth: (b) => req("POST","/auth/google",b),
  pinLogin:   (b) => req("POST","/auth/pin-login",b),
  me:         ()  => req("GET", "/auth/me"),

  // user / settings
  updateProfile: (b)  => req("PATCH","/user/profile",b),
  changePassword:(b)  => req("PATCH","/user/password",b),
  setPin:        (b)  => req("PATCH","/user/pin",b),
  removePin:     ()   => req("DELETE","/user/pin"),

  // stats
  getStats:    ()  => req("GET", "/stats"),
  logPomodoro: (b) => req("POST","/stats/pomodoro",b),
  logFocus:    (b) => req("POST","/stats/focus",b),

  // ai
  chat: (messages) => req("POST","/ai/chat",{ messages }),

  // crud
  getDeadlines:   ()     => req("GET",   "/deadlines"),
  addDeadline:    (b)    => req("POST",  "/deadlines",b),
  updateDeadline: (id,b) => req("PATCH", `/deadlines/${id}`,b),
  deleteDeadline: (id)   => req("DELETE",`/deadlines/${id}`),

  getNotes:    ()     => req("GET",   "/notes"),
  addNote:     (b)    => req("POST",  "/notes",b),
  updateNote:  (id,b) => req("PATCH", `/notes/${id}`,b),
  deleteNote:  (id)   => req("DELETE",`/notes/${id}`),

  getChecklist:  ()     => req("GET",   "/checklist"),
  addCheck:      (b)    => req("POST",  "/checklist",b),
  updateCheck:   (id,b) => req("PATCH", `/checklist/${id}`,b),
  deleteCheck:   (id)   => req("DELETE",`/checklist/${id}`),

  getTimetable: ()  => req("GET",   "/timetable"),
  addEntry:     (b) => req("POST",  "/timetable",b),
  deleteEntry:  (id)=> req("DELETE",`/timetable/${id}`),

  getSubjects:   ()     => req("GET",   "/subjects"),
  addSubject:    (b)    => req("POST",  "/subjects",b),
  updateSubject: (id,b) => req("PATCH", `/subjects/${id}`,b),
  deleteSubject: (id)   => req("DELETE",`/subjects/${id}`),

  getReminders:  ()     => req("GET",   "/reminders"),
  addReminder:   (b)    => req("POST",  "/reminders",b),
  deleteReminder:(id)   => req("DELETE",`/reminders/${id}`),

  // export
  exportNote:    (id)  => `${BASE}/export/notes/${id}?token=${tok()}`,
  exportAllNotes: ()   => `${BASE}/export/notes-all?token=${tok()}`,
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
};
