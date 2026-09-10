import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  HeartPulse, 
  Wind, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Flame,
  Award
} from 'lucide-react';
import { audioSynth } from '../../lib/audioSynth';
import { MUDRAS_DATA, MEDITATION_MODES } from '../../lib/mudrasData';

export default function MentalWellness({ onPointsEarned }) {
  const [chamberTab, setChamberTab] = useState('meditation'); // 'meditation' | 'mudras'

  // =========================================================================
  // 1. MEDITATION & BREATHING SUITE STATE
  // =========================================================================
  const [selectedModeId, setSelectedModeId] = useState('box_breathing');
  const activeMode = MEDITATION_MODES.find(m => m.id === selectedModeId) || MEDITATION_MODES[0];

  const [sessionMins, setSessionMins] = useState(activeMode.defaultDurationMins);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(activeMode.defaultDurationMins * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Breathing Cycle State
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(activeMode.cycle[0].duration);
  const [ambientSound, setAmbientSound] = useState('theta'); // 'none' | 'theta' | 'rain' | 'bowl'

  const currentPhase = activeMode.cycle[phaseIndex] || activeMode.cycle[0];

  // Update session duration when mode changes
  useEffect(() => {
    setIsRunning(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(activeMode.cycle[0].duration);
    setSessionMins(activeMode.defaultDurationMins);
    setTotalSecondsRemaining(activeMode.defaultDurationMins * 60);
  }, [selectedModeId]);

  // Main Breathing Interval
  useEffect(() => {
    let timer = null;
    if (isRunning) {
      timer = setInterval(() => {
        // Decrement overall session
        setTotalSecondsRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });

        // Decrement phase
        setPhaseSecondsLeft(prev => {
          if (prev <= 1) {
            // Next phase
            const nextIdx = (phaseIndex + 1) % activeMode.cycle.length;
            setPhaseIndex(nextIdx);
            
            // Audio cue for new phase
            audioSynth.playSingingBowl(432, 1.8);
            return activeMode.cycle[nextIdx].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, phaseIndex, activeMode]);

  // Ambient sound management
  const handleAmbientChange = (type) => {
    setAmbientSound(type);
    audioSynth.stopAmbient();

    if (type === 'theta') {
      audioSynth.startBinauralTheta();
    } else if (type === 'rain') {
      audioSynth.startZenRain();
    } else if (type === 'bowl') {
      audioSynth.playSingingBowl(432, 4);
    }
  };

  const handleStartSession = () => {
    audioSynth.init();
    if (!isRunning && ambientSound !== 'none') {
      handleAmbientChange(ambientSound);
    }
    audioSynth.playSingingBowl(432, 2.5);
    setIsRunning(true);
  };

  const handlePauseSession = () => {
    setIsRunning(false);
    audioSynth.stopAmbient();
  };

  const handleResetSession = () => {
    setIsRunning(false);
    audioSynth.stopAmbient();
    setPhaseIndex(0);
    setPhaseSecondsLeft(activeMode.cycle[0].duration);
    setTotalSecondsRemaining(sessionMins * 60);
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    audioSynth.stopAmbient();
    audioSynth.playFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    if (onPointsEarned) {
      onPointsEarned(40, 0);
    }
  };

  // =========================================================================
  // 2. MUDRAS ENCYCLOPEDIA STATE
  // =========================================================================
  const [mudraCategory, setMudraCategory] = useState('all');
  const [selectedMudra, setSelectedMudra] = useState(MUDRAS_DATA[0]);
  const [mudraTimerActive, setMudraTimerActive] = useState(false);
  const [mudraTimerSeconds, setMudraTimerSeconds] = useState(15 * 60);

  const filteredMudras = mudraCategory === 'all' 
    ? MUDRAS_DATA 
    : MUDRAS_DATA.filter(m => m.category === mudraCategory);

  const handleStartMudraPractice = (mudra) => {
    setSelectedMudra(mudra);
    setMudraTimerSeconds(mudra.recommendedMins * 60);
    setMudraTimerActive(true);
    audioSynth.init();
    audioSynth.playSingingBowl(432, 3);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #ec4899',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(236, 72, 153, 0.08))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #be185d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 18px rgba(236, 72, 153, 0.4)'
          }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Mental Wellness & Traditional Mudras
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Chamber 5</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Pranayama breathing guides, 4-4-4-4 box breathing visual orb, and traditional Mudra encyclopedia.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setChamberTab('meditation'); audioSynth.stopAmbient(); }}
            className={`btn ${chamberTab === 'meditation' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Wind size={14} />
            Breathing & Meditation
          </button>
          <button
            onClick={() => { setChamberTab('mudras'); audioSynth.stopAmbient(); }}
            className={`btn ${chamberTab === 'mudras' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <BookOpen size={14} />
            Mudras Encyclopedia
          </button>
        </div>
      </div>

      {/* ===================================================================
          TAB 1: GUIDED BREATHWORK & VISUAL BREATHING ORB
          =================================================================== */}
      {chamberTab === 'meditation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* LEFT: Interactive Breathing Orb Room */}
          <div className="glass-card" style={{
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient Background Glow */}
            <div style={{
              position: 'absolute',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${activeMode.color}22 0%, transparent 70%)`,
              filter: 'blur(30px)',
              pointerEvents: 'none',
              transform: isRunning && currentPhase.phase.includes('Inhale') ? 'scale(1.4)' : 'scale(1)',
              transition: `transform ${currentPhase.duration}s ease-in-out`
            }} />

            {/* Session Countdown Header */}
            <div style={{ marginBottom: '24px', zIndex: 2 }}>
              <span className="badge" style={{
                fontSize: '12px',
                padding: '4px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                color: activeMode.color,
                border: `1px solid ${activeMode.color}44`
              }}>
                {activeMode.title}
              </span>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Time Remaining: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                  {Math.floor(totalSecondsRemaining / 60)}:{String(totalSecondsRemaining % 60).padStart(2, '0')}
                </strong>
              </div>
            </div>

            {/* THE VISUAL BREATHING ORB */}
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${activeMode.color} 50%, #061c14 100%)`,
              boxShadow: `0 0 40px ${activeMode.color}66, inset 0 0 20px rgba(255, 255, 255, 0.5)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '20px 0 28px',
              position: 'relative',
              zIndex: 2,
              transform: isRunning && currentPhase.phase.includes('Inhale') 
                ? 'scale(1.35)' 
                : isRunning && currentPhase.phase.includes('Exhale')
                ? 'scale(0.85)'
                : 'scale(1.1)',
              transition: isRunning 
                ? `transform ${currentPhase.duration}s cubic-bezier(0.4, 0, 0.2, 1)` 
                : 'transform 0.4s ease'
            }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#061c14', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentPhase.phase}
              </span>
              <span style={{ fontSize: '28px', fontWeight: '900', color: '#061c14', fontFamily: 'monospace' }}>
                {phaseSecondsLeft}s
              </span>
            </div>

            {/* Guidance Tip Text */}
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', minHeight: '40px', lineHeight: '1.5', zIndex: 2 }}>
              {currentPhase.instruction}
            </p>

            {/* Session Controls */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', zIndex: 2 }}>
              {!isRunning ? (
                <button
                  onClick={handleStartSession}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
                >
                  <Play size={16} /> Begin Session
                </button>
              ) : (
                <button
                  onClick={handlePauseSession}
                  className="btn btn-secondary"
                  style={{ padding: '10px 24px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
                >
                  <Pause size={16} /> Pause
                </button>
              )}

              <button
                onClick={handleResetSession}
                className="btn btn-secondary"
                style={{ padding: '10px 16px', borderRadius: 'var(--radius-full)' }}
                title="Reset session"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* RIGHT: Meditation Modes & Ambient Synthesizer Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Mode Picker */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Breathing & Meditation Patterns
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MEDITATION_MODES.map((mode) => {
                  const isSelected = selectedModeId === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setSelectedModeId(mode.id)}
                      style={{
                        padding: '14px',
                        background: '#0b0f19',
                        border: `1px solid ${isSelected ? mode.color : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? mode.color : 'var(--text-primary)', margin: 0 }}>
                          {mode.title}
                        </h4>
                        <span className="badge badge-dept" style={{ fontSize: '10px' }}>
                          {mode.defaultDurationMins} mins
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                        {mode.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ambient Sound Generator */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={16} color="#06b6d4" />
                  Synthesized Soundscape
                </h3>
                <span className="badge badge-xp" style={{ fontSize: '10px' }}>Web Audio API</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => handleAmbientChange('theta')}
                  className={`btn ${ambientSound === 'theta' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
                >
                  <span>🧠 6Hz Theta Waves</span>
                </button>

                <button
                  onClick={() => handleAmbientChange('rain')}
                  className={`btn ${ambientSound === 'rain' ? 'btn-cyan' : 'btn-secondary'}`}
                  style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
                >
                  <span>🌧️ Zen Gentle Rain</span>
                </button>

                <button
                  onClick={() => handleAmbientChange('bowl')}
                  className={`btn ${ambientSound === 'bowl' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
                >
                  <span>🔔 Tibetan Bowl (432Hz)</span>
                </button>

                <button
                  onClick={() => handleAmbientChange('none')}
                  className={`btn ${ambientSound === 'none' ? 'btn-secondary' : 'btn-secondary'}`}
                  style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start', opacity: ambientSound === 'none' ? 1 : 0.6 }}
                >
                  <VolumeX size={14} /> Silent Mindfulness
                </button>
              </div>
            </div>

            {/* Session Completion Reward Banner */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={14} /> Session Completion Reward
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Earn +40 Aura XP to strengthen mental endurance.
                </span>
              </div>
              <span className="badge badge-xp" style={{ fontSize: '12px' }}>+40 XP</span>
            </div>

          </div>

        </div>
      )}

      {/* ===================================================================
          TAB 2: TRADITIONAL MUDRAS VISUAL ENCYCLOPEDIA
          =================================================================== */}
      {chamberTab === 'mudras' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Category Filter Pills & Disclaimer */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                  Traditional Mudras Visual Encyclopedia
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Centuries-old somatic finger alignments designed to regulate vital energy flow and mental composure.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'focus', 'vitality', 'tranquility', 'metabolism'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMudraCategory(cat)}
                    className={`btn ${mudraCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'capitalize' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-Medical Disclaimer */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <Info size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span>
                <strong>Traditional Wellness Notice:</strong> Mudras are ancient mindful relaxation practices. They are presented for holistic wellness, breath focus, and somatic anchoring, and do not replace clinical therapy.
              </span>
            </div>
          </div>

          {/* Mudras Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {filteredMudras.map((mudra) => (
              <div
                key={mudra.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${mudra.colorAccent}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge" style={{
                      fontSize: '10px',
                      background: `${mudra.colorAccent}22`,
                      color: mudra.colorAccent,
                      border: `1px solid ${mudra.colorAccent}55`
                    }}>
                      {mudra.category.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ⏱️ {mudra.recommendedMins} mins
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {mudra.sanskritName}
                  </h4>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: mudra.colorAccent, marginBottom: '12px' }}>
                    {mudra.englishName}
                  </div>

                  {/* Finger Alignment Instructions */}
                  <div style={{ background: '#0b0f19', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Hand Alignment Guide:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {mudra.handAlignment.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Traditional Benefits */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Core Benefits:
                    </span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                      {mudra.traditionalBenefits[0]}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartMudraPractice(mudra)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                >
                  <Play size={13} /> Practice {mudra.sanskritName.split(' ')[0]} ({mudra.recommendedMins}m)
                </button>
              </div>
            ))}
          </div>

          {/* Active Mudra Practice Modal / Float */}
          {mudraTimerActive && selectedMudra && (
            <div style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              maxWidth: '360px',
              width: 'calc(100% - 48px)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${selectedMudra.colorAccent}`,
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              animation: 'fadeInUp 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-dept" style={{ fontSize: '10px' }}>Active Mudra Practice</span>
                <button 
                  onClick={() => setMudraTimerActive(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕
                </button>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: '800', color: selectedMudra.colorAccent, margin: '0 0 6px' }}>
                {selectedMudra.sanskritName}
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                Hold posture with relaxed shoulders and gentle breathing.
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => audioSynth.playSingingBowl(432, 3)}
                  className="btn btn-cyan"
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                >
                  <Volume2 size={14} /> Chime Bowl
                </button>
                <button
                  onClick={() => {
                    setMudraTimerActive(false);
                    audioSynth.playFanfare();
                    if (onPointsEarned) onPointsEarned(30, 0);
                    confetti({ particleCount: 50 });
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                >
                  Finish (+30 XP)
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
