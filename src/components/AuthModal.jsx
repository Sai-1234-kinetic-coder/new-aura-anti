import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously 
} from 'firebase/auth';
import { auth, createUserProfile } from '../lib/firebase';
import { ShieldCheck, UserPlus, LogIn, Sparkles, Building2 } from 'lucide-react';

export default function AuthModal({ onClose }) {
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
        await createUserProfile(res.user.uid, email, department, name);
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

  // Quick Guest Login for Instant SIH Jury Demos
  const handleGuestDemo = async (demoDept = "CSE") => {
    setLoading(true);
    try {
      const res = await signInAnonymously(auth);
      await createUserProfile(res.user.uid, `demo_${demoDept.toLowerCase()}@campus.edu`, demoDept, `${demoDept} Athlete`);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Guest demo login failed. Please try email sign in.");
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
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        
        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={26} color="#061c14" />
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
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Full Name:
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Lalam Sai"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '5px' }}>
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '5px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '5px' }}>
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
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '15px' }}
          >
            {loading ? "Processing..." : (isSignUp ? "Sign Up & Join Dept" : "Sign In to Dashboard")}
          </button>
        </form>

        {/* Toggle Switch */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? "Already have an account? Sign In" : "New student on campus? Create Account"}
          </button>
        </div>

        {/* Quick Demo Access Bar */}
        <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '10px' }}>
            ⚡ Instant SIH Jury Demo (1-Click)
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              onClick={() => handleGuestDemo("CSE")} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              disabled={loading}
            >
              Demo as CSE
            </button>
            <button 
              onClick={() => handleGuestDemo("ECE")} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              disabled={loading}
            >
              Demo as ECE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
