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

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Realtime Data State
  const [deptLeaderboard, setDeptLeaderboard] = useState([]);
  const [topAthletes, setTopAthletes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Workouts for active user
  const fetchUserWorkouts = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const q = query(collection(db, "workouts"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWorkouts(list.reverse());
    } catch (err) {
      console.error("Error fetching workouts:", err);
    }
  }, []);

  // Listen to Auth State & User Profile
  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchUserWorkouts(currentUser.uid);
        // Realtime User Profile Listener (for live XP updates)
        unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile({
              email: currentUser.email || "guest@campus.edu",
              department: "CSE",
              totalPoints: 0,
              displayName: currentUser.email?.split('@')[0] || "Athlete"
            });
          }
        });
      } else {
        setUserProfile(null);
        setWorkouts([]);
      }
    });

    // Realtime Department Leaderboard Listener (SIH Task 2)
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
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setActiveTab('dashboard');
  };

  return (
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
          />
        ) : activeTab === 'leaderboard' ? (
          <DepartmentWars 
            departments={deptLeaderboard}
            topAthletes={topAthletes}
            userProfile={userProfile}
            onLaunchArena={() => setActiveTab('camera')}
          />
        ) : activeTab === 'buddies' ? (
          <BuddyFinder />
        ) : (
          <Dashboard 
            user={user}
            userProfile={userProfile}
            workouts={workouts}
            onRefreshWorkouts={() => user && fetchUserWorkouts(user.uid)}
            onLaunchArena={() => setActiveTab('camera')}
            onOpenLeaderboard={() => setActiveTab('leaderboard')}
            onOpenBuddies={() => setActiveTab('buddies')}
          />
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
