import React, { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { sendBuddyInvite, getMyBuddyInvites } from '../lib/firebase';
import { 
  Users, 
  Search, 
  Filter, 
  Flame, 
  Clock, 
  MapPin, 
  UserCheck, 
  UserPlus, 
  Sparkles,
  Heart,
  Tag
} from 'lucide-react';

const MOCK_CAMPUS_PROFILES = [
  { id: 1, name: "Aarav Sharma", dept: "CSE", year: "3rd Year", sport: "Gym / Squats", time: "6:00 AM", streak: "14 Days", level: "Elite", bio: "Aiming for 100 daily squats & AI posture perfection.", hostel: "Boys Hostel 2" },
  { id: 2, name: "Priya Mukherjee", dept: "ECE", year: "3rd Year", sport: "Running", time: "5:30 PM", streak: "19 Days", level: "Master", bio: "Campus track runner. Training for 10km marathon.", hostel: "Girls Hostel 1" },
  { id: 3, name: "Rohan Kulkarni", dept: "CSE", year: "2nd Year", sport: "Yoga", time: "7:00 AM", streak: "8 Days", level: "Pro", bio: "Morning mindfulness, core flexibility and breathwork.", hostel: "Girls Hostel 2" },
  { id: 4, name: "Neha Patel", dept: "EEE", year: "3rd Year", sport: "Gym / Squats", time: "6:30 PM", streak: "12 Days", level: "Pro", bio: "Looking for an evening campus workout accountability buddy.", hostel: "Girls Hostel 1" },
  { id: 5, name: "Kabir Das", dept: "CSE", year: "4th Year", sport: "Running", time: "6:00 AM", streak: "25 Days", level: "Campus Legend", bio: "Daily 5km campus sprinter and sports enthusiast.", hostel: "Day Scholar" },
  { id: 6, name: "Ananya Verma", dept: "ECE", year: "2nd Year", sport: "Yoga", time: "5:00 PM", streak: "15 Days", level: "Master", bio: "Evening campus lawn yoga and posture sessions.", hostel: "Girls Hostel 3" },
  { id: 7, name: "Aditya Verma", dept: "MECH", year: "3rd Year", sport: "Gym / Squats", time: "7:00 PM", streak: "6 Days", level: "Novice", bio: "Calisthenics and squat form improvements.", hostel: "Boys Hostel 1" },
  { id: 8, name: "Sneha Reddy", dept: "EEE", year: "1st Year", sport: "Running", time: "6:30 AM", streak: "10 Days", level: "Pro", bio: "Beginner runner building campus track stamina.", hostel: "Girls Hostel 2" },
  { id: 9, name: "Devansh Mehta", dept: "IT", year: "3rd Year", sport: "Badminton", time: "5:30 PM", streak: "18 Days", level: "Elite", bio: "Indoor stadium daily singles & doubles partner needed.", hostel: "Day Scholar" },
  { id: 10, name: "Meera Nair", dept: "CIVIL", year: "2nd Year", sport: "Cycling", time: "6:00 AM", streak: "11 Days", level: "Pro", bio: "Campus ring road morning cycling rides.", hostel: "Girls Hostel 1" },
  { id: 11, name: "Karan Malhotra", dept: "CSE", year: "2nd Year", sport: "Gym / Squats", time: "7:00 PM", streak: "9 Days", level: "Pro", bio: "Calisthenics and push-ups enthusiast.", hostel: "Boys Hostel 3" },
  { id: 12, name: "Tara Sengupta", dept: "ECE", year: "4th Year", sport: "Running", time: "5:00 PM", streak: "22 Days", level: "Campus Legend", bio: "Evening campus jogging with audio podcasts.", hostel: "Day Scholar" },
];

export default function BuddyFinder({ user }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedTime, setSelectedTime] = useState("ALL");
  
  // Persisted Invited Buddies (localStorage as sync cache; Firestore as source of truth)
  const [invitedIds, setInvitedIds] = useState(() => {
    const saved = localStorage.getItem('aurafit_buddies_invited');
    return saved ? JSON.parse(saved) : [];
  });

  // Load existing Firestore invites on mount and merge with localStorage cache
  useEffect(() => {
    if (!user?.uid) return;
    getMyBuddyInvites(user.uid).then((firestoreIds) => {
      if (firestoreIds.length > 0) {
        setInvitedIds((prev) => {
          const merged = [...new Set([...prev, ...firestoreIds])];
          localStorage.setItem('aurafit_buddies_invited', JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(() => {}); // silently fall back to localStorage on error
  }, [user?.uid]);

  // Client-Side Multi-Filter Logic
  const filteredBuddies = MOCK_CAMPUS_PROFILES.filter((buddy) => {
    const matchDept = selectedDept === "ALL" || buddy.dept === selectedDept;
    const matchSport = selectedSport === "ALL" || buddy.sport.toLowerCase().includes(selectedSport.toLowerCase());
    const matchTime = selectedTime === "ALL" || buddy.time.includes(selectedTime);
    const matchSearch = buddy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        buddy.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        buddy.hostel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchDept && matchSport && matchTime && matchSearch;
  });

  const handleInvite = async (id, name, sport) => {
    const nextInvited = [...invitedIds, id];
    setInvitedIds(nextInvited);
    localStorage.setItem('aurafit_buddies_invited', JSON.stringify(nextInvited));

    // Persist to Firestore; fall back silently if offline
    if (user?.uid) {
      try {
        await sendBuddyInvite(user.uid, id, sport);
      } catch {
        // Already saved to localStorage above — no action needed
      }
    }

    toast.success(`🤝 Workout buddy invite sent to ${name}! You will earn +20 bonus XP on your joint streak.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card glow-cyan" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-dept">Campus Network</span>
              <span className="badge badge-xp">Find Partners</span>
            </div>
            <h2 style={{ fontSize: '24px', color: '#fff', margin: '0 0 6px 0' }}>
              Find a Campus Workout Buddy 🤝
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px', maxWidth: '560px' }}>
              Students who exercise with a peer are <strong>85% more likely to maintain consistency</strong>. Connect with students in your branch, hostel, or workout window.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-streak" style={{ fontSize: '12px', padding: '6px 12px' }}>
              🔥 Active Athletes: {MOCK_CAMPUS_PROFILES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Filter Controls */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search student or hostel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Department Filter */}
          <div>
            <select 
              className="form-select"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="ALL">🏢 All Departments</option>
              <option value="CSE">CSE (Computer Science)</option>
              <option value="ECE">ECE (Electronics)</option>
              <option value="EEE">EEE (Electrical)</option>
              <option value="MECH">MECH (Mechanical)</option>
              <option value="IT">IT (Information Tech)</option>
              <option value="CIVIL">CIVIL Engineering</option>
            </select>
          </div>

          {/* Activity / Sport Filter */}
          <div>
            <select 
              className="form-select"
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
            >
              <option value="ALL">🎯 All Activities</option>
              <option value="Gym">Gym / Squats</option>
              <option value="Running">Running</option>
              <option value="Yoga">Yoga / Flexibility</option>
              <option value="Badminton">Badminton</option>
              <option value="Cycling">Cycling</option>
            </select>
          </div>

          {/* Preferred Time Window */}
          <div>
            <select 
              className="form-select"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
            >
              <option value="ALL">⏰ All Timings</option>
              <option value="AM">Morning (6:00 - 8:00 AM)</option>
              <option value="PM">Evening (5:00 - 7:30 PM)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Buddies Grid */}
      <div className="grid-cards">
        {filteredBuddies.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>No student buddies match your current filter.</p>
            <button 
              onClick={() => { setSelectedDept('ALL'); setSelectedSport('ALL'); setSearchQuery(''); setSelectedTime('ALL'); }}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredBuddies.map((buddy) => {
            const isInvited = invitedIds.includes(buddy.id);

            return (
              <div 
                key={buddy.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  border: isInvited ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)'
                }}
              >
                <div>
                  {/* Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{buddy.name}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{buddy.year} • {buddy.hostel}</p>
                    </div>
                    <span className="badge badge-dept">{buddy.dept}</span>
                  </div>

                  {/* Badges & Metrics */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span className="badge badge-xp" style={{ fontSize: '10px' }}>{buddy.level}</span>
                    <span className="badge badge-streak" style={{ fontSize: '10px' }}>🔥 {buddy.streak}</span>
                  </div>

                  {/* Sport & Timing Specs */}
                  <div style={{ background: '#0b0f19', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sport</span>
                      <strong style={{ color: '#38bdf8' }}>{buddy.sport}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Time Slot</span>
                      <strong style={{ color: '#fbbf24' }}>{buddy.time}</strong>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{buddy.bio}"
                  </p>
                </div>

                {/* Invite Action Button */}
                <button
                  onClick={() => handleInvite(buddy.id, buddy.name, buddy.sport)}
                  disabled={isInvited}
                  className={`btn ${isInvited ? 'btn-secondary' : 'btn-cyan'}`}
                  style={{ width: '100%', padding: '9px', fontSize: '13px' }}
                >
                  {isInvited ? (
                    <>
                      <UserCheck size={16} color="#10b981" />
                      Invitation Sent ✓
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Invite as Buddy 🤝
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
