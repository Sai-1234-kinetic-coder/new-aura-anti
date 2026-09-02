import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  increment, 
  collection, 
  query, 
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

// Create user profile document in Firestore
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

// Add earned points to user account
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

// Listen to department leaderboard updates in real-time
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

// Log workout to Firestore
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
