import React from 'react';
import { Flame, ShieldCheck, Heart, Sparkles, Brain, Camera, MessageSquare, Award } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer style={{
      marginTop: '60px',
      borderTop: '1px solid rgba(56, 189, 248, 0.15)',
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(16px)',
      padding: '40px 20px 28px',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '32px',
          marginBottom: '36px'
        }}>
          {/* Col 1: Brand & Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Flame size={18} color="#061c14" />
              </div>
              <span style={{
                fontSize: '18px',
                fontWeight: '900',
                background: 'linear-gradient(90deg, #10b981, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AURAFIT
              </span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              Next-generation unified human performance platform integrating real-time computer vision pose correction, metabolic training, mental wellness, and cognitive brain athletics.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Zero-Cloud Vision</span>
              <span className="badge badge-xp" style={{ fontSize: '10px' }}>100% Privacy</span>
            </div>
          </div>

          {/* Col 2: The 8 Chambers */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Core Chambers
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <span onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
                Command Hub
              </span>
              <span onClick={() => setActiveTab('camera')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                AI Vision Arena
              </span>
              <span onClick={() => setActiveTab('trainer')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Metabolic Engine
              </span>
              <span onClick={() => setActiveTab('coach')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                AuraCoach AI
              </span>
              <span onClick={() => setActiveTab('mind')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Zen & Mudras
              </span>
              <span onClick={() => setActiveTab('chess')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Cognitive Chess
              </span>
              <span onClick={() => setActiveTab('tools')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Smart Tools
              </span>
              <span onClick={() => setActiveTab('arena')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Challenge Arena
              </span>
            </div>
          </div>

          {/* Col 3: Privacy & Safety Guardrails */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#10b981" />
              Safety & Ethics Protocol
            </h4>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              <strong>Medical Disclaimer:</strong> AuraFit provides fitness metrics, posture feedback, and nutritional estimations for general wellness and educational purposes only. It is not medical software and does not substitute clinical diagnosis or professional advice.
            </p>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-muted)', marginTop: '8px' }}>
              <strong>Privacy Guarantee:</strong> All camera video streams run strictly in-memory client-side inside your browser sandbox. No video, biometric photos, or raw camera data are ever stored or uploaded.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} AuraFit Platform. Designed for Peak Human Performance.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Privacy-First</span>
            <span>•</span>
            <span>Edge AI</span>
            <span>•</span>
            <span>Zero-Install Web App</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
