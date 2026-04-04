# 🧠 BrainNex — AI-Powered Education Platform

A full-stack AI education platform built with **React + Tailwind CSS** (frontend) and **Node.js + Express** (backend), powered by **Claude AI** and **Firebase**.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat Tutor** | Real-time AI tutoring powered by Claude AI with markdown rendering |
| 📝 **Smart Quiz Generator** | AI generates custom quizzes on any topic with explanations |
| 📊 **Progress Dashboard** | XP, streaks, subject analytics, quiz history |
| 🗺️ **Learning Path Visualizer** | AI-generated topic roadmaps with visual progress |
| 🎯 **Adaptive Difficulty Engine** | AI adjusts quiz difficulty based on your performance |
| 📈 **Weak Topic Detector** | AI identifies and flags consistently weak areas |
| 👥 **Live Study Rooms** | Real-time collaborative sessions via Socket.io |
| 🏆 **Gamification** | XP points, 15+ badges, streaks, level system |
| 🎙️ **Voice Q&A** | Ask the AI tutor by speaking (Web Speech API) |
| 🔒 **Firebase Auth** | Email/password + Google OAuth, secure token-based API |

---

## 📁 Project Structure

```
brainnex/
├── client/                    # React + Tailwind CSS frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Marketing landing page
│   │   │   ├── LoginPage.jsx         # Firebase auth login
│   │   │   ├── RegisterPage.jsx      # Account registration
│   │   │   ├── DashboardPage.jsx     # Analytics dashboard
│   │   │   ├── ChatTutorPage.jsx     # AI chat + voice Q&A
│   │   │   ├── QuizPage.jsx          # Quiz generator + adaptive difficulty
│   │   │   ├── LearningPathPage.jsx  # Visual learning path
│   │   │   ├── StudyRoomsPage.jsx    # Real-time study rooms
│   │   │   └── AchievementsPage.jsx  # Badges + gamification
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Firebase auth state
│   │   │   └── UserDataContext.jsx   # Profile, XP, streak
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   │   └── ProtectedRoute.jsx    # Route guard
│   │   └── utils/
│   │       ├── firebase.js           # Firebase init
│   │       └── api.js                # Axios API client
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── server/                    # Node.js + Express backend
    ├── routes/
    │   ├── ai.js              # AI endpoints (chat, quiz, weak topics, path, adaptive)
    │   └── progress.js        # Progress tracking, quiz results, streaks
    ├── middleware/
    │   └── auth.js            # Firebase token verification
    ├── index.js               # Express + Socket.io server
    └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js v18+
- A Firebase project (free tier is fine)
- An Anthropic API key (get from console.anthropic.com)

---

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in methods → Email/Password + Google
4. Enable **Firestore Database** → Start in test mode
5. Go to **Project Settings → General → Your apps** → Add Web App
6. Copy the Firebase config for the client `.env`
7. Go to **Project Settings → Service Accounts** → Generate new private key
8. Copy values for the server `.env`

---

### 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your Firebase config values in .env

# Start development server
npm run dev
```

Client runs on: **http://localhost:5173**

---

### 4. Server Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your Anthropic API key and Firebase Admin SDK values

# Start server (development with hot reload)
npm run dev

# OR start production server
npm start
```

Server runs on: **http://localhost:5000**

---

## 🔑 Environment Variables

### Client (`client/.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Server (`server/.env`)
```
PORT=5000
ANTHROPIC_API_KEY=sk-ant-...

FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com

CLIENT_URL=http://localhost:5173
```

---

## 🧠 AI Endpoints (Backend)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/chat` | AI tutor conversation |
| POST | `/api/ai/generate-quiz` | Generate quiz for topic |
| POST | `/api/ai/detect-weak-topics` | Analyze quiz history for weak areas |
| POST | `/api/ai/learning-path` | Generate subject learning path |
| POST | `/api/ai/adaptive-difficulty` | Get difficulty recommendation |

## 📊 Progress Endpoints (Backend)

| Method | Endpoint | Description |
|---|---|---|
| GET  | `/api/progress/profile` | Get/create user profile |
| POST | `/api/progress/update-streak` | Update daily streak |
| POST | `/api/progress/quiz-result` | Save quiz result + award XP |
| GET  | `/api/progress/quiz-history` | Fetch quiz history |
| GET  | `/api/progress/subject-progress` | Get per-subject stats |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, Framer Motion, React Router v6 |
| Backend | Node.js, Express.js, Socket.io |
| AI | Anthropic Claude (claude-haiku-4-5) |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Firebase Firestore |
| Real-time | Socket.io (Study Rooms) |
| Voice | Web Speech API (built-in browser) |

---

## 🚀 Deployment

### Frontend → Vercel / Netlify
```bash
cd client
npm run build
# Upload dist/ folder to Vercel or Netlify
```

### Backend → Railway / Render / Heroku
```bash
cd server
# Set all environment variables in the platform dashboard
npm start
```

Update `CLIENT_URL` in server `.env` and Vite proxy in `vite.config.js` for production URLs.

---

## 📄 License
MIT — built for learning and education purposes.
"# BrainNex" 
