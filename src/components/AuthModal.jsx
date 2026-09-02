import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, createUserProfile } from '../lib/firebase';
import { ShieldCheck, UserPlus, LogIn, Sparkles, Building2, Zap } from 'lucide-react';

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
