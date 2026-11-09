import React, { useState, useEffect } from 'react';
import { Sparkles, User, Target, Flame, Heart, Scale, Activity, ArrowRight, Check } from 'lucide-react';
import { api } from '../api';

export default function OnboardingModal({ isOpen, onClose, currentProfile, onProfileSaved }) {
  const [formData, setFormData] = useState({
    name: currentProfile?.name || '',
    age: currentProfile?.age || 24,
    gender: currentProfile?.gender || 'male',
    heightCm: currentProfile?.heightCm || 175,
    weightKg: currentProfile?.weightKg || 70,
    goals: Array.isArray(currentProfile?.goals) && currentProfile.goals.length > 0
      ? currentProfile.goals
      : (currentProfile?.goal ? [currentProfile.goal] : ['cutting']),
    goal: currentProfile?.goal || 'cutting',
    activityLevel: currentProfile?.activityLevel || 'moderately_active',
    dietaryTags: currentProfile?.dietaryTags || ['🍗 Non-Veg'],
    focusAreas: currentProfile?.focusAreas || ['🛡️ Full Body Balance'],
    dailyTargetCalories: currentProfile?.dailyTargetCalories || 2100,
    dailyTargetProtein: currentProfile?.dailyTargetProtein || 140,
    dailyTargetCarbs: currentProfile?.dailyTargetCarbs || 220,
    dailyTargetFat: currentProfile?.dailyTargetFat || 60,
    dailyTargetWater: currentProfile?.dailyTargetWater || 3000,
    dailyTargetSteps: currentProfile?.dailyTargetSteps || 10000,
  });

  const [liveTargets, setLiveTargets] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Bio info, 2: Goal & Activity, 3: Review Calculated Macros

  // Toggle multi-select goals
  const toggleGoal = (goalId) => {
    const currentGoals = Array.isArray(formData.goals) ? formData.goals : [formData.goal || 'cutting'];
    let updated;
    if (currentGoals.includes(goalId)) {
      if (currentGoals.length > 1) {
        updated = currentGoals.filter(id => id !== goalId);
      } else {
        updated = currentGoals; // Keep at least 1 goal selected
      }
    } else {
      updated = [...currentGoals, goalId];
    }
    setFormData(prev => ({
      ...prev,
      goals: updated,
      goal: updated[0]
    }));
  };

  // Recalculate targets whenever bio stats or goals change
  useEffect(() => {
    async function calc() {
      try {
        const res = await api.calculateTargets(formData);
        if (res.success) {
          setLiveTargets(res.targets);
          // Auto update targets in formData
          setFormData(prev => ({
            ...prev,
            dailyTargetCalories: res.targets.dailyTargetCalories,
            dailyTargetProtein: res.targets.dailyTargetProtein,
            dailyTargetCarbs: res.targets.dailyTargetCarbs,
            dailyTargetFat: res.targets.dailyTargetFat,
            dailyTargetWater: res.targets.dailyTargetWater,
            dailyTargetSteps: res.targets.dailyTargetSteps,
          }));
        }
      } catch (err) {
        console.error('Calculation error:', err);
      }
    }
    calc();
  }, [
    formData.age, 
    formData.gender, 
    formData.heightCm, 
    formData.weightKg, 
    JSON.stringify(formData.goals), 
    formData.goal, 
    formData.activityLevel
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter your name');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.updateProfile({
        ...formData,
        isConfigured: true
      }, false); // Already calculated
      if (res.success) {
        onProfileSaved(res.profile);
        onClose();
      }
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Personalized Fitness Setup</h2>
              <p className="text-emerald-100 text-xs">AI-Engineered Nutrition & Workout Calibration</p>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-white' : 'bg-white/20'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-white' : 'bg-white/20'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-white' : 'bg-white/20'}`} />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* STEP 1: Body Metrics */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Tell us about yourself</h3>
                <p className="text-xs text-slate-400">Used to accurately calculate your Basal Metabolic Rate (BMR)</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Gokul"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Gender</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`py-2 text-xs font-semibold rounded-xl capitalize transition-all border ${
                          formData.gender === g
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Age (Years)</label>
                  <input
                    type="number"
                    min="14"
                    max="90"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="175"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="35"
                    max="200"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="70"
                  />
                </div>
              </div>

              {liveTargets && (
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Calculated BMR (Basal Burn):</span>
                  </div>
                  <span className="font-bold text-slate-200">{liveTargets.bmr} kcal/day</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Goal & Activity (Multiple Expanded Options) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-slate-100">Your Goal & Lifestyle Calibration</h3>
                <p className="text-xs text-slate-400">Choose your exact target to calculate your caloric deficit or surplus and macro split</p>
              </div>

              {/* 1. Primary Fitness Objective (Multi-Select Enabled) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Primary Fitness Objectives</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Multi-Select Enabled ({(formData.goals || [formData.goal]).length} Selected)
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {[
                    { id: 'cutting', label: '🔥 Fat Loss (Steady Cut)', desc: 'Clean -400 kcal deficit with high protein to protect lean muscle', tag: '-400 kcal' },
                    { id: 'rapid_cut', label: '⚡ Rapid Shred (Fast Fat Drop)', desc: 'Aggressive -650 kcal deficit with peak protein for fast results', tag: '-650 kcal' },
                    { id: 'recomp', label: '⚖️ Body Recomposition', desc: 'Burn stubborn fat & build dense muscle at near maintenance', tag: '-100 kcal' },
                    { id: 'lean_bulk', label: '💪 Muscle Gain (Lean Bulk)', desc: 'Controlled +250 kcal surplus to build muscle with minimal fat gain', tag: '+250 kcal' },
                    { id: 'power_bulk', label: '🦍 Power Bulk (Max Mass)', desc: 'Heavy +500 kcal surplus for maximum hypertrophy & strength', tag: '+500 kcal' },
                    { id: 'endurance', label: '🏃 Athletic Stamina & Speed', desc: 'High muscular glycogen fueling for runners, football, sports', tag: 'High Carb' },
                    { id: 'maintenance', label: '🛡️ Weight Maintenance & Reset', desc: 'Lock in weight, stabilize hormones, and restore energy levels', tag: 'Equilibrium' },
                    { id: 'metabolic_health', label: '🩺 Blood Sugar & PCOS / Low-GI', desc: 'Insulin-stabilizing carbs, high fiber & anti-inflammatory balance', tag: 'Low GI' }
                  ].map((g) => {
                    const isSelected = (formData.goals || [formData.goal]).includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-slate-100 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-xs text-slate-200 flex items-center space-x-1.5">
                            <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black transition-colors ${
                              isSelected ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-900 text-transparent'
                            }`}>
                              ✓
                            </span>
                            <span>{g.label}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {g.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight pl-5">{g.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Weekly Activity Level (6 Granular Lifestyle Options) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Weekly Activity & Lifestyle Level</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">6 Lifestyle Tiers</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'sedentary', label: '🛋️ Sedentary', sub: 'Desk job, < 5k steps' },
                    { id: 'lightly_active', label: '🚶 Lightly Active', sub: '1-2 gym days / ~7.5k steps' },
                    { id: 'moderately_active', label: '🏃 Moderately Active', sub: '3-4 workouts / ~10k steps' },
                    { id: 'active_lifter', label: '🏋️ Dedicated Lifter', sub: '5-6 gym days / ~11.5k steps' },
                    { id: 'very_active', label: '⚡ Heavy Physical Job', sub: 'High daily strain / ~13.5k steps' },
                    { id: 'athlete_double', label: '🏆 Pro / 2x Daily', sub: 'Competitive athlete / 16k+ steps' }
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, activityLevel: act.id })}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        formData.activityLevel === act.id
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{act.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{act.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Multi-Select Dietary Lifestyle Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Dietary Preference Tags</span>
                  <span className="text-[10px] text-slate-500">Select all that apply</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '🍗 Non-Veg', 
                    '🥗 Pure Veg', 
                    '🥚 Eggetarian', 
                    '🥛 High-Protein Lacto-Veg', 
                    '🌾 High Fiber / Low GI', 
                    '⏰ Intermittent Fasting (16:8)'
                  ].map((tag) => {
                    const isSelected = formData.dietaryTags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.dietaryTags || [];
                          const updated = isSelected 
                            ? current.filter(t => t !== tag)
                            : [...current, tag];
                          setFormData({ ...formData, dietaryTags: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? `✓ ${tag}` : tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Target Focus Areas (Multi-select) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Target Muscle Focus Areas</span>
                  <span className="text-[10px] text-slate-500">Personalize AI workout suggestions</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '🛡️ Full Body Balance',
                    '💪 Chest & Arms',
                    '🦵 Glutes & Legs',
                    '⚡ Core & Abs',
                    '🔙 Back & Shoulders Width'
                  ].map((area) => {
                    const isSelected = formData.focusAreas?.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          const current = formData.focusAreas || [];
                          const updated = isSelected 
                            ? current.filter(a => a !== area)
                            : [...current, area];
                          setFormData({ ...formData, focusAreas: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? `✓ ${area}` : area}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Review & Customization */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-slate-100">Your AI-Engineered Plan</h3>
                <p className="text-xs text-slate-400">Scientifically tailored for {formData.name || 'you'}. You can fine-tune below.</p>
              </div>

              {/* Main Calorie Banner */}
              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl text-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Recommended Daily Target</span>
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <Flame className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl font-extrabold text-white">{formData.dailyTargetCalories}</span>
                  <span className="text-slate-400 text-sm">kcal / day</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  TDEE: {liveTargets?.tdee || 2400} kcal • Goals: <span className="capitalize text-emerald-300">{(formData.goals || [formData.goal]).join(', ')}</span>
                </div>
              </div>

              {/* Macro breakdown cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[11px] text-sky-400 font-bold mb-1">PROTEIN</div>
                  <input
                    type="number"
                    value={formData.dailyTargetProtein}
                    onChange={(e) => setFormData({ ...formData, dailyTargetProtein: Number(e.target.value) })}
                    className="w-full text-center text-lg font-extrabold bg-transparent text-white border-b border-slate-800 focus:outline-none focus:border-sky-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">grams ({Math.round((formData.dailyTargetProtein * 4 / formData.dailyTargetCalories) * 100)}%)</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[11px] text-amber-400 font-bold mb-1">CARBS</div>
                  <input
                    type="number"
                    value={formData.dailyTargetCarbs}
                    onChange={(e) => setFormData({ ...formData, dailyTargetCarbs: Number(e.target.value) })}
                    className="w-full text-center text-lg font-extrabold bg-transparent text-white border-b border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">grams ({Math.round((formData.dailyTargetCarbs * 4 / formData.dailyTargetCalories) * 100)}%)</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[11px] text-rose-400 font-bold mb-1">FATS</div>
                  <input
                    type="number"
                    value={formData.dailyTargetFat}
                    onChange={(e) => setFormData({ ...formData, dailyTargetFat: Number(e.target.value) })}
                    className="w-full text-center text-lg font-extrabold bg-transparent text-white border-b border-slate-800 focus:outline-none focus:border-rose-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">grams ({Math.round((formData.dailyTargetFat * 9 / formData.dailyTargetCalories) * 100)}%)</div>
                </div>
              </div>

              {/* Water & Steps */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Daily Water Target</div>
                    <div className="text-sm font-bold text-blue-400">{formData.dailyTargetWater} ml</div>
                  </div>
                  <div className="text-xs text-slate-500">~{Math.round(formData.dailyTargetWater / 250)} glasses</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Fastrack Step Goal</div>
                    <div className="text-sm font-bold text-emerald-400">{formData.dailyTargetSteps.toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-slate-500">steps/day</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !formData.name.trim()) {
                  alert('Please enter your name');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/25"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Lock In & Start Journey'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
