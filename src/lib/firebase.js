import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  increment, 
  collection, 
  query, 
  where,
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------------------------------------------------------------------------
// User Profiles
// ---------------------------------------------------------------------------

/**
 * Create or merge a user profile document in the `users` collection.
 * Uses merge:true so partial updates don't overwrite existing data.
 */
export async function createUserProfile(userId, email, department = "CSE", displayName = "") {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(userRef, {
      email,
      displayName: displayName || email.split("@")[0],
      department: department.toUpperCase(),
      totalPoints: 0,
      squatCount: 0,
      currentStreak: 1,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
}

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------

/**
 * Atomically increment totalPoints and squatCount for a user.
 * Works for all exercise types tracked by AICamera — "squatCount" is a
 * generic "rep count" field; the name is kept for backward-compat.
 */
export async function addSquatPoints(userId, reps = 1) {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(userRef, {
      totalPoints: increment(10 * reps),
      squatCount: increment(reps),
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating points:", error);
  }
}

// ---------------------------------------------------------------------------
// Department Leaderboard (real-time)
// ---------------------------------------------------------------------------

/**
 * Subscribe to a live department leaderboard by summing totalPoints
 * across all users grouped by department.
 * Returns an unsubscribe function.
 */
export function subscribeToDepartmentLeaderboard(onUpdate) {
  const usersQuery = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(100));

  return onSnapshot(usersQuery, (snapshot) => {
    const departmentTotals = {
      CSE: 0,
      ECE: 0,
      EEE: 0,
      MECH: 0,
      IT: 0,
      CIVIL: 0
    };

    const topAthletes = [];

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const dept = (data.department || "CSE").toUpperCase();
      departmentTotals[dept] = (departmentTotals[dept] || 0) + (data.totalPoints || 0);

      topAthletes.push({
        id: docSnap.id,
        name: data.displayName || data.email?.split("@")[0] || "Student Athlete",
        department: dept,
        points: data.totalPoints || 0,
        squats: data.squatCount || 0
      });
    });

    const formattedDepartments = Object.keys(departmentTotals)
      .filter((dept) => departmentTotals[dept] > 0 || ['CSE', 'ECE', 'EEE', 'MECH'].includes(dept))
      .map((dept) => ({
        department: dept,
        points: departmentTotals[dept]
      })).sort((a, b) => b.points - a.points);

    onUpdate({
      departments: formattedDepartments,
      topAthletes: topAthletes.slice(0, 5)
    });
  }, (error) => {
    console.warn("Using offline leaderboard data:", error.message);
    onUpdate({
      departments: [
        { department: 'CSE', points: 340 },
        { department: 'ECE', points: 290 },
        { department: 'EEE', points: 190 },
        { department: 'MECH', points: 120 }
      ],
      topAthletes: [
        { id: '1', name: 'Aarav Sharma', department: 'CSE', points: 340, squats: 34 },
        { id: '2', name: 'Priya Mukherjee', department: 'ECE', points: 290, squats: 29 },
        { id: '3', name: 'Rohan Kulkarni', department: 'CSE', points: 260, squats: 26 },
        { id: '4', name: 'Ananya Verma', department: 'ECE', points: 210, squats: 21 },
        { id: '5', name: 'Neha Patel', department: 'EEE', points: 190, squats: 19 }
      ]
    });
  });
}

// ---------------------------------------------------------------------------
// Workout Log
// ---------------------------------------------------------------------------

/**
 * Append a completed workout session to the `workouts` collection.
 */
export async function logWorkout(userId, exercise, duration, pointsEarned = 0) {
  if (!userId) return;
  try {
    await addDoc(collection(db, "workouts"), {
      userId,
      exercise,
      duration,
      pointsEarned,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging workout:", error);
  }
}

// ---------------------------------------------------------------------------
// Daily Health Metrics (new — closes the daily_logs schema gap)
// ---------------------------------------------------------------------------

/**
 * Returns the ISO date string for today in YYYY-MM-DD format (local time).
 */
function todayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Persist today's health metrics for a user.
 * Schema: daily_logs/{userId}/{YYYY-MM-DD}
 * Uses merge:true so individual metric updates don't overwrite each other.
 *
 * @param {string} userId
 * @param {{ steps?: number, waterLiters?: number, sleepHours?: number }} metrics
 */
export async function logDailyMetrics(userId, metrics = {}) {
  if (!userId) return;
  const dateKey = todayDateKey();
  const logRef = doc(db, "daily_logs", userId, "entries", dateKey);
  try {
    await setDoc(logRef, {
      ...metrics,
      date: dateKey,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error logging daily metrics:", error);
  }
}

/**
 * Subscribe to the current user's daily health log for today.
 * Calls onUpdate with the document data (or an empty object if not found).
 * Returns an unsubscribe function.
 *
 * @param {string} userId
 * @param {(data: object) => void} onUpdate
 */
export function subscribeToUserDailyLog(userId, onUpdate) {
  if (!userId) {
    onUpdate({});
    return () => {};
  }
  const dateKey = todayDateKey();
  const logRef = doc(db, "daily_logs", userId, "entries", dateKey);

  return onSnapshot(logRef, (snap) => {
    onUpdate(snap.exists() ? snap.data() : {});
  }, (error) => {
    console.warn("Daily log offline fallback:", error.message);
    onUpdate({});
  });
}

// ---------------------------------------------------------------------------
// Buddy Matchmaking (new — closes the buddy_requests schema gap)
// ---------------------------------------------------------------------------

/**
 * Send a buddy workout invite.
 * Schema: buddy_requests/{auto-id}
 *   fromUid, toBuddyProfileId, sport, status: 'pending', createdAt
 *
 * @param {string} fromUid        - Firebase Auth UID of the requesting user
 * @param {string|number} toBuddyProfileId - ID of the buddy profile (mock or real)
 * @param {string} sport          - Activity type (e.g., "Gym / Squats")
 */
export async function sendBuddyInvite(fromUid, toBuddyProfileId, sport = "") {
  if (!fromUid) return;
  try {
    await addDoc(collection(db, "buddy_requests"), {
      fromUid,
      toBuddyProfileId: String(toBuddyProfileId),
      sport,
      status: "pending",
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending buddy invite:", error);
    // Re-throw so caller can fall back to localStorage
    throw error;
  }
}

/**
 * Get the list of buddy profile IDs that the current user has already
 * sent invites to (one-time read, not real-time).
 *
 * @param {string} fromUid
 * @returns {Promise<string[]>} array of toBuddyProfileId strings
 */
export async function getMyBuddyInvites(fromUid) {
  if (!fromUid) return [];
  try {
    const q = query(
      collection(db, "buddy_requests"),
      where("fromUid", "==", fromUid),
      limit(100)
    );
    // We use getDocs via onSnapshot one-shot pattern
    return new Promise((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        unsub();
        resolve(snap.docs.map((d) => d.data().toBuddyProfileId));
      }, () => resolve([]));
    });
  } catch {
    return [];
  }
}


