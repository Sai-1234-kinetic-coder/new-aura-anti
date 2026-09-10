import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Droplets, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Bell, 
  Plus, 
  Flame, 
  Apple, 
  CheckCircle2, 
  Sparkles, 
  Zap,
  Coffee,
  Heart
} from 'lucide-react';
import { audioSynth } from '../../lib/audioSynth';

export default function WellnessTools() {
  // Navigation tabs within Chamber 4
  const [activeTab, setActiveTab] = useState('hydration'); // 'hydration' | 'timers' | 'nutrition'

  // =========================================================================
  // 1. SMART HYDRATION ALARM & TRACKER
  // =========================================================================
  const [waterLoggedMl, setWaterLoggedMl] = useState(() => {
    const saved = localStorage.getItem('aurafit_water_ml');
    return saved ? Number(saved) : 1750;
  });
  const [waterTargetMl, setWaterTargetMl] = useState(() => {
    const profile = localStorage.getItem('aurafit_metabolic_profile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        return Math.round(parsed.weightKg * 35 + 400);
      } catch (e) {}
    }
    return 3000;
  });
  const [reminderIntervalMins, setReminderIntervalMins] = useState(45);
  const [alarmActive, setAlarmActive] = useState(false);
  const [secondsUntilNextChime, setSecondsUntilNextChime] = useState(45 * 60);

  useEffect(() => {
    localStorage.setItem('aurafit_water_ml', String(waterLoggedMl));
  }, [waterLoggedMl]);

  // Alarm interval countdown
  useEffect(() => {
    if (!alarmActive) return;
    const interval = setInterval(() => {
      setSecondsUntilNextChime(prev => {
        if (prev <= 1) {
          audioSynth.playHydrationChime();
          // Trigger notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('AuraFit Hydration Chime 💧', {
              body: 'Time to drink a glass of fresh water and re-energize!',
              icon: '/favicon.ico'
            });
          }
          return reminderIntervalMins * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alarmActive, reminderIntervalMins]);

  const handleToggleAlarm = () => {
    if (!alarmActive) {
      audioSynth.init();
      audioSynth.playHydrationChime();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setSecondsUntilNextChime(reminderIntervalMins * 60);
      setAlarmActive(true);
    } else {
      setAlarmActive(false);
    }
  };

  const handleLogWater = (ml) => {
    audioSynth.playHydrationChime();
    setWaterLoggedMl(prev => Math.min(6000, prev + ml));
  };

  const waterPercent = Math.min(100, Math.round((waterLoggedMl / waterTargetMl) * 100));

  // =========================================================================
  // 2. MULTI-MODE EXERCISE TIMERS (HIIT / TABATA, STOPWATCH, COUNTDOWN)
  // =========================================================================
  const [timerMode, setTimerMode] = useState('hiit'); // 'hiit' | 'stopwatch' | 'countdown'

  // --- HIIT State ---
  const [workTime, setWorkTime] = useState(20);
  const [restTime, setRestTime] = useState(10);
  const [totalSets, setTotalSets] = useState(8);
  const [currentSet, setCurrentSet] = useState(1);
  const [hiitPhase, setHiitPhase] = useState('idle'); // 'idle' | 'prepare' | 'work' | 'rest' | 'finished'
  const [hiitSecondsLeft, setHiitSecondsLeft] = useState(20);
  const [hiitIsRunning, setHiitIsRunning] = useState(false);

  useEffect(() => {
    let timer = null;
    if (hiitIsRunning) {
      timer = setInterval(() => {
        setHiitSecondsLeft(prev => {
          if (prev <= 4 && prev > 1) {
            audioSynth.playBeep(false); // 3, 2, 1 low tone
          } else if (prev === 1) {
            // Phase transition
            audioSynth.playBeep(true); // high tone
            if (hiitPhase === 'prepare') {
              setHiitPhase('work');
              return workTime;
            } else if (hiitPhase === 'work') {
              if (currentSet >= totalSets) {
                setHiitPhase('finished');
                setHiitIsRunning(false);
                audioSynth.playFanfare();
                return 0;
              } else {
                setHiitPhase('rest');
                return restTime;
              }
            } else if (hiitPhase === 'rest') {
              setCurrentSet(s => s + 1);
              setHiitPhase('work');
              return workTime;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hiitIsRunning, hiitPhase, currentSet, totalSets, workTime, restTime]);

  const handleStartHiit = () => {
    audioSynth.init();
    if (hiitPhase === 'idle' || hiitPhase === 'finished') {
      setCurrentSet(1);
      setHiitPhase('prepare');
      setHiitSecondsLeft(3);
    }
    setHiitIsRunning(true);
  };

  const handlePauseHiit = () => setHiitIsRunning(false);

  const handleResetHiit = () => {
    setHiitIsRunning(false);
    setHiitPhase('idle');
    setCurrentSet(1);
    setHiitSecondsLeft(workTime);
  };

  // --- Stopwatch State ---
  const [swTimeMs, setSwTimeMs] = useState(0);
  const [swIsRunning, setSwIsRunning] = useState(false);
  const [swLaps, setSwLaps] = useState([]);
  const swRef = useRef(null);

  useEffect(() => {
    if (swIsRunning) {
      const startTime = Date.now() - swTimeMs;
      swRef.current = setInterval(() => {
        setSwTimeMs(Date.now() - startTime);
      }, 33);
    } else {
      clearInterval(swRef.current);
    }
    return () => clearInterval(swRef.current);
  }, [swIsRunning]);

  const formatMs = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // =========================================================================
  // 3. NUTRITION & CIRCADIAN TIMING GUIDES
  // =========================================================================
  const fastingHoursCompleted = 14;
  const fastingTotalHours = 16;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #f59e0b',
        background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
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
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 18px rgba(245, 158, 11, 0.4)'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                General Fitness & Lifestyle Tools
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Chamber 4</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Precision audio-chime hydration tracker, HIIT/Tabata interval timers, and circadian nutrient guides.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('hydration')}
            className={`btn ${activeTab === 'hydration' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Droplets size={14} />
            Smart Hydration
          </button>
          <button
            onClick={() => setActiveTab('timers')}
            className={`btn ${activeTab === 'timers' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Timer size={14} />
            HIIT & Timers
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`btn ${activeTab === 'nutrition' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          >
            <Apple size={14} />
            Circadian Habits
          </button>
        </div>
      </div>

      {/* ===================================================================
          TAB 1: SMART HYDRATION ALARM & FLUID TRACKER
          =================================================================== */}
      {activeTab === 'hydration' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Fluid Visualizer & Quick Log */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              Daily Hydration Status
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Target: {waterTargetMl} ml (~{Math.round(waterTargetMl / 250)} standard glasses)
            </span>

            {/* Visual Glass Container */}
            <div style={{
              width: '120px',
              height: '190px',
              borderRadius: '0 0 24px 24px',
              border: '3px solid rgba(56, 189, 248, 0.4)',
              borderTop: '1px dashed rgba(56, 189, 248, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.6)',
              boxShadow: '0 0 24px rgba(6, 182, 212, 0.2)',
              marginBottom: '20px'
            }}>
              {/* Fluid Fill */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${waterPercent}%`,
                background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)'
              }}>
                {/* Surface ripple */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.4)'
                }} />
              </div>

              {/* Glass text readout */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '22px',
                fontWeight: '900',
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                zIndex: 5
              }}>
                {waterPercent}%
              </div>
            </div>

            <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', marginBottom: '2px' }}>
              {waterLoggedMl} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {waterTargetMl} ml</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {waterLoggedMl >= waterTargetMl ? "🎉 Optimal hydration reached for today!" : `${waterTargetMl - waterLoggedMl} ml remaining to hit target`}
            </p>

            {/* Quick Log Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => handleLogWater(250)}
                className="btn btn-cyan"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                <Plus size={14} /> +250ml Glass
              </button>
              <button
                onClick={() => handleLogWater(500)}
                className="btn btn-cyan"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                <Plus size={14} /> +500ml Bottle
              </button>
              <button
                onClick={() => setWaterLoggedMl(0)}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                title="Reset log"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Smart Audio Alarm Settings */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="#f59e0b" />
                Audio Chime Alarm
              </h3>
              <span className="badge" style={{ 
                background: alarmActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                color: alarmActive ? '#10b981' : 'var(--text-muted)'
              }}>
                {alarmActive ? 'ACTIVE' : 'MUTED'}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Synthesizes crystal-harmonic audio frequencies at regular intervals to remind you to drink without looking at your phone.
            </p>

            {/* Frequency Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Reminder Frequency:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setReminderIntervalMins(mins);
                      setSecondsUntilNextChime(mins * 60);
                    }}
                    className={`btn ${reminderIntervalMins === mins ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', justifyContent: 'center' }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Live Alarm Countdown */}
            {alarmActive && (
              <div style={{
                background: '#0b0f19',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Next Chime in:</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
                  {Math.floor(secondsUntilNextChime / 60)}:{String(secondsUntilNextChime % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Alarm Controls */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <button
                onClick={handleToggleAlarm}
                className={`btn ${alarmActive ? 'btn-danger' : 'btn-primary'}`}
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                {alarmActive ? 'Stop Hydration Alarm' : 'Activate Hydration Alarm'}
              </button>

              <button
                onClick={() => audioSynth.playHydrationChime()}
                className="btn btn-secondary"
                style={{ padding: '10px 14px', fontSize: '13px' }}
                title="Test synthesized crystal chime"
              >
                <Volume2 size={16} /> Test Chime
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================
          TAB 2: MULTI-MODE EXERCISE TIMERS (HIIT / TABATA, STOPWATCH)
          =================================================================== */}
      {activeTab === 'timers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Submode switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTimerMode('hiit')}
              className={`btn ${timerMode === 'hiit' ? 'btn-cyan' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              HIIT / Tabata Intervals
            </button>
            <button
              onClick={() => setTimerMode('stopwatch')}
              className={`btn ${timerMode === 'stopwatch' ? 'btn-cyan' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              Stopwatch & Splits
            </button>
          </div>

          {/* HIIT TABATA ENGINE */}
          {timerMode === 'hiit' && (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', position: 'relative' }}>
              
              {/* Phase Pill */}
              <div style={{ marginBottom: '14px' }}>
                <span className="badge" style={{
                  fontSize: '14px',
                  padding: '6px 16px',
                  letterSpacing: '0.08em',
                  background: hiitPhase === 'work' ? 'rgba(16, 185, 129, 0.25)' : hiitPhase === 'rest' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                  color: hiitPhase === 'work' ? '#10b981' : hiitPhase === 'rest' ? '#f59e0b' : '#38bdf8',
                  border: `1px solid ${hiitPhase === 'work' ? '#10b981' : hiitPhase === 'rest' ? '#f59e0b' : '#38bdf8'}`
                }}>
                  {hiitPhase === 'idle' ? 'READY TO TRAIN' : hiitPhase === 'prepare' ? 'GET READY...' : hiitPhase === 'work' ? '🔥 WORK INTERVAL' : hiitPhase === 'rest' ? '💤 RECOVERY REST' : '🏆 WORKOUT FINISHED'}
                </span>
              </div>

              {/* Big Seconds Readout */}
              <div style={{
                fontSize: 'clamp(64px, 12vw, 100px)',
                fontWeight: '900',
                fontFamily: 'monospace',
                lineHeight: '1',
                color: hiitPhase === 'work' ? '#10b981' : hiitPhase === 'rest' ? '#f59e0b' : '#ffffff',
                textShadow: hiitPhase === 'work' ? '0 0 30px rgba(16, 185, 129, 0.4)' : 'none',
                marginBottom: '10px'
              }}>
                {hiitSecondsLeft}
              </div>

              {/* Set Progress */}
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                SET <strong style={{ color: '#fff' }}>{currentSet}</strong> OF <strong style={{ color: '#fff' }}>{totalSets}</strong>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {!hiitIsRunning ? (
                  <button
                    onClick={handleStartHiit}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
                  >
                    <Play size={18} /> Start Interval
                  </button>
                ) : (
                  <button
                    onClick={handlePauseHiit}
                    className="btn btn-secondary"
                    style={{ padding: '12px 28px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
                  >
                    <Pause size={18} /> Pause
                  </button>
                )}

                <button
                  onClick={handleResetHiit}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
                >
                  <RotateCcw size={18} /> Reset
                </button>
              </div>

              {/* Interval Config Sliders */}
              <div style={{
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                textAlign: 'left'
              }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Work Duration: <strong style={{ color: '#10b981' }}>{workTime}s</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={workTime}
                    disabled={hiitIsRunning}
                    onChange={(e) => { setWorkTime(Number(e.target.value)); if (hiitPhase === 'idle') setHiitSecondsLeft(Number(e.target.value)); }}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Rest Duration: <strong style={{ color: '#f59e0b' }}>{restTime}s</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="5"
                    value={restTime}
                    disabled={hiitIsRunning}
                    onChange={(e) => setRestTime(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Total Sets: <strong style={{ color: '#38bdf8' }}>{totalSets} sets</strong>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={totalSets}
                    disabled={hiitIsRunning}
                    onChange={(e) => setTotalSets(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>
              </div>

            </div>
          )}

          {/* STOPWATCH ENGINE */}
          {timerMode === 'stopwatch' && (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(48px, 9vw, 84px)',
                fontWeight: '900',
                fontFamily: 'monospace',
                color: '#38bdf8',
                marginBottom: '20px'
              }}>
                {formatMs(swTimeMs)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => setSwIsRunning(!swIsRunning)}
                  className={`btn ${swIsRunning ? 'btn-danger' : 'btn-primary'}`}
                  style={{ padding: '10px 24px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
                >
                  {swIsRunning ? <Pause size={16} /> : <Play size={16} />}
                  {swIsRunning ? 'Stop' : 'Start'}
                </button>

                <button
                  onClick={() => {
                    if (swTimeMs > 0) setSwLaps([formatMs(swTimeMs), ...swLaps]);
                  }}
                  disabled={!swIsRunning}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
                >
                  Lap Split
                </button>

                <button
                  onClick={() => { setSwIsRunning(false); setSwTimeMs(0); setSwLaps([]); }}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-full)' }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Laps List */}
              {swLaps.length > 0 && (
                <div style={{ maxWidth: '320px', margin: '0 auto', textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    SPLIT LAPS ({swLaps.length})
                  </div>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {swLaps.map((lap, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-inset)', borderRadius: '4px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Lap {swLaps.length - idx}</span>
                        <strong style={{ color: '#0284c7' }}>{lap}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ===================================================================
          TAB 3: CIRCADIAN NUTRITION & FOOD HABITS GUIDE
          =================================================================== */}
      {activeTab === 'nutrition' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Circadian Meal Window */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Coffee size={18} color="#d97706" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Circadian Intermittent Window</h3>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Aligning nutrient intake with daylight cycles enhances insulin sensitivity, cellular autophagy, and resting sleep architecture.
            </p>

            <div style={{ marginTop: '16px', background: 'var(--bg-inset)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>16:8 Fasting Window</span>
                <strong style={{ color: '#10b981' }}>{fastingHoursCompleted}h completed</strong>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(fastingHoursCompleted / fastingTotalHours) * 100}%`, background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span>Eating Phase: 11:00 AM - 7:00 PM</span>
                <span>Fasting Phase: 7:00 PM - 11:00 AM</span>
              </div>
            </div>
          </div>

          {/* Pre & Post Workout Timing */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Nutrient Timing Architecture</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #06b6d4' }}>
                <strong style={{ color: '#06b6d4', display: 'block', marginBottom: '2px' }}>Pre-Workout (30–60 mins prior)</strong>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  Easily digestible low-fat carbs + light protein (e.g. banana with rice cakes or whey isolate) to prime muscle glycogen.
                </p>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#10b981', display: 'block', marginBottom: '2px' }}>Post-Workout (Within 45 mins)</strong>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  25–35g high-leucine complete protein + fast-clearing carbs to halt muscular catabolism and trigger mTOR protein synthesis.
                </p>
              </div>
            </div>
          </div>

          {/* Micronutrient Awareness */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={18} color="#9333ea" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Essential Athletic Micronutrients</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
              <div style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#0284c7', display: 'block' }}>Magnesium Glycinate</strong>
                <span style={{ color: 'var(--text-muted)' }}>Neuromuscular relaxation & deep REM restorative sleep</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#d97706', display: 'block' }}>Electrolyte Sodium/Potassium</strong>
                <span style={{ color: 'var(--text-muted)' }}>Cellular fluid osmolarity and neuromuscular firing</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#10b981', display: 'block' }}>Vitamin D3 + K2</strong>
                <span style={{ color: 'var(--text-muted)' }}>Bone calcium absorption & endocrine hormonal output</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#e11d48', display: 'block' }}>Zinc Picolinate</strong>
                <span style={{ color: 'var(--text-muted)' }}>Immune resistance & enzymatic muscle repair</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
