import React, { useState } from 'react';
import { 
  Activity, 
  RotateCcw, 
  Dumbbell, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Layers, 
  Info,
  Plus
} from 'lucide-react';
import { EXERCISE_DATABASE } from './WorkoutTracker';

export default function AnatomicalMuscleHeatmap({ workouts = [], onAddExerciseToToday }) {
  const [viewAngle, setViewAngle] = useState('front'); // 'front' or 'back'
  const [selectedMuscle, setSelectedMuscle] = useState(null);

  // Analyze past workouts to compute recovery & weekly volume per muscle group
  const muscleStats = {
    chest: { name: 'Chest (Pectorals)', category: 'Chest', sets: 0, lastTrainedDaysAgo: 99 },
    frontDelts: { name: 'Front Shoulders', category: 'Shoulders', sets: 0, lastTrainedDaysAgo: 99 },
    sideDelts: { name: 'Side Shoulders', category: 'Shoulders', sets: 0, lastTrainedDaysAgo: 99 },
    rearDelts: { name: 'Rear Delts', category: 'Shoulders', sets: 0, lastTrainedDaysAgo: 99 },
    biceps: { name: 'Biceps', category: 'Biceps', sets: 0, lastTrainedDaysAgo: 99 },
    triceps: { name: 'Triceps', category: 'Triceps', sets: 0, lastTrainedDaysAgo: 99 },
    traps: { name: 'Traps', category: 'Back & Lats', sets: 0, lastTrainedDaysAgo: 99 },
    lats: { name: 'Lats & Upper Back', category: 'Back & Lats', sets: 0, lastTrainedDaysAgo: 99 },
    lowerBack: { name: 'Lower Back', category: 'Back & Lats', sets: 0, lastTrainedDaysAgo: 99 },
    abs: { name: 'Abs & Core', category: 'Core & Abs', sets: 0, lastTrainedDaysAgo: 99 },
    quads: { name: 'Quads (Thighs)', category: 'Legs (Quads & Hamstrings)', sets: 0, lastTrainedDaysAgo: 99 },
    hamstrings: { name: 'Hamstrings', category: 'Legs (Quads & Hamstrings)', sets: 0, lastTrainedDaysAgo: 99 },
    glutes: { name: 'Glutes', category: 'Glutes & Calves', sets: 0, lastTrainedDaysAgo: 99 },
    calves: { name: 'Calves', category: 'Glutes & Calves', sets: 0, lastTrainedDaysAgo: 99 }
  };

  const todayDate = new Date();

  // Parse workouts list
  (workouts || []).forEach(w => {
    const wDate = new Date(w.date);
    const diffTime = Math.abs(todayDate - wDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const setsCount = (w.sets || []).length || 3;
    const exName = (w.name || w.exerciseName || '').toLowerCase();

    // Mapping heuristics
    const update = (key) => {
      if (muscleStats[key]) {
        muscleStats[key].sets += setsCount;
        if (diffDays < muscleStats[key].lastTrainedDaysAgo) {
          muscleStats[key].lastTrainedDaysAgo = diffDays;
        }
      }
    };

    if (exName.includes('chest') || exName.includes('bench') || exName.includes('fly') || exName.includes('push-up')) update('chest');
    if (exName.includes('overhead') || exName.includes('shoulder') || exName.includes('military') || exName.includes('front raise')) update('frontDelts');
    if (exName.includes('lateral raise') || exName.includes('side raise')) update('sideDelts');
    if (exName.includes('face pull') || exName.includes('rear delt')) update('rearDelts');
    if (exName.includes('curl') || exName.includes('bicep') || exName.includes('chin-up')) update('biceps');
    if (exName.includes('tricep') || exName.includes('pushdown') || exName.includes('dip') || exName.includes('skull crusher')) update('triceps');
    if (exName.includes('shrug')) update('traps');
    if (exName.includes('lat') || exName.includes('pulldown') || exName.includes('row') || exName.includes('pull-up')) update('lats');
    if (exName.includes('deadlift') || exName.includes('hyperextension')) update('lowerBack');
    if (exName.includes('crunch') || exName.includes('plank') || exName.includes('leg raise') || exName.includes('ab')) update('abs');
    if (exName.includes('squat') || exName.includes('leg press') || exName.includes('extension') || exName.includes('lunge')) update('quads');
    if (exName.includes('hamstring') || exName.includes('leg curl') || exName.includes('romanian')) update('hamstrings');
    if (exName.includes('glute') || exName.includes('hip thrust')) update('glutes');
    if (exName.includes('calf') || exName.includes('calves')) update('calves');
  });

  // Color & Status Determiner
  const getMuscleStatus = (key) => {
    const data = muscleStats[key];
    if (!data || data.lastTrainedDaysAgo >= 3) {
      return {
        fill: '#10b981', // Emerald green
        stroke: '#059669',
        glow: 'rgba(16, 185, 129, 0.4)',
        status: 'Fresh & Primed for Growth',
        recoveryPct: 100,
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      };
    }
    if (data.lastTrainedDaysAgo === 2 || data.lastTrainedDaysAgo === 1) {
      return {
        fill: '#f59e0b', // Amber yellow
        stroke: '#d97706',
        glow: 'rgba(245, 158, 11, 0.4)',
        status: 'Recovering & Hypertrophy Phase',
        recoveryPct: 65,
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      };
    }
    return {
      fill: '#ef4444', // Red
      stroke: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.5)',
      status: 'High Fatigue (Trained Recently)',
      recoveryPct: 30,
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    };
  };

  const activeMuscleData = selectedMuscle ? muscleStats[selectedMuscle] : null;
  const activeMuscleStatus = selectedMuscle ? getMuscleStatus(selectedMuscle) : null;
  const recommendedExercises = activeMuscleData?.category ? (EXERCISE_DATABASE[activeMuscleData.category] || []).slice(0, 4) : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Header & Angle Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              3D Anatomical Muscle Heatmap & Fatigue Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Color-coded based on your real workouts over the last 72 hours. Tap any muscle to inspect recovery status.
          </p>
        </div>

        {/* Front / Back Angle Switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => { setViewAngle('front'); setSelectedMuscle('chest'); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewAngle === 'front'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Front View
          </button>
          <button
            onClick={() => { setViewAngle('back'); setSelectedMuscle('lats'); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewAngle === 'back'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Back View
          </button>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-1 text-xs">
        <span className="flex items-center space-x-1.5 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
          <span>Fresh & Ready (100% Recovered)</span>
        </span>
        <span className="flex items-center space-x-1.5 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50" />
          <span>Rebuilding (50%–70%)</span>
        </span>
        <span className="flex items-center space-x-1.5 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
          <span>Heavy Fatigue (&lt; 24h rest)</span>
        </span>
      </div>

      {/* Grid: Interactive Human Anatomy Vector Canvas & Detailed Inspector Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* LEFT / CENTER: INTERACTIVE ANATOMICAL VECTOR CANVAS (7 COLS) */}
        <div className="md:col-span-7 flex justify-center py-4 bg-slate-950/60 border border-slate-800/80 rounded-3xl relative">
          
          <svg width="280" height="420" viewBox="0 0 280 420" className="overflow-visible select-none">
            
            {/* HEAD & NECK */}
            <circle cx="140" cy="45" r="24" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            
            {viewAngle === 'front' ? (
              /* === FRONT ANATOMY VIEW === */
              <g className="cursor-pointer transition-all">
                {/* CHEST (PECTORALS) */}
                <path
                  d="M 108 85 C 120 85 138 90 140 102 C 142 90 160 85 172 85 C 182 105 175 130 140 135 C 105 130 98 105 108 85 Z"
                  fill={getMuscleStatus('chest').fill}
                  stroke={selectedMuscle === 'chest' ? '#38bdf8' : getMuscleStatus('chest').stroke}
                  strokeWidth={selectedMuscle === 'chest' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('chest')}
                  className="transition-all hover:opacity-80"
                  filter={selectedMuscle === 'chest' ? 'drop-shadow(0 0 8px #38bdf8)' : undefined}
                />

                {/* FRONT DELTOIDS (SHOULDERS) */}
                <ellipse
                  cx="90" cy="95" rx="14" ry="18"
                  fill={getMuscleStatus('frontDelts').fill}
                  stroke={selectedMuscle === 'frontDelts' ? '#38bdf8' : getMuscleStatus('frontDelts').stroke}
                  strokeWidth={selectedMuscle === 'frontDelts' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('frontDelts')}
                  className="transition-all hover:opacity-80"
                />
                <ellipse
                  cx="190" cy="95" rx="14" ry="18"
                  fill={getMuscleStatus('frontDelts').fill}
                  stroke={selectedMuscle === 'frontDelts' ? '#38bdf8' : getMuscleStatus('frontDelts').stroke}
                  strokeWidth={selectedMuscle === 'frontDelts' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('frontDelts')}
                  className="transition-all hover:opacity-80"
                />

                {/* BICEPS */}
                <ellipse
                  cx="76" cy="135" rx="11" ry="20"
                  fill={getMuscleStatus('biceps').fill}
                  stroke={selectedMuscle === 'biceps' ? '#38bdf8' : getMuscleStatus('biceps').stroke}
                  strokeWidth={selectedMuscle === 'biceps' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('biceps')}
                  className="transition-all hover:opacity-80"
                />
                <ellipse
                  cx="204" cy="135" rx="11" ry="20"
                  fill={getMuscleStatus('biceps').fill}
                  stroke={selectedMuscle === 'biceps' ? '#38bdf8' : getMuscleStatus('biceps').stroke}
                  strokeWidth={selectedMuscle === 'biceps' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('biceps')}
                  className="transition-all hover:opacity-80"
                />

                {/* FOREARMS */}
                <path d="M 68 160 L 62 205 L 75 205 L 82 160 Z" fill="#1e293b" stroke="#334155" />
                <path d="M 212 160 L 218 205 L 205 205 L 198 160 Z" fill="#1e293b" stroke="#334155" />

                {/* ABS / CORE */}
                <path
                  d="M 120 140 L 160 140 L 155 205 L 125 205 Z"
                  fill={getMuscleStatus('abs').fill}
                  stroke={selectedMuscle === 'abs' ? '#38bdf8' : getMuscleStatus('abs').stroke}
                  strokeWidth={selectedMuscle === 'abs' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('abs')}
                  className="transition-all hover:opacity-80"
                />

                {/* QUADS (THIGHS) */}
                <path
                  d="M 112 215 C 110 240 105 295 116 315 C 126 315 135 285 136 215 Z"
                  fill={getMuscleStatus('quads').fill}
                  stroke={selectedMuscle === 'quads' ? '#38bdf8' : getMuscleStatus('quads').stroke}
                  strokeWidth={selectedMuscle === 'quads' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('quads')}
                  className="transition-all hover:opacity-80"
                />
                <path
                  d="M 168 215 C 170 240 175 295 164 315 C 154 315 145 285 144 215 Z"
                  fill={getMuscleStatus('quads').fill}
                  stroke={selectedMuscle === 'quads' ? '#38bdf8' : getMuscleStatus('quads').stroke}
                  strokeWidth={selectedMuscle === 'quads' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('quads')}
                  className="transition-all hover:opacity-80"
                />

                {/* CALVES (FRONT VIEW) */}
                <path
                  d="M 112 330 C 108 360 114 395 120 405 C 126 395 128 360 124 330 Z"
                  fill={getMuscleStatus('calves').fill}
                  stroke={selectedMuscle === 'calves' ? '#38bdf8' : getMuscleStatus('calves').stroke}
                  strokeWidth={selectedMuscle === 'calves' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('calves')}
                  className="transition-all hover:opacity-80"
                />
                <path
                  d="M 168 330 C 172 360 166 395 160 405 C 154 395 152 360 156 330 Z"
                  fill={getMuscleStatus('calves').fill}
                  stroke={selectedMuscle === 'calves' ? '#38bdf8' : getMuscleStatus('calves').stroke}
                  strokeWidth={selectedMuscle === 'calves' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('calves')}
                  className="transition-all hover:opacity-80"
                />
              </g>
            ) : (
              /* === BACK ANATOMY VIEW === */
              <g className="cursor-pointer transition-all">
                {/* TRAPS */}
                <path
                  d="M 125 70 L 140 85 L 155 70 L 165 95 L 140 115 L 115 95 Z"
                  fill={getMuscleStatus('traps').fill}
                  stroke={selectedMuscle === 'traps' ? '#38bdf8' : getMuscleStatus('traps').stroke}
                  strokeWidth={selectedMuscle === 'traps' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('traps')}
                  className="transition-all hover:opacity-80"
                />

                {/* LATS & UPPER BACK */}
                <path
                  d="M 110 95 L 140 115 L 170 95 L 178 135 L 148 165 L 132 165 L 102 135 Z"
                  fill={getMuscleStatus('lats').fill}
                  stroke={selectedMuscle === 'lats' ? '#38bdf8' : getMuscleStatus('lats').stroke}
                  strokeWidth={selectedMuscle === 'lats' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('lats')}
                  className="transition-all hover:opacity-80"
                />

                {/* TRICEPS */}
                <ellipse
                  cx="76" cy="135" rx="10" ry="20"
                  fill={getMuscleStatus('triceps').fill}
                  stroke={selectedMuscle === 'triceps' ? '#38bdf8' : getMuscleStatus('triceps').stroke}
                  strokeWidth={selectedMuscle === 'triceps' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('triceps')}
                  className="transition-all hover:opacity-80"
                />
                <ellipse
                  cx="204" cy="135" rx="10" ry="20"
                  fill={getMuscleStatus('triceps').fill}
                  stroke={selectedMuscle === 'triceps' ? '#38bdf8' : getMuscleStatus('triceps').stroke}
                  strokeWidth={selectedMuscle === 'triceps' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('triceps')}
                  className="transition-all hover:opacity-80"
                />

                {/* LOWER BACK */}
                <path
                  d="M 126 170 L 154 170 L 158 200 L 122 200 Z"
                  fill={getMuscleStatus('lowerBack').fill}
                  stroke={selectedMuscle === 'lowerBack' ? '#38bdf8' : getMuscleStatus('lowerBack').stroke}
                  strokeWidth={selectedMuscle === 'lowerBack' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('lowerBack')}
                  className="transition-all hover:opacity-80"
                />

                {/* GLUTES */}
                <path
                  d="M 112 205 C 110 240 138 245 139 215 C 140 245 168 240 168 205 Z"
                  fill={getMuscleStatus('glutes').fill}
                  stroke={selectedMuscle === 'glutes' ? '#38bdf8' : getMuscleStatus('glutes').stroke}
                  strokeWidth={selectedMuscle === 'glutes' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('glutes')}
                  className="transition-all hover:opacity-80"
                />

                {/* HAMSTRINGS */}
                <path
                  d="M 112 245 C 110 270 108 300 118 315 C 126 315 134 290 136 245 Z"
                  fill={getMuscleStatus('hamstrings').fill}
                  stroke={selectedMuscle === 'hamstrings' ? '#38bdf8' : getMuscleStatus('hamstrings').stroke}
                  strokeWidth={selectedMuscle === 'hamstrings' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('hamstrings')}
                  className="transition-all hover:opacity-80"
                />
                <path
                  d="M 168 245 C 170 270 172 300 162 315 C 154 315 146 290 144 245 Z"
                  fill={getMuscleStatus('hamstrings').fill}
                  stroke={selectedMuscle === 'hamstrings' ? '#38bdf8' : getMuscleStatus('hamstrings').stroke}
                  strokeWidth={selectedMuscle === 'hamstrings' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('hamstrings')}
                  className="transition-all hover:opacity-80"
                />

                {/* CALVES (BACK VIEW) */}
                <path
                  d="M 110 330 C 104 360 112 395 118 405 C 124 395 126 360 122 330 Z"
                  fill={getMuscleStatus('calves').fill}
                  stroke={selectedMuscle === 'calves' ? '#38bdf8' : getMuscleStatus('calves').stroke}
                  strokeWidth={selectedMuscle === 'calves' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('calves')}
                  className="transition-all hover:opacity-80"
                />
                <path
                  d="M 170 330 C 176 360 168 395 162 405 C 156 395 154 360 158 330 Z"
                  fill={getMuscleStatus('calves').fill}
                  stroke={selectedMuscle === 'calves' ? '#38bdf8' : getMuscleStatus('calves').stroke}
                  strokeWidth={selectedMuscle === 'calves' ? '3' : '1.5'}
                  onClick={() => setSelectedMuscle('calves')}
                  className="transition-all hover:opacity-80"
                />
              </g>
            )}
          </svg>
        </div>

        {/* RIGHT: DETAILED MUSCLE RECOVERY INSPECTOR (5 COLS) */}
        <div className="md:col-span-5 space-y-4">
          {activeMuscleData ? (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${activeMuscleStatus?.badge}`}>
                  {activeMuscleStatus?.status}
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  {activeMuscleData.name}
                </h3>
              </div>

              {/* Recovery Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Recovery State</span>
                  <span className="text-cyan-300">{activeMuscleStatus?.recoveryPct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeMuscleStatus?.recoveryPct}%`, backgroundColor: activeMuscleStatus?.fill }}
                  />
                </div>
              </div>

              {/* Weekly Volume & Last Trained */}
              <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-800/80">
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Sets This Week</span>
                  <div className="text-base font-black text-white">{activeMuscleData.sets} sets</div>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Last Trained</span>
                  <div className="text-base font-black text-white">
                    {activeMuscleData.lastTrainedDaysAgo === 0 
                      ? 'Today' 
                      : activeMuscleData.lastTrainedDaysAgo === 1 
                        ? 'Yesterday' 
                        : activeMuscleData.lastTrainedDaysAgo < 10 
                          ? `${activeMuscleData.lastTrainedDaysAgo} days ago` 
                          : 'Fully Rested'}
                  </div>
                </div>
              </div>

              {/* Recommended Exercises to Add */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Exercises for {activeMuscleData.name}:</span>
                </span>

                <div className="space-y-1.5">
                  {recommendedExercises.map(ex => (
                    <div 
                      key={ex.name} 
                      className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block">{ex.name}</span>
                        <span className="text-[10px] text-slate-500">{ex.sets} sets × {ex.reps} reps ({ex.equipment})</span>
                      </div>
                      {onAddExerciseToToday && (
                        <button
                          onClick={() => onAddExerciseToToday(ex)}
                          className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          title="Add to today's workout"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-3xl space-y-2 text-slate-400">
              <Info className="w-8 h-8 text-cyan-400 mx-auto" />
              <p className="text-xs font-semibold">Tap any muscle on the anatomy figure to inspect recovery and recommended sets.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
