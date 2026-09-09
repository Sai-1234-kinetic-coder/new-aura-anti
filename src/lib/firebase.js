import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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

let appInstance = null;
let authInstance = null;
let dbInstance = null;

// Only initialize live Firebase if valid, real credentials are provided
const hasValidConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 10 && 
  !firebaseConfig.apiKey.includes("your_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("your_")
);

if (hasValidConfig) {
  try {
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.warn("Live Firebase initialization bypassed (running in Smart Local Athlete Mode):", err?.message);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
  }
} else {
  console.info("AuraFit: Running in Smart Local Athlete Mode (no cloud keys required).");
}

export const auth = authInstance;
export const db = dbInstance;
export const isLiveFirebase = Boolean(authInstance && dbInstance);

// Google OAuth Login
export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase Auth is running in smart local offline mode. Add valid Firebase keys in .env to use Google OAuth.");
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

// ---------------------------------------------------------------------------
// User Profiles
// ---------------------------------------------------------------------------

export async function createUserProfile(userId, email, department = "CSE", displayName = "") {
  if (!userId) return;
  const profile = {
    email,
    displayName: displayName || email.split("@")[0],
    department: department.toUpperCase(),
    totalPoints: 0,
    squatCount: 0,
    currentStreak: 1,
    sport: "Gym / Squats",
    year: "Student",
    hostel: "Campus Hostel",
    buddyOptIn: true,
    lastActive: new Date().toISOString()
  };

  if (!db) {
    try {
      localStorage.setItem('aurafit_local_user', JSON.stringify({ uid: userId, ...profile }));
    } catch (e) {}
    return;
  }

  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...profile,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
}

export async function updateUserProfile(userId, updates = {}) {
  if (!userId) return;
  try {
    const saved = localStorage.getItem('aurafit_local_user');
    if (saved) {
      const u = JSON.parse(saved);
      localStorage.setItem('aurafit_local_user', JSON.stringify({ ...u, ...updates }));
    }
  } catch (e) {}

  if (!db) return;

  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...updates,
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Error updating user profile:", err);
  }
}

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------

export async function addSquatPoints(userId, reps = 1) {
  if (!userId) return;
  const pts = 10 * reps;

  // Always update local cache first
  try {
    const saved = localStorage.getItem('aurafit_local_user');
    if (saved) {
      const u = JSON.parse(saved);
      u.totalPoints = (u.totalPoints || 0) + pts;
      u.squatCount = (u.squatCount || 0) + reps;
      localStorage.setItem('aurafit_local_user', JSON.stringify(u));
    }
  } catch (e) {}

  if (!db) return;

  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      totalPoints: increment(pts),
      squatCount: increment(reps),
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating points:", error);
  }
}

// ---------------------------------------------------------------------------
// Department Leaderboard (real-time with offline fallback)
// ---------------------------------------------------------------------------

export function subscribeToDepartmentLeaderboard(onUpdate) {
  const defaultDepts = [
    { department: 'CSE', points: 340 },
    { department: 'ECE', points: 290 },
    { department: 'EEE', points: 190 },
    { department: 'MECH', points: 120 }
  ];

  const defaultAthletes = [
    { id: '1', name: 'Aarav Sharma', department: 'CSE', points: 340, squats: 34 },
    { id: '2', name: 'Priya Mukherjee', department: 'ECE', points: 290, squats: 29 },
    { id: '3', name: 'Rohan Kulkarni', department: 'CSE', points: 260, squats: 26 },
    { id: '4', name: 'Ananya Verma', department: 'ECE', points: 210, squats: 21 },
    { id: '5', name: 'Neha Patel', department: 'EEE', points: 190, squats: 19 }
  ];

  if (!db) {
    onUpdate({
      departments: defaultDepts,
      topAthletes: defaultAthletes
    });
    return () => {};
  }

  try {
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
        departments: defaultDepts,
        topAthletes: defaultAthletes
      });
    });
  } catch (err) {
    onUpdate({
      departments: defaultDepts,
      topAthletes: defaultAthletes
    });
    return () => {};
  }
}

// ---------------------------------------------------------------------------
// Workout Log
// ---------------------------------------------------------------------------

