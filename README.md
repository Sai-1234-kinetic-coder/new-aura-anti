# AuraFit — AI-Powered Gamified Campus Fitness & Performance Platform
### Smart India Hackathon 2026 | Problem Statement SIH26196

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Firebase](https://img.shields.io/badge/backend-Firebase%2012-orange)](#)
[![React](https://img.shields.io/badge/frontend-React%2019-61dafb)](#)
[![Vision](https://img.shields.io/badge/vision-MediaPipe%20Pose-blue)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#)

> **AuraFit** transforms campus fitness into an engaging, gamified, and scientifically rigorous experience. Students correct workout posture in real time using on-device computer vision, compete in campus Department Wars, match with workout buddies, plan precision metabolic nutrition, calibrate mental focus through guided mudras and box breathing, and sharpen cognitive stamina through tactical chess — all running directly in the browser with 100% on-device privacy.

---

## 🏛️ The 8 Performance Chambers

| Chamber | Feature | Description & Technology |
|---|---|---|
| **Chamber 1** | **Metabolic Trainer & BMI** | Harris-Benedict BMR, Mifflin-St Jeor TDEE, macronutrient distribution, and somatic profiling (Ectomorph / Mesomorph / Endomorph). |
| **Chamber 2** | **AI Vision Camera** | Real-time on-device 33-landmark **MediaPipe Pose** computer vision. Tracks Squats, Pushups, Jumping Jacks, Planks, and Warrior II with joint trigonometry, rep counting, hold timers, and synthetic voice cues. |
| **Chamber 3** | **AuraCoach Conversational AI** | Context-aware multi-mode sports assistant (Fitness, Nutrition, Mindset, Chess). Powered by Google Gemini 1.5 Flash streaming with built-in contextual sports science reasoning fallback. |
| **Chamber 4** | **Smart Wellness Tools** | HIIT / Tabata interval timers, stopwatch with laps, countdown timer, and smart hydration alarms with native browser notifications and audio chimes. |
| **Chamber 5** | **Mental Wellness & Mudras** | Guided 4-4-4-4 Box Breathing and 4-7-8 cycles, traditional Mudras anatomical dictionary, and procedural soundscapes (binaural theta waves, zen rain, Tibetan singing bowls) via Web Audio API. |
| **Chamber 6** | **Cognitive Tactical Chess** | Interactive chessboard powered by `chess.js`, playing against an AI bot with 5 difficulty tiers, tactical puzzle challenges with move validation, and dynamic Elo tracking. |
| **Chamber 7** | **Gaming Arena** | 60-Second AI Ghost Athlete Duels, Titan Boss Raid endurance battles, unlockable achievement badges, and celebratory particle confetti. |
| **Chamber 8** | **Department Wars & Buddy Finder** | Real-time campus department leaderboards (CSE, ECE, EEE, MECH, etc.) and two-way peer workout buddy matchmaking with incoming invite inboxes. |

---

## 🛠️ Technology Stack

- **Frontend Core:** React 19 + Vite 7 (ES Modules, modern JSX)
- **Styling:** Curated Vanilla CSS Design System (`src/index.css`) with glassmorphism, responsive grid, neon accents, and dark mode tokens
- **Typography:** Inter & Outfit (Google Fonts)
- **On-Device Computer Vision:** MediaPipe Pose (33 full-body skeletal landmarks at 30+ FPS directly in-browser)
- **Procedural Audio:** Native browser `AudioContext` Web Audio synthesizer (binaural theta waves, chimes, countdown beeps, singing bowls)
- **Cloud Backend:** Firebase v12 (Authentication, Firestore real-time `onSnapshot` subscriptions)
- **Cognitive Engine:** `chess.js` (rule validation, FEN parsing, tactical analysis)
- **AI Intelligence:** Google Gemini 1.5 Flash (serverless proxy + client streaming)
- **Icons & Effects:** `lucide-react`, `canvas-confetti`
- **PWA Ready:** Web App Manifest (`public/manifest.json`) for 1-click home-screen installation on mobile

---

## 🔒 Security, Ethics & Privacy Guarantees

1. **100% Zero Cloud Video Streaming**:
   Webcam video frames are processed strictly in-memory on the client device via MediaPipe WebAssembly. Zero video streams or camera images are ever recorded or transmitted to any external server.
2. **Server-Side Firestore Write Validation**:
   Points and squat increments are strictly constrained in `firestore.rules`:
   - Starter profile points are capped at <= 150 XP.
   - Profile updates strictly enforce a maximum positive delta of <= 200 XP per transaction, preventing client-side point manipulation or spoofing.
   - Deletes are globally denied.
3. **Medical Disclaimer Protocol**:
   All metabolic recommendations and posture corrections carry non-diagnostic disclaimers. AuraCoach intercepts injury and clinical pain queries, enforces the PRICE protocol, and directs users to licensed medical professionals.

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Sai-1234-kinetic-coder/new-aura-anti.git
cd new-aura-anti
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Google Gemini API Key for Live Streaming AuraCoach
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** Even with empty API keys, AuraFit operates with zero degradation using its **Smart Local Athlete Mode** (persisted in `localStorage` with offline sports science reasoning).

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

- **Vercel / Netlify**: Pre-configured with `vercel.json` and `public/_redirects` for single-page routing.
- **GitHub Pages**: Automatically deployed via `.github/workflows/deploy.yml` on pushes to `main`.
- **Live Demo**: [https://sai-1234-kinetic-coder.github.io/new-aura-anti/](https://sai-1234-kinetic-coder.github.io/new-aura-anti/)

---

## 📄 License
MIT (c) 2026 AuraFit Team. Developed for Smart India Hackathon 2026.
