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

export const FOOD_GUIDANCE = {
  prioritize: [
    { name: 'Lean Chicken Breast & Turkey', category: 'Protein', reason: 'High biological value, 31g protein/100g with minimal saturated fat' },
    { name: 'Wild Salmon & Mackerel', category: 'Fats & Protein', reason: 'Rich in anti-inflammatory EPA/DHA Omega-3s & high protein' },
    { name: 'Organic Eggs & Egg Whites', category: 'Protein', reason: 'Gold-standard amino acid profile, choline for cognitive sharpness' },
    { name: 'Quinoa & Steel-Cut Rolled Oats', category: 'Carbs', reason: 'Low glycemic index, rich in beta-glucan fibers and sustained glycogen' },
    { name: 'Greek Yogurt (0% or Low Fat)', category: 'Protein', reason: 'Dense casein/whey blend with gut-friendly live active probiotics' },
    { name: 'Lentils, Chickpeas & Edamame', category: 'Plant Protein', reason: 'Prebiotic fiber, iron, zinc, and sustained carbohydrate energy' },
    { name: 'Avocados & Raw Almonds', category: 'Healthy Fats', reason: 'Heart-healthy monounsaturated fats & Vitamin E for joint health' },
    { name: 'Cruciferous Greens & Berries', category: 'Micronutrients', reason: 'Anthocyanins, polyphenols, and micronutrients for cellular recovery' }
  ],
  minimize: [
    { name: 'Ultra-Processed Seed Oils', category: 'Fats', reason: 'High Omega-6 linoleic acid promotes systemic inflammation' },
    { name: 'Refined Sugars & Syrups', category: 'Carbs', reason: 'Sharp insulin spikes followed by reactive hypoglycemia and lethargy' },
    { name: 'Deep-Fried Fast Foods', category: 'Trans Fats', reason: 'Oxidized trans fats impair endothelial blood flow and cardiovascular recovery' },
    { name: 'Sugary Carbonated Sodas', category: 'Liquids', reason: 'Zero micronutrients, triggers visceral adiposity and dehydrates cells' },
    { name: 'Processed Deli Meats with Nitrates', category: 'Protein', reason: 'Sodium overload, chemical preservatives linked to metabolic stress' },
    { name: 'Refined White Pastries & Bakery', category: 'Carbs', reason: 'High glycemic index flour with stripped fiber content' }
  ]
};
