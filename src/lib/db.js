/**
 * AuraFit — Unified High-Concurrency Database Layer
 * Automatically routes to Supabase PostgreSQL (Primary High-Concurrency Engine),
 * Firebase Cloud Firestore, or Smart Local Storage based on environment configuration.
 */

import * as supabaseLib from './supabase';
import * as firebaseLib from './firebase';

export const isLiveSupabase = supabaseLib.isLiveSupabase;
export const isLiveFirebase = firebaseLib.isLiveFirebase;
export const activeDatabaseEngine = isLiveSupabase 
  ? 'Supabase PostgreSQL' 
  : isLiveFirebase 
  ? 'Firebase Firestore' 
  : 'Smart Local Storage';

console.info(`? AuraFit Active Database Engine: ${activeDatabaseEngine}`);

// 1. User / Athlete Profile
export async function createUserProfile(userId, emailOrPhone, department = "CSE", displayName = "") {
  if (isLiveSupabase) {
    return await supabaseLib.createAthleteProfile(userId, emailOrPhone, department, displayName);
  }
  return await firebaseLib.createUserProfile(userId, emailOrPhone, department, displayName);
}

export async function updateUserProfile(userId, updates = {}) {
  if (isLiveSupabase) {
    return await supabaseLib.updateAthleteProfile(userId, updates);
  }
  return await firebaseLib.updateUserProfile(userId, updates);
}

// 2. High-Concurrency Squat Points (Anti-Cheat Enforced)
export async function addSquatPoints(userId, reps = 1) {
  if (isLiveSupabase) {
    return await supabaseLib.addSquatPoints(userId, reps);
  }
  return await firebaseLib.addSquatPoints(userId, reps);
}

// 3. Department Wars Realtime Leaderboard
export function subscribeToDepartmentLeaderboard(onUpdate) {
  if (isLiveSupabase) {
    return supabaseLib.subscribeToDepartmentLeaderboard(onUpdate);
  }
  return firebaseLib.subscribeToDepartmentLeaderboard(onUpdate);
}

// 4. Workout History Logging
export async function logWorkout(userId, exercise, duration, pointsEarned = 0) {
  if (isLiveSupabase) {
    return await supabaseLib.logWorkout(userId, exercise, duration, pointsEarned);
  }
  return await firebaseLib.logWorkout(userId, exercise, duration, pointsEarned);
}

export async function getUserWorkouts(userId) {
  if (isLiveSupabase) {
    return await supabaseLib.getUserWorkouts(userId);
  }
  // Firestore / local fallback
  return [];
}

// 5. Daily Biometrics
export async function logDailyMetrics(userId, metrics = {}) {
  if (isLiveSupabase) {
    return await supabaseLib.logDailyMetrics(userId, metrics);
  }
  return await firebaseLib.logDailyMetrics(userId, metrics);
}

export function subscribeToUserDailyLog(userId, onUpdate) {
  if (isLiveSupabase) {
    return supabaseLib.subscribeToUserDailyLog(userId, onUpdate);
  }
  return firebaseLib.subscribeToUserDailyLog(userId, onUpdate);
}

// 6. Buddy Matchmaking
export async function sendBuddyInvite(fromUserId, toBuddyId, sport) {
  if (isLiveSupabase) {
    return await supabaseLib.sendBuddyInvite(fromUserId, toBuddyId, sport);
  }
  return await firebaseLib.sendBuddyInvite(fromUserId, toBuddyId, sport);
}

export async function getMyBuddyInvites(fromUserId) {
  if (isLiveSupabase) {
    return await supabaseLib.getMyBuddyInvites(fromUserId);
  }
  return await firebaseLib.getMyBuddyInvites(fromUserId);
}

export function subscribeToIncomingBuddyInvites(currentUserId, onUpdate) {
  if (isLiveSupabase) {
    return supabaseLib.subscribeToIncomingBuddyInvites(currentUserId, onUpdate);
  }
  return firebaseLib.subscribeToIncomingBuddyInvites(currentUserId, onUpdate);
}

export async function respondToBuddyInvite(inviteId, status) {
  if (isLiveSupabase) {
    return await supabaseLib.respondToBuddyInvite(inviteId, status);
  }
  return await firebaseLib.respondToBuddyInvite(inviteId, status);
}

export function subscribeToDiscoverableAthletes(currentUserId, onUpdate) {
  if (isLiveSupabase) {
    return supabaseLib.subscribeToDiscoverableAthletes(currentUserId, onUpdate);
  }
  return firebaseLib.subscribeToDiscoverableAthletes(currentUserId, onUpdate);
}
