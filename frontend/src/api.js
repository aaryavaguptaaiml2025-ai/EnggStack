// In production (Vercel), VITE_API_URL = https://enggstack-1.onrender.com
// This module appends /api to all paths
// In development, falls back to "" which Vite proxies to localhost:5000
const RAW = (import.meta.env.VITE_API_URL || "").trim();
// Strip trailing slash and /api suffix so we always have a clean base like https://host.com
let BASE = RAW.endsWith("/") ? RAW.slice(0, -1) : RAW;
if (BASE.endsWith("/api")) BASE = BASE.slice(0, -4);
const tok  = () => localStorage.getItem("es_token") || "";

// ── Retry wrapper for Render cold-start resilience ────────────────────────────
// Render free-tier spins down after 15 min idle; first request can fail with
// ERR_NETWORK_CHANGED / TypeError: Failed to fetch. We retry up to 3 times
// with exponential backoff so the user just sees a brief delay, not an error.
async function fetchWithRetry(url, opts, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const r = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeout);
      return r;
    } catch (err) {
      const isNetworkError =
        err.name === "TypeError" ||
        err.name === "AbortError" ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("ERR_NETWORK");

      if (isNetworkError && i < retries - 1) {
        // Wait 1s, 2s, 4s before retrying
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      // Final attempt failed — throw a user-friendly message
      throw new Error(
        "Cannot reach the server. It may be waking up — please wait a moment and try again."
      );
    }
  }
}

async function req(method, path, body) {
  const r = await fetchWithRetry(`${BASE}/api${path}`, {
    method,
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

  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const api = {
  // auth
  sendOtp:     (b) => req("POST",  "/auth/send-otp",    b),
  verifyOtp:   (b) => req("POST",  "/auth/verify-otp",  b),
  resendOtp:   (b) => req("POST",  "/auth/resend-otp",  b),
  login:       (b) => req("POST",  "/auth/login",       b),
  googleAuth:  (b) => req("POST",  "/auth/google",      b),
  pinLogin:    (b) => req("POST",  "/auth/pin-login",   b),
  me:          ()  => req("GET",   "/auth/me"),
  forgotPassword: (b) => req("POST", "/auth/forgot-password", b),
  resetPassword:  (b) => req("POST", "/auth/reset-password",  b),

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

  // AI chat
  chat: (messages) => req("POST", "/ai/chat", { messages }),

  // export PDFs — sends token in Authorization header via fetch
  exportNote: async (id) => {
    const r = await fetchWithRetry(`${BASE}/api/export/notes/${id}`, {
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
    const r = await fetchWithRetry(`${BASE}/api/export/notes-all`, {
      headers: { "Authorization": `Bearer ${tok()}` },
    });
    if (!r.ok) throw new Error("Export failed");
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "Cognit_All_Notes.pdf"; a.click();
    URL.revokeObjectURL(url);
  },
};
