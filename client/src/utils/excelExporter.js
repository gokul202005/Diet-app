import * as XLSX from 'xlsx';

export function exportDietPlanToExcel({ profile, plan, mealsHistory = [], fastrackHistory = [] }) {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: AI DAILY MEAL PLAN
  // ==========================================
  const planRows = [];

  // Title & Bio Banner
  planRows.push(['AGY FIT • AI DAILY MEAL PLAN & CALORIE BLUEPRINT']);
  planRows.push([
    'User Name:', profile?.name || 'User',
    'Goal:', (profile?.goal || 'Recomp').toUpperCase(),
    'Calorie Target:', `${profile?.dailyTargetCalories || 2100} kcal/day`
  ]);
  planRows.push([
    'Protein Target:', `${profile?.dailyTargetProtein || 140} g`,
    'Carbs Target:', `${profile?.dailyTargetCarbs || 220} g`,
    'Fat Target:', `${profile?.dailyTargetFat || 60} g`,
    'Water Target:', `${(profile?.dailyTargetWater || 3000) / 1000} L`
  ]);
  planRows.push([]); // blank line

  // Column Headers
  planRows.push([
    'Day',
    'Meal Timing',
    'Meal Category',
    'Meal Recipe / Title',
    'Food Item Description',
    'Portion / Serving Size',
    'Calories (kcal)',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)'
  ]);

  if (plan && plan.days) {
    plan.days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.foods.forEach((food, idx) => {
          planRows.push([
            idx === 0 ? day.dayName : '',
            idx === 0 ? (meal.time || '') : '',
            idx === 0 ? meal.mealType : '',
            idx === 0 ? meal.title : '',
            food.name,
            food.portion,
            food.calories,
            food.protein,
            food.carbs,
            food.fat
          ]);
        });

        // Meal Subtotal
        planRows.push([
          '', '', '', `[Subtotal ${meal.mealType}]`, '', '',
          meal.mealCalories,
          meal.mealProtein,
          meal.mealCarbs,
          meal.mealFat
        ]);
      });

      // Day Cumulative Total
      planRows.push([
        day.dayName, '', 'DAY TOTAL', 'All Meals Combined', '', '',
        day.dayTotalCalories,
        day.dayTotalProtein,
        day.dayTotalCarbs,
        day.dayTotalFat
      ]);
      planRows.push([
        '', '', 'TARGET VS ACTUAL',
        `Diff: ${day.dayTotalCalories - (profile?.dailyTargetCalories || 2100)} kcal`, '', '',
        `${day.dayTotalCalories} / ${profile?.dailyTargetCalories || 2100} kcal`,
        `${day.dayTotalProtein} / ${profile?.dailyTargetProtein || 140} g`,
        `${day.dayTotalCarbs} / ${profile?.dailyTargetCarbs || 220} g`,
        `${day.dayTotalFat} / ${profile?.dailyTargetFat || 60} g`
      ]);
      planRows.push([]); // blank spacer
    });
  }

  const wsPlan = XLSX.utils.aoa_to_sheet(planRows);
  // Column Widths for clean layout
  wsPlan['!cols'] = [
    { wch: 15 }, // Day
    { wch: 12 }, // Time
    { wch: 15 }, // Category
    { wch: 32 }, // Title
    { wch: 28 }, // Food Item
    { wch: 22 }, // Portion
    { wch: 15 }, // Cal
    { wch: 12 }, // P
    { wch: 12 }, // C
    { wch: 12 }, // F
  ];
  XLSX.utils.book_append_sheet(wb, wsPlan, 'AI Daily Meal Plan');

  // ==========================================
  // SHEET 2: BIO & CALORIE TARGETS
  // ==========================================
  const targetRows = [
    ['METRIC', 'VALUE', 'UNIT / SPORTS SCIENCE EXPLANATION'],
    ['User Name', profile?.name || '', 'Active Profile'],
    ['Age', profile?.age || 24, 'Years'],
    ['Gender', (profile?.gender || 'Male').toUpperCase(), 'Used for hormonal BMR baseline'],
    ['Height', profile?.heightCm || 175, 'Centimeters (cm)'],
    ['Weight', profile?.weightKg || 70, 'Kilograms (kg)'],
    ['Fitness Goal', (profile?.goal || 'Recomp').toUpperCase(), 'Caloric balance strategy'],
    ['Activity Level', profile?.activityLevel || 'moderately_active', 'Weekly training multiplier'],
    ['BMR (Basal Metabolic Burn)', profile?.bmr || 1650, 'kcal/day burned at rest (Mifflin-St Jeor)'],
    ['Maintenance TDEE', profile?.tdee || 2400, 'kcal/day needed to stay at same weight'],
    ['Target Daily Calories', profile?.dailyTargetCalories || 2100, 'kcal/day to reach chosen goal'],
    ['Target Protein', profile?.dailyTargetProtein || 140, 'grams/day (~2.0g per kg bodyweight)'],
    ['Target Carbohydrates', profile?.dailyTargetCarbs || 220, 'grams/day (Muscular glycogen & energy)'],
    ['Target Fats', profile?.dailyTargetFat || 60, 'grams/day (Hormonal & joint support)'],
    ['Daily Water Target', profile?.dailyTargetWater || 3000, 'ml/day (Hydration & metabolic efficiency)'],
    ['Fastrack Step Goal', profile?.dailyTargetSteps || 10000, 'steps/day (Active NEAT expenditure)']
  ];

  const wsTargets = XLSX.utils.aoa_to_sheet(targetRows);
  wsTargets['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsTargets, 'Bio & Macro Targets');

  // ==========================================
  // SHEET 3: TRACKING & FASTRACK LOGS
  // ==========================================
  const logRows = [
    [
      'Date',
      'Meals Logged Count',
      'Calories Consumed (kcal)',
      'Target Calories (kcal)',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Fastrack Steps',
      'Fastrack Active Burn (kcal)',
      'Net Calorie Balance (kcal)',
      'Calorie Balance Status'
    ]
  ];

  if (mealsHistory && mealsHistory.length > 0) {
    mealsHistory.forEach((dayLog) => {
      logRows.push([
        dayLog.date,
        dayLog.mealCount || 1,
        dayLog.calories,
        profile?.dailyTargetCalories || 2100,
        dayLog.protein,
        dayLog.carbs,
        dayLog.fat,
        dayLog.steps || 0,
        dayLog.activeBurn || 0,
        dayLog.netCalories || 0,
        dayLog.status || 'Balanced'
      ]);
    });
  } else {
    // Current day sample record
    logRows.push([
      new Date().toISOString().split('T')[0],
      'Active Day',
      profile?.dailyTargetCalories || 2100,
      profile?.dailyTargetCalories || 2100,
      profile?.dailyTargetProtein || 140,
      profile?.dailyTargetCarbs || 220,
      profile?.dailyTargetFat || 60,
      profile?.dailyTargetSteps || 10000,
      400,
      -350,
      'Fat-Loss Deficit'
    ]);
  }

  const wsLogs = XLSX.utils.aoa_to_sheet(logRows);
  wsLogs['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 22 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 25 }, { wch: 25 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Daily Tracking History');

  // Download File
  const safeName = (profile?.name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `AGY_Fit_Diet_Plan_${safeName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
