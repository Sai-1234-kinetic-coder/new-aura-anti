# AuraFit — AI-Powered Gamified Campus Fitness Platform
### Smart India Hackathon 2026 | Problem Statement SIH26196

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Firebase](https://img.shields.io/badge/backend-Firebase%2012-orange)](#)
[![React](https://img.shields.io/badge/frontend-React%2019-61dafb)](#)

> **AuraFit** turns campus fitness into a competitive, AI-powered experience. Students earn XP by completing posture-tracked workouts, compete in real-time department leaderboards, and find workout partners through an intelligent Buddy Finder — all from a single browser tab, 100% on-device and private.

---

## Key Features

| Feature | Status |
|---|---|
| ??? AI Posture Arena (Squats / Push-ups / Plank) | ? Live with canvas skeleton overlay |
| ?? Department Wars Leaderboard (CSE vs ECE vs …) | ? Real-time Firestore `onSnapshot` |
| ?? Campus Buddy Finder (filter by sport, dept, timing) | ? Firestore-persisted invites |
| ?? Daily Health Metrics (Steps, Water, Sleep) | ? Persisted to `daily_logs` Firestore collection |
| ?? Gamification (XP, Streaks, Campus rankings) | ? Atomic `increment()` writes |
| ?? Auth (Sign Up / Sign In / 1-click Demo Login) | ? Firebase Auth + Firestore user profiles |
| ??? Firestore Security Rules | ? `firestore.rules` scoped per collection |

---

## Tech Stack

- **Frontend:** React 19 + Vite 7 (JSX, CSS custom properties, glassmorphism design system)
- **Styling:** Vanilla CSS design system (`src/index.css`) — Inter + Outfit fonts
- **AI/Pose:** Canvas-based skeleton overlay + angle-state-machine rep counter (MoveNet-compatible keypoint model)
- **Backend:** Firebase v12 (Auth, Firestore real-time DB)
- **Gamification:** `canvas-confetti` for rep celebrations
- **Icons:** `lucide-react`

---

## Project Structure

```
src/
+-- App.jsx                   # Root: auth state, tab routing, live leaderboard listener
+-- main.jsx                  # React 19 createRoot entry
+-- index.css                 # Full design system (tokens, components, animations)
+-- lib/
¦   +-- firebase.js           # All Firebase helpers (auth, gamification, daily_logs, buddy_requests)
+-- components/
    +-- AICamera.jsx          # AI Posture Arena — webcam + canvas skeleton + rep state machine
    +-- AuthModal.jsx         # Sign Up / Sign In / 1-click Demo Login modal
    +-- BuddyFinder.jsx       # Campus buddy matchmaking with Firestore invite persistence
    +-- Dashboard.jsx         # Home dashboard — health KPIs, activity logger, workout stream
    +-- DepartmentWars.jsx    # Live department leaderboard + top athletes spotlight
    +-- Navbar.jsx            # Top navigation + user XP pill
    +-- ToastContext.jsx      # Global toast notification system
```

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | Student profile, `totalPoints`, `squatCount`, `department`, streak |
| `workouts/{id}` | Workout sessions logged by AI Arena or manual logger |
| `daily_logs/{uid}/entries/{YYYY-MM-DD}` | Daily steps, water, sleep per student per day |
| `buddy_requests/{id}` | Buddy invite records (`fromUid`, `toBuddyProfileId`, `status`) |

Security rules are in [`firestore.rules`](./firestore.rules).

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Auth (Email/Password) and Firestore enabled

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your Firebase project credentials:
```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### 4. Start development server
```bash
npm run dev
```
Opens at `http://localhost:3000`

### 5. Build for production
```bash
npm run build
```

---

## Demo Login

For judges and reviewers without a student account, use the **1-click demo login** in the Auth modal:
- **Demo as CSE** — pre-provisioned demo account with 140 XP
- **Demo as ECE** — pre-provisioned demo account with 110 XP

The demo accounts are created automatically on first use via Firebase Auth.

---

## Team

| Member | Role | Track |
|---|---|---|
| Chandra Mouli | Team Lead / DevOps | CI/CD, GitHub Pages deployment |
| Sai | Vision ML | AI Pose Arena, MoveNet keypoint integration |
| Kalpana | Frontend | Design system, component architecture |
| Veda Laxmi | Firebase | Firestore schema, real-time listeners, security rules |
| Spandana | Buddy Matchmaking | BuddyFinder, buddy_requests Firestore schema |
| Naveena | UI/UX QA | Accessibility, device testing, QA protocols |

---

## SIH Problem Statement

**SIH26196** — Design a gamified campus fitness platform that uses AI-based posture correction to encourage healthy habits among students, with peer-to-peer accountability features.

*AuraFit makes every rep count for your department.*
