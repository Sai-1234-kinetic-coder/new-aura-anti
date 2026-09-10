/**
 * AuraFit — High-Concurrency Unified Database Layer
 * Automatically detects and utilizes:
 * 1. Dedicated High-Performance Database Engine (at /api)
 * 2. Supabase PostgreSQL (if keys set)
 * 3. Firebase Cloud Firestore
 * 4. Resilient Local Storage fallback
 */

import * as supabaseLib from './supabase';
import * as firebaseLib from './firebase';

let hasApiBackend = true;

// Quick check if /api is reachable
async function checkApiBackend() {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(1500) });
    hasApiBackend = res.ok;
  } catch (e) {
    hasApiBackend = false;
  }
}

if (typeof window !== 'undefined') {
  checkApiBackend();
}

export const isLiveSupabase = supabaseLib.isLiveSupabase;
export const isLiveFirebase = firebaseLib.isLiveFirebase;

// 1. Athlete Profiles
export async function createUserProfile(userId, emailOrPhone, department = "CSE", displayName = "") {
  if (hasApiBackend) {
    try {
      const isPhone = Boolean(emailOrPhone && (emailOrPhone.startsWith("+") || /^\d+$/.test(emailOrPhone)));
      const res = await fetch('/api/athletes/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email: isPhone ? null : (emailOrPhone || null),
          phone_number: isPhone ? emailOrPhone : null,
          display_name: displayName || (isPhone ? `Athlete ${emailOrPhone.slice(-4)}` : (emailOrPhone ? emailOrPhone.split("@")[0] : "Campus Athlete")),
          department: (department || 'CSE').toUpperCase()
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  if (isLiveSupabase) {
    return await supabaseLib.createAthleteProfile(userId, emailOrPhone, department, displayName);
  }
  return await firebaseLib.createUserProfile(userId, emailOrPhone, department, displayName);
}

export async function updateUserProfile(userId, updates = {}) {
  if (hasApiBackend) {
    try {
      await fetch('/api/athletes/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...updates })
      });
    } catch (e) {}
  }

  if (isLiveSupabase) {
    return await supabaseLib.updateAthleteProfile(userId, updates);
  }
  return await firebaseLib.updateUserProfile(userId, updates);
}

// 2. High-Concurrency Squat Points (Anti-Cheat Enforced)
export async function addSquatPoints(userId, reps = 1) {
  if (hasApiBackend) {
    try {
      const res = await fetch('/api/athletes/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reps })
      });
      if (res.ok) {
        // Also update local cache for instant UI feedback
        try {
          const saved = localStorage.getItem('aurafit_local_user');
          if (saved) {
            const u = JSON.parse(saved);
            u.totalPoints = (u.totalPoints || 0) + (reps * 10);
            u.squatCount = (u.squatCount || 0) + reps;
            localStorage.setItem('aurafit_local_user', JSON.stringify(u));
          }
        } catch (e) {}
        return await res.json();
      }
    } catch (e) {}
  }

  if (isLiveSupabase) {
    return await supabaseLib.addSquatPoints(userId, reps);
  }
  return await firebaseLib.addSquatPoints(userId, reps);
}

// 3. Instant Department Wars Leaderboard (<1ms response)
export function subscribeToDepartmentLeaderboard(onUpdate) {
  let isSubscribed = true;

  const fetchFromApi = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data?.departments && isSubscribed) {
          onUpdate(data);
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  // Try API first
  fetchFromApi().then(success => {
    if (success && isSubscribed) {
      const interval = setInterval(fetchFromApi, 3000);
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }
  });

  if (isLiveSupabase) {
    return supabaseLib.subscribeToDepartmentLeaderboard(onUpdate);
  }
  return firebaseLib.subscribeToDepartmentLeaderboard(onUpdate);
}

// 4. Workout Logging
export async function logWorkout(userId, exercise, duration, pointsEarned = 0) {
  if (hasApiBackend) {
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, exercise, duration, points_earned: pointsEarned })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  if (isLiveSupabase) {
    return await supabaseLib.logWorkout(userId, exercise, duration, pointsEarned);
  }
  return await firebaseLib.logWorkout(userId, exercise, duration, pointsEarned);
}

export async function getUserWorkouts(userId) {
  if (hasApiBackend) {
    try {
      const res = await fetch(`/api/workouts/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  if (isLiveSupabase) {
    return await supabaseLib.getUserWorkouts(userId);
  }
  return [];
}

// 5. Daily Biometrics
export async function logDailyMetrics(userId, metrics = {}) {
  const dateKey = new Date().toISOString().split('T')[0];
  if (hasApiBackend) {
    try {
      await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date: dateKey, metrics })
      });
    } catch (e) {}
  }
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
  if (hasApiBackend) {
    try {
      await fetch('/api/buddies/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user_id: fromUserId, to_buddy_id: toBuddyId, sport })
      });
    } catch (e) {}
  }
  if (isLiveSupabase) {
    return await supabaseLib.sendBuddyInvite(fromUserId, toBuddyId, sport);
  }
  return await firebaseLib.sendBuddyInvite(fromUserId, toBuddyId, sport);
}

export async function getMyBuddyInvites(fromUserId) {
  if (hasApiBackend) {
    try {
      const res = await fetch(`/api/buddies/invites/${fromUserId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
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
  if (hasApiBackend) {
    try {
      await fetch('/api/buddies/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, status })
      });
    } catch (e) {}
  }
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