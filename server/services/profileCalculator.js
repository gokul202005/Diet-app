// Smart Macro & TDEE Calculator based on Sports Science (Multi-Option & Multi-Goal Engine)
export function calculateNutritionTargets({ age, gender, heightCm, weightKg, goal, goals, activityLevel }) {
  const ageNum = Number(age) || 24;
  const heightNum = Number(heightCm) || 175;
  const weightNum = Number(weightKg) || 70;

  // 1. BMR (Mifflin-St Jeor)
  let bmr;
  if (gender === 'female') {
    bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
  } else {
    bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
  }
  bmr = Math.round(bmr);

  // 2. Activity Multiplier (Granular 6-tier lifestyle options)
  let multiplier = 1.55;
  let dailyTargetSteps = 10000;

  switch (activityLevel) {
    case 'sedentary':
      multiplier = 1.2;
      dailyTargetSteps = 5000;
      break;
    case 'lightly_active':
      multiplier = 1.375;
      dailyTargetSteps = 7500;
      break;
    case 'moderately_active':
      multiplier = 1.55;
      dailyTargetSteps = 10000;
      break;
    case 'active_lifter':
      multiplier = 1.65;
      dailyTargetSteps = 11500;
      break;
    case 'very_active':
      multiplier = 1.75;
      dailyTargetSteps = 13500;
      break;
    case 'athlete_double':
      multiplier = 1.9;
      dailyTargetSteps = 16000;
      break;
    default:
      multiplier = 1.55;
      dailyTargetSteps = 10000;
  }

  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment (Granular 8-tier fitness targets, supports Multi-Select)
  const GOAL_CONFIG = {
    rapid_cut: { delta: -650, proteinRatio: 2.3, fatPercent: 0.22 },
    cutting: { delta: -400, proteinRatio: 2.1, fatPercent: 0.25 },
    steady_cut: { delta: -400, proteinRatio: 2.1, fatPercent: 0.25 },
    recomp: { delta: -100, proteinRatio: 2.0, fatPercent: 0.25 },
    lean_bulk: { delta: +250, proteinRatio: 1.8, fatPercent: 0.25 },
    bulking: { delta: +250, proteinRatio: 1.8, fatPercent: 0.25 },
    power_bulk: { delta: +500, proteinRatio: 1.9, fatPercent: 0.25 },
    endurance: { delta: +100, proteinRatio: 1.6, fatPercent: 0.22 },
    metabolic_health: { delta: -250, proteinRatio: 2.0, fatPercent: 0.28 },
    maintenance: { delta: 0, proteinRatio: 1.8, fatPercent: 0.25 }
  };

  // Extract selected goals list
  let selectedGoals = [];
  if (Array.isArray(goals) && goals.length > 0) {
    selectedGoals = goals;
  } else if (goal) {
    selectedGoals = [goal];
  } else {
    selectedGoals = ['cutting'];
  }

  let totalDelta = 0;
  let maxProteinRatio = 1.8;
  let totalFatPercent = 0;
  let validCount = 0;

  for (const gId of selectedGoals) {
    const cfg = GOAL_CONFIG[gId] || GOAL_CONFIG['cutting'];
    totalDelta += cfg.delta;
    if (cfg.proteinRatio > maxProteinRatio) maxProteinRatio = cfg.proteinRatio;
    totalFatPercent += cfg.fatPercent;
    validCount++;
  }

  const averageDelta = validCount > 0 ? Math.round(totalDelta / validCount) : -400;
  const fatPercent = validCount > 0 ? totalFatPercent / validCount : 0.25;
  const proteinRatio = maxProteinRatio;

  let dailyTargetCalories = Math.round(tdee + averageDelta);

  // Prevent dangerous starvation calories
  dailyTargetCalories = Math.max(1200, dailyTargetCalories);

  // 4. Macro Splits
  const dailyTargetProtein = Math.round(weightNum * proteinRatio);
  const proteinCalories = dailyTargetProtein * 4;

  const fatCalories = dailyTargetCalories * fatPercent;
  const dailyTargetFat = Math.round(fatCalories / 9);

  const remainingCalories = dailyTargetCalories - (proteinCalories + (dailyTargetFat * 9));
  const dailyTargetCarbs = Math.max(50, Math.round(remainingCalories / 4));

  // Water: 38ml per kg bodyweight
  const dailyTargetWater = Math.round(weightNum * 38 / 100) * 100;

  return {
    bmr,
    tdee,
    dailyTargetCalories,
    dailyTargetProtein,
    dailyTargetCarbs,
    dailyTargetFat,
    dailyTargetWater,
    dailyTargetSteps,
    goals: selectedGoals,
    calorieDelta: averageDelta
  };
}
