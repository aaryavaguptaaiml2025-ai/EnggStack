<div align="center">

<img src="https://img.shields.io/badge/EnggStack-v3-6366f1?style=for-the-badge&labelColor=0f0f0f" alt="EnggStack v3"/>

# ⚡ EnggStack

### The all-in-one productivity OS for engineering students.

**Study smarter. Track everything. Level up.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-engg--stack.vercel.app-6366f1?style=for-the-badge)](https://engg-stack.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React_+_Vite-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js_+_Express-3c873a?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-MongoDB-47a248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![AI](https://img.shields.io/badge/AI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)

</div>

---

## 📖 Table of Contents

- [What is EnggStack?](#-what-is-enggstack)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Environment Variables](#environment-variables)
- [Deployment](#-deployment)
  - [Frontend — Vercel](#frontend--vercel)
  - [Backend — Render](#backend--render)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [API Overview](#-api-overview)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 What is EnggStack?

EnggStack is a **full-stack student productivity platform** built specifically for engineering students who want to study with purpose. It combines gamification, AI assistance, deep analytics, and smart scheduling into a single, beautiful dashboard — so you always know what to study, how much you've done, and how to do better.

Think of it as **Notion × Duolingo × a study tracker**, purpose-built for the engineering grind.

> Built by a CS/AI-ML student, for engineering students.

---

## ✨ Features

### 🔐 Authentication
| Feature | Details |
|---|---|
| Email / Password | Secure signup & login with hashed passwords |
| Google OAuth | One-click sign-in via Google |
| 4-Digit PIN Login | Fast re-authentication after setup |
| Email OTP | OTP verification flow via Nodemailer (Gmail) |
| JWT Sessions | Stateless auth with tokens stored in `localStorage` as `es_token` |

---

### 🍅 Pomodoro Timer + XP System
- Configurable focus/break intervals
- Earns **XP** on every completed session
- Tracks **streak days** and **total study hours**
- Sound effects and session summaries

---

### 📊 Analytics Dashboard
- **Bar charts** — daily study breakdown per subject
- **Line charts** — weekly/monthly productivity trends
- **Study heatmap** — GitHub-style contribution grid for study days
- **XP tracker** — level progression with visual milestones

---

### 🤖 AI Chat (GPT-4o)
- Powered by OpenAI GPT-4o
- Full conversation history in session
- Ideal for concept explanations, doubt-clearing, and study planning

---

### 📝 Notes
- Rich-text note creation per subject
- **Export notes to PDF** directly from the browser
- Organized by topic/subject with timestamps

---

### 📅 Calendar & Deadlines
- Add and manage **assignment deadlines**
- Schedule **timetable events** (classes, labs, exams)
- Built-in **reminders** for upcoming events

---

### 🎵 Music Player
- Persistent **YouTube embed** music player across all pages (via global `MusicContext`)
- Ambient sounds via **Web Audio API** (rain, white noise, lo-fi vibes)
- Survives page navigation — no re-buffering

---

### 🎨 Themes & Personalization
- 5 built-in themes: **Dark, Midnight, Forest, Ocean, Candy**
- Custom **accent color** picker
- **Avatar emoji** selection
- Custom username and **motivational quote**
- **Daily study goal** setting

---

### 📱 Fully Responsive
- Works on all screen sizes — desktop, tablet, mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT, Google OAuth 2.0, bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) |
| **AI** | OpenAI GPT-4o API |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |
| **Build Tool** | Vite |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│                                                                     │
│   React + Vite (Vercel)         VITE_API_URL → Render backend       │
│   ┌──────────────┐    JWT       ┌───────────────────────────────┐   │
│   │  React SPA   │ ──────────── │     Express.js REST API       │   │
│   │  Tailwind    │              │     Node.js                   │   │
│   │  MusicCtx    │              │  ┌────────────┐               │   │
│   │  AuthCtx     │              │  │  MongoDB   │               │   │
│   └──────────────┘              │  │  Mongoose  │               │   │
│                                 │  └────────────┘               │   │
│                                 │  ┌────────────┐               │   │
│                                 │  │ OpenAI API │               │   │
│                                 │  └────────────┘               │   │
│                                 │  ┌────────────┐               │   │
│                                 │  │ Google OAuth│              │   │
│                                 │  └────────────┘               │   │
│                                 └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Frontend uses `VITE_API_URL` env var, falls back to `/api` in development
- CORS dynamically allows all `*.vercel.app` subdomains + `localhost`
- JWT tokens keyed as `es_token` in `localStorage`
- In-memory OTP store with graceful bypass when Gmail credentials are absent
- MongoDB startup drops stale `uid_1` index to prevent query errors

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Community](https://www.mongodb.com/try/download/community) (local) **or** a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- An [OpenAI API Key](https://platform.openai.com/api-keys) (for GPT-4o chat)
- A [Google Cloud OAuth Client ID](https://console.cloud.google.com/) (for Google login)

---

### Local Setup

**1. Clone the repository**

```bash
git clone https://github.com/aaryavaguptaaiml2025-ai/EnggStack.git
cd EnggStack
```

**2. Set up the backend**

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
# See full reference below
JWT_SECRET=your_secret_here
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
MONGO_URI=mongodb://localhost:27017/enggstack
GMAIL_USER=your@gmail.com
GMAIL_PASS=your_app_password
PORT=5000
```

Start the backend dev server:

```bash
npm run dev
```

**3. Set up the frontend**

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Also update `frontend/index.html` — replace `YOUR_GOOGLE_CLIENT_ID` with your actual OAuth Client ID.

Start the frontend:

```bash
npm run dev
```

**4. Open the app**

Visit [http://localhost:5173](http://localhost:5173) 🎉

---

### Environment Variables

#### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Any random secret string for signing JWTs |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (for GPT-4o chat) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 2.0 Client ID |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `GMAIL_USER` | ⚠️ Optional | Gmail address for OTP emails |
| `GMAIL_PASS` | ⚠️ Optional | Gmail App Password (not your account password) |
| `PORT` | ⚠️ Optional | Defaults to `5000` |

> ⚠️ If `GMAIL_USER` / `GMAIL_PASS` are missing, the OTP system is gracefully bypassed — the app still runs.

#### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g. `https://your-app.onrender.com/api`) |

---

## ☁️ Deployment

### Frontend — Vercel

1. Push your repo to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set **Root Directory** → `frontend`
4. Add environment variable: `VITE_API_URL` → your Render backend URL + `/api`
5. Deploy ✅

### Backend — Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** → `backend`
3. **Build command:** `npm install`
4. **Start command:** `node server.js` (or `npm start`)
5. Add all backend environment variables in the Render dashboard
6. Deploy ✅

> 💡 **Important:** Never commit your `.env` files. They are already in `.gitignore`. Configure all secrets through the hosting dashboards only.

---

## 📁 Project Structure

```
EnggStack/
├── backend/
│   ├── models/             # Mongoose schemas (User, Note, Deadline, etc.)
│   ├── routes/             # Express route handlers
│   │   ├── auth.js         # Login, signup, Google OAuth, PIN, OTP
│   │   ├── notes.js        # CRUD for notes
│   │   ├── analytics.js    # Study stats, heatmap data
│   │   ├── ai.js           # GPT-4o chat endpoint
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js         # JWT verification middleware
│   ├── server.js           # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── context/        # React Contexts (Auth, Music, Theme)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # API helper, formatters
│   │   │   └── api.js      # Centralized API calls using VITE_API_URL
│   │   ├── App.jsx         # Router and layout
│   │   └── main.jsx        # App entry point
│   ├── index.html          # Google OAuth script tag lives here
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔒 Authentication

EnggStack supports three login methods:

```
┌─────────────────────────────────────┐
│         Authentication Flow         │
│                                     │
│  1. Email/Password ─────► JWT Token │
│                                     │
│  2. Google OAuth ────────► JWT Token│
│     (Google verifies, backend       │
│      issues its own JWT)            │
│                                     │
│  3. 4-Digit PIN ─────────► JWT Token│
│     (Set up post-login for          │
│      quick re-authentication)       │
└─────────────────────────────────────┘
```

All methods return a JWT stored as `es_token` in localStorage. Protected API routes verify this token via the `auth.js` middleware.

---

## 📡 API Overview

All routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Create new account |
| `POST` | `/api/auth/login` | ❌ | Email/password login |
| `POST` | `/api/auth/google` | ❌ | Google OAuth login |
| `POST` | `/api/auth/pin-login` | ❌ | PIN-based login |
| `POST` | `/api/auth/send-otp` | ❌ | Send OTP to email |
| `POST` | `/api/auth/verify-otp` | ❌ | Verify OTP |
| `GET` | `/api/user/profile` | ✅ | Get user profile + stats |
| `PUT` | `/api/user/profile` | ✅ | Update profile settings |
| `GET` | `/api/notes` | ✅ | Get all notes |
| `POST` | `/api/notes` | ✅ | Create a note |
| `PUT` | `/api/notes/:id` | ✅ | Update a note |
| `DELETE` | `/api/notes/:id` | ✅ | Delete a note |
| `GET` | `/api/analytics/heatmap` | ✅ | Study heatmap data |
| `GET` | `/api/analytics/stats` | ✅ | XP, streak, subject breakdown |
| `POST` | `/api/ai/chat` | ✅ | Send message to GPT-4o |
| `GET` | `/api/deadlines` | ✅ | Get all deadlines/events |
| `POST` | `/api/deadlines` | ✅ | Create deadline/event |
| `DELETE` | `/api/deadlines/:id` | ✅ | Delete deadline |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure:
- No secrets or `.env` files are committed
- Code is clean and consistent with the existing style
- New features include relevant comments

---

## ⚠️ Security Notes

- **Never** commit `.env` files — they're gitignored, keep them that way
- Rotate any API keys that were accidentally exposed using your provider's key management dashboard
- Use environment variable dashboards (Vercel/Render) for all secrets in production
- Gmail OTP requires an [App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password

---

## 📜 License

This project is open source. Feel free to fork, build upon, and learn from it.

---

<div align="center">

Built with ❤️ by [Aaryav Gupta](https://github.com/aaryavaguptaaiml2025-ai)

**[⭐ Star this repo](https://github.com/aaryavaguptaaiml2025-ai/EnggStack) if EnggStack helped you study better!**

</div>
