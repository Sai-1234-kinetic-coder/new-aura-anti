import React, { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { logWorkout, logDailyMetrics, subscribeToUserDailyLog } from '../lib/firebase';
import { 
  Flame, 
  Droplet, 
  Moon, 
  Footprints, 
  Plus, 
  Camera, 
  Trophy, 
  Users, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  RefreshCw,
  Dumbbell,
  Brain,
  Bot,
  HeartPulse,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function Dashboard({ 
  user, 
  userProfile, 
  workouts = [], 
  onRefreshWorkouts, 
  onLaunchArena, 
  onOpenLeaderboard, 
  onOpenBuddies,
  onLocalWorkoutLogged,
  setActiveTab
}) {
  const toast = useToast();

  // Load live metabolic profile from Chamber 1 if set
  const [metabolicSnapshot, setMetabolicSnapshot] = useState(null);
  useEffect(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    if (saved) {
      try {
        setMetabolicSnapshot(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Hydration state
  const [waterAmount, setWaterAmount] = useState(() => {
    const saved = localStorage.getItem('aurafit_water');
    return saved ? Number(saved) : 2.25;
  });
  const waterTarget = 3.5;

  // Steps state
  const [steps, setSteps] = useState(() => {
    const saved = localStorage.getItem('aurafit_steps');
    return saved ? Number(saved) : 8420;
  });
  const stepTarget = 10000;

  // Sync today's daily log from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToUserDailyLog(user.uid, (data) => {
      if (data.steps !== undefined) {
        setSteps(data.steps);
        localStorage.setItem('aurafit_steps', String(data.steps));
      }
      if (data.waterLiters !== undefined) {
        setWaterAmount(data.waterLiters);
        localStorage.setItem('aurafit_water', String(data.waterLiters));
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // Activity Logger
  const [exerciseName, setExerciseName] = useState('');
  const [durationStr, setDurationStr] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleAddWater = () => {
    const nextAmount = Math.min(Number((waterAmount + 0.25).toFixed(2)), waterTarget);
    setWaterAmount(nextAmount);
    localStorage.setItem('aurafit_water', nextAmount.toString());
    if (user?.uid) {
      logDailyMetrics(user.uid, { waterLiters: nextAmount }).catch(() => {});
    }
  };

  const handleAddSteps = () => {
    const nextSteps = Math.min(steps + 500, 15000);
    setSteps(nextSteps);
    localStorage.setItem('aurafit_steps', nextSteps.toString());
    if (user?.uid) {
      logDailyMetrics(user.uid, { steps: nextSteps }).catch(() => {});
    }
  };

  const handleLogManualActivity = async (e) => {
    e.preventDefault();
    if (!exerciseName || !durationStr) return;
    setIsLogging(true);
    const newWorkoutObj = {
      id: `w_${Date.now()}`,
      exercise: exerciseName,
      duration: durationStr,
      pointsEarned: 25,
      createdAt: new Date()
    };

    try {
      await logWorkout(user?.uid || "demo_user", exerciseName, durationStr, 25);
      setExerciseName('');
      setDurationStr('');
      if (onLocalWorkoutLogged) onLocalWorkoutLogged(newWorkoutObj);
      if (onRefreshWorkouts) onRefreshWorkouts();
      toast.success("✅ Activity successfully logged! +25 XP awarded.");
    } catch (err) {
      if (onLocalWorkoutLogged) onLocalWorkoutLogged(newWorkoutObj);
      setExerciseName('');
      setDurationStr('');
      toast.success("✅ Activity logged locally! +25 XP awarded.");
    } finally {
      setIsLogging(false);
    }
  };

  // Gamification Level calculations
  const totalXp = userProfile?.totalPoints || 140;
  const currentLevel = Math.floor(Math.sqrt(totalXp / 50)) + 1;
  const xpCurrentLevelFloor = (currentLevel - 1) * (currentLevel - 1) * 50;
  const xpNextLevelFloor = currentLevel * currentLevel * 50;
  const levelProgressPct = Math.min(100, Math.round(((totalXp - xpCurrentLevelFloor) / (xpNextLevelFloor - xpCurrentLevelFloor)) * 100));

  const squatReps = userProfile?.squatCount || 14;
  const streakDays = userProfile?.currentStreak || 7;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Live Command Header & Aura Level Hero */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #10b981',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(16, 185, 129, 0.08))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome back, {userProfile?.displayName || 'Champion Athlete'}
              </h2>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>
                {userProfile?.department || 'ATHLETE'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Your cognitive and physical systems are firing. Active streak: <strong style={{ color: '#fbbf24' }}>{streakDays} days 🔥 (1.5x Multiplier)</strong>
            </p>
          </div>

          {/* Aura Level Pill Card */}
          <div style={{
            background: '#0b0f19',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            minWidth: '220px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} /> Aura Level {currentLevel}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#f8fafc' }}>
                {totalXp} XP
              </span>
            </div>

            {/* Level Bar */}
            <div style={{ height: '6px', background: '#1e293b', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${levelProgressPct}%`,
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {xpNextLevelFloor - totalXp} XP to Level {currentLevel + 1}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Metabolic & Biometric Quick-Tile (Interlinked with Chamber 1) */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={18} color="#10b981" />
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>
              Active Metabolic Profile (Chamber 1)
            </h3>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('trainer')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-full)' }}
            >
              Recalibrate In Trainer <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#0b0f19', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #10b981' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Weight</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>
              {metabolicSnapshot?.weightKg || 72} kg
            </div>
          </div>

          <div style={{ background: '#0b0f19', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #06b6d4' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Height</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#06b6d4' }}>
              {metabolicSnapshot?.heightCm || 175} cm
            </div>
          </div>

          <div style={{ background: '#0b0f19', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #f59e0b' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Calorie Target</span>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b' }}>
              {metabolicSnapshot?.goal === 'hypertrophy' ? '~2,750 kcal' : '~2,150 kcal'}
            </div>
          </div>

          <div style={{ background: '#0b0f19', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #a855f7' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Goal</span>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#a855f7' }}>
              {metabolicSnapshot?.goal ? metabolicSnapshot.goal.toUpperCase().replace('_', ' ') : 'FAT LOSS'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daily Activity Triple Ring & Key Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Metric 1: AI Vision Reps */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>AI Form Reps</span>
            <Camera size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#10b981' }}>
            {squatReps} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>reps</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Pose accuracy score: <strong style={{ color: '#10b981' }}>94% form validity</strong>
          </p>
          <button
            onClick={onLaunchArena}
            className="btn btn-primary"
            style={{ marginTop: '12px', padding: '7px 12px', fontSize: '11px', width: '100%' }}
          >
            <Camera size={13} /> Launch AI Camera
          </button>
        </div>

        {/* Metric 2: Smart Hydration */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Hydration Log</span>
            <Droplet size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#06b6d4' }}>
            {waterAmount} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {waterTarget} L</span>
          </div>
          <div style={{ height: '6px', background: '#1e293b', borderRadius: 'var(--radius-full)', margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((waterAmount / waterTarget) * 100))}%`, background: '#06b6d4' }} />
          </div>
          <button
            onClick={handleAddWater}
            className="btn btn-cyan"
            style={{ marginTop: '8px', padding: '7px 12px', fontSize: '11px', width: '100%' }}
          >
            <Plus size={13} /> Log Glass (+250ml)
          </button>
        </div>

        {/* Metric 3: Campus Footsteps */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Active Footsteps</span>
            <Footprints size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#f59e0b' }}>
            {steps.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {stepTarget.toLocaleString()}</span>
          </div>
          <div style={{ height: '6px', background: '#1e293b', borderRadius: 'var(--radius-full)', margin: '8px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((steps / stepTarget) * 100))}%`, background: '#f59e0b' }} />
          </div>
          <button
            onClick={handleAddSteps}
            className="btn btn-secondary"
            style={{ marginTop: '8px', padding: '7px 12px', fontSize: '11px', width: '100%' }}
          >
            <Plus size={13} /> Simulate Walk (+500 steps)
          </button>
        </div>

      </div>

      {/* 4. Quick-Action Chamber Launchpad (Jump into any Chamber in 1 click) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px', letterSpacing: '-0.02em' }}>
          Quick Chamber Launchpad
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <button
            onClick={() => setActiveTab && setActiveTab('camera')}
            className="btn btn-primary"
            style={{ padding: '12px', justifyContent: 'flex-start', borderRadius: 'var(--radius-md)' }}
          >
            <Camera size={18} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>AI Camera Arena</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>Pose & Rep Correction</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('coach')}
            className="btn btn-secondary"
            style={{ padding: '12px', justifyContent: 'flex-start', borderRadius: 'var(--radius-md)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
          >
            <Bot size={18} color="#a855f7" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>AuraCoach AI</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Conversational Assistant</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('mind')}
            className="btn btn-secondary"
            style={{ padding: '12px', justifyContent: 'flex-start', borderRadius: 'var(--radius-md)', borderColor: 'rgba(236, 72, 153, 0.4)' }}
          >
            <HeartPulse size={18} color="#ec4899" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Zen & Mudras</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mindfulness & Breathwork</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('chess')}
            className="btn btn-secondary"
            style={{ padding: '12px', justifyContent: 'flex-start', borderRadius: 'var(--radius-md)', borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            <Brain size={18} color="#38bdf8" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Cognitive Chess</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Play AI & Puzzles</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('tools')}
            className="btn btn-secondary"
            style={{ padding: '12px', justifyContent: 'flex-start', borderRadius: 'var(--radius-md)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            <Clock size={18} color="#f59e0b" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Smart Tools</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HIIT & Chime Alarms</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Activity Logger & Recent Activity Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Manual Workout Logger */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#10b981" />
            Log Custom Workout Activity
          </h3>

          <form onSubmit={handleLogManualActivity} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Activity / Exercise Name
              </label>
              <input 
                type="text"
                placeholder="e.g., 5km Campus Track Run, Swimming, Calisthenics"
                value={exerciseName}
                onChange={e => setExerciseName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Duration / Reps
              </label>
              <input 
                type="text"
                placeholder="e.g., 25 mins or 4 sets x 15 reps"
                value={durationStr}
                onChange={e => setDurationStr(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLogging}
              className="btn btn-primary"
              style={{ marginTop: '6px', padding: '10px', fontSize: '13px' }}
            >
              {isLogging ? "Logging XP..." : "Log Activity (+25 Aura XP)"}
            </button>
          </form>
        </div>

        {/* Recent Workouts Feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              Recent Training Logs ({workouts.length})
            </h3>
            {onRefreshWorkouts && (
              <button onClick={onRefreshWorkouts} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <RefreshCw size={12} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {workouts.map((w, idx) => (
              <div
                key={w.id || idx}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {w.exercise}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Duration: {w.duration}
                  </div>
                </div>

                <span className="badge badge-xp" style={{ fontSize: '11px' }}>
                  +{w.pointsEarned || 25} XP
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
