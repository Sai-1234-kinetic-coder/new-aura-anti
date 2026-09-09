import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, createUserProfile, signInWithGoogle } from '../lib/firebase';
import { ShieldCheck, UserPlus, LogIn, Sparkles, Building2, Zap, Globe } from 'lucide-react';

export default function AuthModal({ onClose, onGuestLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        if (!email || !password) throw new Error("Please enter both email and password.");
        const localUid = 'athlete_' + Date.now();
        const localProf = {
          uid: localUid,
          email,
          displayName: name || email.split('@')[0],
          department: department.toUpperCase(),
          totalPoints: 140,
          currentStreak: 1
        };
        await createUserProfile(localUid, email, department, name || email.split('@')[0]);
        if (onGuestLogin) onGuestLogin(localProf);
        onClose();
        return;
      }

      if (isSignUp) {
        if (!email || !password) throw new Error("Please enter both email and password.");
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(res.user.uid, email, department, name || email.split('@')[0]);
      } else {
        if (!email || !password) throw new Error("Please enter both email and password.");
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Foolproof 1-Click Instant Demo Login (Works 100% with or without Firebase Anonymous Auth)
  const handleGuestDemo = async (demoDept = "CSE") => {
    setLoading(true);
    setError('');
    const demoEmail = `demo_${demoDept.toLowerCase()}@aurafit.campus`;
    const demoPass = "Demo12345!";
    const demoName = `${demoDept} Campus Champion`;

    if (!auth) {
      if (onGuestLogin) {
        onGuestLogin({
          uid: `demo_${demoDept.toLowerCase()}_${Date.now()}`,
          email: demoEmail,
          displayName: demoName,
          department: demoDept,
          totalPoints: demoDept === 'CSE' ? 140 : 110,
          squatCount: demoDept === 'CSE' ? 14 : 11,
          currentStreak: 12
        });
      }
      onClose();
      setLoading(false);
      return;
    }

    try {
      // 1. Try Signing in with the pre-configured Demo Account
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch (signInErr) {
        // 2. If account doesn't exist yet, automatically create it
        const res = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        await createUserProfile(res.user.uid, demoEmail, demoDept, demoName);
      }
      onClose();
    } catch (err) {
      console.warn("Firebase online auth bypassed, using local demo session:", err);
      // 3. Fallback: Instant local guest session state
      if (onGuestLogin) {
        onGuestLogin({
          uid: `demo_${demoDept.toLowerCase()}_${Date.now()}`,
          email: demoEmail,
          displayName: demoName,
          department: demoDept,
          totalPoints: demoDept === 'CSE' ? 140 : 110,
          squatCount: demoDept === 'CSE' ? 14 : 11,
          currentStreak: 12
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      if (!auth) {
        handleGuestDemo('CSE');
        return;
      }
      const res = await signInWithGoogle();
      if (res?.user) {
        await createUserProfile(res.user.uid, res.user.email, department, res.user.displayName);
      }
      onClose();
    } catch (err) {
      console.warn("Google Sign-In note:", err);
      setError(err?.message || "Google sign-in could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-card glow-cyan" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        
        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={24} color="#061c14" />
          </div>
          <h2 style={{ fontSize: '22px', color: '#fff', margin: '0 0 4px 0' }}>
            {isSignUp ? "Create Student Account" : "Welcome to AuraFit"}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isSignUp ? "Tag your department and start scoring Aura points" : "Sign in to track pose workouts & department standings"}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        {/* 1-Click Instant Demo Bar */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '18px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Zap size={14} /> Quick Demo Login
          </span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={() => handleGuestDemo("CSE")} 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
              disabled={loading}
            >
              Demo as CSE
            </button>
            <button 
              type="button"
              onClick={() => handleGuestDemo("ECE")} 
              className="btn btn-cyan" 
              style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
              disabled={loading}
            >
              Demo as ECE
            </button>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Full Name:
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Aarav Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Campus Email:
            </label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="student@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Password:
            </label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <Building2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Your Department / Branch:
              </label>
              <select 
                className="form-select"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="CSE">CSE — Computer Science & Engineering</option>
                <option value="ECE">ECE — Electronics & Communication</option>
                <option value="EEE">EEE — Electrical & Electronics</option>
                <option value="MECH">MECH — Mechanical Engineering</option>
                <option value="IT">IT — Information Technology</option>
                <option value="CIVIL">CIVIL — Civil Engineering</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: '4px', fontSize: '14px' }}
          >
            {loading ? "Processing..." : (isSignUp ? "Sign Up & Join Dept" : "Sign In to Dashboard")}
          </button>
        </form>

        {/* Toggle Switch & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? "Already registered? Sign In" : "New student? Create Account"}
          </button>

          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
