/**
 * AuraFit AuraCoach AI Engine
 * Context-injected fitness, nutrition, mindset, and chess conversational assistant.
 * Supports external Google Gemini API + built-in contextual sports science reasoning intelligence.
 */

export const COACH_MODES = [
  {
    id: 'fitness',
    label: 'Fitness & Workout',
    badge: 'Strength & Form',
    color: '#10b981',
    starterPrompts: [
      'How should I warm up before my AI Camera Squats session?',
      'I have tight hips. What alternative movements can I do?',
      'Can you recommend a high-intensity bodyweight circuit for fat loss?'
    ]
  },
  {
    id: 'nutrition',
    label: 'Nutrition & Meals',
    badge: 'Macros & Fuel',
    color: '#06b6d4',
    starterPrompts: [
      'What should I eat 45 minutes post-workout for maximum protein synthesis?',
      'Give me a clean high-protein breakfast recipe around 450 calories.',
      'How can I hit my daily hydration target without feeling bloated?'
    ]
  },
  {
    id: 'mindset',
    label: 'Mindset & Zen',
    badge: 'Breath & Recovery',
    color: '#ec4899',
    starterPrompts: [
      'How does 4-4-4-4 Box Breathing calm the nervous system before a competition?',
      'Which traditional Mudra is best for midday mental fatigue?',
      'Guide me through a 2-minute somatic tension release exercise.'
    ]
  },
  {
    id: 'chess',
    label: 'Chess & Strategy',
    badge: 'Cognitive Tactics',
    color: '#38bdf8',
    starterPrompts: [
      'What are the core opening principles for controlling the center in Chess?',
      'How can I avoid tunnel vision when defending against tactical forks?',
      'How does tactical chess training improve physical athletic focus?'
    ]
  }
];

/**
 * Reads all active biometric and performance context across the chambers
 */
export function getContextSnapshot() {
  let metabolic = { weightKg: 72, heightCm: 175, bmi: 23.5, goal: 'fat_loss', targetCalories: 2150, somaticType: 'Mesomorph' };
  let chess = { elo: 1200, wins: 0, enduranceIndex: 78 };
  let waterMl = 1750;

  try {
    const savedMeta = localStorage.getItem('aurafit_metabolic_profile');
    if (savedMeta) metabolic = { ...metabolic, ...JSON.parse(savedMeta) };

    const savedChess = localStorage.getItem('aurafit_chess_profile');
    if (savedChess) chess = { ...chess, ...JSON.parse(savedChess) };

    const savedWater = localStorage.getItem('aurafit_water_ml');
    if (savedWater) waterMl = Number(savedWater);
  } catch (e) {}

  return { metabolic, chess, waterMl };
}

/**
 * Synthesizes a contextual prompt response based on user mode & biometric state
 */
