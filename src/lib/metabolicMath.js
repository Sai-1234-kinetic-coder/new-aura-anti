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
 * BMI = weight (kg) / (height (m))^2
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: 0, category: 'Unknown', color: '#94a3b8' };
  const heightM = heightCm / 100;
  const bmi = +(weightKg / (heightM * heightM)).toFixed(1);

  let category = 'Normal / Healthy';
  let color = '#10b981'; // green

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#38bdf8'; // sky blue
  } else if (bmi < 25) {
    category = 'Normal / Healthy';
    color = '#10b981'; // emerald
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#f59e0b'; // amber
  } else {
    category = 'Obese';
    color = '#f43f5e'; // rose / alert
  }

  return { bmi, category, color };
}

/**
 * Calculates BMR using Mifflin-St Jeor Equation
 * Men: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
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
    return {
      type: 'Ectomorph',
      desc: 'Naturally lean with high metabolic rate; benefits from caloric surplus and hypertrophy compound lifts.'
    };
  } else if (bmi >= 19.5 && bmi <= 25.5) {
    return {
      type: 'Mesomorph',
      desc: 'Athletic somatic structure with efficient muscle response; thrives on hybrid strength & HIIT regimes.'
    };
  } else {
    return {
      type: 'Endomorph',
      desc: 'Solid build with higher storage tendency; thrives on nutrient timing, steady cardio, and metabolic resistance.'
    };
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

  // Macronutrient calculation
  // 1. Protein: proteinPerKg * weightKg (4 kcal/g)
  const proteinGrams = Math.round(weightKg * goalObj.proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // 2. Fat: fatRatio * totalCalories (9 kcal/g)
  const fatCalories = targetDailyCalories * goalObj.fatRatio;
  const fatGrams = Math.round(fatCalories / 9);

  // 3. Carbohydrates: Remaining calories / 4
  const remainingCalories = Math.max(0, targetDailyCalories - (proteinCalories + fatCalories));
  const carbGrams = Math.round(remainingCalories / 4);

  // 4. Daily Hydration: 35ml per kg of bodyweight + activity buffer
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
    macros: {
      proteinGrams,
      fatGrams,
      carbGrams,
      hydrationMl
    }
  };
}

export function getFoodGuidanceByGoal(goal = 'fat_loss') {
  if (goal === 'muscle_gain') {
    return {
      goalTitle: 'Hypertrophy & Lean Bulk Nutrition Protocol',
      calorieContext: 'Caloric Surplus Focus (+300 to +500 kcal)',
      prioritize: [
        { name: 'Lean Beef & Free-Range Chicken', category: 'High-Leucine Protein', reason: 'Abundant natural creatine & leucine to stimulate the mTOR anabolic pathway' },
        { name: 'Whole Eggs with Yolks', category: 'Anabolic Lipids & Protein', reason: 'Essential cholesterol and bioavailable choline for hormonal testosterone support' },
        { name: 'Basmati Rice & Sweet Potatoes', category: 'Dense Glycogen Carbs', reason: 'Easily digestible carbohydrates to fuel heavy compound squat & bench sessions' },
        { name: 'Natural Peanut / Almond Butter', category: 'Healthy Caloric Density', reason: 'High-calorie healthy fats: provides 190 kcal in 2 tbsp to easily hit your caloric surplus' },
        { name: 'Rolled Oats & Banana Shake', category: 'Pre/Post-Workout Carb', reason: 'Fast liquid carbohydrate replenishment without gastrointestinal sluggishness' },
        { name: 'Wild Salmon & Mackerel', category: 'Omega-3 & Joint Support', reason: 'EPA/DHA fats lubricate joint cartilage under heavy progressive overload' },
        { name: 'Greek Yogurt & Fresh Paneer', category: 'Slow-Release Casein', reason: 'Sustained amino acid release across 6-8 hours to halt muscle catabolism during sleep' },
        { name: 'Lentils, Chickpeas & Edamame', category: 'Complex Plant Protein', reason: 'Mineral-dense fuel rich in zinc, magnesium, and slow-burning digestive fiber' }
      ],
      minimize: [
        { name: 'Excess Raw Vegetable Bulk Before Lifting', category: 'Volume Density', reason: 'Overfills the stomach with zero-calorie water fiber, suppressing your required caloric intake' },
        { name: 'Refined Bakery Cakes & Deep-Fried Donuts', category: 'Trans Fats & Sugar', reason: 'Causes high fat accumulation with low micronutrient partitioning to muscle' },
        { name: 'Skipping Post-Workout Nutrition Windows', category: 'Timing Protocol', reason: 'Delays protein synthesis and prolongs cortisol-driven muscle breakdown' },
        { name: 'Hydrogenated Vegetable Margarines', category: 'Inflammatory Fats', reason: 'Impairs cellular membrane fluidity and blunts nutrient uptake into myocytes' }
      ]
    };
  }

  if (goal === 'endurance') {
    return {
      goalTitle: 'Cardiorespiratory & Stamina Fuel Protocol',
      calorieContext: 'Glycogen Storage & Electrolyte Balance',
      prioritize: [
        { name: 'Beetroot Juice & Steamed Beets', category: 'Nitric Oxide & VO2 Max', reason: 'Dietary nitrates dilate blood vessels, elevating oxygen delivery to working muscles' },
        { name: 'Bananas with Pink Himalayan Salt', category: 'Electrolytes & Rapid Energy', reason: 'Restores extracellular sodium-potassium balance, halting muscle cramps during long sets' },
        { name: 'Quinoa & Steel-Cut Oats', category: 'Sustained Glycogen Carbs', reason: 'Complex starches that provide sustained glucose without causing energy crashes' },
        { name: 'Coconut Water & Chia Seed Infusion', category: 'Cellular Osmosis', reason: 'Natural electrolytes and hydrophilic chia gel maintain steady intra-cellular hydration' },
        { name: 'Tart Cherry Extract / Juice', category: 'Polyphenol Recovery', reason: 'Clinically proven to reduce delayed-onset muscle soreness (DOMS) after high-volume reps' },
        { name: 'Steamed Lentils (Dal) & Beans', category: 'B-Vitamins & Plant Protein', reason: 'Essential B-complex vitamins for cellular ATP energy synthesis and stamina' },
        { name: 'Wild Cod & Grilled Chicken Breast', category: 'Lean Repair Protein', reason: 'Pure essential amino acids for micro-tear repair without digestive heaviness' },
        { name: 'Raw Honey & Dried Medjool Dates', category: 'Mid-Workout Fuel', reason: 'Dual glucose-fructose transporter uptake for rapid intra-workout energy' }
      ],
      minimize: [
        { name: 'Heavy High-Fat Meals Within 2 Hours of Cardio', category: 'Gastric Timing', reason: 'Slows down gastric emptying, causing stomach cramps, nausea, and sluggishness' },
        { name: 'Artificial High-Caffeine Energy Drinks', category: 'Central Nervous Stimulant', reason: 'Triggers tachycardia and sudden post-peak crashes during aerobic conditioning' },
        { name: 'Spicy Acidic Foods Before Endurance Work', category: 'Gastrointestinal Stress', reason: 'Induces acid reflux and diaphragm discomfort during rhythmic breathing' }
      ]
    };
  }

  if (goal === 'maintenance') {
    return {
      goalTitle: 'Metabolic Balance & Athletic Recomposition',
      calorieContext: 'Isocaloric Homeostasis (40/30/30 Ratio)',
      prioritize: [
        { name: 'Grilled Free-Range Chicken Breast', category: 'Lean Muscle Protein', reason: 'Clean high biological value protein to maintain lean mass while staying agile' },
        { name: 'Wild Salmon & Cold-Water Sardines', category: 'Essential Fatty Acids', reason: 'Reduces systemic inflammation and optimizes resting metabolic rate' },
        { name: 'Avocados & Extra Virgin Olive Oil', category: 'Cardioprotective Fats', reason: 'Monounsaturated oleic acid improves arterial elasticity and satiety' },
        { name: 'Sweet Potatoes, Quinoa & Brown Rice', category: 'Complex Carbohydrates', reason: 'Steady, non-spiking glycemic fuels that sustain mental and physical productivity' },
        { name: 'Low-Fat Greek Yogurt & Paneer', category: 'Probiotic Amino Blend', reason: 'Balances gut microbiome flora while supplying continuous amino acids' },
        { name: 'Sprouted Moong & Black Chickpeas', category: 'Enzyme-Rich Plant Fuel', reason: 'Easy to digest, rich in trace iron, potassium, and plant bioflavonoids' },
        { name: 'Walnuts & Roasted Pumpkin Seeds', category: 'Zinc & Magnesium', reason: 'Zinc and magnesium support deep neuromuscular relaxation and restful recovery' },
        { name: 'Rainbow Bell Peppers, Spinach & Berries', category: 'Micronutrient Shield', reason: 'Anthocyanins and vitamin C synthesize collagen for healthy joints and tendons' }
      ],
      minimize: [
        { name: 'Ultra-Processed Seed Oils', category: 'Inflammatory Lipids', reason: 'Excess linoleic acid promotes chronic low-grade inflammation' },
        { name: 'Refined White Sugars & Commercial Syrups', category: 'Simple Carbs', reason: 'Triggers reactive hypoglycemia and visceral abdominal fat deposition' },
        { name: 'Deep-Fried Commercial Snacks', category: 'Oxidized Trans Fats', reason: 'Damages endothelial function and slows down post-workout recovery' }
      ]
    };
  }

  // Default: Fat Loss
  return {
    goalTitle: 'Thermogenic & Satiety-Maximized Fat Loss Protocol',
    calorieContext: 'Caloric Deficit (-300 to -500 kcal) with Lean Mass Preservation',
    prioritize: [
      { name: 'Organic Egg Whites & Whole Poached Eggs', category: 'High Thermic Protein', reason: 'High satiety index (13g protein/100g) with high Thermic Effect of Food (TEF)' },
      { name: 'Lean Chicken Breast & White Cod Fish', category: 'Pure Lean Protein', reason: 'Highest protein-to-calorie ratio; prevents lean muscle catabolism during a caloric cut' },
      { name: 'Cruciferous Greens (Broccoli, Cauliflower)', category: 'High-Volume Dietary Fiber', reason: 'Triggers stomach stretch receptors, keeping you full for hours on very few calories' },
      { name: '0% Fat Greek Yogurt & Low-Fat Cottage Cheese', category: 'Casein & Probiotics', reason: 'Dense, slow-digesting protein that halts mid-afternoon and late-night cravings' },
      { name: 'Konjac / Shirataki & Zucchini Noodles', category: 'Near-Zero Calorie Volume', reason: 'Glucomannan soluble fiber absorbs water in the gut, multiplying satiety without calories' },
      { name: 'Fresh Blueberries, Strawberries & Raspberries', category: 'Low-Glycemic Antioxidants', reason: 'Satisfies sweet cravings with minimal fructose, packed with cellular polyphenols' },
      { name: 'Boiled Potatoes (Cold-Cooled)', category: 'Resistant Starch', reason: 'Scores #1 on the international Satiety Index; resistant starch feeds healthy gut bacteria' },
      { name: 'Unsweetened Green Tea & Apple Cider Vinegar', category: 'Thermogenic Catalysts', reason: 'EGCG catechins elevate resting fat oxidation by 3-4% when paired with workouts' }
    ],
    minimize: [
      { name: 'Liquid Calories, Smoothies & Fruit Juices', category: 'Bypasses Satiety Signals', reason: 'Drinking calories bypasses chewing, leading to rapid insulin spikes and immediate rebound hunger' },
      { name: 'Cooking Oils & Ghee Poured Unmeasured', category: 'Stealth Caloric Bombs', reason: 'Just 1 unmeasured tablespoon adds 120 calories, easily erasing your entire daily calorie deficit' },
      { name: 'Refined White Flours (Maida) & Sweet Pastries', category: 'Fast-Absorbing Simple Carbs', reason: 'Stripped of dietary fiber, causing rapid blood glucose spikes followed by fatigue' },
      { name: 'Deep-Fried Samosas, Fries & Fast Foods', category: 'High-Calorie Trans Fats', reason: 'Extremely calorie-dense: a single serving can exceed 600 calories with zero micronutrients' },
      { name: 'Sugary Carbonated Sodas & Energy Drinks', category: 'High-Fructose Liquid', reason: 'Triggers visceral liver fat storage and impairs leptin (fullness) hormone signaling' }
    ]
  };
}

// Backwards-compatible default
export const FOOD_GUIDANCE = getFoodGuidanceByGoal('fat_loss');
