import React from 'react';
import { 
  Activity, 
  Flame, 
  Users, 
  Trophy, 
  Camera, 
  LogOut, 
  Sparkles, 
  ShieldCheck,
  User 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  userProfile, 
  onLogout, 
  onOpenAuth 
}) {
  return (
    <header className="glass-card" style={{ marginBottom: '24px', padding: '14px 20px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #10b981, #06b6d4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
          }}>
            <Flame size={22} color="#061c14" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #10b981, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AURAFIT
              </span>
              <span className="badge badge-dept" style={{ fontSize: '10px', padding: '2px 6px' }}>Campus Beta</span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Gamified Campus Fitness & AI Posture</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Activity size={16} />
            Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('camera')} 
            className={`btn ${activeTab === 'camera' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Camera size={16} />
            AI Arena
          </button>

          <button 
            onClick={() => setActiveTab('leaderboard')} 
            className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Trophy size={16} />
            Dept Wars
          </button>

          <button 
            onClick={() => setActiveTab('buddies')} 
            className={`btn ${activeTab === 'buddies' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Users size={16} />
            Buddy Finder
          </button>
        </nav>

        {/* User Profile Pill / Auth Action */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: '#0b0f19', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>
                {userProfile?.department || 'CSE'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Sparkles size={13} />
                {userProfile?.totalPoints || 0} XP
              </span>
            </div>

            <button 
              onClick={onLogout} 
              className="btn btn-danger" 
              style={{ padding: '7px 10px', fontSize: '12px' }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={onOpenAuth} 
              className="btn btn-primary" 
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <ShieldCheck size={16} />
              Student Login
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
