import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'fitness_db.json');

// Initial schema template - requires user setup first
const initialData = {
  profile: {
    isConfigured: false,
    name: '',
    age: 23,
    gender: 'male',
    heightCm: 175,
    weightKg: 70,
    goal: 'recomp', // 'cutting' (fat loss), 'bulking' (muscle gain), 'recomp' (body recomposition), 'maintenance'
    activityLevel: 'moderately_active', // sedentary, lightly_active, moderately_active, very_active
    dailyTargetCalories: 2100,
    dailyTargetProtein: 140, // grams
    dailyTargetCarbs: 220,   // grams
    dailyTargetFat: 60,      // grams
    dailyTargetWater: 3000,  // ml
    dailyTargetSteps: 10000,
  },
  meals: [],
  workouts: [],
  workoutPlans: [
    {
      id: 'default-ppl',
      name: 'Push Pull Legs (PPL) - 6 Day Split',
      daysPerWeek: 6,
      split: [
        { day: 'Day 1 - Push A', focus: 'Chest, Shoulders, Triceps', exercises: ['Barbell Bench Press 4x8', 'Incline DB Press 3x10', 'DB Lateral Raises 4x15', 'Overhead Tricep Extension 3x12', 'Cable Flyes 3x15'] },
        { day: 'Day 2 - Pull A', focus: 'Back, Rear Delts, Biceps', exercises: ['Deadlift 3x5', 'Lat Pulldown 4x10', 'Chest Supported Row 3x10', 'Face Pulls 4x15', 'Barbell Bicep Curl 3x10'] },
        { day: 'Day 3 - Legs A', focus: 'Quads, Calves, Abs', exercises: ['Barbell Squats 4x8', 'Leg Press 3x12', 'Leg Extensions 3x15', 'Standing Calf Raises 4x15', 'Hanging Knee Raises 3x15'] },
        { day: 'Day 4 - Push B', focus: 'Shoulders, Upper Chest, Triceps', exercises: ['Overhead Overhead Press 4x8', 'Dips 3x10', 'Cable Lateral Raises 4x15', 'Skull Crushers 3x12'] },
        { day: 'Day 5 - Pull B', focus: 'Upper Back, Lats, Biceps', exercises: ['Pull-ups 4x8', 'Barbell Bent Over Row 3x8', 'Seated Cable Row 3x10', 'Incline DB Curl 3x10', 'Hammer Curls 3x12'] },
        { day: 'Day 6 - Legs B', focus: 'Hamstrings, Glutes, Calves', exercises: ['Romanian Deadlift (RDL) 4x8', 'Bulgarian Split Squats 3x10', 'Lying Hamstring Curls 4x12', 'Seated Calf Raises 4x15'] },
        { day: 'Day 7 - Rest', focus: 'Active Recovery & Mobility', exercises: ['8,000 steps brisk walk', 'Mobility & stretching'] }
      ]
    }
  ],
  fastrackLogs: [],
  waterLogs: [],
  weightLogs: [],
  aiCache: {},
  chatHistory: [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Vanakkam! Welcome to your AI Diet & Fitness tracker. I specialize in South Indian & global nutrition, workout plan biomechanics, and Fastrack watch energy tracking. Once you set up your profile, I will tailor your daily calories and macros precisely to your body!',
      timestamp: new Date().toISOString()
    }
  ],
  settings: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    preferredModel: 'gemini-2.0-flash-lite-preview-02-05',
    useHeuristicFallback: true,
    cacheTokens: true,
    fastrackDeviceName: 'Fastrack Smartwatch',
    tokenUsage: {
      requestsToday: 0,
      tokensEstimated: 0,
      lastResetDate: new Date().toISOString().split('T')[0]
    }
  }
};

export function initDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

export function readDB() {
  try {
    initDB();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    return initialData;
  }
}

export function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}
