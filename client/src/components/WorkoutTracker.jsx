import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Flame, 
  Clock,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../api';

// Comprehensive Gym Exercise Variations Database (Zero Manual Typing)
export const EXERCISE_DATABASE = {
  'Chest': [
    { name: 'Barbell Flat Bench Press', sets: 3, reps: 8, weight: 60, equipment: 'Barbell' },
    { name: 'Incline Barbell Bench Press', sets: 3, reps: 10, weight: 50, equipment: 'Barbell' },
    { name: 'Flat Dumbbell Bench Press', sets: 3, reps: 10, weight: 22, equipment: 'Dumbbells' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 20, equipment: 'Dumbbells' },
    { name: 'Decline Dumbbell Bench Press', sets: 3, reps: 12, weight: 18, equipment: 'Dumbbells' },
    { name: 'Cable Chest Flyes (High-to-Low)', sets: 4, reps: 15, weight: 12, equipment: 'Cable' },
    { name: 'Cable Chest Flyes (Low-to-High)', sets: 3, reps: 15, weight: 10, equipment: 'Cable' },
    { name: 'Pec Deck Machine Fly', sets: 3, reps: 12, weight: 45, equipment: 'Machine' },
    { name: 'Chest Dips (Parallel Bars)', sets: 3, reps: 10, weight: 0, equipment: 'Bodyweight' },
    { name: 'Standard Push-ups', sets: 3, reps: 15, weight: 0, equipment: 'Bodyweight' },
    { name: 'Dumbbell Pullover', sets: 3, reps: 12, weight: 20, equipment: 'Dumbbell' }
  ],
  'Back & Lats': [
    { name: 'Conventional Barbell Deadlift', sets: 3, reps: 5, weight: 90, equipment: 'Barbell' },
    { name: 'Wide-Grip Lat Pulldown', sets: 4, reps: 10, weight: 55, equipment: 'Cable' },
    { name: 'Close-Grip / V-Bar Lat Pulldown', sets: 3, reps: 12, weight: 50, equipment: 'Cable' },
    { name: 'Barbell Bent-Over Row', sets: 4, reps: 8, weight: 50, equipment: 'Barbell' },
    { name: 'Single-Arm Dumbbell Row', sets: 3, reps: 10, weight: 24, equipment: 'Dumbbell' },
    { name: 'Seated Cable Row', sets: 3, reps: 12, weight: 50, equipment: 'Cable' },
    { name: 'T-Bar Row', sets: 3, reps: 10, weight: 45, equipment: 'Barbell' },
    { name: 'Pull-ups / Chin-ups', sets: 4, reps: 8, weight: 0, equipment: 'Bodyweight' },
    { name: 'Chest-Supported Machine Row', sets: 3, reps: 12, weight: 40, equipment: 'Machine' },
    { name: 'Straight-Arm Cable Pulldown', sets: 3, reps: 15, weight: 20, equipment: 'Cable' }
  ],
  'Shoulders & Traps': [
    { name: 'Standing Overhead Barbell Press (OHP)', sets: 4, reps: 8, weight: 40, equipment: 'Barbell' },
    { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: 10, weight: 18, equipment: 'Dumbbells' },
    { name: 'Dumbbell Lateral Raises', sets: 4, reps: 15, weight: 8, equipment: 'Dumbbells' },
    { name: 'Cable Lateral Raises', sets: 4, reps: 15, weight: 6, equipment: 'Cable' },
    { name: 'Face Pulls (Rope Cable)', sets: 4, reps: 15, weight: 20, equipment: 'Cable' },
    { name: 'Reverse Pec Deck (Rear Delt Fly)', sets: 4, reps: 15, weight: 35, equipment: 'Machine' },
    { name: 'Bent-Over Dumbbell Rear Delt Fly', sets: 3, reps: 15, weight: 8, equipment: 'Dumbbells' },
    { name: 'Barbell / Dumbbell Shrugs', sets: 3, reps: 12, weight: 50, equipment: 'Barbell' }
  ],
  'Arms - Biceps': [
    { name: 'Barbell Bicep Curl', sets: 3, reps: 10, weight: 25, equipment: 'Barbell' },
    { name: 'Incline Dumbbell Bicep Curl', sets: 3, reps: 10, weight: 12, equipment: 'Dumbbells' },
    { name: 'Dumbbell Hammer Curls', sets: 3, reps: 12, weight: 14, equipment: 'Dumbbells' },
    { name: 'EZ-Bar Preacher Curls', sets: 3, reps: 10, weight: 22, equipment: 'Barbell' },
    { name: 'Cable Rope Bicep Curls', sets: 3, reps: 12, weight: 20, equipment: 'Cable' },
    { name: 'Concentration Curls', sets: 3, reps: 12, weight: 10, equipment: 'Dumbbell' }
  ],
  'Arms - Triceps': [
    { name: 'Tricep Cable Rope Pushdown', sets: 3, reps: 12, weight: 22, equipment: 'Cable' },
    { name: 'Tricep Straight-Bar Pushdown', sets: 3, reps: 12, weight: 25, equipment: 'Cable' },
    { name: 'Skull Crushers (Lying EZ-Bar Extension)', sets: 3, reps: 10, weight: 22, equipment: 'Barbell' },
    { name: 'Overhead Cable Tricep Extension', sets: 3, reps: 12, weight: 18, equipment: 'Cable' },
    { name: 'Overhead Dumbbell Tricep Extension', sets: 3, reps: 12, weight: 16, equipment: 'Dumbbell' },
    { name: 'Close-Grip Barbell Bench Press', sets: 3, reps: 10, weight: 45, equipment: 'Barbell' },
    { name: 'Weighted Tricep Dips', sets: 3, reps: 10, weight: 0, equipment: 'Bodyweight' }
  ],
  'Legs - Quads': [
    { name: 'Barbell Back Squat', sets: 4, reps: 8, weight: 75, equipment: 'Barbell' },
    { name: 'Barbell Front Squat', sets: 3, reps: 8, weight: 55, equipment: 'Barbell' },
    { name: 'Leg Press (45-Degree Sled)', sets: 3, reps: 12, weight: 120, equipment: 'Machine' },
    { name: 'Bulgarian Split Squats (Dumbbell)', sets: 3, reps: 10, weight: 14, equipment: 'Dumbbells' },
    { name: 'Leg Extension Machine', sets: 3, reps: 15, weight: 40, equipment: 'Machine' },
    { name: 'Hack Squat Machine', sets: 3, reps: 10, weight: 70, equipment: 'Machine' },
    { name: 'Goblet Squats (Kettlebell / DB)', sets: 3, reps: 12, weight: 20, equipment: 'Dumbbell' },
    { name: 'Walking Dumbbell Lunges', sets: 3, reps: 12, weight: 12, equipment: 'Dumbbells' }
  ],
  'Legs - Hamstrings & Glutes': [
    { name: 'Romanian Deadlift (RDL - Barbell)', sets: 4, reps: 8, weight: 65, equipment: 'Barbell' },
    { name: 'Romanian Deadlift (RDL - Dumbbell)', sets: 3, reps: 10, weight: 20, equipment: 'Dumbbells' },
    { name: 'Lying Hamstring Leg Curl', sets: 4, reps: 12, weight: 35, equipment: 'Machine' },
    { name: 'Seated Hamstring Leg Curl', sets: 3, reps: 12, weight: 40, equipment: 'Machine' },
    { name: 'Barbell Hip Thrust', sets: 4, reps: 10, weight: 80, equipment: 'Barbell' },
    { name: 'Glute Cable Kickbacks', sets: 3, reps: 15, weight: 10, equipment: 'Cable' }
  ],
  'Calves & Core (Abs)': [
    { name: 'Standing Calf Raises', sets: 4, reps: 15, weight: 45, equipment: 'Machine' },
    { name: 'Seated Calf Raises', sets: 4, reps: 15, weight: 35, equipment: 'Machine' },
    { name: 'Hanging Knee / Leg Raises', sets: 3, reps: 15, weight: 0, equipment: 'Bodyweight' },
    { name: 'Cable Woodchoppers (Obliques)', sets: 3, reps: 15, weight: 15, equipment: 'Cable' },
    { name: 'Ab Wheel Rollout', sets: 3, reps: 12, weight: 0, equipment: 'Bodyweight' },
    { name: 'Plank (Timed)', sets: 3, reps: 60, weight: 0, equipment: 'Bodyweight' }
  ],
  'Cardio & Conditioning': [
    { name: 'Incline Treadmill Walk (12-3-30)', sets: 1, reps: 30, weight: 0, equipment: 'Cardio' },
    { name: 'Stationary Cycling (HIIT Intervals)', sets: 5, reps: 1, weight: 0, equipment: 'Cardio' },
    { name: 'Rowing Machine (Concept2)', sets: 3, reps: 500, weight: 0, equipment: 'Cardio' },
    { name: 'Stairmaster / StepMill', sets: 1, reps: 20, weight: 0, equipment: 'Cardio' },
    { name: 'Jump Rope Conditioning', sets: 4, reps: 100, weight: 0, equipment: 'Cardio' }
  ]
};

