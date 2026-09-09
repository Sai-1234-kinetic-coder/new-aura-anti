import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  subscribeToDepartmentLeaderboard 
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingHero from './components/LandingHero';
import Dashboard from './components/Dashboard';
import AICamera from './components/AICamera';
import DepartmentWars from './components/DepartmentWars';
import BuddyFinder from './components/BuddyFinder';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContext';

// Chamber Foundations
import MetabolicTrainer from './components/chambers/MetabolicTrainer';
import AuraCoach from './components/chambers/AuraCoach';
import WellnessTools from './components/chambers/WellnessTools';
import MentalWellness from './components/chambers/MentalWellness';
import ChessCognitive from './components/chambers/ChessCognitive';
import GamingArena from './components/chambers/GamingArena';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    if (!db) {
      const saved = localStorage.getItem('aurafit_local_workouts');
      if (saved) {
        try { setWorkouts(JSON.parse(saved)); } catch (e) {}
      }
      return;
    }
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
    // If no live Firebase backend, initialize Smart Local Athlete Mode
    if (!auth) {
      const savedUser = localStorage.getItem('aurafit_local_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser({ uid: parsed.uid || 'local_athlete', email: parsed.email, displayName: parsed.displayName });
          setUserProfile(parsed);
          fetchUserWorkouts(parsed.uid || 'local_athlete');
        } catch (e) {}
      } else {
        const defaultProfile = {
          uid: 'student_athlete_1',
          email: 'athlete@aurafit.campus',
          department: 'CSE',
          totalPoints: 140,
          currentStreak: 3,
          displayName: 'Campus Athlete'
        };
        setUser({ uid: defaultProfile.uid, email: defaultProfile.email, displayName: defaultProfile.displayName });
        setUserProfile(defaultProfile);
        try {
          localStorage.setItem('aurafit_local_user', JSON.stringify(defaultProfile));
        } catch (e) {}
      }

      // Live department leaderboard listener (works offline too)
      const unsubLeaderboard = subscribeToDepartmentLeaderboard((data) => {
        if (data?.departments) setDeptLeaderboard(data.departments);
        if (data?.topAthletes) setTopAthletes(data.topAthletes || []);
      });
      return () => unsubLeaderboard();
    }

    // Live Firebase Auth Listener
    let unsubProfile = null;
    let unsubAuth = null;
    try {
      unsubAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          fetchUserWorkouts(currentUser.uid);
          if (db) {
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
          }
        } else {
          setUserProfile(null);
        }
      });
    } catch (e) {
      console.warn("Auth state change error:", e);
    }

    // Live department leaderboard listener
    const unsubLeaderboard = subscribeToDepartmentLeaderboard((data) => {
      if (data?.departments) {
        setDeptLeaderboard(data.departments);
        setTopAthletes(data.topAthletes || []);
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubProfile) unsubProfile();
      unsubLeaderboard();
    };
  }, [fetchUserWorkouts]);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    setUser(null);
    setUserProfile(null);
    try {
      localStorage.removeItem('aurafit_local_user');
    } catch (e) {}
    setActiveTab('dashboard');
  };

  // Immediate Local Demo Session Handler
  const handleGuestSession = (demoData) => {
    const profile = demoData || {
      uid: 'guest_' + Date.now(),
      email: 'athlete@aurafit.campus',
      department: 'CSE',
      totalPoints: 140,
      displayName: 'Campus Athlete'
    };
    setUser({ uid: profile.uid, email: profile.email });
    setUserProfile(profile);
    try {
      localStorage.setItem('aurafit_local_user', JSON.stringify(profile));
    } catch (e) {}
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
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Main Tab Views Protected by Chamber Error Boundary */}
        <ErrorBoundary onReset={() => setActiveTab('dashboard')}>
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
            ) : activeTab === 'trainer' ? (
              <MetabolicTrainer 
                user={user} 
                userProfile={userProfile} 
                onLaunchCamera={() => setActiveTab('camera')} 
              />
            ) : activeTab === 'coach' ? (
              <AuraCoach userProfile={userProfile} />
            ) : activeTab === 'tools' ? (
              <WellnessTools />
            ) : activeTab === 'mind' ? (
              <MentalWellness onPointsEarned={handlePointsEarned} />
            ) : activeTab === 'chess' ? (
              <ChessCognitive onPointsEarned={handlePointsEarned} />
            ) : activeTab === 'arena' ? (
              <GamingArena 
                userProfile={userProfile}
                onLaunchCamera={() => setActiveTab('camera')} 
                onOpenLeaderboard={() => setActiveTab('leaderboard')} 
                onPointsEarned={handlePointsEarned}
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
              <>
                <LandingHero 
                  setActiveTab={setActiveTab} 
                  onOpenAuth={() => setShowAuthModal(true)} 
                  user={user} 
                />
                <Dashboard 
                  user={user}
                  userProfile={userProfile}
                  workouts={workouts}
                  onRefreshWorkouts={() => user && fetchUserWorkouts(user.uid)}
                  onLaunchArena={() => setActiveTab('camera')}
                  onOpenLeaderboard={() => setActiveTab('leaderboard')}
                  onOpenBuddies={() => setActiveTab('buddies')}
                  onLocalWorkoutLogged={handleWorkoutSaved}
                  setActiveTab={setActiveTab}
                />
              </>
            )}
          </main>
        </ErrorBoundary>

        {/* Footer */}
        <Footer setActiveTab={setActiveTab} />

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            onGuestLogin={handleGuestSession}
          />
        )}

        {/* Platform & AI Settings Modal */}
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      </div>
    </ToastProvider>
  );
}
