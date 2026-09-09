# AuraFit — Production Build & Deployment Guide

## 1. Overview
**AuraFit** is an AI-powered human performance platform integrating real-time computer vision pose correction, metabolic calculation, guided mindfulness, tactical cognitive chess, and conversational coaching into a unified responsive web application.

---

## 2. Environment Configuration

Ensure your environment variables are configured in `.env` (refer to `.env.example`):

```bash
# Firebase Cloud Firestore & Auth
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Google Gemini API for Live Streaming AuraCoach AI
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** Even without API keys, AuraFit operates with zero degradation using its built-in offline sports science reasoning engine, Web Audio API synthesizer, and local storage fallback.

---

## 3. Production Build & Local Validation

To create an optimized production build:

```bash
# 1. Install dependencies
npm install

# 2. Build production bundle with Vite
npm run build

# 3. Preview production build locally
npm run preview
```

The output bundle will be generated in `dist/`:
- Minified HTML5, CSS3, and JavaScript modules.
- Pre-chunked vendor modules (`react`, `firebase`, `chess.js`, `lucide-react`).

---

## 4. Hosting & Deployment Guides

### Option A: Vercel (Recommended)
1. Push the code to a GitHub repository or use the Vercel CLI:
   ```bash
   npx vercel
   ```
2. Set **Build Command**: `npm run build`
3. Set **Output Directory**: `dist`
4. Add `vercel.json` for SPA route rewrites:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Option B: Netlify
1. Connect repository in the Netlify Dashboard.
2. Set **Build Command**: `npm run build`
3. Set **Publish Directory**: `dist`
4. Create a `public/_redirects` file with:
   ```text
   /*    /index.html   200
   ```

### Option C: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select 'dist' as public directory and configure as single-page app
firebase deploy --only hosting
```

---

## 5. Security & Privacy Guarantees

1. **Client-Side Vision Privacy**:
   - Webcams used for posture correction process all video frames purely in memory on the client device.
   - Zero video streams or camera frames are ever uploaded or transmitted externally.
2. **Medical Disclaimer Protocol**:
   - All metabolic targets, BMI screenings, and posture corrections carry prominent non-diagnostic disclaimers.
   - AuraCoach actively intercepts queries regarding injury, pain, or diagnosis, enforcing the PRICE protocol and directing users to licensed healthcare professionals.
3. **Audio Synthesis Resilience**:
   - All chimes, countdown beeps, singing bowls, and binaural soundscapes run through the browser native `AudioContext` without external MP3/WAV dependencies.

---

## 6. Dedicated Project Backup Path
The complete codebase is permanently mirrored and maintained at:
**`D:\new aura anti\`**
