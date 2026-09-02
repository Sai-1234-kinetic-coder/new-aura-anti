import React from 'react';
import { 
  Trophy, 
  Flame, 
  Crown, 
  TrendingUp, 
  Award, 
  Users, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function DepartmentWars({ 
  departments = [], 
  topAthletes = [], 
  userProfile,
  onLaunchArena 
}) {
  const defaultDepts = [
    { department: 'CSE', points: 340 },
    { department: 'ECE', points: 290 },
    { department: 'EEE', points: 190 },
    { department: 'MECH', points: 120 },
  ];

  const displayDepts = departments.length > 0 ? departments : defaultDepts;
  const totalCampusPoints = displayDepts.reduce((acc, curr) => acc + (curr.points || 0), 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Hero Banner */}
      <div className="glass-card glow-cyan" style={{
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-streak">🔥 Live Standings</span>
              <span className="badge badge-dept">Realtime Sync</span>
            </div>
            <h2 style={{ fontSize: '26px', color: '#fff', margin: '0 0 6px 0' }}>
              Campus Department Wars 🏆
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', maxWidth: '540px' }}>
              Every completed squat and workout automatically awards points to your branch. Which department will lead the campus leaderboard today?
            </p>
          </div>

          <button 
            onClick={onLaunchArena}
            className="btn btn-primary glow-emerald"
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            <Zap size={18} />
            Score Points for {userProfile?.department || 'My Dept'} ⚡
          </button>
        </div>
      </div>

      {/* Main Leaderboard & Top Athletes Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Department Standings Column */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#fbbf24" />
              Branch Rankings
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Updated Live</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayDepts.map((item, index) => {
              const rawShare = Math.round(((item.points || 0) / totalCampusPoints) * 100);
              const sharePercent = isNaN(rawShare) ? 0 : rawShare;
              const isUserDept = userProfile?.department === item.department;

              return (
                <div 
                  key={item.department}
                  style={{
                    background: isUserDept ? 'rgba(16, 185, 129, 0.08)' : '#0b0f19',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: isUserDept ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : '#1e293b',
                        color: index <= 2 ? '#000' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '12px'
                      }}>
                        {index === 0 ? <Crown size={15} /> : `#${index + 1}`}
                      </div>
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                          {item.department}
                        </span>
                        {isUserDept && (
                          <span className="badge badge-dept" style={{ marginLeft: '6px', fontSize: '9px' }}>Your Team</span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: index === 0 ? '#fbbf24' : '#10b981' }}>
                        {item.points}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>XP</span>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div style={{ width: '100%', height: '7px', background: '#1e293b', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div 
                      style={{
                        width: `${Math.max(sharePercent, 8)}%`,
                        height: '100%',
                        background: index === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Campus Share</span>
                    <span>{sharePercent}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Campus Athletes Spotlight */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#f43f5e" />
              Campus Top Athletes
            </h3>
            <span className="badge badge-xp">MVP List</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(topAthletes.length > 0 ? topAthletes : [
              { id: '1', name: 'Aarav Sharma', department: 'CSE', points: 340, squats: 34 },
              { id: '2', name: 'Priya Mukherjee', department: 'ECE', points: 290, squats: 29 },
              { id: '3', name: 'Rohan Kulkarni', department: 'CSE', points: 260, squats: 26 },
              { id: '4', name: 'Ananya Verma', department: 'ECE', points: 210, squats: 21 },
              { id: '5', name: 'Neha Patel', department: 'EEE', points: 190, squats: 19 },
            ]).map((athlete, i) => (
              <div 
                key={athlete.id || i}
                style={{
                  background: '#0b0f19',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: '#38bdf8'
                  }}>
                    {athlete.name[0]}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{athlete.name}</h5>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <span className="badge badge-dept" style={{ fontSize: '9px', padding: '1px 5px' }}>{athlete.department}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{athlete.squats || 0} squats</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>
                    {athlete.points} XP
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(56, 189, 248, 0.3)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              💡 <strong>Tip:</strong> Complete AI squat sets to push your department to #1!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
