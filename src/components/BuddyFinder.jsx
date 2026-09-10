import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext';
import { 
  sendBuddyInvite, 
  getMyBuddyInvites, 
  subscribeToIncomingBuddyInvites, 
  respondToBuddyInvite, 
  subscribeToDiscoverableAthletes,
  updateUserProfile 
} from '../lib/firebase';
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
  Tag,
  Check,
  X,
  Bell,
  Radio,
  ShieldCheck
} from 'lucide-react';

const MOCK_CAMPUS_PROFILES = [
  { id: "mock_1", name: "Aarav Sharma", dept: "CSE", year: "3rd Year", sport: "Gym / Squats", time: "6:00 AM", streak: "14 Days", level: "Elite", bio: "Aiming for 100 daily squats & AI posture perfection.", hostel: "Boys Hostel 2" },
  { id: "mock_2", name: "Priya Mukherjee", dept: "ECE", year: "3rd Year", sport: "Running", time: "5:30 PM", streak: "19 Days", level: "Master", bio: "Campus track runner. Training for 10km marathon.", hostel: "Girls Hostel 1" },
  { id: "mock_3", name: "Rohan Kulkarni", dept: "CSE", year: "2nd Year", sport: "Yoga", time: "7:00 AM", streak: "8 Days", level: "Pro", bio: "Morning mindfulness, core flexibility and breathwork.", hostel: "Boys Hostel 1" },
  { id: "mock_4", name: "Neha Patel", dept: "EEE", year: "3rd Year", sport: "Gym / Squats", time: "6:30 PM", streak: "12 Days", level: "Pro", bio: "Looking for an evening campus workout accountability buddy.", hostel: "Girls Hostel 1" },
  { id: "mock_5", name: "Kabir Das", dept: "CSE", year: "4th Year", sport: "Running", time: "6:00 AM", streak: "25 Days", level: "Campus Legend", bio: "Daily 5km campus sprinter and sports enthusiast.", hostel: "Day Scholar" },
  { id: "mock_6", name: "Ananya Verma", dept: "ECE", year: "2nd Year", sport: "Yoga", time: "5:00 PM", streak: "15 Days", level: "Master", bio: "Evening campus lawn yoga and posture sessions.", hostel: "Girls Hostel 3" },
  { id: "mock_7", name: "Aditya Verma", dept: "MECH", year: "3rd Year", sport: "Gym / Squats", time: "7:00 PM", streak: "6 Days", level: "Novice", bio: "Calisthenics and squat form improvements.", hostel: "Boys Hostel 1" },
  { id: "mock_8", name: "Sneha Reddy", dept: "EEE", year: "1st Year", sport: "Running", time: "6:30 AM", streak: "10 Days", level: "Pro", bio: "Beginner runner building campus track stamina.", hostel: "Girls Hostel 2" },
  { id: "mock_9", name: "Devansh Mehta", dept: "IT", year: "3rd Year", sport: "Badminton", time: "5:30 PM", streak: "18 Days", level: "Elite", bio: "Indoor stadium daily singles & doubles partner needed.", hostel: "Day Scholar" },
  { id: "mock_10", name: "Meera Nair", dept: "CIVIL", year: "2nd Year", sport: "Cycling", time: "6:00 AM", streak: "11 Days", level: "Pro", bio: "Campus ring road morning cycling rides.", hostel: "Girls Hostel 1" },
  { id: "mock_11", name: "Karan Malhotra", dept: "CSE", year: "2nd Year", sport: "Gym / Squats", time: "7:00 PM", streak: "9 Days", level: "Pro", bio: "Calisthenics and push-ups enthusiast.", hostel: "Boys Hostel 3" },
  { id: "mock_12", name: "Tara Sengupta", dept: "ECE", year: "4th Year", sport: "Running", time: "5:00 PM", streak: "22 Days", level: "Campus Legend", bio: "Evening campus jogging with audio podcasts.", hostel: "Day Scholar" }
];

