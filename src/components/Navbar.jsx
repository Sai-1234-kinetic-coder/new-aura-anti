import React, { useState } from 'react';
import { 
  Activity, 
  Flame, 
  Camera, 
  Dumbbell, 
  Bot, 
  Clock, 
  Sparkles, 
  Brain, 
  Swords, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  UserCheck,
  HeartPulse
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  userProfile, 
  onLogout, 
  onOpenAuth 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const chambers = [
    { id: 'dashboard', label: 'Command Hub', icon: Activity, badge: 'Live' },
    { id: 'trainer', label: 'Trainer & BMI', icon: Dumbbell, badge: 'Metabolic' },
    { id: 'camera', label: 'AI Vision', icon: Camera, badge: 'Vision' },
    { id: 'coach', label: 'AuraCoach AI', icon: Bot, badge: 'AI' },
    { id: 'mind', label: 'Zen & Mudras', icon: HeartPulse, badge: 'Wellness' },
    { id: 'chess', label: 'Cognitive Chess', icon: Brain, badge: 'Mind' },
    { id: 'tools', label: 'Smart Tools', icon: Clock, badge: 'Timer' },
    { id: 'arena', label: 'Arena Battles', icon: Swords, badge: 'XP' }
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="glass-card" style={{ 
      marginBottom: '24px', 
      padding: '12px 20px', 
      borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
      position: 'sticky',
      top: '12px',
      zIndex: 1000,
      background: 'rgba(17, 24, 39, 0.92)',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => handleSelectTab('dashboard')}
        >
          <div style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #10b981, #06b6d4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
          }}>
            <Flame size={22} color="#061c14" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: '900', 
                letterSpacing: '-0.03em', 
                background: 'linear-gradient(90deg, #10b981, #38bdf8)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                AURAFIT
              </span>
              <span className="badge badge-dept" style={{ fontSize: '9px', padding: '2px 6px' }}>v2.0 AI</span>
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Peak Human Performance
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Scrollable pill row) */}
        <nav className="desktop-nav" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          overflowX: 'auto',
          maxWidth: '680px',
          padding: '4px 2px'
        }}>
          {chambers.map((chamber) => {
            const Icon = chamber.icon;
            const isActive = activeTab === chamber.id;
            return (
              <button
                key={chamber.id}
                onClick={() => handleSelectTab(chamber.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '7px 12px', 
                  fontSize: '12px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: isActive ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                  flexShrink: 0
                }}
              >
                <Icon size={14} />
                <span>{chamber.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Pill / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                background: '#0b0f19', 
                padding: '6px 12px', 
                borderRadius: 'var(--radius-full)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="badge badge-dept" style={{ fontSize: '10px' }}>
                  {userProfile?.department || 'ATHLETE'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={13} />
                  {userProfile?.totalPoints || 140} XP
                </span>
              </div>

              <button 
                onClick={onLogout} 
                className="btn btn-danger" 
                style={{ padding: '7px 10px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth} 
              className="btn btn-primary" 
              style={{ padding: '7px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
            >
              <ShieldCheck size={14} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              display: 'none', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer'
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ 
          marginTop: '16px', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '8px'
        }}>
          {chambers.map((chamber) => {
            const Icon = chamber.icon;
            const isActive = activeTab === chamber.id;
            return (
              <button
                key={chamber.id}
                onClick={() => handleSelectTab(chamber.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '12px', width: '100%' }}
              >
                <Icon size={15} />
                <span>{chamber.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
