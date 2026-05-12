// In production (Vercel), VITE_API_URL = https://enggstack-1.onrender.com
// This module appends /api to all paths

// Section 2.3: Fail loudly if VITE_API_URL is not set in production
const RAW = (import.meta.env.VITE_API_URL || "").trim();
if (!RAW && import.meta.env.PROD) {
  console.error("FATAL: VITE_API_URL is not set. Check your Vercel environment variables.");
}

// Strip trailing slash and /api suffix so we always have a clean base like https://host.com
let BASE = RAW.endsWith("/") ? RAW.slice(0, -1) : RAW;
if (BASE.endsWith("/api")) BASE = BASE.slice(0, -4);
const tok  = () => localStorage.getItem("es_token") || "";

// ── Cold-start banner management (Section 2.8) ───────────────────────────────
let coldStartBannerEl = null;
function showColdStartBanner() {
  if (coldStartBannerEl) return;
  coldStartBannerEl = document.createElement("div");
  coldStartBannerEl.id = "cold-start-banner";
  coldStartBannerEl.style.cssText = `
    position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px 24px;
    background:linear-gradient(135deg,#1a2235,#0f172a);border-bottom:1px solid rgba(0,200,150,0.2);
    color:#e5e7eb;font-size:13px;text-align:center;font-family:Inter,system-ui,sans-serif;
    display:flex;align-items:center;justify-content:center;gap:8px;
    animation:slideDown .3s ease-out;
  `;
  coldStartBannerEl.innerHTML = `
    <div style="width:16px;height:16px;border:2px solid #00C896;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite"></div>
    <span>Connecting to server... <span style="color:#9ca3af">(first load may take up to 60s)</span></span>
    <style>@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}</style>
  `;
  document.body.prepend(coldStartBannerEl);
}
function hideColdStartBanner() {
  if (coldStartBannerEl) {
    coldStartBannerEl.remove();
    coldStartBannerEl = null;
  }
}

// ── Health check on load (Section 2.8) ────────────────────────────────────────
if (BASE) {
  const healthTimeout = setTimeout(showColdStartBanner, 3000);
  fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout?.(30000) })
    .then(() => { clearTimeout(healthTimeout); hideColdStartBanner(); })
    .catch(() => { clearTimeout(healthTimeout); /* banner stays until first successful req */ });
}

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
      hideColdStartBanner(); // dismiss banner on first successful response
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
        showColdStartBanner();
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      // Final attempt failed — throw a user-friendly message
      console.error(`[API] Network request failed after ${retries} attempts:`, err.message);
      hideColdStartBanner();
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
    if (!r.ok) {
      console.error(`[API] Server error ${r.status} on ${method} ${path}`);
      throw new Error(`Server error ${r.status} — is the backend running?`);
    }
    return r;
  }

  const data = await r.json();
  if (!r.ok) {
    console.error(`[API Error] ${method} ${path}:`, data.error || `HTTP ${r.status}`);
    throw new Error(data.error || `HTTP ${r.status}`);
  }
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
  exportData:     ()     => req("GET",    "/user/export"),

  // stats
  getStats:    ()  => req("GET",  "/stats"),
  logPomodoro: (b) => req("POST", "/stats/pomodoro", b),
  logFocus:    (b) => req("POST", "/stats/focus",    b),

  // deadlines
  getDeadlines:   ()      => req("GET",    "/deadlines"),
  addDeadline:    (b)     => req("POST",   "/deadlines",     b),
  updateDeadline: (id, b) => req("PATCH",  `/deadlines/${id}`, b),
  deleteDeadline: (id)    => req("DELETE", `/deadlines/${id}`),

  // notes (Section 4.4 — pagination support)
  getNotes:    (page=1, limit=20) => req("GET", `/notes?page=${page}&limit=${limit}`),
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

  // AI chat (Section 3.5 — session persistence)
  chat:           (messages, sessionId) => req("POST", "/ai/chat", { messages, sessionId }),
  getChatSessions: () => req("GET", "/ai/sessions"),
  getChatSession:  (id) => req("GET", `/ai/sessions/${id}`),
  deleteChatSession: (id) => req("DELETE", `/ai/sessions/${id}`),

  // friends
  searchUsers:       (q)   => req("GET",    `/friends/search?q=${encodeURIComponent(q)}`),
  sendFriendRequest: (id)  => req("POST",   "/friends/request", { toUserId: id }),
  getFriendRequests: ()    => req("GET",    "/friends/requests"),
  respondRequest:    (id, action) => req("PATCH", `/friends/request/${id}`, { action }),
  getFriends:        ()    => req("GET",    "/friends"),
  getFriendStats:    (id)  => req("GET",    `/friends/${id}/stats`),
  removeFriend:      (id)  => req("DELETE", `/friends/${id}`),

  // flashcards (Feature 1)
  getDecks:       ()          => req("GET",    "/flashcards/decks"),
  createDeck:     (b)         => req("POST",   "/flashcards/decks", b),
  deleteDeck:     (id)        => req("DELETE", `/flashcards/decks/${id}`),
  getDueCards:    (deckId)    => req("GET",    `/flashcards/decks/${deckId}/due`),
  getDeckCards:   (deckId)    => req("GET",    `/flashcards/decks/${deckId}/cards`),
  createCard:     (b)         => req("POST",   "/flashcards/cards", b),
  reviewCard:     (cardId, rating) => req("POST", `/flashcards/cards/${cardId}/review`, { rating }),
  deleteCard:     (cardId)    => req("DELETE", `/flashcards/cards/${cardId}`),

  // weekly reports (Feature 3)
  getReports:     ()  => req("GET",  "/reports"),
  generateReport: ()  => req("POST", "/reports/weekly"),

  // account data (Feature 5)
  exportData:     ()    => req("GET", "/user/export"),
  deleteAccount:  (pin) => req("DELETE", "/user/account", { pin }),

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