export async function generateCoachResponse(userMessage, modeId, context, onChunk) {
  const userEnteredKey = typeof localStorage !== 'undefined' ? localStorage.getItem('aurafit_gemini_api_key') : null;
  const isMedicalQuery = /pain|hurt|injury|torn|sprain|fracture|doctor|medicine|pill|disease|diagnos/i.test(userMessage);

  const systemInstruction = `You are "AuraCoach", an elite Olympic-level AI Sports Scientist, Certified Strength & Conditioning Coach, and Cognitive Chess Mentor inside the AuraFit platform.
User Biometrics:
- Weight: ${context.metabolic.weightKg} kg, Height: ${context.metabolic.heightCm} cm
- BMI: ${context.metabolic.bmi} (${context.metabolic.somaticType || 'Athletic'})
- Primary Goal: ${context.metabolic.goal}
- Daily Caloric Target: ${context.metabolic.targetCalories} kcal
- Current Water Intake: ${context.waterMl} ml
- Chess Elo: ${context.chess.elo} (Endurance: ${context.chess.enduranceIndex}/100)

RULES:
1. Provide concise, direct, inspiring, and scientifically accurate athletic advice. Use markdown with bullet points and bold highlights.
2. Keep response brief (under 150 words) so it streams instantly. Focus strictly on actionable app-specific fitness, form, nutrition, or chess tactics.
3. If the user mentions physical pain or symptoms of injury, state clearly: "DISCLAIMER: I am an athletic wellness assistant, not a physician. Please consult a licensed sports medicine physician or physical therapist for clinical injury diagnosis."
4. Tailor all advice specifically to their active mode (${modeId}) and their somatic profile.`;

  // 1. Attempt secure serverless proxy (/api/gemini)
  // Keeps master GEMINI_API_KEY 100% on the server without bundling into public JS
  try {
    const proxyHeaders = { 'Content-Type': 'application/json' };
    if (userEnteredKey) proxyHeaders['x-gemini-api-key'] = userEnteredKey;

    const proxyRes = await fetch('/api/gemini', {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({ systemInstruction, userMessage })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.text) {
        await streamText(data.text, onChunk);
        return data.text;
      }
    }
  } catch (proxyErr) {
    // Handled gracefully: Fall back if running on static host without serverless functions
  }

  // 2. Direct client call ONLY IF user explicitly entered a personal BYOK key in settings
  if (userEnteredKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${userEnteredKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }] }
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 350,
            topP: 0.85
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (fullText) {
          await streamText(fullText, onChunk);
          return fullText;
        }
      }
    } catch (err) {
      console.warn("Direct Gemini client fallback note:", err);
    }
  }

  // Fallback: Built-in Contextual Sports Intelligence Engine
  let responseText = '';
  const msgLower = (userMessage || '').toLowerCase();

  if (isMedicalQuery) {
    responseText = `### ⚠️ Safety & Sports Medicine Protocol\n\n> **Important Disclaimer:** AuraCoach is designed for athletic coaching, form correction, and nutritional guidance. I cannot diagnose clinical injuries, ligament tears, or medical pathology.\n\n**Immediate Safety Recommendations:**\n- **Halt Strenuous Reps:** Cease loaded compound movements (Squats, heavy lunges) immediately.\n- **PRICE Protocol:** Protect the joint, apply light compression, elevate, and rest.\n- **Seek Professional Evaluation:** Please consult a certified sports physical therapist or orthopedic physician to assess structural joint integrity before resuming high-impact training.\n\n*Would you like me to suggest low-impact mobility flows or breathwork while you recover?*`;
  }
  // --- Specific Fitness Queries ---
  else if (/warm(\s|-)?up|prime|stretching before/i.test(msgLower)) {
    responseText = `### 🏃 Dynamic Joint Priming Protocol for AI Squats\n\nFollow this 4-minute joint-activation flow before stepping in front of Chamber 2 AI Camera:\n\n- **10 Deep Cossack Squats**: Mobilizes adductors, hips, and ankle dorsiflexion.\n- **12 Glute Bridges**: Hold top contraction for 2 seconds to activate posterior chain.\n- **15 Cat-Cow Spinal Extensions**: Mobilizes lumbar spine and deep transverse core.\n- **10 Bodyweight Good Mornings**: Pre-stretches hamstrings for full squat depth.\n\n*Step into Chamber 2 and achieve sub-90° knee flexion for full XP scoring!*`;
  } else if (/tight hip|hip mobility|alternative movement|can't squat/i.test(msgLower)) {
    responseText = `### 🧘 Hip Mobility & Squat Relief Protocol\n\nTight hip flexors restrict pelvic rotation during knee flexion. Implement these corrections:\n\n- **90/90 Hip Switches (8 reps/side)**: Actively unglues femoral head impingement.\n- **Elevated Pigeon Pose (45s hold)**: Lengthens piriformis and deep glute rotators.\n- **Low Dragon Lunge with Reach**: Opens tight psoas muscles.\n\n*Alternative Movements*: In Chamber 2, switch exercise mode to **Sumo Squats** (wider stance) or **Walking Lunges** to reduce anterior hip pinching.`;
  } else if (/circuit|fat loss|hiit|burn|weight loss/i.test(msgLower)) {
    responseText = `### 🔥 High-Intensity Bodyweight MetCon Circuit\n\nTailored for **${context.metabolic.goal?.replace('_', ' ').toUpperCase()}** and your somatic profile:\n\nPerform 4 rounds (40s work / 20s rest):\n1. **AI Camera Air Squats**: 20 reps focusing on explosive hip extension.\n2. **Tabata Jumping Jacks**: Maximum cardiorespiratory pace.\n3. **Decline / Standard Pushups**: 15 reps with tucked elbows.\n4. **High Plank to Dolphin Flow**: Core and scapular stability.\n\n*Estimated Burn*: ~210 kcal. Log this in Chamber 1 to track your daily progress!`;
  }
  // --- Specific Nutrition Queries ---
  else if (/post(-|\s)?workout|protein synthesis|eat after/i.test(msgLower)) {
    responseText = `### 🥗 Precision Post-Workout Anabolic Fuel Window\n\nConsume within 45 minutes of finishing training for maximum protein synthesis:\n\n- **High BV Protein Target**: 30–35g (e.g. 150g grilled chicken, 180g low-fat paneer, or 1.5 scoops whey isolate).\n- **Glycogen Replenishment**: 45–50g fast complex carbs (1 ripe banana + 45g rolled oats) to halt cortisol.\n- **Electrolyte Restoration**: 500ml water with a pinch of Himalayan pink salt.\n\n*Current Daily Target*: **${context.metabolic.targetCalories || 2150} kcal**.`;
  } else if (/breakfast|recipe|morning meal/i.test(msgLower)) {
    responseText = `### 🍳 Clean 450-Kcal High-Protein Breakfast\n\nCalibrated for your **${context.metabolic.somaticType}** body composition:\n\n- **Ingredients**:\n  - 3 Whole Eggs (poached or scrambled) with fresh baby spinach\n  - 1 slice 100% Sprouted Whole Grain Toast\n  - 1/4 Sliced Avocado (healthy monounsaturated fats)\n  - 100g Fresh Blueberries or Apple slices\n- **Nutritional Breakdown**: 32g Protein | 34g Carbs | 18g Healthy Fats | ~448 kcal.`;
  } else if (/hydrat|water|bloat|drink/i.test(msgLower)) {
    responseText = `### 💧 Anti-Bloat Hydration Protocol\n\nYou have logged **${context.waterMl} ml** today. To hit your target without stomach distension:\n\n- **Cadence**: Sip 180–220ml every 45 minutes instead of chugging 500ml at once.\n- **Sodium Balance**: Add a pinch of pink salt or lemon juice to prevent electrolyte dilution.\n- **Timing**: Cease large fluid volumes 60 minutes before heavy squat sessions and sleep.`;
  }
  // --- Specific Mindset & Zen Queries ---
  else if (/box breath|nervous system|calm|anxiety/i.test(msgLower)) {
    responseText = `### 🧘 4-4-4-4 Tactical Box Breathing Science\n\nBox breathing stimulates the **Vagus nerve** to balance autonomic arousal:\n\n1. **Inhale (4s)**: Expand the diaphragm, drawing oxygen deep into lower lungs.\n2. **Hold (4s)**: Retain oxygen, allowing optimal alveoli gas exchange.\n3. **Exhale (4s)**: Smoothly empty lungs, lowering systolic pressure.\n4. **Hold (4s)**: Pause in calm, eliminating acute salivary cortisol.\n\n*Launch Chamber 5 (Zen & Mudras) to follow the animated breathing visual!*`;
  } else if (/mudra|fatigue|energy/i.test(msgLower)) {
    responseText = `### 🪷 Prana Mudra for Midday Mental Fatigue\n\nWhen feeling sluggish without wanting caffeine jitters:\n\n- **Finger Lock**: Connect the tips of your **ring finger** and **little finger** with your **thumb**. Keep index and middle fingers extended.\n- **Duration**: Hold for 10–12 minutes with calm diaphragmatic breathing.\n- **Athletic Benefit**: Increases vital bio-energy (Prana), improves cellular oxygen uptake, and stabilizes focus.`;
  } else if (/tension|release|somatic/i.test(msgLower)) {
    responseText = `### ⚡ 2-Minute Somatic Tension Release Flow\n\nRelease stored neuromuscular tension in 3 targeted steps:\n\n1. **Progressive Neck Decompression (30s)**: Slowly drop right ear to right shoulder; inhale deeply into left trapezius. Switch sides.\n2. **Thoracic Box Shakeout (30s)**: Vigorously shake hands and bounce heels on the floor to discharge sympathetic nervous tone.\n3. **Deep Sigh Exhale (60s)**: Take two quick nasal inhales followed by one long, audibly releasing mouth sigh.`;
  }
  // --- Specific Chess & Strategy Queries ---
  else if (/center|opening|principles/i.test(msgLower)) {
    responseText = `### ♟️ Grandmaster Opening & Center Control\n\nFor your current **${context.chess.elo} Elo** rating:\n\n- **1. Claim the Classical Center**: Stake out d4/e4 immediately with pawns to deny enemy knights forward outposts.\n- **2. Knights Before Bishops**: Develop knights to f3/c3 before pinning with bishops.\n- **3. King Safety First**: Castle kingside within the first 8 moves to connect rooks.\n\n*Test these opening principles against the bot in Chamber 6 (Cognitive Chess)!*`;
  } else if (/fork|tunnel vision|defend/i.test(msgLower)) {
    responseText = `### ♟️ Defending Against Knight & Queen Forks\n\nTactical forks occur when two pieces share geometric vulnerability:\n\n- **Color Coordination**: Knights only attack squares of opposite color from where they stand. Track their next jumping square.\n- **Candidate Zwischenzug**: If forked, look for an in-between check or counter-threat against opponent's King.\n- **Piece Harmonization**: Never place your King and Queen on the same rank or diagonal without an intervening pawn shield.`;
  } else if (/focus|cognitive|athletic|transfer/i.test(msgLower)) {
    responseText = `### 🧠 Cognitive Transfer: Chess to Physical Athletics\n\nChess conditioning reinforces mental discipline during strenuous lifting:\n\n- **Impulse Control**: Rushing a move creates a blunder; rushing a squat rep breaks lumbar neutral.\n- **Cadence Discipline**: Just as you calculate 3 candidate moves, maintain 2-second controlled eccentric descents in the gym.\n- **Endurance Index**: Your current cognitive score is **${context.chess.enduranceIndex}/100**. 15 mins of tactical chess sharpens prefrontal focus!`;
  }
  // Generic Mode Fallbacks
  else if (modeId === 'fitness') {
    responseText = `### 🏋️ Tailored Movement Protocol for Your Profile\n\nBased on your **${context.metabolic.somaticType}** somatic structure and goal of **${context.metabolic.goal?.replace('_', ' ').toUpperCase()}**:\n\n- **Dynamic Joint Priming (3-5 mins)**: 10 Deep Cossack Squats and 12 Cat-Cow extensions.\n- **AI Camera Form Focus**: In Chamber 2, ensure hip crease travels below knee level (< 90°) before driving upward.\n- **Post-Workout Recovery**: Spend 5 minutes practicing Vayu Mudra or static quad stretches.\n\n*Ready to test this in Chamber 2 AI Camera Arena?*`;
  } else if (modeId === 'nutrition') {
    responseText = `### 🥗 Precision Metabolic Fuel Plan\n\nTargeting your daily allocation of **${context.metabolic.targetCalories || 2150} kcal**:\n\n- **Post-Workout Target**: 30–35g high BV protein within 45 mins of exercise.\n- **Carbohydrates**: 45g complex carbs to replenish muscle glycogen.\n- **Hydration Status**: Logged **${context.waterMl} ml** today. Aim for an additional **${Math.max(0, 3000 - context.waterMl)} ml**.`;
  } else if (modeId === 'mindset') {
    responseText = `### 🧘 Parasympathetic Nervous System Calibration\n\nSharpening physical stamina begins with nervous system composure:\n\n- **4-4-4-4 Tactical Box Breathing**: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s.\n- **Prana Mudra Focus**: Join ring finger, little finger, and thumb tips for 10 minutes.\n- **Mindset Focus**: *"Form precedes weight. Calm precedes power."*`;
  } else if (modeId === 'chess') {
    responseText = `### ♟️ Grandmaster Cognitive Conditioning\n\nYour current Chess Elo is **${context.chess.elo}** (Endurance: **${context.chess.enduranceIndex}/100**):\n\n- **Candidate Moves**: Calculate checks, captures, and threats before every move.\n- **King Safety**: Castle within the first 7–10 moves.\n- **Cadence Transfer**: Maintain 2-second controlled descents in both chess and gym squats!`;
  }

  await streamText(responseText, onChunk);
  return responseText;
}

/**
 * Stream text token-by-token for responsive conversational UX
 */
async function streamText(fullText, onChunk) {
  const words = fullText.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    accumulated += (i > 0 ? ' ' : '') + words[i];
    onChunk(accumulated);
    await new Promise(res => setTimeout(res, 18));
  }
}
