/**
 * AuraFit AuraCoach AI Engine
 * Context-injected fitness, nutrition, mindset, and chess conversational assistant.
 * Supports external LLM endpoint + built-in contextual reasoning intelligence.
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
 * Reads all active biometric and performance context across the 8 chambers
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
  const apiKey = (typeof localStorage !== 'undefined' && localStorage.getItem('aurafit_gemini_api_key')) || 
                 import.meta.env?.VITE_GEMINI_API_KEY || '';
  const isMedicalQuery = /pain|hurt|injury|torn|sprain|fracture|doctor|medicine|pill|disease|diagnos/i.test(userMessage);

  // If Gemini API Key is provided, call Gemini 1.5 Flash
  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
2. If the user mentions physical pain or symptoms of injury, state clearly: "DISCLAIMER: I am an athletic wellness assistant, not a physician. Please consult a licensed sports medicine physician or physical therapist for clinical injury diagnosis."
3. Tailor all advice specifically to their active mode (${modeId}) and their somatic profile.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }] }
          ]
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
      console.warn("Gemini cloud API fallback:", err);
    }
  }

  // Fallback: Built-in Contextual Sports Intelligence Engine
  let responseText = '';

  if (isMedicalQuery) {
    responseText = `### ⚠️ Safety & Sports Medicine Protocol\n\n> **Important Disclaimer:** AuraCoach is designed for athletic coaching, form correction, and nutritional guidance. I cannot diagnose clinical injuries, ligament tears, or medical pathology.\n\n**Immediate Safety Recommendations:**\n- **Halt Strenuous Reps:** Cease loaded compound movements (Squats, heavy lunges) immediately.\n- **PRICE Protocol:** Protect the joint, apply light compression, elevate, and rest.\n- **Seek Professional Evaluation:** Please consult a certified sports physical therapist or orthopedic physician to assess structural joint integrity before resuming high-impact training.\n\n*Would you like me to suggest low-impact mobility flows or breathwork while you recover?*`;
  } else if (modeId === 'fitness') {
    responseText = `### 🏋️ Tailored Movement Protocol for Your Profile\n\nBased on your **${context.metabolic.somaticType}** somatic structure and goal of **${context.metabolic.goal?.replace('_', ' ').toUpperCase()}**:\n\n1. **Dynamic Joint Priming (3-5 mins):**\n   - 10 Deep Cossack Squats to mobilize adductors and ankles.\n   - 12 Cat-Cow spinal extensions to activate deep transverse core muscles.\n   - 15 Arm Circles & Scapular Push-ups to stabilize shoulder rotator cuffs.\n\n2. **AI Camera Form Focus:**\n   - When executing **AI Squats** in Chamber 2, ensure your hip crease travels below knee level ($< 90^\\circ$) before reversing the drive.\n   - Keep your chest proud and drive through mid-foot to maximize glute recruitment.\n\n3. **Post-Workout Recovery:**\n   - Spend 5 minutes practicing **Vayu Mudra** or static quad stretches to reduce lactic soreness.\n\n*Ready to test this in the AI Camera Arena?*`;
  } else if (modeId === 'nutrition') {
    responseText = `### 🥗 Precision Metabolic Fuel Plan\n\nTargeting your daily allocation of **${context.metabolic.targetCalories || 2150} kcal**:\n\n1. **Optimal Post-Workout Fuel Window (within 45 mins):**\n   - **Protein Target:** 30–35g high biological value protein (e.g. 150g grilled chicken breast or 1.5 scoops whey isolate).\n   - **Carb Replenishment:** 40–50g fast-acting complex carbohydrates (e.g. 1 ripe banana + 1/2 cup rolled oats) to quickly refill depleted muscle glycogen stores.\n\n2. **Hydration Status Check:**\n   - You have logged **${context.waterMl} ml** so far today. Aim for an additional **${Math.max(0, 3000 - context.waterMl)} ml** with a pinch of pink Himalayan sea salt to support neuromuscular contractions.\n\n3. **Foods to Prioritize:**\n   - Wild salmon, Greek yogurt, spinach, quinoa, and cold-pressed extra virgin olive oil for cellular membrane recovery.`;
  } else if (modeId === 'mindset') {
    responseText = `### 🧘 Parasympathetic Nervous System Calibration\n\nSharpening physical endurance begins with nervous system composure:\n\n1. **4-4-4-4 Tactical Box Breathing:**\n   - Inhale for **4s**, Hold for **4s**, Exhale for **4s**, Hold for **4s**.\n   - This rhythmic cycle directly stimulates the **Vagus nerve**, reducing salivary cortisol and stabilizing heart rate variability (HRV).\n\n2. **Recommended Mudra Focus:**\n   - **Prana Mudra** (joining ring finger, little finger, and thumb tips) for 10–15 minutes will help restore mental stamina without caffeine crashes.\n\n3. **Mindset Mantram:**\n   - *"Form precedes weight. Calm precedes power."* Shift your focus to deliberate, controlled repetitions.`;
  } else if (modeId === 'chess') {
    responseText = `### ♟️ Grandmaster Cognitive Conditioning\n\nYour current Chess Elo is **${context.chess.elo}** with a Cognitive Endurance Index of **${context.chess.enduranceIndex}/100**:\n\n1. **Core Tactical Rules for Your Tier:**\n   - **Candidate Moves:** Before making any move, calculate your opponent’s most aggressive checks, captures, and threats.\n   - **King Safety:** Castle early (within the first 7–10 moves) to connect your rooks and prevent corridor mate tactics.\n   - **Piece Harmonization:** Avoid moving the same minor piece twice in the opening unless executing a concrete winning tactic.\n\n2. **Cognitive Transfer to Athletic Training:**\n   - Just as in chess where rushing causes blunders, rushing squat rep cadence compromises knee alignment. Maintain 2-second controlled descents in both arenas!\n\n*Would you like to analyze a specific opening or solve the daily checkmate puzzle?*`;
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
    await new Promise(res => setTimeout(res, 20));
  }
}
