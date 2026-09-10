/**
 * AuraFit Metabolic Engine & Nutrition Computation
 * Standards: Mifflin-St Jeor BMR, WHO BMI Classification, ACSM Activity Multipliers
 */

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', multiplier: 1.2, desc: 'Little or no exercise, desk job' },
  { id: 'light', label: 'Lightly Active', multiplier: 1.375, desc: 'Light exercise 1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', multiplier: 1.55, desc: 'Moderate exercise 3-5 days/week' },
  { id: 'very_active', label: 'Very Active', multiplier: 1.725, desc: 'Hard exercise 6-7 days/week' },
  { id: 'athlete', label: 'Elite / Athlete', multiplier: 1.9, desc: 'Intense training 2x per day' }
];

export const FITNESS_GOALS = [
  { id: 'fat_loss', label: 'Fat Loss & Cutting', calorieDelta: -500, proteinPerKg: 2.2, fatRatio: 0.25 },
  { id: 'hypertrophy', label: 'Muscle Hypertrophy', calorieDelta: 350, proteinPerKg: 2.0, fatRatio: 0.25 },
  { id: 'recomp', label: 'Body Recomposition', calorieDelta: -150, proteinPerKg: 2.3, fatRatio: 0.25 },
  { id: 'endurance', label: 'Cardio & Endurance', calorieDelta: 100, proteinPerKg: 1.6, fatRatio: 0.22 },
  { id: 'maintenance', label: 'Mobility & Longevity', calorieDelta: 0, proteinPerKg: 1.6, fatRatio: 0.25 }
];

/**
 * Calculates BMI (Body Mass Index)
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: 0, category: 'Unknown', color: '#94a3b8' };
  const heightM = heightCm / 100;
  const bmi = +(weightKg / (heightM * heightM)).toFixed(1);

  let category = 'Normal / Healthy';
  let color = '#10b981';

  if (bmi < 18.5) { category = 'Underweight'; color = '#38bdf8'; }
  else if (bmi < 25) { category = 'Normal / Healthy'; color = '#10b981'; }
  else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; }
  else { category = 'Obese'; color = '#f43f5e'; }

  return { bmi, category, color };
}

/**
 * Calculates BMR using Mifflin-St Jeor Equation
 */
export function calculateBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'female' ? Math.round(base - 161) : Math.round(base + 5);
}

/**
 * Estimate Somatotype from biometrics
 */
export function estimateSomaticType(weightKg, heightCm, bmi) {
  if (bmi < 19.5) {
    return { type: 'Ectomorph', desc: 'Naturally lean with high metabolic rate; benefits from caloric surplus and hypertrophy compound lifts.' };
  } else if (bmi >= 19.5 && bmi <= 25.5) {
    return { type: 'Mesomorph', desc: 'Athletic somatic structure with efficient muscle response; thrives on hybrid strength & HIIT regimes.' };
  } else {
    return { type: 'Endomorph', desc: 'Solid build with higher storage tendency; thrives on nutrient timing, steady cardio, and metabolic resistance.' };
  }
}

/**
 * Computes full metabolic profile including TDEE, Calories, and Macros
 */
export function computeMetabolicProfile({ weightKg, heightCm, age, gender, activityLevel, goal }) {
  const { bmi, category, color } = calculateBMI(weightKg, heightCm);
  const bmr = calculateBMR(weightKg, heightCm, age, gender);

  const actObj = ACTIVITY_LEVELS.find(a => a.id === activityLevel) || ACTIVITY_LEVELS[1];
  const tdee = Math.round(bmr * actObj.multiplier);

  const goalObj = FITNESS_GOALS.find(g => g.id === goal) || FITNESS_GOALS[0];
  let targetDailyCalories = Math.max(1200, tdee + goalObj.calorieDelta);

  const proteinGrams = Math.round(weightKg * goalObj.proteinPerKg);
  const proteinCalories = proteinGrams * 4;
  const fatCalories = targetDailyCalories * goalObj.fatRatio;
  const fatGrams = Math.round(fatCalories / 9);
  const remainingCalories = Math.max(0, targetDailyCalories - (proteinCalories + fatCalories));
  const carbGrams = Math.round(remainingCalories / 4);
  const hydrationMl = Math.round(weightKg * 35 + (actObj.multiplier > 1.5 ? 600 : 350));

  const somatic = estimateSomaticType(weightKg, heightCm, bmi);

  return {
    bmi,
    bmiCategory: category,
    bmiColor: color,
    bmr,
    tdee,
    targetDailyCalories,
    somaticType: somatic.type,
    somaticDesc: somatic.desc,
    macros: { proteinGrams, fatGrams, carbGrams, hydrationMl }
  };
}