export async function logWorkout(userId, exercise, duration, pointsEarned = 0) {
  if (!userId) return;
  const newWorkout = {
    id: 'w_' + Date.now(),
    userId,
    exercise,
    duration,
    pointsEarned,
    createdAt: new Date().toISOString()
  };

  try {
    const saved = localStorage.getItem('aurafit_local_workouts');
    const list = saved ? JSON.parse(saved) : [];
    list.unshift(newWorkout);
    localStorage.setItem('aurafit_local_workouts', JSON.stringify(list.slice(0, 30)));
  } catch (e) {}

  if (!db) return;

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
// Daily Health Metrics
// ---------------------------------------------------------------------------

function todayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function logDailyMetrics(userId, metrics = {}) {
  if (!userId) return;
  const dateKey = todayDateKey();

  try {
    const current = JSON.parse(localStorage.getItem(`aurafit_daily_${dateKey}`) || '{}');
    localStorage.setItem(`aurafit_daily_${dateKey}`, JSON.stringify({ ...current, ...metrics }));
  } catch (e) {}

  if (!db) return;

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

export function subscribeToUserDailyLog(userId, onUpdate) {
  const dateKey = todayDateKey();
  const localData = (() => {
    try {
      return JSON.parse(localStorage.getItem(`aurafit_daily_${dateKey}`) || '{}');
    } catch {
      return {};
    }
  })();

  if (!userId || !db) {
    onUpdate(localData);
    return () => {};
  }

  try {
    const logRef = doc(db, "daily_logs", userId, "entries", dateKey);
    return onSnapshot(logRef, (snap) => {
      onUpdate(snap.exists() ? snap.data() : localData);
    }, () => {
      onUpdate(localData);
    });
  } catch {
    onUpdate(localData);
    return () => {};
  }
}

// ---------------------------------------------------------------------------
// Buddy Matchmaking
// ---------------------------------------------------------------------------

export async function sendBuddyInvite(fromUid, toBuddyProfileId, sport = "") {
  if (!fromUid) return;
  try {
    const saved = localStorage.getItem('aurafit_buddies_invited');
    const list = saved ? JSON.parse(saved) : [];
    if (!list.includes(String(toBuddyProfileId))) {
      list.push(String(toBuddyProfileId));
      localStorage.setItem('aurafit_buddies_invited', JSON.stringify(list));
    }
  } catch (e) {}

  if (!db) return;

  try {
    await addDoc(collection(db, "buddy_requests"), {
      fromUid,
      toBuddyProfileId: String(toBuddyProfileId),
      sport,
      status: "pending",
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Could not save invite to cloud, preserved locally:", error);
  }
}

export async function getMyBuddyInvites(fromUid) {
  const localList = (() => {
    try {
      const s = localStorage.getItem('aurafit_buddies_invited');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  })();

  if (!fromUid || !db) return localList;

  try {
    const q = query(
      collection(db, "buddy_requests"),
      where("fromUid", "==", fromUid),
      limit(100)
    );
    return new Promise((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        unsub();
        const ids = snap.docs.map((d) => d.data().toBuddyProfileId);
        resolve([...new Set([...localList, ...ids])]);
      }, () => resolve(localList));
    });
  } catch {
    return localList;
  }
}

export function subscribeToIncomingBuddyInvites(myUid, onUpdate) {
  if (!myUid || !db) {
    onUpdate([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, "buddy_requests"),
      where("toBuddyProfileId", "==", String(myUid)),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const invites = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(invites);
    }, (err) => {
      console.warn("Incoming invites listener fallback:", err?.message);
      onUpdate([]);
    });
  } catch (err) {
    onUpdate([]);
    return () => {};
  }
}

export async function respondToBuddyInvite(requestId, newStatus = "accepted") {
  if (!db || !requestId) return;
  try {
    const ref = doc(db, "buddy_requests", requestId);
    await setDoc(ref, {
      status: newStatus,
      respondedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not respond to invite:", err);
  }
}

export function subscribeToDiscoverableAthletes(onUpdate) {
  if (!db) {
    onUpdate([]);
    return () => {};
  }

  try {
    const q = query(collection(db, "users"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.displayName || data.email?.split("@")[0] || "Campus Athlete",
          dept: (data.department || "CSE").toUpperCase(),
          year: data.year || "Student",
          sport: data.sport || "Gym / Squats",
          time: data.time || "6:00 PM",
          streak: `${data.currentStreak || 1} Days`,
          level: (data.totalPoints || 0) > 300 ? "Elite" : (data.totalPoints || 0) > 100 ? "Pro" : "Athlete",
          bio: data.bio || `Active campus athlete with ${data.totalPoints || 0} XP.`,
          hostel: data.hostel || "Campus Hostel",
          isLiveCloudUser: true
        };
      });
      onUpdate(users);
    }, (err) => {
      console.warn("Discoverable athletes fallback:", err?.message);
      onUpdate([]);
    });
  } catch {
    onUpdate([]);
    return () => {};
  }
}