// Quick-Load Session Templates
export const WORKOUT_SESSION_PRESETS = [
  {
    title: 'Push Day (Chest, Shoulders, Triceps)',
    splitType: 'Push',
    durationMin: 55,
    estimatedBurn: 380,
    exercises: [
      { name: 'Barbell Flat Bench Press', sets: [{ reps: 8, weight: 60, done: false }, { reps: 8, weight: 60, done: false }, { reps: 8, weight: 60, done: false }] },
      { name: 'Incline Dumbbell Press', sets: [{ reps: 10, weight: 20, done: false }, { reps: 10, weight: 20, done: false }, { reps: 10, weight: 20, done: false }] },
      { name: 'Dumbbell Lateral Raises', sets: [{ reps: 15, weight: 8, done: false }, { reps: 15, weight: 8, done: false }, { reps: 15, weight: 8, done: false }] },
      { name: 'Tricep Cable Rope Pushdown', sets: [{ reps: 12, weight: 22, done: false }, { reps: 12, weight: 22, done: false }, { reps: 12, weight: 22, done: false }] },
      { name: 'Cable Chest Flyes (High-to-Low)', sets: [{ reps: 15, weight: 12, done: false }, { reps: 15, weight: 12, done: false }, { reps: 15, weight: 12, done: false }] }
    ]
  },
  {
    title: 'Pull Day (Back, Rear Delts, Biceps)',
    splitType: 'Pull',
    durationMin: 55,
    estimatedBurn: 390,
    exercises: [
      { name: 'Conventional Barbell Deadlift', sets: [{ reps: 5, weight: 90, done: false }, { reps: 5, weight: 90, done: false }, { reps: 5, weight: 90, done: false }] },
      { name: 'Wide-Grip Lat Pulldown', sets: [{ reps: 10, weight: 55, done: false }, { reps: 10, weight: 55, done: false }, { reps: 10, weight: 55, done: false }] },
      { name: 'Seated Cable Row', sets: [{ reps: 12, weight: 50, done: false }, { reps: 12, weight: 50, done: false }, { reps: 12, weight: 50, done: false }] },
      { name: 'Face Pulls (Rope Cable)', sets: [{ reps: 15, weight: 20, done: false }, { reps: 15, weight: 20, done: false }, { reps: 15, weight: 20, done: false }] },
      { name: 'Incline Dumbbell Bicep Curl', sets: [{ reps: 10, weight: 12, done: false }, { reps: 10, weight: 12, done: false }, { reps: 10, weight: 12, done: false }] }
    ]
  },
  {
    title: 'Legs Day (Quads, Hamstrings, Calves)',
    splitType: 'Legs',
    durationMin: 60,
    estimatedBurn: 440,
    exercises: [
      { name: 'Barbell Back Squat', sets: [{ reps: 8, weight: 75, done: false }, { reps: 8, weight: 75, done: false }, { reps: 8, weight: 75, done: false }] },
      { name: 'Romanian Deadlift (RDL - Barbell)', sets: [{ reps: 8, weight: 65, done: false }, { reps: 8, weight: 65, done: false }, { reps: 8, weight: 65, done: false }] },
      { name: 'Leg Press (45-Degree Sled)', sets: [{ reps: 12, weight: 120, done: false }, { reps: 12, weight: 120, done: false }, { reps: 12, weight: 120, done: false }] },
      { name: 'Lying Hamstring Leg Curl', sets: [{ reps: 12, weight: 35, done: false }, { reps: 12, weight: 35, done: false }, { reps: 12, weight: 35, done: false }] },
      { name: 'Standing Calf Raises', sets: [{ reps: 15, weight: 45, done: false }, { reps: 15, weight: 45, done: false }, { reps: 15, weight: 45, done: false }] }
    ]
  },
  {
    title: 'Upper Body Power',
    splitType: 'Upper',
    durationMin: 50,
    estimatedBurn: 370,
    exercises: [
      { name: 'Barbell Flat Bench Press', sets: [{ reps: 6, weight: 65, done: false }, { reps: 6, weight: 65, done: false }, { reps: 6, weight: 65, done: false }] },
      { name: 'Barbell Bent-Over Row', sets: [{ reps: 6, weight: 55, done: false }, { reps: 6, weight: 55, done: false }, { reps: 6, weight: 55, done: false }] },
      { name: 'Standing Overhead Barbell Press (OHP)', sets: [{ reps: 8, weight: 40, done: false }, { reps: 8, weight: 40, done: false }, { reps: 8, weight: 40, done: false }] },
      { name: 'Pull-ups / Chin-ups', sets: [{ reps: 8, weight: 0, done: false }, { reps: 8, weight: 0, done: false }, { reps: 8, weight: 0, done: false }] }
    ]
  },
  {
    title: 'Lower Body & Core',
    splitType: 'Lower',
    durationMin: 50,
    estimatedBurn: 400,
    exercises: [
      { name: 'Barbell Back Squat', sets: [{ reps: 8, weight: 75, done: false }, { reps: 8, weight: 75, done: false }, { reps: 8, weight: 75, done: false }] },
      { name: 'Bulgarian Split Squats (Dumbbell)', sets: [{ reps: 10, weight: 14, done: false }, { reps: 10, weight: 14, done: false }, { reps: 10, weight: 14, done: false }] },
      { name: 'Hanging Knee / Leg Raises', sets: [{ reps: 15, weight: 0, done: false }, { reps: 15, weight: 0, done: false }, { reps: 15, weight: 0, done: false }] },
      { name: 'Plank (Timed)', sets: [{ reps: 60, weight: 0, done: false }, { reps: 60, weight: 0, done: false }, { reps: 60, weight: 0, done: false }] }
    ]
  }
];