/**
 * Returns Indian-style food guidance per fitness goal
 */
export function getFoodGuidanceByGoal(goal = 'fat_loss') {

  // ─── Hypertrophy / Muscle Gain ───────────────────────────────────────────
  if (goal === 'muscle_gain' || goal === 'hypertrophy') {
    return {
      goalTitle: 'Hypertrophy & Lean Bulk Nutrition Protocol 🇮🇳',
      calorieContext: 'Caloric Surplus Focus (+300 to +500 kcal)',
      prioritize: [
        { name: 'Paneer Bhurji & Grilled Chicken Tikka', category: 'High-Leucine Protein', reason: 'Paneer supplies casein + leucine for mTOR stimulation; chicken provides complete amino acids for muscle repair' },
        { name: 'Anda Bhurji (Whole Eggs)', category: 'Anabolic Lipids & Protein', reason: 'Essential cholesterol and bioavailable choline support hormonal testosterone production' },
        { name: 'Rajma-Chawal (Kidney Beans + Rice)', category: 'Protein + Glycogen Carbs', reason: 'Complete protein combo with complex carbs to fuel heavy compound sessions and replenish glycogen' },
        { name: 'Dal Makhani & Masoor Dal Tadka', category: 'Plant Protein & Iron', reason: 'Rich in lysine and iron; fat in dal makhani aids fat-soluble vitamin absorption' },
        { name: 'Chapati (Wheat Roti) & Brown Rice', category: 'Dense Glycogen Carbs', reason: 'Easily digestible complex carbohydrates to replenish muscle glycogen post-workout' },
        { name: 'Banana-Milk Shake & Oats Porridge', category: 'Pre/Post-Workout Carb', reason: 'Fast carbohydrate replenishment without gastrointestinal sluggishness' },
        { name: 'Fresh Dahi (Curd) & Low-Fat Paneer', category: 'Slow-Release Casein', reason: 'Sustained amino acid release across 6–8 hours to halt muscle catabolism overnight' },
        { name: 'Chana Dal & Sprouted Moong Sabzi', category: 'Complex Plant Protein', reason: 'Mineral-dense fuel rich in zinc, magnesium, and slow-burning digestive fiber' },
        { name: 'Peanut Butter on Multigrain Toast', category: 'Healthy Caloric Density', reason: '190 kcal per 2 tbsp to easily hit caloric surplus goals; excellent pre-workout energy' },
        { name: 'Rohu / Catla Fish Curry (Light Oil)', category: 'Omega-3 & Joint Support', reason: 'EPA/DHA fats lubricate joint cartilage under heavy progressive overload' }
      ],
      minimize: [
        { name: 'Excess Raw Salad Before Heavy Lifting', category: 'Volume Suppressor', reason: 'Overfills stomach with zero-calorie fiber, suppressing required caloric intake for bulk' },
        { name: 'Samosas, Pakoras & Deep-Fried Snacks', category: 'Trans Fats & Empty Calories', reason: 'Causes fat accumulation with low micronutrient partitioning to muscle tissue' },
        { name: 'Skipping Post-Workout Meal Window', category: 'Timing Protocol', reason: 'Delays protein synthesis and prolongs cortisol-driven muscle breakdown' },
        { name: 'Maida Bread, Biscuits & Refined Baked Goods', category: 'Inflammatory Carbs', reason: 'Impairs insulin sensitivity and blunts nutrient uptake into myocytes over time' }
      ]
    };
  }

  // ─── Endurance ────────────────────────────────────────────────────────────
  if (goal === 'endurance') {
    return {
      goalTitle: 'Cardiorespiratory & Stamina Fuel Protocol 🇮🇳',
      calorieContext: 'Glycogen Storage & Electrolyte Balance',
      prioritize: [
        { name: 'Beetroot Raita & Amla (Indian Gooseberry) Juice', category: 'Nitric Oxide & VO2 Max', reason: 'Dietary nitrates dilate blood vessels, elevating oxygen delivery to working muscles' },
        { name: 'Banana with Pink Himalayan Salt', category: 'Electrolytes & Rapid Energy', reason: 'Restores sodium-potassium balance, halting muscle cramps during long cardio sets' },
        { name: 'Poha (Flattened Rice) & Vegetable Upma', category: 'Sustained Glycogen Carbs', reason: 'Light complex starches that provide sustained glucose without energy crashes' },
        { name: 'Idli & Sambar (Steamed)', category: 'Fermented Probiotic Fuel', reason: 'Fermented rice-lentil combo with gut-friendly probiotics and complex carbs for sustained endurance' },
        { name: 'Coconut Water & Sabja (Basil Seed) Drink', category: 'Cellular Hydration', reason: 'Natural electrolytes and hydrophilic seeds maintain steady cellular hydration during exercise' },
        { name: 'Moong Dal Khichdi with Ghee (Small Amount)', category: 'B-Vitamins & Plant Protein', reason: 'Easy-to-digest complete meal rich in B-complex vitamins for cellular ATP synthesis and stamina' },
        { name: 'Grilled Chicken Tikka & Steamed Fish', category: 'Lean Repair Protein', reason: 'Pure amino acids for micro-tear repair without heavy digestive load' },
        { name: 'Dates (Khajoor) & Jaggery (Gud)', category: 'Mid-Workout Fuel', reason: 'Natural glucose-fructose transporter for rapid intra-workout energy; iron-rich' },
        { name: 'Fresh Amla Juice & Tart Citrus', category: 'Polyphenol Recovery', reason: 'High vitamin C reduces DOMS and accelerates post-cardio tissue repair' }
      ],
      minimize: [
        { name: 'Heavy Biryani & Rich Gravy Curries Before Cardio', category: 'Gastric Timing', reason: 'Slows gastric emptying, causing cramps, nausea, and sluggishness during aerobic work' },
        { name: 'Chai with Excess Sugar & Energy Drinks', category: 'Stimulant Crash', reason: 'Post-peak energy crash and dehydration during aerobic conditioning' },
        { name: 'Spicy Pickles & Acidic Foods Pre-Workout', category: 'GI Stress', reason: 'Induces acid reflux and diaphragm discomfort during rhythmic cardio breathing' }
      ]
    };
  }

  // ─── Maintenance / Mobility ───────────────────────────────────────────────
  if (goal === 'maintenance') {
    return {
      goalTitle: 'Metabolic Balance & Athletic Longevity 🇮🇳',
      calorieContext: 'Isocaloric Homeostasis (40/30/30 Macro Ratio)',
      prioritize: [
        { name: 'Tandoori Chicken & Grilled Pomfret Fish', category: 'Lean Muscle Protein', reason: 'Clean high-BV protein without excess saturated fat to maintain lean mass while staying agile' },
        { name: 'Dal Tadka & Rajma Curry', category: 'Plant Protein & Minerals', reason: 'Reduces systemic inflammation and optimizes resting metabolic rate' },
        { name: 'Cold-Pressed Groundnut Oil & Mustard Oil', category: 'Cardioprotective Fats', reason: 'Monounsaturated fats improve arterial elasticity and satiety signaling' },
        { name: 'Brown Rice, Jowar & Bajra (Millet) Roti', category: 'Complex Carbohydrates', reason: 'Millets provide fiber, steady glucose, and micronutrients for lasting sustained energy' },
        { name: 'Fresh Dahi (Curd) & Chaas (Buttermilk)', category: 'Probiotic Amino Blend', reason: 'Balances gut microbiome while supplying continuous amino acids and calcium' },
        { name: 'Sprouted Moong & Kala Chana Chaat', category: 'Enzyme-Rich Plant Fuel', reason: 'Easy to digest, rich in iron, potassium, and plant bioflavonoids' },
        { name: 'Walnuts, Roasted Pumpkin Seeds & Flaxseeds', category: 'Zinc, Omega-3 & Magnesium', reason: 'Zinc and magnesium support deep neuromuscular relaxation and restful sleep recovery' },
        { name: 'Palak, Methi & Mixed Vegetable Sabzis', category: 'Micronutrient Shield', reason: 'Iron, folate, and vitamin C synthesize collagen for healthy joints and tendons' }
      ],
      minimize: [
        { name: 'Refined Vanaspati & Ultra-Processed Cooking Oils', category: 'Inflammatory Lipids', reason: 'Excess trans fats promote chronic low-grade inflammation and impair recovery' },
        { name: 'Excess Mithai, Halwa & Packaged Sweets', category: 'Simple Carbs', reason: 'Triggers reactive hypoglycemia and visceral abdominal fat deposition' },
        { name: 'Daily Fried Snacks & Fast Food', category: 'Oxidized Trans Fats', reason: 'Damages endothelial function and slows post-workout metabolic recovery' }
      ]
    };
  }

  // ─── Recomposition ─────────────────────────────────────────────────────────
  if (goal === 'recomp') {
    return {
      goalTitle: 'Body Recomposition — Lose Fat & Build Muscle Together 🇮🇳',
      calorieContext: 'Slight Caloric Deficit (-100 to -200 kcal) with Very High Protein',
      prioritize: [
        { name: 'Moong Dal Chilla (Lentil Pancakes) & Egg White Bhurji', category: 'High Thermic Protein Breakfast', reason: 'High protein, low fat, light on digestion — perfect pre-workout morning fuel for recomp' },
        { name: 'Boiled Chana (Chickpeas) & Sprouted Salad', category: 'Lean Plant Protein', reason: 'Keeps you full with fiber, provides amino acids for muscle synthesis, and aids fat loss simultaneously' },
        { name: 'Grilled Chicken & Steamed Fish (Baked / Tandoor)', category: 'Pure Lean Protein', reason: 'Highest protein-to-calorie ratio; preserves lean muscle during slight caloric deficit' },
        { name: '2 Wheat Rotis or Small Brown Rice Portion', category: 'Controlled Carbs', reason: 'Provides muscle glycogen for training without overshooting calories during recomposition' },
        { name: 'Low-Fat Dahi & Skimmed Milk Paneer', category: 'Casein Protein', reason: 'Slow-digesting dairy protein builds muscle overnight and curbs late-night cravings' },
        { name: 'Palak Sabzi, Methi Dal & Broccoli', category: 'Iron-Rich High-Fiber Greens', reason: 'Micronutrient-dense and high in fiber; supports fat oxidation and cellular repair' },
        { name: 'Amla Juice & Unsweetened Green Tea', category: 'Thermogenic Antioxidants', reason: 'EGCG catechins elevate resting fat oxidation by ~3%; amla is a powerful immune booster' },
        { name: 'Sprouts Chaat & Kala Chana Evening Snack', category: 'Fiber + Protein Snack', reason: 'Filling with plant protein and fiber; curbs evening hunger during caloric deficit' }
      ],
      minimize: [
        { name: 'Ghee-Heavy Dal & Butter Naan', category: 'Excess Saturated Fats', reason: 'Adds unnecessary calories that make recomposition harder; use measured amounts only' },
        { name: 'Sweetened Lassi, Packaged Juices & Sodas', category: 'Liquid Calories', reason: 'Drinking excess calories bypasses satiety signals and spikes insulin — worst for recomp' },
        { name: 'Deep-Fried Snacks — Bhajias, Samosas, Vada', category: 'High-Calorie Trans Fats', reason: 'Extremely calorie-dense with zero muscle-building benefit; completely derails recomp' },
        { name: 'Skipping Protein at Any Meal', category: 'Muscle-Catabolism Risk', reason: 'Recomp demands consistent protein every 3–4 hours to build muscle while in a deficit' }
      ]
    };
  }

  // ─── Fat Loss (Default) ────────────────────────────────────────────────────
  return {
    goalTitle: 'Thermogenic & Satiety-Maximized Fat Loss Protocol 🇮🇳',
    calorieContext: 'Caloric Deficit (-300 to -500 kcal) with Lean Mass Preservation',
    prioritize: [
      { name: 'Moong Dal Chilla & Egg White Omelette', category: 'High Thermic Protein', reason: 'High satiety index with a high Thermic Effect of Food (TEF) — body burns extra calories just digesting these' },
      { name: 'Grilled Chicken Tikka & Tandoori Fish', category: 'Pure Lean Protein', reason: 'Highest protein-to-calorie ratio; prevents lean muscle catabolism during caloric deficit' },
      { name: 'Palak, Lauki (Bottle Gourd) & Cucumber Sabzi', category: 'High-Volume Dietary Fiber', reason: 'Triggers stomach stretch receptors; keeps you full for hours on very few calories' },
      { name: 'Idli & Sambar (Steamed, No Butter)', category: 'Fermented Light Carbs + Protein', reason: 'Fermented batter aids gut health; sambar adds protein and fiber with minimal calories' },
      { name: 'Low-Fat Dahi (Curd) & Chaas (Buttermilk)', category: 'Casein Protein & Probiotics', reason: 'Dense, slow-digesting protein that halts mid-afternoon and late-night cravings' },
      { name: 'Boiled Sprouts Chaat & Kala Chana', category: 'Fiber + Plant Protein Snack', reason: 'Extremely filling with high fiber and plant protein; curbs evening hunger spikes effectively' },
      { name: 'Fresh Guava, Amla & Berries', category: 'Low-Glycemic Antioxidants', reason: 'Satisfies sweet cravings with minimal sugar; packed with vitamin C and cellular polyphenols' },
      { name: 'Unsweetened Green Tea & Jeera (Cumin) Water', category: 'Thermogenic Catalysts', reason: 'EGCG catechins elevate resting fat oxidation; jeera water aids digestion and reduces bloating' }
    ],
    minimize: [
      { name: 'Sweetened Chai, Lassi & Packaged Fruit Juices', category: 'Bypasses Satiety Signals', reason: 'Liquid calories bypass chewing, causing rapid insulin spikes and immediate rebound hunger' },
      { name: 'Unmeasured Ghee, Oil & Butter on Rotis', category: 'Stealth Caloric Bombs', reason: '1 tablespoon adds 120 calories — easily erasing your entire daily calorie deficit' },
      { name: 'Maida Rotis, White Bread & Biscuits', category: 'Fast-Absorbing Simple Carbs', reason: 'Stripped of fiber; causes rapid blood glucose spikes followed by fatigue and rebound hunger' },
      { name: 'Deep-Fried Samosas, Vada Pav & Pakoras', category: 'High-Calorie Trans Fats', reason: 'Extremely calorie-dense: a single serving can exceed 400–600 calories with zero micronutrients' },
      { name: 'Sugary Sodas, Energy Drinks & Packaged Chips', category: 'High-Fructose & Trans Fat', reason: 'Triggers visceral liver fat storage and impairs leptin (fullness) hormone signaling' }
    ]
  };
}

// Backwards-compatible default
export const FOOD_GUIDANCE = getFoodGuidanceByGoal('fat_loss');