export default function BuddyFinder({ user }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'requests'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedTime, setSelectedTime] = useState("ALL");

  // Real-time Cloud Discovery State
  const [liveAthletes, setLiveAthletes] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [isDiscoverable, setIsDiscoverable] = useState(true);

  // Persisted Invited Buddies
  const [invitedIds, setInvitedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('aurafit_buddies_invited');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 1. Subscribe to Live Registered Athletes
  useEffect(() => {
    const unsubAthletes = subscribeToDiscoverableAthletes((cloudUsers) => {
      setLiveAthletes(cloudUsers || []);
    });
    return () => unsubAthletes();
  }, []);

  // 2. Subscribe to Incoming Match Requests for Current User
  useEffect(() => {
    if (!user?.uid) return;
    const unsubInvites = subscribeToIncomingBuddyInvites(user.uid, (invites) => {
      setIncomingRequests(invites || []);
    });
    return () => unsubInvites();
  }, [user?.uid]);

  // 3. Load Existing Outbound Invites from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    getMyBuddyInvites(user.uid).then((firestoreIds) => {
      if (firestoreIds?.length > 0) {
        setInvitedIds((prev) => {
          const merged = [...new Set([...prev, ...firestoreIds])];
          try {
            localStorage.setItem('aurafit_buddies_invited', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});
  }, [user?.uid]);

  // Combine Live Cloud Athletes + Seed Roster
  const combinedAthletes = useMemo(() => {
    const activeUid = user?.uid ? String(user.uid) : '';
    const cloudFiltered = liveAthletes.filter(a => String(a.id) !== activeUid);
    const cloudIds = new Set(cloudFiltered.map(a => String(a.id)));
    const mocks = MOCK_CAMPUS_PROFILES.filter(m => !cloudIds.has(String(m.id)));
    return [...cloudFiltered, ...mocks];
  }, [liveAthletes, user?.uid]);

  // Client-Side Multi-Filter Logic
  const filteredBuddies = useMemo(() => {
    return combinedAthletes.filter((buddy) => {
      const matchDept = selectedDept === "ALL" || buddy.dept === selectedDept;
      const matchSport = selectedSport === "ALL" || buddy.sport.toLowerCase().includes(selectedSport.toLowerCase());
      const matchTime = selectedTime === "ALL" || buddy.time.includes(selectedTime);
      const matchSearch = buddy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          buddy.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          buddy.hostel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchDept && matchSport && matchTime && matchSearch;
    });
  }, [combinedAthletes, selectedDept, selectedSport, selectedTime, searchQuery]);

  const handleInvite = async (id, name, sport) => {
    const stringId = String(id);
    const nextInvited = [...invitedIds, stringId];
    setInvitedIds(nextInvited);
    try {
      localStorage.setItem('aurafit_buddies_invited', JSON.stringify(nextInvited));
    } catch {}

    if (user?.uid) {
      try {
        await sendBuddyInvite(user.uid, stringId, sport);
      } catch {}
    }

    toast.success(`🤝 Workout buddy invite sent to ${name}! You will earn +20 bonus XP on your joint streak.`);
  };

  const handleRespond = async (requestId, status, fromName = "Athlete") => {
    try {
      await respondToBuddyInvite(requestId, status);
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      if (status === 'accepted') {
        toast.success(`🎉 You and ${fromName} are now workout partners! +50 XP awarded.`);
      } else {
        toast.info("Invite declined.");
      }
    } catch (err) {
      toast.error("Could not update invite status.");
    }
  };

  const toggleDiscoverable = () => {
    const next = !isDiscoverable;
    setIsDiscoverable(next);
    if (user?.uid) {
      updateUserProfile(user.uid, { buddyOptIn: next }).catch(() => {});
    }
    toast.info(next ? "Profile visible to campus peers." : "Profile set to private.");
  };

  const pendingRequestsCount = incomingRequests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card glow-cyan" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-dept">Campus Network</span>
              <span className="badge badge-xp">Peer Motivation</span>
            </div>
            <h2 style={{ fontSize: '24px', color: '#fff', margin: '0 0 6px 0' }}>
              Find a Campus Workout Buddy 🤝
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px', maxWidth: '560px' }}>
              Students who exercise with a peer are <strong>85% more likely to maintain consistency</strong>. Connect with students in your branch, hostel, or workout window.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleDiscoverable}
              className={`btn ${isDiscoverable ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '8px 14px' }}
              title="Toggle your presence on peer search"
            >
              <Radio size={14} color={isDiscoverable ? '#061c14' : '#94a3b8'} />
              {isDiscoverable ? "Discoverable: Active" : "Discoverable: Paused"}
            </button>
            <span className="badge badge-streak" style={{ fontSize: '12px', padding: '8px 12px' }}>
              🔥 {combinedAthletes.length} Active Athletes
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Browse vs Incoming Requests */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('browse')}
          className={`btn ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          <Users size={15} />
          Explore Campus Athletes ({combinedAthletes.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-cyan' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px', position: 'relative' }}
        >
          <Bell size={15} />
          Incoming Invites
          {pendingRequestsCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '10px',
              padding: '1px 6px',
              marginLeft: '6px'
            }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'requests' ? (
        /* Incoming Requests Section */
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#38bdf8" />
            Partner Workout Requests ({incomingRequests.length})
          </h3>

          {incomingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No pending buddy invites right now.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                When peers in your hostel or branch send you an invite, they will appear here for 1-click confirmation.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: 'var(--bg-inset)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fff' }}>
                      Workout Request for: <strong style={{ color: '#38bdf8' }}>{req.sport || "Campus Fitness"}</strong>
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      Sender UID: {req.fromUid?.slice(0, 10)}... • Status: <strong style={{ color: req.status === 'accepted' ? '#10b981' : '#fbbf24' }}>{req.status}</strong>
                    </p>
                  </div>

                  {req.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRespond(req.id, 'accepted')}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Check size={14} /> Accept 🤝
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'declined')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  ) : (
                    <span className="badge badge-dept" style={{ color: '#10b981' }}>
                      ✓ {req.status?.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Browse Athletes Section */
        <>
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
                  <option value="ALL">🏃 All Workouts</option>
                  <option value="Gym">Gym / Squats</option>
                  <option value="Running">Campus Track Running</option>
                  <option value="Yoga">Yoga & Mindfulness</option>
                  <option value="Badminton">Badminton / Court</option>
                  <option value="Cycling">Campus Cycling</option>
                </select>
              </div>

              {/* Timing Filter */}
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
                const stringId = String(buddy.id);
                const isInvited = invitedIds.includes(stringId);

                return (
                  <div 
                    key={stringId}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      border: isInvited ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{buddy.name}</h4>
                            {buddy.isLiveCloudUser && (
                              <span title="Verified Campus Student" style={{ display: 'inline-flex' }}>
                                <ShieldCheck size={14} color="#10b981" />
                              </span>
                            )}
                          </div>
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
                      <div style={{ background: 'var(--bg-inset)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
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
                      onClick={() => handleInvite(stringId, buddy.name, buddy.sport)}
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
        </>
      )}

    </div>
  );
}