export default function WorkoutTracker({ selectedDate, profile }) {
  const [workouts, setWorkouts] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // View: 'logger' | 'analyzer'
  const [viewMode, setViewMode] = useState('logger');

  // Plan Analyzer state
  const [selectedPreset, setSelectedPreset] = useState('ppl');
  const [customPlanText, setCustomPlanText] = useState(`Day 1 - Push: Barbell Bench Press 4x8, Incline Dumbbell Press 3x10, DB Lateral Raises 4x15, Overhead Tricep Extension 3x12, Cable Flyes 3x15
Day 2 - Pull: Barbell Deadlift 3x5, Lat Pulldown 4x10, Seated Cable Row 3x10, Face Pulls 4x15, Barbell Bicep Curl 3x10
Day 3 - Legs: Barbell Squat 4x8, Romanian Deadlift 3x10, Leg Press 3x12, Standing Calf Raises 4x15, Hanging Leg Raises 3x12
Day 4 - Push: Overhead Press 4x8, Dips 3x10, Incline DB Bench 3x10, Lateral Cable Raises 4x15, Tricep Pushdowns 3x12
Day 5 - Pull: Pull-ups 4x8, Barbell Row 3x8, Incline Dumbbell Curls 3x10, Reverse Pec Deck 4x15
Day 6 - Legs: Bulgarian Split Squats 3x10, Lying Leg Curls 4x12, Leg Extensions 3x15, Seated Calf Raises 4x15
Day 7 - Rest: 8,000 steps active recovery walk & stretching`);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Workout Logger state
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [splitType, setSplitType] = useState('Push');
  const [durationMin, setDurationMin] = useState(45);
  const [estimatedBurn, setEstimatedBurn] = useState(280);
  const [exercises, setExercises] = useState([]);

  // Dropdown Exercise Picker state
  const [selectedCategory, setSelectedCategory] = useState('Chest');
  const [selectedVariation, setSelectedVariation] = useState(EXERCISE_DATABASE['Chest'][0].name);

  // Rest Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  const startTimer = (seconds) => {
    setTimerSeconds(seconds);
    setIsTimerActive(true);
  };

  const loadData = async () => {
    try {
      const [wRes, pRes] = await Promise.all([
        api.getWorkouts(selectedDate),
        api.getWorkoutPlans()
      ]);
      setWorkouts(wRes.workouts || []);
      setSavedPlans(pRes.workoutPlans || []);
    } catch (err) {
      console.error('Error fetching workout data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Handle Preset Split selection for Analyzer
  const handleSelectPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'ppl') {
      setCustomPlanText(`Day 1 - Push: Barbell Bench Press 4x8, Incline Dumbbell Press 3x10, DB Lateral Raises 4x15, Overhead Tricep Extension 3x12, Cable Flyes 3x15
Day 2 - Pull: Barbell Deadlift 3x5, Lat Pulldown 4x10, Seated Cable Row 3x10, Face Pulls 4x15, Barbell Bicep Curl 3x10
Day 3 - Legs: Barbell Squat 4x8, Romanian Deadlift 3x10, Leg Press 3x12, Standing Calf Raises 4x15, Hanging Leg Raises 3x12
Day 4 - Push: Overhead Press 4x8, Dips 3x10, Incline DB Bench 3x10, Lateral Cable Raises 4x15, Tricep Pushdowns 3x12
Day 5 - Pull: Pull-ups 4x8, Barbell Row 3x8, Incline Dumbbell Curls 3x10, Reverse Pec Deck 4x15
Day 6 - Legs: Bulgarian Split Squats 3x10, Lying Leg Curls 4x12, Leg Extensions 3x15, Seated Calf Raises 4x15
Day 7 - Rest: 8,000 steps active recovery walk & stretching`);
    } else if (presetKey === 'upper_lower') {
      setCustomPlanText(`Day 1 - Upper Power: Barbell Bench Press 4x6, Barbell Row 4x6, Overhead Press 3x8, Pull-ups 3x8, Bicep Curls 3x10, Tricep Dips 3x10
Day 2 - Lower Power: Barbell Squat 4x6, Romanian Deadlift 4x8, Leg Press 3x10, Standing Calf Raises 4x12, Ab Rollout 3x12
Day 3 - Rest: Active Recovery Walk 8,000 steps
Day 4 - Upper Hypertrophy: Incline DB Press 3x10, Lat Pulldown 4x12, Cable Lateral Raises 4x15, Cable Row 3x12, Face Pulls 4x15, Hammer Curls 3x12
Day 5 - Lower Hypertrophy: Bulgarian Split Squats 3x10, Lying Leg Curl 4x12, Leg Extensions 3x15, Seated Calf Raises 4x15, Plank 3x60s
Day 6 - Rest: Mobility & Foam Rolling
Day 7 - Rest: Full Recovery`);
    } else if (presetKey === 'full_body') {
      setCustomPlanText(`Day 1 - Full Body A: Barbell Squat 3x8, Barbell Bench Press 3x8, Barbell Row 3x8, DB Lateral Raises 3x12, Hanging Knee Raises 3x15
Day 2 - Rest: Active Walking & Hydration
Day 3 - Full Body B: Deadlift 3x5, Overhead Press 3x8, Lat Pulldown 3x10, Lying Leg Curls 3x12, Tricep Pushdown 3x12
Day 4 - Rest: 8,000 steps
Day 5 - Full Body C: Leg Press 3x10, Incline DB Press 3x10, Cable Row 3x10, Dumbbell Bicep Curls 3x12, Calf Raises 3x15
Day 6 - Rest: Full Recovery
Day 7 - Rest: Mobility & Meal Prep`);
    }
  };

  // Quick-load session template into Logger
  const handleLoadSessionTemplate = (title) => {
    const template = WORKOUT_SESSION_PRESETS.find(p => p.title === title);
    if (!template) return;
    setWorkoutTitle(template.title);
    setSplitType(template.splitType);
    setDurationMin(template.durationMin);
    setEstimatedBurn(template.estimatedBurn);
    setExercises(JSON.parse(JSON.stringify(template.exercises)));
  };

  // Category change in Exercise Picker
  const handleCategoryChange = (newCat) => {
    setSelectedCategory(newCat);
    const variations = EXERCISE_DATABASE[newCat] || [];
    if (variations.length > 0) {
      setSelectedVariation(variations[0].name);
    }
  };

  // Variation change in Exercise Picker
  const handleVariationChange = (varName) => {
    setSelectedVariation(varName);
  };

  // Add exercise from dropdown picker to workout session
  const handleConfirmAddExercise = () => {
    if (!selectedVariation) return;
    const currentList = EXERCISE_DATABASE[selectedCategory] || [];
    const exerciseDef = currentList.find(e => e.name === selectedVariation) || currentList[0];
    const defaultSets = exerciseDef?.sets || 3;
    const defaultReps = exerciseDef?.reps || 10;
    const defaultWeight = exerciseDef?.weight !== undefined ? exerciseDef.weight : 20;

    const newSets = Array.from({ length: defaultSets }, () => ({
      reps: defaultReps,
      weight: defaultWeight,
      done: false
    }));

    setExercises(prev => [
      ...prev,
      {
        name: selectedVariation,
        sets: newSets
      }
    ]);
  };

  const handleDeleteExercise = (exIdx) => {
    setExercises(exercises.filter((_, i) => i !== exIdx));
  };

  const handleAddSet = (exIdx) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1] || { reps: 10, weight: 20, done: false };
    updated[exIdx].sets.push({ reps: lastSet.reps, weight: lastSet.weight, done: false });
    setExercises(updated);
  };

  const handleDeleteSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    if (updated[exIdx].sets.length <= 1) {
      // Remove exercise if no sets remain
      setExercises(updated.filter((_, i) => i !== exIdx));
      return;
    }
    updated[exIdx].sets.splice(setIdx, 1);
    setExercises(updated);
  };

  const handleToggleSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx].done = !updated[exIdx].sets[setIdx].done;
    setExercises(updated);
  };

  // Save Workout Session
  const handleSaveWorkout = async () => {
    const payload = {
      date: selectedDate,
      title: workoutTitle,
      splitType,
      exercises,
      durationMin: Number(durationMin),
      caloriesBurned: Number(estimatedBurn),
      notes: `Logged via AI Workout Tracker on ${selectedDate}`
    };

    try {
      const res = await api.addWorkout(payload);
      if (res.success) {
        alert('Workout logged successfully!');
        loadData();
      }
    } catch (err) {
      alert('Failed to log workout: ' + err.message);
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (!confirm('Delete this workout entry?')) return;
    try {
      await api.deleteWorkout(id);
      loadData();
    } catch (err) {
      alert('Failed to delete workout');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>Biomechanics & Workout Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white">Workout Plan AI & Tracker</h1>
            <p className="text-xs text-slate-400 mt-1">
              AI evaluates muscle balance, recovery, and volume. Log daily sets with rest timer.
            </p>
          </div>

          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('analyzer')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all ${
                viewMode === 'analyzer'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Plan Analyzer</span>
            </button>
            <button
              onClick={() => setViewMode('logger')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all ${
                viewMode === 'logger'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Workout Logger</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: AI WORKOUT PLAN ANALYZER */}
      {viewMode === 'analyzer' && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Critique Your Weekly Workout Split</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a template or paste your trainer's routine to evaluate biomechanics, push/pull ratios, and diet synergy.
                </p>
              </div>

              {/* Split template pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ppl', label: 'Push Pull Legs (6-Day)' },
                  { id: 'upper_lower', label: 'Upper / Lower (4-Day)' },
                  { id: 'full_body', label: 'Full Body (3-Day)' }
                ].map((split) => (
                  <button
                    key={split.id}
                    onClick={() => handleSelectPreset(split.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedPreset === split.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {split.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Plan Textarea */}
            <div className="space-y-3">
              <textarea
                rows="7"
                value={customPlanText}
                onChange={(e) => setCustomPlanText(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                placeholder="Paste your weekly workout routine here..."
              />

              <button
                disabled={isAnalyzing || !customPlanText.trim()}
                onClick={handleAnalyzeWorkoutPlan}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing Biomechanics & Volume...' : 'Analyze Workout Plan with AI'}</span>
              </button>
            </div>
          </div>

          {/* AI ANALYSIS RESULTS DASHBOARD */}
          {analysisResult && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in">
              
              {/* Score Header Banner */}
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
                      {analysisResult.source || 'Gemini Biomechanics AI'}
                    </span>
                    <h3 className="text-xl font-black text-white">{analysisResult.planTitle || 'Weekly Routine Evaluation'}</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl self-start sm:self-auto">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Split Score</div>
                    <div className="text-xs text-emerald-400 font-semibold">Scientific Rating</div>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {analysisResult.overallScore}<span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Muscle Balance & Antagonists */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase">
                    <Activity className="w-4 h-4" />
                    <span>Muscle Balance & Joint Health</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div><strong>Push:Pull Ratio:</strong> <span className="text-slate-400">{analysisResult.muscleBalance?.pushPullRatio}</span></div>
                    <div><strong>Quad:Hamstring Ratio:</strong> <span className="text-slate-400">{analysisResult.muscleBalance?.quadHamstringRatio}</span></div>
                    <div className="text-slate-400 text-[11px] pt-1">{analysisResult.muscleBalance?.notes}</div>
                  </div>
                </div>

                {/* 2. Volume & Recovery */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Volume & Recovery Capacity</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div><strong>Weekly Volume:</strong> <span className="text-slate-400">{analysisResult.volumeAndRecovery?.weeklySetsPerMuscle}</span></div>
                    <div><strong>Rest Days:</strong> <span className="text-slate-400">{analysisResult.volumeAndRecovery?.restDaysAdequacy}</span></div>
                    <div><strong>Overtraining Risk:</strong> <span className="text-emerald-400 font-semibold">{analysisResult.volumeAndRecovery?.overtrainingRisk}</span></div>
                  </div>
                </div>

                {/* 3. Strengths & Weaknesses */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase">
                    <Check className="w-4 h-4" />
                    <span>Key Strengths & Optimizations</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    {analysisResult.strengths?.map((s, i) => (
                      <li key={i}><span className="text-slate-200">{s}</span></li>
                    ))}
                    {analysisResult.weaknesses?.map((w, i) => (
                      <li key={`w-${i}`} className="text-amber-400/90"><span className="text-amber-200">{w}</span></li>
                    ))}
                  </ul>
                </div>

                {/* 4. Diet & Nutritional Synergy */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 uppercase">
                    <Flame className="w-4 h-4" />
                    <span>Diet & Caloric Synergy</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div><strong>Calorie Goal:</strong> <span className="text-slate-400">{analysisResult.nutritionSynergy?.calorieRecommendation}</span></div>
                    <div><strong>Protein Need:</strong> <span className="text-slate-400">{analysisResult.nutritionSynergy?.proteinAdequacy}</span></div>
                    <div className="text-[11px] text-slate-400">{analysisResult.nutritionSynergy?.timingTip}</div>
                  </div>
                </div>

              </div>

              {/* Progressive Overload Action Steps */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase">
                  <TrendingUp className="w-4 h-4" />
                  <span>Progressive Overload Blueprint</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {analysisResult.progressiveOverloadRecommendations?.map((rec, i) => (
                    <div key={i} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">#{i + 1}</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DAILY WORKOUT LOGGER & REST TIMER */}
      {viewMode === 'logger' && (
        <div className="space-y-6">
          
          {/* Rest Timer Floating Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Inter-Set Rest Timer</div>
                <div className="text-[11px] text-slate-400">Keep muscle recovery consistent between heavy sets</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-2xl font-black text-emerald-400 font-mono min-w-16 text-center">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>
              {[30, 60, 90, 120].map((s) => (
                <button
                  key={s}
                  onClick={() => startTimer(s)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
                >
                  {s}s
                </button>
              ))}
              {timerSeconds > 0 && (
                <button
                  onClick={() => { setIsTimerActive(false); setTimerSeconds(0); }}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Workout Logging Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Session Title</label>
                <input
                  type="text"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  placeholder="e.g. Chest & Triceps / Leg Day"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={durationMin}
                  onChange={(e) => {
                    const dur = Number(e.target.value);
                    setDurationMin(dur);
                    setEstimatedBurn(Math.round(dur * 6.5));
                  }}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Est. Calories Burned</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={estimatedBurn}
                    onChange={(e) => setEstimatedBurn(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
                  />
                  <span className="text-xs text-slate-500">kcal</span>
                </div>
              </div>
            </div>

            {/* Simple Selectable Exercise Picker */}
            <div className="bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Select Exercise</span>
                </div>
                <span className="text-[11px] text-slate-400">Zero manual typing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* 1. Workout Category Dropdown */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
                    1. Workout / Muscle
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {Object.keys(EXERCISE_DATABASE).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Exercise Variation Dropdown */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1.5 uppercase">
                    2. Exercise Variation ({selectedCategory})
                  </label>
                  <select
                    value={selectedVariation}
                    onChange={(e) => handleVariationChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {(EXERCISE_DATABASE[selectedCategory] || []).map((ex) => (
                      <option key={ex.name} value={ex.name}>
                        {ex.name} ({ex.equipment})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add to Workout Button */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleConfirmAddExercise}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Exercises in Workout ({exercises.length})
                </span>
              </div>

              {exercises.length === 0 && (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 p-8 rounded-2xl text-center space-y-2">
                  <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No Exercises in this Workout Yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a Workout and Variation from the dropdowns above and click &quot;+ Add&quot; to begin!
                  </p>
                </div>
              )}

              {exercises.map((ex, exIdx) => (
                <div key={exIdx} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{ex.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAddSet(exIdx)}
                        className="text-xs text-emerald-400 hover:underline font-semibold"
                      >
                        + Add Set
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exIdx)}
                        className="p-1 text-slate-600 hover:text-rose-400 rounded transition-colors"
                        title="Delete exercise"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {ex.sets.map((set, setIdx) => (
                      <div key={setIdx} className="flex items-center space-x-3 text-xs bg-slate-900/50 p-2 rounded-xl">
                        <span className="text-slate-500 font-semibold w-12">Set {setIdx + 1}</span>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => {
                              const updated = [...exercises];
                              updated[exIdx].sets[setIdx].weight = Number(e.target.value);
                              setExercises(updated);
                            }}
                            className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold text-white text-xs"
                          />
                          <span className="text-slate-400">kg</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => {
                              const updated = [...exercises];
                              updated[exIdx].sets[setIdx].reps = Number(e.target.value);
                              setExercises(updated);
                            }}
                            className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold text-white text-xs"
                          />
                          <span className="text-slate-400">reps</span>
                        </div>

                        <button
                          onClick={() => handleToggleSet(exIdx, setIdx)}
                          className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            set.done
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {set.done ? '✓ Done' : 'Mark Done'}
                        </button>

                        <button
                          onClick={() => handleDeleteSet(exIdx, setIdx)}
                          className="text-slate-600 hover:text-rose-400 text-xs px-1"
                          title="Remove set"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveWorkout}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save & Log Workout Session</span>
            </button>
          </div>

          {/* Today's Logged Workouts */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Logged Workouts for {selectedDate}</h3>

            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.map((w) => (
                  <div key={w.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">{w.title}</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {w.durationMin} mins • +{w.caloriesBurned} kcal burned • {w.exercises?.length || 0} exercises
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(w.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                No workouts logged yet today. Complete your exercises above and click Save!
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
