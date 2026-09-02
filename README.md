# AuraFit

AuraFit is a web app we built for Smart India Hackathon 2026 (Problem Statement SIH26196). The idea is simple: most students can't afford a smartwatch or gym subscription, and workout videos on YouTube don't tell you if your form is actually correct. So we built something that uses your laptop/phone camera to check your exercise form in real time, right in the browser, no extra hardware needed.

On top of that we added a couple of things to make it more fun to actually use:
- **Department Wars** – your points add up to your department's (CSE, ECE, EEE, MECH) total, so it turns into a friendly competition.
- **Buddy Finder** – find other students who work out at the same time/place as you.

## How it works

We use pose tracking to get 17 body joint positions from the camera feed and calculate joint angles from them (hip/knee/ankle for squats, shoulder/elbow/wrist for push-ups, etc.) using basic vector math — take two vectors between the joints and get the angle from their dot product:

```
θ = arccos( (u · v) / (|u| |v|) ) × 180/π
```

Each exercise has its own thresholds:
- **Squats** – depth counted below ~90° knee angle, rep confirmed once you stand back up past ~160°.
- **Push-ups** – same idea but at the elbow: below ~90° at the bottom, past ~160° at lockout.
- **Plank** – instead of a rep, this one checks you're holding a neutral spine angle (165°–180°) continuously for 5 seconds before it counts a round. Sagging or over-extending resets the timer.

```
webcam → pose landmarks → joint angle → rep/hold detected → points saved to Firebase → leaderboard updates
```

## Features

- Real-time form tracking for squats, push-ups, and plank, with a skeleton overlay on the camera feed
- Live angle readout + feedback text telling you what to fix
- Department leaderboard (CSE vs ECE vs EEE vs MECH), updates live via Firestore
- Buddy finder with filters for department, activity, and time slot
- Dashboard with water intake, steps, and manual workout logging
- Demo login button so you don't need to create an account just to try it out
- Works without a webcam too — there's a "simulate" button as a fallback for judging/testing
- Toast notifications instead of browser `alert()` popups

## Tech stack

- React 19 + Vite
- Firebase (Auth + Firestore) for accounts, points, and the live leaderboard
- `canvas-confetti` for the little celebration animation on rep completion
- Plain CSS, no UI framework

## Running it locally

```bash
git clone https://github.com/Sai-1234-kinetic-coder/aurafit-2026.git
cd aurafit-2026
npm install
npm run dev
```

If you want to use your own Firebase project, copy `.env.example` to `.env` and fill in your project's keys:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Without a `.env`, guest/demo login and the offline fallback leaderboard still work, but real sign-in and live Firestore sync won't — so make sure `.env` is set (both locally and on wherever you deploy it) before a real demo.

## Known limitations

- Rep/hold detection is angle-based, so odd camera angles can throw it off
- Leaderboard numbers fall back to hardcoded baseline values if Firestore can't be reached (e.g. campus wifi blocking it)
- No real pose-detection model wired in yet for the camera feed itself — the "simulate" button drives the demo for now

## Team

| Name | Worked on |
| --- | --- |
| Lalam Chandramouli | Overall architecture, repo, deployment |
| Lalam Sai Bharadwaj | Pose tracking & angle math |
| Kandregula Veda Laxmi | Firebase auth & Firestore |
| Lalam Kalpana | UI, dashboard, department wars |
| Kasireddi Spandana | Buddy finder |
| Kovvuri Naveena | Testing on low-end devices |
