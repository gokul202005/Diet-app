import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileSpreadsheet, 
  Download, 
  Utensils, 
  Flame, 
  Check, 
  Calendar, 
  Clock, 
  ChevronRight,
  Info,
  CheckCircle2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { exportDietPlanToExcel } from '../utils/excelExporter';

export default function MealPlanner({ profile, selectedDate, onPlanLogged }) {
  const [preference, setPreference] = useState('south_indian_mixed');
  const [daysCount, setDaysCount] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isLoggingAll, setIsLoggingAll] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  // Load saved meal plan on mount without automatically re-rolling on every visit
  useEffect(() => {
    const loadSavedPlan = async () => {
      // 1. Check localStorage first for instant 0ms restoration
      try {
        const cached = localStorage.getItem('antigravity_saved_meal_plan');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.days && parsed.days.length > 0) {
            setGeneratedPlan(parsed);
            if (parsed.preference) setPreference(parsed.preference);
            if (parsed.days?.length) setDaysCount(parsed.days.length);
            return;
          }
        }
      } catch (e) {}

      // 2. Check backend for persisted plan
      try {
        const res = await api.getSavedMealPlan();
        if (res.success && res.plan && res.plan.days && res.plan.days.length > 0) {
          setGeneratedPlan(res.plan);
          if (res.plan.preference) setPreference(res.plan.preference);
          if (res.plan.days?.length) setDaysCount(res.plan.days.length);
          try {
            localStorage.setItem('antigravity_saved_meal_plan', JSON.stringify(res.plan));
          } catch (e2) {}
          return;
        }
      } catch (e) {}

      // 3. Only if no plan has ever been generated, generate an initial one
      handleGeneratePlan('south_indian_mixed', 7);
    };

    loadSavedPlan();
  }, []);

  const handleGeneratePlan = async (customPref, customDays) => {
    const prefToUse = customPref || preference;
    const daysToUse = customDays !== undefined ? customDays : daysCount;
    setIsGenerating(true);
    setLoggedSuccess(false);
    try {
      const res = await api.generateMealPlan({ preference: prefToUse, daysCount: daysToUse });
      if (res.success && res.plan) {
        setGeneratedPlan(res.plan);
        setSelectedDayIdx(0);
        try {
          localStorage.setItem('antigravity_saved_meal_plan', JSON.stringify(res.plan));
        } catch (e) {}
      }
    } catch (err) {
      alert('Failed to generate meal plan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 1-Click Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (!generatedPlan) return;
    try {
      // Fetch latest daily meals for tracking history sheet
      const mealsRes = await api.getMeals(selectedDate);
      const watchRes = await api.getFastrackSummary(selectedDate);

      const sampleHistory = [
        {
          date: selectedDate,
          mealCount: mealsRes.meals?.length || 4,
          calories: mealsRes.totals?.calories || generatedPlan.days[0]?.dayTotalCalories,
          protein: mealsRes.totals?.protein || generatedPlan.days[0]?.dayTotalProtein,
          carbs: mealsRes.totals?.carbs || generatedPlan.days[0]?.dayTotalCarbs,
          fat: mealsRes.totals?.fat || generatedPlan.days[0]?.dayTotalFat,
          steps: watchRes.log?.steps || profile?.dailyTargetSteps || 10000,
          activeBurn: watchRes.log?.activeCalories || 380,
          netCalories: -350,
          status: 'Caloric Deficit'
        }
      ];

      exportDietPlanToExcel({
        profile,
        plan: generatedPlan,
        mealsHistory: sampleHistory
      });
    } catch (err) {
      alert('Excel export error: ' + err.message);
    }
  };

  // 1-Click Log Entire AI Plan to Today's Diary
  const handleLogDayToDiary = async () => {
    const activeDay = generatedPlan?.days[selectedDayIdx];
    if (!activeDay) return;

    setIsLoggingAll(true);
    try {
      for (const meal of activeDay.meals) {
        const mealPayload = {
          date: selectedDate,
          mealType: meal.mealType.toLowerCase().includes('snack') ? 'snack' : meal.mealType.toLowerCase(),
          name: meal.title,
          foods: meal.foods.map(f => ({
            name: f.name,
            quantity: f.portion,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat
          })),
          notes: `Auto-logged from AI ${preference.replace(/_/g, ' ')} Meal Plan`
        };
        await api.addMeal(mealPayload);
      }
      setLoggedSuccess(true);
      if (onPlanLogged) onPlanLogged();
      setTimeout(() => setLoggedSuccess(false), 4000);
    } catch (err) {
      alert('Failed to log meals: ' + err.message);
    } finally {
      setIsLoggingAll(false);
    }
  };

  const activeDay = generatedPlan?.days[selectedDayIdx];
  const targetCal = profile?.dailyTargetCalories || 2100;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>AI Meal Planner & Target Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white">Daily Calorie & Meal Blueprint</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              The AI calculates all the exact foods, portion sizes in grams, and calories you need to eat every day to hit your bio targets. Export directly to Excel.
            </p>
          </div>

          {/* Action Buttons: Export to Excel & Regenerate */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportExcel}
              disabled={!generatedPlan}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
              title="Download formatted Excel spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleGeneratePlan(preference, daysCount)}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Calculating Plan...' : 'Generate / Update Plan'}</span>
            </button>
          </div>
        </div>

        {/* Preference Selector */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Diet Style:</span>
            {[
              { id: 'south_indian_mixed', label: '🔄 South Indian Mixed (Veg + Eggs & Non-Veg)' },
              { id: 'south_indian_non_veg', label: '🍗 South Indian Non-Veg' },
              { id: 'south_indian_eggetarian', label: '🥚 South Indian Veg + Eggs' },
              { id: 'south_indian_veg', label: '🥗 Pure South Indian Veg' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPreference(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  preference === p.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-xs text-slate-400 font-semibold">Plan Length:</span>
            {[
              { count: 7, label: '7 Days (Full Week Variety)' },
              { count: 1, label: '1 Day' }
            ].map((dur) => (
              <button
                key={dur.count}
                onClick={() => setDaysCount(dur.count)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  daysCount === dur.count
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TARGET ACCURACY SUMMARY BAR */}
      {activeDay && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">Target Alignment</div>
              <div className="text-xl font-black text-white">
                {activeDay.dayTotalCalories} <span className="text-xs text-slate-400 font-normal">kcal planned</span>
                <span className="text-slate-500 mx-2">/</span>
                <span className="text-emerald-400">{targetCal} kcal target</span>
              </div>
            </div>
          </div>

          {/* Macro breakdown pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-semibold block text-[10px]">PROTEIN</span>
              <span className="text-sky-400 font-bold">{activeDay.dayTotalProtein}g</span>
              <span className="text-slate-500 text-[10px]"> / {profile?.dailyTargetProtein || 140}g</span>
            </div>

            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-semibold block text-[10px]">CARBS</span>
              <span className="text-amber-400 font-bold">{activeDay.dayTotalCarbs}g</span>
              <span className="text-slate-500 text-[10px]"> / {profile?.dailyTargetCarbs || 220}g</span>
            </div>

            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-semibold block text-[10px]">FATS</span>
              <span className="text-rose-400 font-bold">{activeDay.dayTotalFat}g</span>
              <span className="text-slate-500 text-[10px]"> / {profile?.dailyTargetFat || 60}g</span>
            </div>

            {/* 1-Click Log to Diary Button */}
            <button
              onClick={handleLogDayToDiary}
              disabled={isLoggingAll}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                loggedSuccess
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {loggedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Logged to Today's Diary!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isLoggingAll ? 'Logging Meals...' : "Log Plan to Today's Diary"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Multi-Day Tabs (if 7 days generated) */}
      {generatedPlan?.days?.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {generatedPlan.days.map((d, idx) => (
            <button
              key={d.dayNumber}
              onClick={() => setSelectedDayIdx(idx)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
                selectedDayIdx === idx
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {d.dayName}
            </button>
          ))}
        </div>
      )}

      {/* MEAL-BY-MEAL BLUEPRINT CARDS */}
      {activeDay && (
        <div className="space-y-4">
          {activeDay.meals.map((meal, mIdx) => (
            <div
              key={mIdx}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {mIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {meal.mealType}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{meal.time}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">{meal.title}</h3>
                  </div>
                </div>

                <div className="text-right self-start sm:self-auto">
                  <div className="text-base font-black text-white">{meal.mealCalories} kcal</div>
                  <div className="text-[11px] text-slate-400 space-x-2">
                    <span className="text-sky-400 font-semibold">{meal.mealProtein}g Protein</span>
                    <span className="text-amber-400 font-semibold">{meal.mealCarbs}g Carbs</span>
                    <span className="text-rose-400 font-semibold">{meal.mealFat}g Fat</span>
                  </div>
                </div>
              </div>

              {/* Exact Foods Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] text-slate-500 uppercase tracking-wider">
                      <th className="pb-2 font-semibold">Exact Food Item</th>
                      <th className="pb-2 font-semibold">Recommended Portion</th>
                      <th className="pb-2 font-semibold text-right">Calories</th>
                      <th className="pb-2 font-semibold text-right text-sky-400">Protein</th>
                      <th className="pb-2 font-semibold text-right text-amber-400">Carbs</th>
                      <th className="pb-2 font-semibold text-right text-rose-400">Fats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {meal.foods.map((food, fIdx) => (
                      <tr key={fIdx} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-2.5 font-bold text-slate-200">{food.name}</td>
                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">{food.portion}</td>
                        <td className="py-2.5 text-right font-extrabold text-white">{food.calories} kcal</td>
                        <td className="py-2.5 text-right font-semibold text-sky-400">{food.protein}g</td>
                        <td className="py-2.5 text-right font-semibold text-amber-400">{food.carbs}g</td>
                        <td className="py-2.5 text-right font-semibold text-rose-400">{food.fat}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Dietitian Tip & Hydration Callout */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex items-start space-x-3 text-xs text-slate-400">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Coach Guidance for Today: </span>
              <span>{activeDay.dieticianTip} Hydration Target: <strong className="text-blue-400">{activeDay.hydrationGoal}</strong>.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
