import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Watch, 
  Activity, 
  Droplets, 
  Plus, 
  Minus,
  Dumbbell, 
  Utensils, 
  Heart, 
  Moon, 
  ArrowUpRight, 
  Sparkles,
  Zap,
  TrendingDown,
  TrendingUp,
  Scale
} from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ 
  selectedDate, 
  profile, 
  onNavigateToDiet, 
  onNavigateToWorkouts, 
  onNavigateToFastrack,
  onNavigateToProgress,
  onOpenCoach,
  onOpenProfile
}) {
  const [mealsData, setMealsData] = useState(null);
  const [fastrackLog, setFastrackLog] = useState(null);
  const [energyBalance, setEnergyBalance] = useState(null);
  const [waterData, setWaterData] = useState({ amountMl: 0, targetMl: 3000 });
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load daily dashboard data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [mealsRes, watchRes, balanceRes, waterRes, workoutsRes] = await Promise.all([
          api.getMeals(selectedDate),
          api.getFastrackSummary(selectedDate),
          api.getEnergyBalance(selectedDate),
          api.getWater(selectedDate),
          api.getWorkouts(selectedDate)
        ]);

        setMealsData(mealsRes);
        setFastrackLog(watchRes.log);
        setEnergyBalance(balanceRes.balance);
        setWaterData(waterRes);
        setWorkouts(workoutsRes.workouts || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDate]);

  const handleAddWater = async (amount) => {
    try {
      const res = await api.logWater(amount, selectedDate);
      if (res.success) {
        setWaterData(prev => ({ ...prev, amountMl: Math.max(0, prev.amountMl + amount) }));
      }
    } catch (err) {
      console.error('Failed to log water:', err);
    }
  };

  const consumedCalories = mealsData?.totals?.calories || 0;
  const targetCalories = profile?.dailyTargetCalories || 2100;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const caloriePercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));

  const consumedProtein = mealsData?.totals?.protein || 0;
  const targetProtein = profile?.dailyTargetProtein || 140;

  const consumedCarbs = mealsData?.totals?.carbs || 0;
  const targetCarbs = profile?.dailyTargetCarbs || 220;

  const consumedFat = mealsData?.totals?.fat || 0;
  const targetFat = profile?.dailyTargetFat || 60;

  const steps = fastrackLog?.steps || 0;
  const stepTarget = profile?.dailyTargetSteps || 10000;
  const stepPercent = Math.min(100, Math.round((steps / stepTarget) * 100));

  const getGoalDisplay = () => {
    const rawGoal = profile?.goal || (Array.isArray(profile?.goals) ? profile.goals[0] : 'recomp');
    switch (rawGoal) {
      case 'cutting': return { label: '🔥 Fat Loss (Cut)', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };
      case 'rapid_cut': return { label: '⚡ Rapid Shred', color: 'border-rose-500/30 bg-rose-500/10 text-rose-300' };
      case 'recomp': return { label: '⚖️ Body Recomp', color: 'border-sky-500/30 bg-sky-500/10 text-sky-300' };
      case 'lean_bulk': return { label: '💪 Lean Bulk', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };
      case 'power_bulk': return { label: '🦍 Power Bulk', color: 'border-orange-500/30 bg-orange-500/10 text-orange-300' };
      case 'endurance': return { label: '🏃 Athletic Stamina', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' };
      case 'maintenance': return { label: '🛡️ Maintenance', color: 'border-teal-500/30 bg-teal-500/10 text-teal-300' };
      case 'metabolic_health': return { label: '🩺 Low-GI / Health', color: 'border-purple-500/30 bg-purple-500/10 text-purple-300' };
      default: return { label: `${rawGoal || 'Recomp'} Goal`, color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };
    }
  };

  const goalInfo = getGoalDisplay();

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. HERO ENERGY BALANCE CARD (DIET + FASTRACK BURN) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Flame className="w-4 h-4" />
                <span>Live Energy & Calorie Balance</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">Fastrack Synced</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {profile?.name ? `Keep Pushing, ${profile.name}!` : 'Daily Overview'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={onNavigateToProgress}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="View 7-day/30-day Trends & Photo Vault"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Body Trends & Vault</span>
              </button>

              <button
                onClick={onNavigateToDiet}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Meal</span>
              </button>
            </div>
          </div>

          {/* Three Metric Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Food In */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Calories Eaten</span>
                <div className="text-2xl font-black text-slate-100 mt-0.5">{consumedCalories} <span className="text-xs font-normal text-slate-400">kcal</span></div>
                <div className="text-[11px] text-slate-500 mt-1">Target: {targetCalories} kcal</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                {caloriePercent}%
              </div>
            </div>

            {/* Fastrack Out */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Fastrack Total Burn</span>
                <div className="text-2xl font-black text-slate-100 mt-0.5">
                  {energyBalance?.totalExpenditure || (1500 + (fastrackLog?.activeCalories || 0))} <span className="text-xs font-normal text-slate-400">kcal</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">
                  Active: +{fastrackLog?.activeCalories || 0} kcal ({steps.toLocaleString()} steps)
                </div>
              </div>
              <div 
                onClick={onNavigateToFastrack} 
                className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 cursor-pointer hover:bg-emerald-500/25 transition-all"
                title="View Fastrack Details"
              >
                <Watch className="w-6 h-6" />
              </div>
            </div>

            {/* Net Deficit / Surplus Status */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Calorie Deficit/Surplus</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {energyBalance?.status === 'deficit' ? (
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                  ) : energyBalance?.status === 'surplus' ? (
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Activity className="w-5 h-5 text-sky-400" />
                  )}
                  <span className={`text-2xl font-black ${
                    energyBalance?.status === 'deficit' ? 'text-emerald-400' : energyBalance?.status === 'surplus' ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {Math.abs(energyBalance?.netCalories || 0)} <span className="text-xs font-normal text-slate-400">kcal</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 capitalize">
                  {energyBalance?.message || 'Caloric equilibrium'}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                  energyBalance?.status === 'deficit'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {profile?.goal || 'Recomp'} Goal
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MACRONUTRIENT RINGS & BARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Protein Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="text-xs font-bold uppercase text-sky-400">Protein Target</span>
            </div>
            <span className="text-xs text-slate-400">{Math.round((consumedProtein / targetProtein) * 100)}%</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{consumedProtein}</span>
            <span className="text-sm text-slate-400">/ {targetProtein} g</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div 
              className="bg-sky-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }} 
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Remaining: <span className="text-sky-300 font-semibold">{Math.max(0, targetProtein - consumedProtein).toFixed(1)}g</span> (Chicken, Paneer, Eggs, Dal)
          </div>
        </div>

        {/* Carbs Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs font-bold uppercase text-amber-400">Carbohydrates</span>
            </div>
            <span className="text-xs text-slate-400">{Math.round((consumedCarbs / targetCarbs) * 100)}%</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{consumedCarbs}</span>
            <span className="text-sm text-slate-400">/ {targetCarbs} g</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }} 
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Remaining: <span className="text-amber-300 font-semibold">{Math.max(0, targetCarbs - consumedCarbs).toFixed(1)}g</span> (Rice, Idli, Dosa, Oats)
          </div>
        </div>

        {/* Fats Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-xs font-bold uppercase text-rose-400">Healthy Fats</span>
            </div>
            <span className="text-xs text-slate-400">{Math.round((consumedFat / targetFat) * 100)}%</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{consumedFat}</span>
            <span className="text-sm text-slate-400">/ {targetFat} g</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div 
              className="bg-rose-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }} 
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Remaining: <span className="text-rose-300 font-semibold">{Math.max(0, targetFat - consumedFat).toFixed(1)}g</span> (Ghee, Nuts, Peanut Butter)
          </div>
        </div>

      </div>

      {/* 3. FASTRACK SMARTWATCH & HYDRATION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fastrack Smartwatch Hub Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">{fastrackLog?.deviceName || 'Fastrack Smartwatch'}</h3>
                <p className="text-[11px] text-slate-400">Steps, Heart Rate & Calorie Burn</p>
              </div>
            </div>
            <button
              onClick={onNavigateToFastrack}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Sync Watch</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Steps */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Steps</span>
              <div className="text-lg font-extrabold text-white mt-0.5">{steps.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-400">{stepPercent}% of goal</div>
            </div>

            {/* Active Calories */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Burn</span>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">+{fastrackLog?.activeCalories || 0}</div>
              <div className="text-[10px] text-slate-500">kcal burned</div>
            </div>

            {/* Heart Rate */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Heart Rate</span>
              <div className="text-lg font-extrabold text-rose-400 mt-0.5 flex items-center space-x-1">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>{fastrackLog?.avgHeartRate ? `${fastrackLog.avgHeartRate} bpm` : '--'}</span>
              </div>
              <div className="text-[10px] text-slate-500">{fastrackLog?.avgHeartRate ? 'sensor average' : 'no sensor data'}</div>
            </div>

            {/* Sleep */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Sleep</span>
              <div className="text-lg font-extrabold text-indigo-400 mt-0.5 flex items-center space-x-1">
                <Moon className="w-4 h-4" />
                <span>{fastrackLog?.sleepHours ? `${fastrackLog.sleepHours}h` : '--'}</span>
              </div>
              <div className="text-[10px] text-slate-500">{fastrackLog?.sleepHours ? 'real sleep logged' : 'no sleep logged'}</div>
            </div>
          </div>
        </div>

        {/* Water Hydration Tracker */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Hydration Tracker</h3>
                <p className="text-[11px] text-slate-400">Target: {waterData.targetMl || 3000} ml / day</p>
              </div>
            </div>
            <span className="text-xl font-black text-blue-400">{waterData.amountMl} <span className="text-xs text-slate-400 font-normal">ml</span></span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (waterData.amountMl / (waterData.targetMl || 3000)) * 100)}%` }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAddWater(-250)}
              disabled={waterData.amountMl <= 0}
              className="px-3 py-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-semibold text-rose-400 flex items-center justify-center space-x-1 transition-all"
              title="Subtract 250 ml if you added too much"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>-250 ml</span>
            </button>
            <button
              onClick={() => handleAddWater(250)}
              className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-center space-x-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+250 ml (Glass)</span>
            </button>
            <button
              onClick={() => handleAddWater(500)}
              className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-center space-x-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+500 ml (Bottle)</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. TODAY'S MEALS & WORKOUT QUICK GLANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Meals Logged */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">Today's Meals Logged ({mealsData?.meals?.length || 0})</h3>
            </div>
            <button
              onClick={onNavigateToDiet}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Open Diet Tracker &rarr;
            </button>
          </div>

          {mealsData?.meals && mealsData.meals.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {mealsData.meals.map((meal) => (
                <div key={meal.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {meal.mealType}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{meal.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {meal.foods?.map(f => `${f.quantity} ${f.name}`).join(' • ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-white">{meal.totalCalories} kcal</div>
                    <div className="text-[10px] text-sky-400 font-semibold">{meal.totalProtein}g protein</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
              <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No meals logged yet for {selectedDate}.</p>
              <button
                onClick={onNavigateToDiet}
                className="mt-3 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all"
              >
                Log Breakfast / Lunch Now
              </button>
            </div>
          )}
        </div>

        {/* Workouts Logged */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">Workout Plan & Logging</h3>
            </div>
            <button
              onClick={onNavigateToWorkouts}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Analyze Split with AI &rarr;
            </button>
          </div>

          {workouts && workouts.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {workouts.map((w) => (
                <div key={w.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200">{w.title}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {w.splitType} • {w.durationMin} mins • {w.exercises?.length || 0} exercises
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">+{w.caloriesBurned} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No workout session logged for this day.</p>
              <button
                onClick={onNavigateToWorkouts}
                className="mt-3 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all"
              >
                Log Workout & Analyze Split
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
