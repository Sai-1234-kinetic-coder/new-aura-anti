import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Target, 
  Flame, 
  Activity, 
  Droplets, 
  Zap, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Info, 
  Sliders, 
  RotateCcw,
  Camera
} from 'lucide-react';
import { 
  computeMetabolicProfile, 
  ACTIVITY_LEVELS, 
  FITNESS_GOALS, 
  getFoodGuidanceByGoal 
} from '../../lib/metabolicMath';

export default function MetabolicTrainer({ user, userProfile, onLaunchCamera }) {
  // Biometric input state with intelligent defaults
  const [weightKg, setWeightKg] = useState(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    return saved ? JSON.parse(saved).weightKg : 72;
  });
  const [heightCm, setHeightCm] = useState(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    return saved ? JSON.parse(saved).heightCm : 175;
  });
  const [age, setAge] = useState(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    return saved ? JSON.parse(saved).age : 22;
  });
  const [gender, setGender] = useState(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    return saved ? JSON.parse(saved).gender : 'male';
  });
  const [activityLevel, setActivityLevel] = useState(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    return saved ? JSON.parse(saved).activityLevel : 'moderate';
  });
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('aurafit_metabolic_profile');
    return saved ? JSON.parse(saved).goal : 'fat_loss';
  });

  const [activeDietTab, setActiveDietTab] = useState('prioritize');
  const [routineLevel, setRoutineLevel] = useState('intermediate');

  // Dynamic food guidance based on user goal
  const currentFoodGuidance = getFoodGuidanceByGoal(goal);

  // Compute live metabolic profile
  const metrics = computeMetabolicProfile({
    weightKg: Number(weightKg) || 70,
    heightCm: Number(heightCm) || 170,
    age: Number(age) || 22,
    gender,
    activityLevel,
    goal
  });

  // Save changes to localStorage
  useEffect(() => {
    const profile = { weightKg, heightCm, age: Number(age) || 22, gender, activityLevel, goal, updatedAt: new Date().toISOString() };
    localStorage.setItem('aurafit_metabolic_profile', JSON.stringify(profile));
  }, [weightKg, heightCm, age, gender, activityLevel, goal]);

  const routines = {
    beginner: [
      { name: 'Bodyweight Air Squats', sets: '3 sets x 12 reps', focus: 'Quadriceps, Glutes', verifyWithCamera: true },
      { name: 'Incline / Wall Pushups', sets: '3 sets x 10 reps', focus: 'Chest, Anterior Deltoids', verifyWithCamera: true },
      { name: 'Isometric Static Plank', sets: '3 holds x 30s', focus: 'Core Stability & Transverse Abdominis', verifyWithCamera: false },
      { name: 'Walking Lunges', sets: '2 sets x 10 reps/leg', focus: 'Hamstrings, Hip Balance', verifyWithCamera: true }
    ],
    intermediate: [
      { name: 'Tempo AI Deep Squats', sets: '4 sets x 15 reps', focus: 'Full Range Knee Flexion (90°)', verifyWithCamera: true },
      { name: 'Standard Pushups', sets: '4 sets x 15 reps', focus: 'Upper Body Compound', verifyWithCamera: true },
      { name: 'Alternating Reverse Lunges', sets: '3 sets x 12 reps/leg', focus: 'Unilateral Stability', verifyWithCamera: true },
      { name: 'Tabata Jumping Jacks', sets: '8 intervals (20s on / 10s rest)', focus: 'Cardiorespiratory Endurance', verifyWithCamera: false }
    ],
    advanced: [
      { name: 'Explosive Jump Squats', sets: '5 sets x 18 reps', focus: 'Fast-Twitch Muscle Recruitment', verifyWithCamera: true },
      { name: 'Diamond Pushups & Archer Hold', sets: '4 sets x 15 reps', focus: 'Triceps & Sternal Pec', verifyWithCamera: true },
      { name: 'Bulgarian Split Squats', sets: '4 sets x 12 reps/leg', focus: 'Glute Medius & Quad Drive', verifyWithCamera: true },
      { name: 'High Plank to Low Dolphin Flow', sets: '4 sets x 45s hold', focus: 'Scapular & Core Endurance', verifyWithCamera: false }
    ]
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #10b981',
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
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#061c14',
            boxShadow: '0 0 18px rgba(16, 185, 129, 0.4)'
          }}>
            <Dumbbell size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Metabolic & Personal Trainer Engine
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Chamber 1</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Scientific Basal Rate calculation, dynamic BMI classification, and macronutrient targeting.
            </p>
          </div>
        </div>

        <button 
          onClick={onLaunchCamera}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          <Camera size={16} />
          Verify Form in Vision Arena
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Main 2-Column Grid: Inputs on Left, Real-Time Calculations on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>

        {/* LEFT COLUMN: Biometric Questionnaire */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#10b981" />
              Biometric Questionnaire
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-Saves Locally</span>
          </div>

          {/* Gender & Age */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Biological Gender
              </label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="form-select"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Age: <strong style={{ color: '#10b981' }}>{age ? `${age} yrs` : '—'}</strong>
              </label>
              <input 
                type="number" 
                min="12" 
                max="100" 
                value={age} 
                onChange={(e) => {
                  const val = e.target.value;
                  setAge(val === '' ? '' : Math.min(120, parseInt(val, 10) || ''));
                }}
                onBlur={() => {
                  const num = Number(age);
                  if (!num || num < 12) setAge(12);
                  else if (num > 100) setAge(100);
                  else setAge(Math.round(num));
                }}
                className="form-input"
                placeholder="Age (12-100)"
              />
            </div>
          </div>

          {/* Weight & Height Sliders */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Weight
              </label>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
                {weightKg} kg <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({(weightKg * 2.20462).toFixed(1)} lbs)</span>
              </span>
            </div>
            <input 
              type="range" 
              min="35" 
              max="160" 
              value={weightKg} 
              onChange={(e) => setWeightKg(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Height
              </label>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#06b6d4' }}>
                {heightCm} cm <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({Math.floor(heightCm / 30.48)}'{Math.round((heightCm % 30.48) / 2.54)}")</span>
              </span>
            </div>
            <input 
              type="range" 
              min="120" 
              max="220" 
              value={heightCm} 
              onChange={(e) => setHeightCm(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>

          {/* Activity Level */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Daily Physical Activity Level
            </label>
            <select 
              value={activityLevel} 
              onChange={(e) => setActivityLevel(e.target.value)}
              className="form-select"
            >
              {ACTIVITY_LEVELS.map(act => (
                <option key={act.id} value={act.id}>
                  {act.label} — {act.desc} (x{act.multiplier})
                </option>
              ))}
            </select>
          </div>

          {/* Primary Fitness Goal */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Primary Physical Goal
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {FITNESS_GOALS.map(g => {
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className="btn"
                    style={{
                      padding: '8px 10px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-primary)',
                      border: `1px solid ${isSelected ? '#10b981' : 'var(--border-color)'}`,
                      color: isSelected ? '#10b981' : 'var(--text-secondary)',
                      textAlign: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Metabolic Engine Results & Somatic Blueprint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dynamic BMI Indicator Card */}
          <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Dynamic Body Mass Index
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: metrics.bmiColor }}>
                    {metrics.bmi}
                  </span>
                  <span className="badge" style={{ 
                    background: `${metrics.bmiColor}22`, 
                    color: metrics.bmiColor, 
                    border: `1px solid ${metrics.bmiColor}55`,
                    fontSize: '12px'
                  }}>
                    {metrics.bmiCategory}
                  </span>
                </div>
              </div>

              {/* Somatotype Pill */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Somatic Type</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>
                  {metrics.somaticType}
                </div>
              </div>
            </div>

            {/* BMI Colored Spectrum Bar */}
            <div style={{
              height: '8px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(90deg, #38bdf8 0%, #38bdf8 25%, #10b981 25%, #10b981 55%, #f59e0b 55%, #f59e0b 80%, #f43f5e 80%, #f43f5e 100%)',
              position: 'relative',
              marginBottom: '10px'
            }}>
              {/* Pointer Marker */}
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: `${Math.min(98, Math.max(2, ((metrics.bmi - 14) / (38 - 14)) * 100))}%`,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '3px solid #0b0f19',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
                transform: 'translateX(-50%)'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              <span>&lt; 18.5 Underweight</span>
              <span>18.5 - 24.9 Normal</span>
              <span>25 - 29.9 Overweight</span>
              <span>≥ 30 Obese</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              {metrics.somaticDesc}
            </p>

            {/* Non-Diagnostic Disclaimer */}
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <Info size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span>
                <strong>Medical Notice:</strong> BMI is an epidemiological screening guideline, not a direct measurement of body fat or clinical health.
              </span>
            </div>
          </div>

          {/* Caloric Targets & Metabolic Energy Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                <Flame size={15} />
                BMR (Mifflin)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800' }}>
                {metrics.bmr} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kcal</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Basal Resting Rate</div>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                <Zap size={15} />
                TDEE (Burn)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800' }}>
                {metrics.tdee} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kcal</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily Expenditure</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                <Target size={15} />
                Daily Target
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>
                {metrics.targetDailyCalories} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kcal</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {goal === 'fat_loss' ? 'Deficit Target (-500 kcal)' : goal === 'hypertrophy' ? 'Surplus (+350 kcal)' : 'Goal Target'}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                <Droplets size={15} />
                Hydration Goal
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800' }}>
                {metrics.macros.hydrationMl} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ml</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                ~{Math.round(metrics.macros.hydrationMl / 250)} standard glasses
              </div>
            </div>
          </div>

          {/* Macronutrient Distribution Bars */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Daily Macronutrient Distribution
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {/* Protein */}
              <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #10b981' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protein</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                  {metrics.macros.proteinGrams}g
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {Math.round((metrics.macros.proteinGrams * 4 / metrics.targetDailyCalories) * 100)}% calories
                </div>
              </div>

              {/* Carbs */}
              <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #06b6d4' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complex Carbs</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#06b6d4' }}>
                  {metrics.macros.carbGrams}g
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {Math.round((metrics.macros.carbGrams * 4 / metrics.targetDailyCalories) * 100)}% calories
                </div>
              </div>

              {/* Healthy Fats */}
              <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #d97706' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Healthy Fats</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>
                  {metrics.macros.fatGrams}g
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {Math.round((metrics.macros.fatGrams * 9 / metrics.targetDailyCalories) * 100)}% calories
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Actionable Diet Lists: Foods to Prioritize vs Foods to Minimize */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Nutritional Optimization Protocols
              </h3>
              <span className="badge" style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                {currentFoodGuidance.calorieContext}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {currentFoodGuidance.goalTitle} • Scientifically curated for your somatic profile & <strong style={{ color: '#10b981' }}>{FITNESS_GOALS.find(g => g.id === goal)?.label}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveDietTab('prioritize')}
              className={`btn ${activeDietTab === 'prioritize' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              <CheckCircle2 size={14} />
              Foods to Prioritize ({currentFoodGuidance.prioritize?.length || 0})
            </button>
            <button
              onClick={() => setActiveDietTab('minimize')}
              className={`btn ${activeDietTab === 'minimize' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              <XCircle size={14} />
              Foods to Minimize ({currentFoodGuidance.minimize?.length || 0})
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '14px'
        }}>
          {(currentFoodGuidance[activeDietTab] || []).map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-inset)',
                border: `1px solid ${activeDietTab === 'prioritize' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {item.name}
                  </h4>
                  <span className="badge" style={{
                    fontSize: '10px',
                    background: activeDietTab === 'prioritize' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: activeDietTab === 'prioritize' ? '#10b981' : '#fb7185'
                  }}>
                    {item.category}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                  {item.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Daily Exercise Routines */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
              Curated Daily Training Protocols
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Adaptive routines tailored for your goal: <strong style={{ color: '#10b981' }}>{FITNESS_GOALS.find(g => g.id === goal)?.label}</strong>
            </p>
          </div>

          {/* Level Switcher */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRoutineLevel(lvl)}
                className={`btn ${routineLevel === lvl ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'capitalize' }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {routines[routineLevel].map((exercise, i) => (
            <div
              key={i}
              style={{
                background: '#0b0f19',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {exercise.name}
                  </h4>
                  {exercise.verifyWithCamera && (
                    <span className="badge badge-dept" style={{ fontSize: '9px' }}>
                      Camera Trackable
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                  {exercise.sets}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Target: {exercise.focus}
                </div>
              </div>

              {exercise.verifyWithCamera && (
                <button
                  onClick={onLaunchCamera}
                  className="btn btn-cyan"
                  style={{ marginTop: '14px', padding: '6px 10px', fontSize: '11px', width: '100%' }}
                >
                  <Camera size={13} />
                  Verify Form in AI Arena
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
