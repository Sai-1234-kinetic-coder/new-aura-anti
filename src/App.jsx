import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  subscribeToDepartmentLeaderboard 
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AICamera from './components/AICamera';
import DepartmentWars from './components/DepartmentWars';
import BuddyFinder from './components/BuddyFinder';
import AuthModal from './components/AuthModal';
import { ToastProvider } from './components/ToastContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Realtime Data State
  const [deptLeaderboard, setDeptLeaderboard] = useState([
    { department: 'CSE', points: 340 },
    { department: 'ECE', points: 290 },
    { department: 'EEE', points: 190 },
    { department: 'MECH', points: 120 }
  ]);
  const [topAthletes, setTopAthletes] = useState([]);
  const [workouts, setWorkouts] = useState([
    { id: 'w1', exercise: 'AI Squats (20 reps)', duration: '3m 20s', pointsEarned: 200 },
    { id: 'w2', exercise: '5km Campus Track Run', duration: '24 mins', pointsEarned: 50 },
    { id: 'w3', exercise: 'Morning Core Yoga', duration: '15 mins', pointsEarned: 30 }
  ]);

  // Fetch Workouts for active user
  const fetchUserWorkouts = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const q = query(collection(db, "workouts"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setWorkouts(list.reverse());
      }
    } catch (err) {
      console.warn("Using local workout stream:", err);
    }
  }, []);

  // Listen to Auth State & User Profile
  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        fetchUserWorkouts(currentUser.uid);
        // Realtime User Profile Listener (for live XP updates)
        unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(prev => prev || {
              email: currentUser.email || "guest@campus.edu",
              department: "CSE",
              totalPoints: 140,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "Athlete"
            });
          }
        }, (err) => {
          console.warn("Profile listener fallback:", err);
        });
      } else {
        setUserProfile(null);
      }
    });

    // Live department leaderboard listener
    const unsubLeaderboard = subscribeToDepartmentLeaderboard((data) => {
      if (data?.departments) {
        setDeptLeaderboard(data.departments);
        setTopAthletes(data.topAthletes || []);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      unsubLeaderboard();
    };
  }, [fetchUserWorkouts]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored
    }
    setUser(null);
    setUserProfile(null);
    setActiveTab('dashboard');
  };

  // Immediate Local Demo Session Handler
  const handleGuestSession = (demoData) => {
    setUser({ uid: demoData.uid, email: demoData.email });
    setUserProfile(demoData);
    setShowAuthModal(false);
  };

  // Realtime Local State Boost (when reps are completed in AI Arena)
  const handlePointsEarned = (pointsGained, repsGained) => {
    setUserProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalPoints: (prev.totalPoints || 0) + pointsGained,
        squatCount: (prev.squatCount || 0) + repsGained
      };
    });

    setDeptLeaderboard(prev => {
      const userDept = userProfile?.department || 'CSE';
      return prev.map(d => {
        if (d.department === userDept) {
          return { ...d, points: d.points + pointsGained };
        }
        return d;
      }).sort((a, b) => b.points - a.points);
    });
  };

  const handleWorkoutSaved = (newWorkout) => {
    setWorkouts(prev => [newWorkout, ...prev]);
  };

  return (
    <ToastProvider>
      <div className="app-container">
        {/* Navbar Header */}
        <Navbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          userProfile={userProfile}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        {/* Main Tab Views */}
        <main>
          {activeTab === 'camera' ? (
            <AICamera 
              onBack={() => setActiveTab('dashboard')} 
              user={user}
              userProfile={userProfile}
              onPointsEarned={handlePointsEarned}
              onWorkoutSaved={handleWorkoutSaved}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          ) : activeTab === 'leaderboard' ? (
            <DepartmentWars 
              departments={deptLeaderboard}
              topAthletes={topAthletes}
              userProfile={userProfile}
              onLaunchArena={() => setActiveTab('camera')}
            />
          ) : activeTab === 'buddies' ? (
            <BuddyFinder user={user} />
          ) : (
            <Dashboard 
              user={user}
              userProfile={userProfile}
              workouts={workouts}
              onRefreshWorkouts={() => user && fetchUserWorkouts(user.uid)}
              onLaunchArena={() => setActiveTab('camera')}
              onOpenLeaderboard={() => setActiveTab('leaderboard')}
              onOpenBuddies={() => setActiveTab('buddies')}
              onLocalWorkoutLogged={handleWorkoutSaved}
            />
          )}
        </main>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            onGuestLogin={handleGuestSession}
          />
        )}
      </div>
    </ToastProvider>
  );
}
