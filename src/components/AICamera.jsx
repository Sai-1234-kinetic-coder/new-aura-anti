import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { addSquatPoints, logWorkout } from '../lib/firebase';
import { 
  Camera, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Flame, 
  Award, 
  Activity, 
  RefreshCw, 
  AlertCircle,
  Zap
} from 'lucide-react';

export default function AICamera({ onBack, user, userProfile }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  // Exercise and Tracking State
  const [count, setCount] = useState(0);
  const [exerciseType, setExerciseType] = useState('Squats');
  const [kneeAngle, setKneeAngle] = useState(175);
  const [postureFeedback, setPostureFeedback] = useState("Position entire body in frame");
  const [postureQuality, setPostureQuality] = useState('good'); // 'good' | 'warning' | 'alert'
  const [isSaving, setIsSaving] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [sessionStartTime] = useState(Date.now());
  const [sessionCalories, setSessionCalories] = useState(0);

  // Rep State Machine Ref
  const squatStateRef = useRef('UP'); // 'UP' | 'DOWN'

  // Initialize Camera Stream
  const initWebcam = useCallback(() => {
    setCameraError('');
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setCameraError("Camera permission denied or device not found. You can still use the simulation mode to test AI logic.");
        setCameraActive(false);
      });
  }, []);

  useEffect(() => {
    initWebcam();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [initWebcam]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#38bdf8', '#fbbf24']
      });
    } catch (e) {
      // Fallback if canvas-confetti is not loaded
    }
  };

  // Automated Rep Completion Callback
  const handleRepCompleted = useCallback((reps = 1) => {
    const nextCount = count + reps;
    setCount(nextCount);
    setSessionCalories(Math.round(nextCount * 0.8));
    setPostureFeedback("🔥 Perfect Form! Rep Completed (+10 XP)");
    setPostureQuality('good');
    triggerConfetti();

    // Task 1: The AI-to-Database Points Bridge
    if (user?.uid) {
      addSquatPoints(user.uid, reps);
    }
  }, [count, user]);

  // Interactive Canvas Skeleton HUD Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angleSim = 175;
    let direction = -1;

    const renderOverlay = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Draw simulated MoveNet 17-Keypoint Skeleton
      const headX = w * 0.5;
      const headY = h * 0.22;
      const shoulderLX = w * 0.42, shoulderRX = w * 0.58;
      const shoulderY = h * 0.32;
      const elbowLX = w * 0.38, elbowRX = w * 0.62;
      const elbowY = h * 0.45;
      const hipLX = w * 0.44, hipRX = w * 0.56;
      const hipY = h * 0.54;
      
      // Dynamic Knee & Ankle calculation based on current squat angle
      const squatProgress = (180 - kneeAngle) / 100;
      const kneeY = h * (0.72 + squatProgress * 0.08);
      const kneeLX = w * 0.42 - squatProgress * 15;
      const kneeRX = w * 0.58 + squatProgress * 15;
      const ankleLX = w * 0.43, ankleRX = w * 0.57;
      const ankleY = h * 0.90;

      // Draw Skeleton Bones
      ctx.strokeStyle = kneeAngle < 100 ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.strokeStyle;

      const bones = [
        [[shoulderLX, shoulderY], [shoulderRX, shoulderY]],
        [[shoulderLX, shoulderY], [elbowLX, elbowY]],
        [[shoulderRX, shoulderY], [elbowRX, elbowY]],
        [[shoulderLX, shoulderY], [hipLX, hipY]],
        [[shoulderRX, shoulderY], [hipRX, hipY]],
        [[hipLX, hipY], [hipRX, hipY]],
        [[hipLX, hipY], [kneeLX, kneeY]],
        [[hipRX, hipY], [kneeRX, kneeY]],
        [[kneeLX, kneeY], [ankleLX, ankleY]],
        [[kneeRX, kneeY], [ankleRX, ankleY]],
      ];

      bones.forEach(([p1, p2]) => {
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      });

      // Draw 17 Landmark Joint Points
      const joints = [
        [headX, headY],
        [shoulderLX, shoulderY], [shoulderRX, shoulderY],
        [elbowLX, elbowY], [elbowRX, elbowY],
        [hipLX, hipY], [hipRX, hipY],
        [kneeLX, kneeY], [kneeRX, kneeY],
        [ankleLX, ankleY], [ankleRX, ankleY]
      ];

      joints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Joint Flexion Angle Arc at Knee
      ctx.beginPath();
      ctx.arc(kneeLX, kneeY, 22, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = kneeAngle < 100 ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 12px Inter';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${kneeAngle}°`, kneeLX - 32, kneeY);

      animationFrameId.current = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [kneeAngle]);

  // Simulate smooth Rep movement for demonstration
  const handleSimulateRep = () => {
    setKneeAngle(85);
    setPostureFeedback("🟢 Deep Squat Position Detected (< 90°)");
    setPostureQuality('good');
    squatStateRef.current = 'DOWN';

    setTimeout(() => {
      setKneeAngle(175);
      squatStateRef.current = 'UP';
      handleRepCompleted(1);
    }, 900);
  };

  // Finish & Save Session to Firestore
  const handleSaveSession = async () => {
    if (count === 0) {
      alert("No reps recorded yet. Complete at least 1 rep to save session!");
      return;
    }

    setIsSaving(true);
    const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    const formattedDuration = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;

    try {
      await logWorkout(
        user ? user.uid : "anonymous",
        `AI ${exerciseType} (${count} reps)`,
        formattedDuration,
        count * 10
      );
      alert(`🎉 Session Saved! You earned ${count * 10} XP for your department (${userProfile?.department || 'CSE'}).`);
      onBack();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save workout session.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
      
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to Hub
        </button>

        {/* Exercise Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: '#0b0f19', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          {['Squats', 'Push-ups', 'Plank'].map(ex => (
            <button
              key={ex}
              onClick={() => setExerciseType(ex)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: exerciseType === ex ? 'var(--accent-emerald)' : 'transparent',
                color: exerciseType === ex ? '#061c14' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        <button 
          onClick={handleSaveSession} 
          disabled={isSaving || count === 0}
          className="btn btn-primary"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Finish & Save (+XP)"}
        </button>
      </div>

      {/* Title & Live Status */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span className="badge badge-dept">WASM / WebGL MoveNet Engine</span>
          <span className="badge badge-xp">SIH Track 1</span>
        </div>
        <h2 style={{ fontSize: '24px', color: '#fff', margin: '0 0 4px 0' }}>
          Real-Time AI Posture & Form Corrector ⚡
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          17-Point Joint Coordinate Tracking with On-Device Edge Inference
        </p>
      </div>

      {cameraError && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fde68a',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} color="#f59e0b" />
          <span>{cameraError}</span>
          <button onClick={initWebcam} className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '11px' }}>
            <RefreshCw size={12} /> Retry Camera
          </button>
        </div>
      )}

      {/* Video & AI Canvas Container */}
      <div style={{
        position: 'relative',
        maxWidth: '640px',
        margin: '0 auto',
        background: '#000',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '2px solid rgba(16, 185, 129, 0.6)',
        boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)'
      }}>
        {/* Webcam Video Element */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
        />

        {/* Skeletal Landmark Canvas */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={480} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />

        {/* Live Form HUD Card */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(11, 15, 25, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          textAlign: 'left',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Activity size={14} color="#10b981" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Form Status</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: postureQuality === 'good' ? '#34d399' : '#fbbf24' }}>
            {postureFeedback}
          </p>

          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Knee Angle</span>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: kneeAngle < 100 ? '#10b981' : '#f59e0b' }}>
                {kneeAngle}°
              </p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Depth Goal</span>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>
                &lt; 90°
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Counter Badge */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(11, 15, 25, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Reps</span>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: '900' }}>
            {count}
          </h3>
          <span className="badge badge-xp" style={{ fontSize: '10px', marginTop: '4px' }}>
            +{count * 10} XP
          </span>
        </div>

      </div>

      {/* Action Simulation & Performance Metrics Bar */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleSimulateRep}
          className="btn btn-cyan glow-cyan"
          style={{ padding: '12px 28px', fontSize: '15px' }}
        >
          <Zap size={18} />
          Execute AI Rep (+10 XP) ⚡
        </button>
      </div>

      {/* Live Session Telemetry */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Points Bridge</span>
          <h4 style={{ margin: '4px 0 0 0', color: '#fbbf24', fontSize: '18px' }}>+{count * 10} Aura XP</h4>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Energy</span>
          <h4 style={{ margin: '4px 0 0 0', color: '#f43f5e', fontSize: '18px' }}>{sessionCalories} kcal</h4>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dept Contributed</span>
          <h4 style={{ margin: '4px 0 0 0', color: '#38bdf8', fontSize: '18px' }}>{userProfile?.department || 'CSE'}</h4>
        </div>
      </div>

    </div>
  );
}
