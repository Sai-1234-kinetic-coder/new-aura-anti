import React from 'react';
import { 
  Flame, 
  Camera, 
  Dumbbell, 
  Bot, 
  Brain, 
  HeartPulse, 
  Swords, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  Target,
  Trophy
} from 'lucide-react';

export default function LandingHero({ setActiveTab, onOpenAuth, user }) {
  const showcaseChambers = [
    {
      id: 'trainer',
      title: 'Metabolic & Trainer',
      desc: 'Dynamic BMI, Mifflin-St Jeor BMR, caloric deficit/surplus engine, and macro distribution.',
      icon: Dumbbell,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      borderAccent: 'rgba(16, 185, 129, 0.4)',
      badge: 'Chamber 1'
    },
    {
      id: 'camera',
      title: 'AI Vision Posture Arena',
      desc: 'Client-side skeleton tracking, real-time joint angle math, rep counters, and live audio cues.',
      icon: Camera,
      gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)',
      borderAccent: 'rgba(6, 182, 212, 0.4)',
      badge: 'Chamber 2'
    },
    {
      id: 'coach',
      title: 'AuraCoach Conversational AI',
      desc: 'Context-aware AI mentor tailored to your biometrics, diet protocols, and training goals.',
      icon: Bot,
      gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      borderAccent: 'rgba(168, 85, 247, 0.4)',
      badge: 'Chamber 3'
    },
    {
      id: 'tools',
      title: 'Smart Lifestyle Tools',
      desc: 'Hydration chime alarm, HIIT/Tabata interval timer with audio beeps, and nutrient guides.',
      icon: Clock,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      borderAccent: 'rgba(245, 158, 11, 0.4)',
      badge: 'Chamber 4'
    },
    {
      id: 'mind',
      title: 'Zen & Mudras Suite',
      desc: 'Pranayama breathing guides, 4-4-4-4 box breathing orb, and traditional Mudra encyclopedia.',
      icon: HeartPulse,
      gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
      borderAccent: 'rgba(236, 72, 153, 0.4)',
      badge: 'Chamber 5'
    },
    {
      id: 'chess',
      title: 'Cognitive Chess Chamber',
      desc: 'Sharp tactical brain training. Play against 5 tiers of AI or solve daily checkmate puzzles.',
      icon: Brain,
      gradient: 'linear-gradient(135deg, #38bdf8, #2563eb)',
      borderAccent: 'rgba(56, 189, 248, 0.4)',
      badge: 'Chamber 6'
    },
    {
      id: 'arena',
      title: 'Competitive Arena Duels',
      desc: '60-second AI squat battles, plank posture endurance, and social leaderboard ranking.',
      icon: Swords,
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      borderAccent: 'rgba(244, 63, 94, 0.4)',
      badge: 'Chamber 7'
    },
    {
      id: 'dashboard',
      title: 'Live Command Hub',
      desc: 'Unified Aura XP economy, daily activity rings, streak multipliers, and milestone trophies.',
      icon: Trophy,
      gradient: 'linear-gradient(135deg, #10b981, #38bdf8)',
      borderAccent: 'rgba(16, 185, 129, 0.4)',
      badge: 'Chamber 8'
    }
  ];

  return (
    <section style={{ marginBottom: '40px' }} className="animate-fade-in-up">
      {/* Hero Banner */}
      <div className="glass-card" style={{
        padding: '36px 28px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.88))',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Ambient Glows */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-5%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '840px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span className="badge badge-dept" style={{ fontSize: '11px', padding: '4px 10px' }}>
              <Zap size={12} style={{ marginRight: '4px' }} />
              Next-Gen Human Performance OS
            </span>
            <span className="badge badge-xp" style={{ fontSize: '11px', padding: '4px 10px' }}>
              <Sparkles size={12} style={{ marginRight: '4px' }} />
              Zero-Cloud Video Privacy
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            lineHeight: '1.15',
            marginBottom: '16px',
            fontWeight: '900',
            letterSpacing: '-0.03em'
          }}>
            Train Your Body. Correct Your Form. <br />
            <span style={{
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Master Your Mind.
            </span>
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginBottom: '26px',
            maxWidth: '680px'
          }}>
            AuraFit unites browser-based AI computer vision, personalized metabolic analytics, guided mindfulness & traditional Mudras, tactical cognitive chess, and conversational coaching into one holistic athletic platform.
          </p>

          {/* Call to Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('camera')}
              className="btn btn-primary" 
              style={{ padding: '12px 22px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
            >
              <Camera size={18} />
              Launch AI Camera Arena
              <ArrowRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('trainer')}
              className="btn btn-secondary" 
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
            >
              <Target size={18} />
              Calculate Metabolic Profile
            </button>

            {!user && (
              <button 
                onClick={onOpenAuth}
                className="btn btn-cyan" 
                style={{ padding: '12px 18px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
              >
                <ShieldCheck size={18} />
                Get Started
              </button>
            )}
          </div>
        </div>

        {/* Live System Metrics Strip */}
        <div style={{
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '16px',
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>8 Chambers</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interconnected Ecosystem</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#06b6d4' }}>&lt; 35ms</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Local Vision Latency</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#a855f7' }}>100% Client-Side</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero Raw Video Upload</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>AI + Chess + Zen</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cognitive & Physical</div>
          </div>
        </div>
      </div>

      {/* 8-Chamber Interactive Navigation Showcase */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Explore The 8 Core Chambers
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Select any chamber to activate its dedicated intelligence suite.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {showcaseChambers.map((chamber) => {
            const Icon = chamber.icon;
            return (
              <div
                key={chamber.id}
                onClick={() => setActiveTab(chamber.id)}
                className="glass-card"
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  border: `1px solid var(--border-color)`,
                  borderRadius: 'var(--radius-md)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = chamber.borderAccent;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: chamber.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}>
                      <Icon size={20} />
                    </div>
                    <span className="badge badge-dept" style={{ fontSize: '10px' }}>
                      {chamber.badge}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {chamber.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {chamber.desc}
                  </p>
                </div>

                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#38bdf8'
                }}>
                  <span>Enter Chamber</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
