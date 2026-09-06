import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Swords, 
  Trophy, 
  Flame, 
  Sparkles, 
  Zap, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Award, 
  Crown, 
  Target, 
  Clock, 
  HeartPulse, 
  Brain, 
  CheckCircle2, 
  Dumbbell,
  ArrowRight
} from 'lucide-react';
import { BADGES_REGISTRY, BADGE_TIERS, GHOST_ATHLETES } from '../../lib/gamification';
import { audioSynth } from '../../lib/audioSynth';

export default function GamingArena({ userProfile, onLaunchCamera, onOpenLeaderboard, onPointsEarned }) {
  const [arenaTab, setArenaTab] = useState('duel'); // 'duel' | 'boss' | 'badges'

  // =========================================================================
  // 1. 60-SECOND AI GHOST DUEL STATE
  // =========================================================================
  const [selectedGhost, setSelectedGhost] = useState(GHOST_ATHLETES[0]);
  const [duelSecondsLeft, setDuelSecondsLeft] = useState(60);
  const [duelActive, setDuelActive] = useState(false);
  const [userDuelReps, setUserDuelReps] = useState(0);
  const [ghostDuelReps, setGhostDuelReps] = useState(0);
  const [duelResult, setDuelResult] = useState(null); // 'win' | 'loss' | null

  // 60-second Duel Countdown & Ghost Rep Cadence Simulator
  useEffect(() => {
    let interval = null;
    if (duelActive) {
      interval = setInterval(() => {
        setDuelSecondsLeft(prev => {
          if (prev <= 1) {
            handleEndDuel();
            return 0;
          }

          // Ghost advances at regular intervals based on targetReps60s
          const timeElapsed = 60 - prev;
          const expectedGhostReps = Math.floor((timeElapsed / 60) * selectedGhost.targetReps60s);
          setGhostDuelReps(expectedGhostReps);

          if (prev <= 4 && prev > 1) {
            audioSynth.playBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [duelActive, selectedGhost]);

  const handleStartDuel = () => {
    audioSynth.init();
    audioSynth.playBeep(true);
    setUserDuelReps(0);
    setGhostDuelReps(0);
    setDuelSecondsLeft(60);
    setDuelResult(null);
    setDuelActive(true);
  };

  const handleUserRep = () => {
    if (!duelActive) return;
    audioSynth.playHydrationChime();
    setUserDuelReps(prev => {
      const next = prev + 1;
      if (next > ghostDuelReps && prev <= ghostDuelReps) {
        // User took the lead
        audioSynth.playBeep(true);
      }
      return next;
    });
  };

  const handleEndDuel = () => {
    setDuelActive(false);
    if (userDuelReps >= ghostDuelReps) {
      setDuelResult('win');
      audioSynth.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      if (onPointsEarned) onPointsEarned(150, userDuelReps);
    } else {
      setDuelResult('loss');
      audioSynth.playBeep(false);
    }
  };

  const handleResetDuel = () => {
    setDuelActive(false);
    setDuelSecondsLeft(60);
    setUserDuelReps(0);
    setGhostDuelReps(0);
    setDuelResult(null);
  };

  // =========================================================================
  // 2. DAILY BOSS QUEST: THE FATIGUE TITAN (1000 HP)
  // =========================================================================
  const [bossHp, setBossHp] = useState(() => {
    const saved = localStorage.getItem('aurafit_boss_hp');
    return saved !== null ? Number(saved) : 1000;
  });
  const maxBossHp = 1000;

  const handleAttackBoss = (damage, questName, xp) => {
    audioSynth.init();
    audioSynth.playFanfare();
    confetti({ particleCount: 60, spread: 60 });
    
    setBossHp(prev => {
      const next = Math.max(0, prev - damage);
      localStorage.setItem('aurafit_boss_hp', String(next));
      if (next === 0) {
        localStorage.setItem('aurafit_boss_defeated', 'true');
        confetti({ particleCount: 150, spread: 100 });
      }
      return next;
    });

    if (onPointsEarned) onPointsEarned(xp, 0);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #f43f5e',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(244, 63, 94, 0.08))',
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
            background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 18px rgba(244, 63, 94, 0.4)'
          }}>
            <Swords size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Gaming & Competitive Arena
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Chamber 7</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              60-second AI ghost rep duels, yoga hold stability showdowns, and weekly boss quests.
            </p>
          </div>
        </div>

        {/* Sub-navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setArenaTab('duel')}
            className={`btn ${arenaTab === 'duel' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Zap size={14} /> 60s Ghost Duel
          </button>
          <button
            onClick={() => setArenaTab('boss')}
            className={`btn ${arenaTab === 'boss' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Flame size={14} /> Titan Boss Quest
          </button>
          <button
            onClick={() => setArenaTab('badges')}
            className={`btn ${arenaTab === 'badges' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Award size={14} /> Badges & Trophies
          </button>
        </div>
      </div>

      {/* ===================================================================
          TAB 1: 60-SECOND AI GHOST DUEL
          =================================================================== */}
      {arenaTab === 'duel' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* Main Battle Ring Card */}
          <div className="glass-card" style={{ padding: '28px', textAlign: 'center', position: 'relative' }}>
            
            {/* Countdown Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-dept" style={{ fontSize: '12px' }}>
                60-Second Rep Battle
              </span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: duelSecondsLeft <= 10 ? '#f43f5e' : '#10b981', fontFamily: 'monospace' }}>
                ⏱️ {duelSecondsLeft}s
              </div>
            </div>

            {/* Competitor Matchup Visual */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '20px 0' }}>
              
              {/* User Side */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  You ({userProfile?.displayName || 'Athlete'})
                </div>
                <div style={{
                  fontSize: 'clamp(48px, 8vw, 68px)',
                  fontWeight: '900',
                  color: userDuelReps >= ghostDuelReps ? '#10b981' : '#f8fafc',
                  lineHeight: '1'
                }}>
                  {userDuelReps}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified Reps</span>
              </div>

              <div style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#f43f5e',
                padding: '0 16px'
              }}>
                VS
              </div>

              {/* Ghost Competitor Side */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {selectedGhost.name}
                </div>
                <div style={{
                  fontSize: 'clamp(48px, 8vw, 68px)',
                  fontWeight: '900',
                  color: ghostDuelReps > userDuelReps ? '#f59e0b' : '#94a3b8',
                  lineHeight: '1'
                }}>
                  {ghostDuelReps}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ghost Record ({selectedGhost.targetReps60s} target)</span>
              </div>

            </div>

            {/* Duel Outcome Banner */}
            {duelResult && (
              <div style={{
                background: duelResult === 'win' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${duelResult === 'win' ? '#10b981' : '#f43f5e'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                margin: '16px 0',
                color: duelResult === 'win' ? '#10b981' : '#fb7185',
                fontSize: '15px',
                fontWeight: '800'
              }}>
                {duelResult === 'win' ? '🏆 VICTORY! You defeated the ghost record! (+150 XP)' : '⚔️ Time Expired! The ghost record held strong. Try again!'}
              </div>
            )}

            {/* Duel Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              {!duelActive ? (
                <button
                  onClick={handleStartDuel}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
                >
                  <Play size={18} /> Start 60s Rep Battle
                </button>
              ) : (
                <button
                  onClick={handleUserRep}
                  className="btn btn-cyan"
                  style={{ padding: '16px 36px', fontSize: '18px', borderRadius: 'var(--radius-full)', fontWeight: '900' }}
                >
                  🔥 LOG REP NOW (+1)
                </button>
              )}

              <button
                onClick={handleResetDuel}
                className="btn btn-secondary"
                style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)' }}
                title="Reset battle"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Real-Time Camera Hook Note */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px', margin: '16px 0 0' }}>
              Tip: Reps completed in the AI Camera Arena also count toward your battle score!
            </p>
          </div>

          {/* Ghost Athlete Opponents List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
              Select Ghost Competitor
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {GHOST_ATHLETES.map((ghost) => {
                const isSelected = selectedGhost.id === ghost.id;
                return (
                  <div
                    key={ghost.id}
                    onClick={() => { if (!duelActive) setSelectedGhost(ghost); }}
                    style={{
                      background: '#0b0f19',
                      border: `1px solid ${isSelected ? ghost.avatarColor : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      cursor: duelActive ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? ghost.avatarColor : 'var(--text-primary)' }}>
                          {ghost.name}
                        </span>
                        <span className="badge badge-dept" style={{ fontSize: '9px' }}>{ghost.department}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {ghost.desc}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: ghost.avatarColor }}>
                        {ghost.targetReps60s}
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>reps / 60s</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onOpenLeaderboard}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px', padding: '10px', fontSize: '12px' }}
            >
              <Trophy size={14} color="#fbbf24" />
              View Full Department Standings
            </button>
          </div>

        </div>
      )}

      {/* ===================================================================
          TAB 2: DAILY BOSS QUEST (THE FATIGUE TITAN)
          =================================================================== */}
      {arenaTab === 'boss' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Boss Banner & HP Meter */}
          <div className="glass-card" style={{
            padding: '30px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(244, 63, 94, 0.15))',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-streak">WEEKLY BOSS RAID</span>
              <span className="badge badge-xp">+200 XP REWARD</span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', margin: '4px 0' }}>
              The Fatigue Titan 👹
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px' }}>
              A colossal embodiment of physical soreness, mental distraction, and sluggishness. Coordinate workouts across physical, mental, and cognitive chambers to deplete its HP!
            </p>

            {/* Boss HP Bar */}
            <div style={{ maxWidth: '500px', margin: '0 auto 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>
                <span style={{ color: '#f43f5e' }}>TITAN HEALTH</span>
                <span style={{ color: '#ffffff' }}>{bossHp} / {maxBossHp} HP</span>
              </div>
              <div style={{ height: '14px', background: '#0b0f19', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <div style={{
                  height: '100%',
                  width: `${(bossHp / maxBossHp) * 100}%`,
                  background: 'linear-gradient(90deg, #f43f5e, #e11d48)',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>

            {bossHp === 0 && (
              <div style={{ color: '#10b981', fontWeight: '800', fontSize: '16px', marginTop: '12px' }}>
                🎉 TITAN DEFEATED! You have unlocked the "Titan Slayer" Gold Badge!
              </div>
            )}
          </div>

          {/* Quests that Strike the Titan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Quest 1 */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Dumbbell size={20} color="#10b981" />
                  <span className="badge badge-streak">-350 Titan HP</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                  Strike with AI Squats
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Execute a verified AI Camera workout to strike with kinetic leg power.
                </p>
              </div>

              <button
                onClick={() => handleAttackBoss(350, 'AI Squats Strike', 50)}
                disabled={bossHp === 0}
                className="btn btn-primary"
                style={{ marginTop: '16px', padding: '9px', fontSize: '12px' }}
              >
                Launch Attack (-350 HP)
              </button>
            </div>

            {/* Quest 2 */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <HeartPulse size={20} color="#ec4899" />
                  <span className="badge badge-streak">-300 Titan HP</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                  Calm with Box Breathing
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Dissolve the Titan's mental noise by completing a 4-4-4-4 breath cycle.
                </p>
              </div>

              <button
                onClick={() => handleAttackBoss(300, 'Box Breathing Strike', 40)}
                disabled={bossHp === 0}
                className="btn btn-cyan"
                style={{ marginTop: '16px', padding: '9px', fontSize: '12px' }}
              >
                Channel Zen (-300 HP)
              </button>
            </div>

            {/* Quest 3 */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Brain size={20} color="#38bdf8" />
                  <span className="badge badge-streak">-350 Titan HP</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                  Checkmate Tactician Strike
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Outmaneuver the Titan's defenses by solving a tactical chess puzzle.
                </p>
              </div>

              <button
                onClick={() => handleAttackBoss(350, 'Chess Tactical Strike', 50)}
                disabled={bossHp === 0}
                className="btn btn-primary"
                style={{ marginTop: '16px', padding: '9px', fontSize: '12px' }}
              >
                Outsmart Titan (-350 HP)
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ===================================================================
          TAB 3: ACHIEVEMENTS & BADGES SHOWCASE
          =================================================================== */}
      {arenaTab === 'badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 6px 0' }}>
              AuraFit Universal Achievement System
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Badges earned across physical fitness, computer vision posture, mental breathwork, and cognitive chess.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {BADGES_REGISTRY.map((badge) => {
              const tierConfig = BADGE_TIERS[badge.tier] || BADGE_TIERS.bronze;
              const isUnlocked = badge.checkUnlocked(userProfile);

              return (
                <div
                  key={badge.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    border: `1px solid ${isUnlocked ? tierConfig.border : 'var(--border-color)'}`,
                    opacity: isUnlocked ? 1 : 0.65,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className="badge" style={{
                        background: `${tierConfig.color}22`,
                        color: tierConfig.color,
                        border: `1px solid ${tierConfig.color}55`,
                        fontSize: '10px'
                      }}>
                        {tierConfig.label.toUpperCase()} TIER
                      </span>

                      {isUnlocked ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}>
                          <CheckCircle2 size={14} /> UNLOCKED
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          LOCKED
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: isUnlocked ? '#ffffff' : 'var(--text-secondary)', marginBottom: '4px' }}>
                      {badge.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                      {badge.desc}
                    </p>
                  </div>

                  <div style={{
                    marginTop: '16px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Reward:</span>
                    <strong style={{ color: '#fbbf24' }}>+{badge.xpAward} XP</strong>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
