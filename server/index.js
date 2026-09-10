/**
 * AuraFit High-Performance Standalone Backend API Server
 * Provides RESTful endpoints with sub-millisecond leaderboard aggregations.
 */

import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'AuraFit High-Performance Database Engine',
    timestamp: new Date().toISOString()
  });
});

// 1. Leaderboard & Department Wars (Sub-millisecond aggregation)
app.get('/api/leaderboard', (req, res) => {
  const standings = db.getDepartmentStandings();
  res.json(standings);
});

// 2. Athlete Profile
app.post('/api/athletes/profile', (req, res) => {
  const athlete = db.createOrUpdateAthlete(req.body);
  if (!athlete) return res.status(400).json({ error: 'user_id is required' });
  res.json(athlete);
});

app.get('/api/athletes/:id', (req, res) => {
  const athlete = db.getAthlete(req.params.id);
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
  res.json(athlete);
});

// 3. Points Increment (with Server Anti-Cheat Check)
app.post('/api/athletes/points', (req, res) => {
  const { user_id, reps } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const result = db.addSquatPoints(user_id, Number(reps || 1));
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// 4. Workout Logs
app.post('/api/workouts', (req, res) => {
  const workout = db.logWorkout(req.body);
  res.json(workout);
});

app.get('/api/workouts/:userId', (req, res) => {
  const list = db.getUserWorkouts(req.params.userId);
  res.json(list);
});

// 5. Daily Biometrics
app.post('/api/daily', (req, res) => {
  const { user_id, date, metrics } = req.body;
  if (!user_id || !date) return res.status(400).json({ error: 'user_id and date required' });
  const entry = db.logDailyMetrics(user_id, date, metrics);
  res.json(entry);
});

app.get('/api/daily/:userId/:date', (req, res) => {
  const log = db.getUserDailyLog(req.params.userId, req.params.date);
  res.json(log);
});

// 6. Buddy Matchmaking
app.post('/api/buddies/invite', (req, res) => {
  const { from_user_id, to_buddy_id, sport } = req.body;
  const invite = db.sendBuddyInvite(from_user_id, to_buddy_id, sport);
  res.json(invite);
});

app.get('/api/buddies/invites/:userId', (req, res) => {
  const invites = db.getMyBuddyInvites(req.params.userId);
  res.json(invites);
});

app.get('/api/buddies/incoming/:userId', (req, res) => {
  const incoming = db.getIncomingBuddyInvites(req.params.userId);
  res.json(incoming);
});

app.post('/api/buddies/respond', (req, res) => {
  const { invite_id, status } = req.body;
  const updated = db.respondToBuddyInvite(invite_id, status);
  res.json(updated || { error: 'Invite not found' });
});

app.get('/api/buddies/discover/:userId', (req, res) => {
  const peers = db.getDiscoverableAthletes(req.params.userId);
  res.json(peers);
});

// Start Server
app.listen(PORT, () => {
  console.log(`?? AuraFit Database Engine running at http://localhost:${PORT}`);
});
