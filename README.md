# EnggStack v3 Setup Guide

## MANUAL STEPS

### 1. Install MongoDB
- Windows: https://www.mongodb.com/try/download/community
- Mac: brew install mongodb-community && brew services start mongodb-community

### 2. Edit backend/.env — set these 3 values:
```
JWT_SECRET=any_random_string_here_abc123
OPENAI_API_KEY=sk-YOUR_KEY  (from platform.openai.com)
GOOGLE_CLIENT_ID=YOUR_ID.apps.googleusercontent.com  (from console.cloud.google.com)
```

### 3. Google OAuth (for "Sign in with Google")
1. Go to console.cloud.google.com
2. Create project → APIs & Services → Credentials → OAuth Client ID
3. Type: Web application
4. Origins: http://localhost:5173
5. Copy Client ID into backend/.env AND into frontend/index.html (replace YOUR_GOOGLE_CLIENT_ID)

### 4. Run the app
Terminal 1 (backend): cd backend && npm install && npm run dev
Terminal 2 (frontend): cd frontend && npm install && npm run dev
Open: http://localhost:5173

## Features
- Google OAuth + email/password + 4-digit PIN login
- 5 themes (Dark, Midnight, Forest, Ocean, Candy) + custom accent color
- Avatar emoji, username, custom motivational quotes
- Daily study goals
- OpenAI GPT-4o powered AI chat
- Analytics: bar charts, line charts, study heatmap, XP tracker
- Calendar with deadlines, timetable events and reminders
- Export notes to PDF
- Sound effects throughout
- All data in MongoDB, syncs across devices when hosted
