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
  RefreshCw
} from 'lucide-react';


export default function Dashboard({ 
  user, 
  userProfile, 
  workouts = [], 
  onRefreshWorkouts, 
  onLaunchArena, 
  onOpenLeaderboard, 
  onOpenBuddies,
  onLocalWorkoutLogged 
}) {
  const toast = useToast();

  // Interactive Water Logger (Persisted in localStorage + Firestore daily_logs)
  const [waterAmount, setWaterAmount] = useState(() => {
    const saved = localStorage.getItem('aurafit_water');
    return saved ? Number(saved) : 2.2;
  });
  const waterTarget = 3.5;

  // Interactive Daily Steps Simulator (Persisted in localStorage + Firestore daily_logs)
  const [steps, setSteps] = useState(() => {
    const saved = localStorage.getItem('aurafit_steps');
    return saved ? Number(saved) : 8420;
  });
  const stepTarget = 10000;

  // Sync today's daily log from Firestore on mount (so values survive page reload)
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


  // Manual Activity Logger State
  const [exerciseName, setExerciseName] = useState('');
  const [durationStr, setDurationStr] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleAddWater = () => {
    const nextAmount = Math.min(Number((waterAmount + 0.25).toFixed(2)), waterTarget);
    setWaterAmount(nextAmount);
    localStorage.setItem('aurafit_water', nextAmount.toString());
    // Persist to Firestore daily_logs (fire-and-forget; localStorage is the sync fallback)
    if (user?.uid) {
      logDailyMetrics(user.uid, { waterLiters: nextAmount }).catch(() => {});
    }
  };

  const handleAddSteps = () => {
    const nextSteps = Math.min(steps + 500, 15000);
    setSteps(nextSteps);
    localStorage.setItem('aurafit_steps', nextSteps.toString());
    // Persist to Firestore daily_logs
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
      console.warn("Local workout log fallback:", err);
      if (onLocalWorkoutLogged) onLocalWorkoutLogged(newWorkoutObj);
      setExerciseName('');
      setDurationStr('');
      toast.success("✅ Activity logged locally! +25 XP awarded.");
    } finally {
      setIsLogging(false);
    }
  };

  const stepPercent = Math.min(Math.round((steps / stepTarget) * 100), 100);

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome & Campus Banner */}
      <div className="glass-card glow-emerald" style={{
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-dept">Department of {userProfile?.department || 'CSE'}</span>
              <span className="badge badge-streak">🔥 14-Day Streak</span>
            </div>
            <h2 style={{ fontSize: '26px', color: '#fff', margin: '0 0 6px 0' }}>
              Welcome back, {userProfile?.displayName || user?.email?.split('@')[0] || 'Campus Athlete'}! 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              Your department holds <strong>#1 position</strong> on campus today. Keep your streak alive with an AI Posture session!
            </p>
          </div>

          <button 
            onClick={onLaunchArena}
            className="btn btn-primary glow-emerald"
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            <Camera size={18} />
            Launch AI Pose Arena ⚡
          </button>
        </div>
      </div>

      {/* Dynamic Health & Activity KPI Cards */}
      <div className="grid-stats">
        
        {/* Steps Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Steps</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Footprints size={18} color="#38bdf8" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0 }}>
              {steps.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {stepTarget.toLocaleString()}</span>
            </h3>
            <button 
              onClick={handleAddSteps}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              title="Add 500 Steps"
            >
              +500 🚶
            </button>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '12px 0 6px 0' }}>
            <div style={{ width: `${stepPercent}%`, height: '100%', background: '#38bdf8', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>{stepPercent}% of daily campus goal</span>
        </div>

        {/* Interactive Water Logger Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Water Hydration</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplet size={18} color="#06b6d4" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0 }}>{waterAmount}L <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {waterTarget}L</span></h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{(waterTarget - waterAmount).toFixed(1)}L remaining today</p>
            </div>
            <button 
              onClick={handleAddWater}
              className="btn btn-cyan"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Add 250ml"
            >
              <Plus size={14} /> +250ml 💧
            </button>
          </div>
        </div>

        {/* Sleep Tracker Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sleep Quality</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Moon size={18} color="#a855f7" />
            </div>
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: '0 0 4px 0' }}>7.5h <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 8.0h</span></h3>
          <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '10px 0 6px 0' }}>
            <div style={{ width: '92%', height: '100%', background: '#a855f7', borderRadius: 'var(--radius-full)' }} />
          </div>
          <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: '600' }}>92% sleep efficiency score</span>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div 
          className="glass-card" 
          style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
          onClick={onOpenLeaderboard}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={24} color="#fbbf24" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Department Wars Leaderboard</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>View real-time branch rankings & MVPs</p>
          </div>
        </div>

        <div 
          className="glass-card" 
          style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
          onClick={onOpenBuddies}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#38bdf8" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Campus Buddy Finder</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Find partners for morning runs & gym</p>
          </div>
        </div>
      </div>

      {/* Manual Activity Logger & Recent Stream Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Logger Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#fff', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#10b981" />
            Log Manual Campus Activity
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Ran track, played sports, or completed gym sets? Log them to score department XP!
          </p>

          <form onSubmit={handleLogManualActivity} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Activity Name:
              </label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. 5km Campus Track Run"
                value={exerciseName}
                onChange={e => setExerciseName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Duration / Reps:
              </label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. 25 mins or 3 sets"
                value={durationStr}
                onChange={e => setDurationStr(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLogging}
              className="btn btn-primary"
              style={{ marginTop: '8px', padding: '11px' }}
            >
              {isLogging ? "Saving to Cloud..." : "Save Activity (+25 XP) 🚀"}
            </button>
          </form>
        </div>

        {/* Recent Activity History */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#38bdf8" />
              Recent Activity Stream
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{workouts.length} recorded</span>
          </div>

          {workouts.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No workouts logged yet today.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Complete reps in the AI Arena to see them here!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workouts.slice(0, 5).map((w, idx) => (
                <div 
                  key={w.id || idx}
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
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{w.exercise}</h5>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{w.duration}</span>
                    </div>
                  </div>
                  <span className="badge badge-xp" style={{ fontSize: '11px' }}>
                    +{w.pointsEarned || 10} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
