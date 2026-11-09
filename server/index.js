import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDB, writeDB, initDB } from './data/db.js';
import { AIService } from './services/aiService.js';
import { FastrackService } from './services/fastrackService.js';
import { searchFoodDatabase } from './data/foodDatabase.js';
import { calculateNutritionTargets } from './services/profileCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
initDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Multer for image uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json());

// Initialize AI Service
const dbInitial = readDB();
const aiService = new AIService(dbInitial.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');

// --- HEALTH & STATUS ---
app.get('/api/status', (req, res) => {
  const db = readDB();
  res.json({
    status: 'online',
    version: '1.0.0',
    aiEnabled: Boolean(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY),
    fastrackConnected: Boolean(db.fastrackLogs && db.fastrackLogs.length > 0)
  });
});

// --- USER PROFILE & GOALS ---
app.get('/api/profile', (req, res) => {
  const db = readDB();
  res.json(db.profile);
});

app.post('/api/profile/calculate', (req, res) => {
  const calculated = calculateNutritionTargets(req.body);
  res.json({ success: true, targets: calculated });
});

app.post('/api/profile', (req, res) => {
  const db = readDB();
  const shouldRecalculate = req.body.recalculateTargets;
  let targets = {};

  if (shouldRecalculate) {
    targets = calculateNutritionTargets({ ...db.profile, ...req.body });
  }

  db.profile = {
    ...db.profile,
    ...req.body,
    ...targets,
    isConfigured: true
  };

  writeDB(db);
  res.json({ success: true, profile: db.profile });
});

// --- FOOD DATABASE ZERO-TOKEN SEARCH ---
app.get('/api/nutrition-db/search', (req, res) => {
  const query = req.query.q || '';
  const diet = req.query.diet || 'all';
  const results = searchFoodDatabase(query, diet);
  res.json({ query, diet, results, count: results.length });
});

// --- DIET & MEAL TRACKING ---
app.get('/api/meals', (req, res) => {
  const db = readDB();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const mealsForDate = db.meals.filter(m => m.date === date);

  // Daily totals
  const totals = mealsForDate.reduce((acc, m) => {
    acc.calories += m.totalCalories || 0;
    acc.protein += m.totalProtein || 0;
    acc.carbs += m.totalCarbs || 0;
    acc.fat += m.totalFat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  totals.protein = Number(totals.protein.toFixed(1));
  totals.carbs = Number(totals.carbs.toFixed(1));
  totals.fat = Number(totals.fat.toFixed(1));

  res.json({
    date,
    meals: mealsForDate,
    totals,
    targets: {
      calories: db.profile.dailyTargetCalories,
      protein: db.profile.dailyTargetProtein,
      carbs: db.profile.dailyTargetCarbs,
      fat: db.profile.dailyTargetFat
    }
  });
});

app.post('/api/meals', (req, res) => {
  const db = readDB();
  const { date, mealType, name, foods, notes } = req.body;

  if (!foods || !Array.isArray(foods) || foods.length === 0) {
    return res.status(400).json({ error: 'Foods array is required' });
  }

  const totalCalories = foods.reduce((sum, f) => sum + (Number(f.calories) || 0), 0);
  const totalProtein = Number(foods.reduce((sum, f) => sum + (Number(f.protein) || 0), 0).toFixed(1));
  const totalCarbs = Number(foods.reduce((sum, f) => sum + (Number(f.carbs) || 0), 0).toFixed(1));
  const totalFat = Number(foods.reduce((sum, f) => sum + (Number(f.fat) || 0), 0).toFixed(1));

  const newMeal = {
    id: `meal-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    mealType: mealType || 'snack', // breakfast, lunch, dinner, snack
    name: name || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
    foods,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    notes: notes || '',
    loggedAt: new Date().toISOString()
  };

  db.meals.unshift(newMeal);
  writeDB(db);

  res.status(201).json({ success: true, meal: newMeal });
});

app.delete('/api/meals/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const initialLen = db.meals.length;
  db.meals = db.meals.filter(m => m.id !== id);

  if (db.meals.length === initialLen) {
    return res.status(404).json({ error: 'Meal not found' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Meal deleted' });
});

// --- AI MEAL ANALYSIS (NATURAL LANGUAGE & VISION) ---
app.post('/api/ai/analyze-meal-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Meal text is required' });
    }

    const db = readDB();
    aiService.setApiKey(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');

    const analysis = await aiService.analyzeMealText(text);

    // Track usage
    if (db.settings?.tokenUsage) {
      db.settings.tokenUsage.requestsToday += 1;
      db.settings.tokenUsage.tokensEstimated += 350;
      writeDB(db);
    }

    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing meal text:', err);
    res.status(500).json({ error: 'Failed to analyze meal text', details: err.message });
  }
});

app.post('/api/ai/analyze-meal-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const db = readDB();
    aiService.setApiKey(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');

    const analysis = await aiService.analyzeMealPhoto(req.file.buffer, req.file.mimetype);

    // Track usage
    if (db.settings?.tokenUsage) {
      db.settings.tokenUsage.requestsToday += 1;
      db.settings.tokenUsage.tokensEstimated += 800;
      writeDB(db);
    }

    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing meal photo:', err);
    res.status(500).json({ error: 'Failed to analyze meal photo', details: err.message });
  }
});

app.get('/api/ai/saved-meal-plan', (req, res) => {
  const db = readDB();
  res.json({ success: true, plan: db.savedMealPlan || null });
});

app.post('/api/ai/generate-meal-plan', async (req, res) => {
  try {
    const { preference = 'south_indian_mixed', daysCount = 7 } = req.body;
    const db = readDB();

    aiService.setApiKey(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');
    const plan = await aiService.generateDailyMealPlan(db.profile, preference, Number(daysCount) || 7);

    // Persist saved meal plan so it doesn't re-roll automatically
    db.savedMealPlan = plan;

    // Track usage
    if (db.settings?.tokenUsage) {
      db.settings.tokenUsage.requestsToday += 1;
      db.settings.tokenUsage.tokensEstimated += 900;
    }
    writeDB(db);

    res.json({ success: true, plan });
  } catch (err) {
    console.error('Error generating meal plan:', err);
    res.status(500).json({ error: 'Failed to generate meal plan', details: err.message });
  }
});

// --- WORKOUT TRACKING & AI PLAN ANALYZER ---
app.get('/api/workouts', (req, res) => {
  const db = readDB();
  const date = req.query.date;
  let workouts = db.workouts || [];
  if (date) {
    workouts = workouts.filter(w => w.date === date);
  }
  res.json({ workouts });
});

app.post('/api/workouts', (req, res) => {
  const db = readDB();
  const { date, title, splitType, exercises, durationMin, caloriesBurned, notes } = req.body;

  const newWorkout = {
    id: `workout-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    title: title || 'Workout Session',
    splitType: splitType || 'Strength',
    exercises: exercises || [],
    durationMin: Number(durationMin) || 45,
    caloriesBurned: Number(caloriesBurned) || 300,
    notes: notes || '',
    loggedAt: new Date().toISOString()
  };

  db.workouts.unshift(newWorkout);
  writeDB(db);

  res.status(201).json({ success: true, workout: newWorkout });
});

app.delete('/api/workouts/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  db.workouts = (db.workouts || []).filter(w => w.id !== id);
  writeDB(db);
  res.json({ success: true, message: 'Workout deleted' });
});

app.get('/api/workout-plans', (req, res) => {
  const db = readDB();
  res.json({ workoutPlans: db.workoutPlans || [] });
});

app.post('/api/workout-plans', (req, res) => {
  const db = readDB();
  const { name, split, daysPerWeek } = req.body;
  const newPlan = {
    id: `plan-${Date.now()}`,
    name: name || 'Custom Split',
    daysPerWeek: daysPerWeek || 5,
    split: split || []
  };

  db.workoutPlans = db.workoutPlans || [];
  db.workoutPlans.push(newPlan);
  writeDB(db);
  res.status(201).json({ success: true, plan: newPlan });
});

app.post('/api/ai/analyze-workout-plan', async (req, res) => {
  try {
    const { planText } = req.body;
    if (!planText) {
      return res.status(400).json({ error: 'Workout plan text is required' });
    }

    const db = readDB();
    aiService.setApiKey(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');

    const analysis = await aiService.analyzeWorkoutPlan(planText, db.profile);

    // Track usage
    if (db.settings?.tokenUsage) {
      db.settings.tokenUsage.requestsToday += 1;
      db.settings.tokenUsage.tokensEstimated += 600;
      writeDB(db);
    }

    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing workout plan:', err);
    res.status(500).json({ error: 'Failed to analyze workout plan', details: err.message });
  }
});

// --- FASTRACK SMARTWATCH SYNC & METRICS ---
app.get('/api/fastrack/summary', (req, res) => {
  const db = readDB();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const bmr = FastrackService.calculateBMR(
    db.profile.weightKg || 70,
    db.profile.heightCm || 175,
    db.profile.age || 24,
    db.profile.gender || 'male'
  );

  const log = (db.fastrackLogs || []).find(l => l.date === date) || {
    date,
    deviceName: db.settings?.fastrackDeviceName || 'Fastrack Smartwatch',
    steps: 0,
    activeCalories: 0,
    restingCalories: bmr,
    totalBurned: bmr,
    distanceKm: 0,
    avgHeartRate: 0,
    peakHeartRate: 0,
    sleepHours: 0,
    syncedAt: null
  };

  res.json({ success: true, log });
});

app.post('/api/fastrack/sync', (req, res) => {
  const db = readDB();
  const {
    date = new Date().toISOString().split('T')[0],
    steps,
    activeCalories,
    distanceKm,
    avgHeartRate,
    peakHeartRate,
    sleepHours,
    deviceName
  } = req.body;

  const bmr = FastrackService.calculateBMR(
    db.profile.weightKg,
    db.profile.heightCm,
    db.profile.age,
    db.profile.gender
  );

  const active = Number(activeCalories) || Math.round((Number(steps) || 0) * 0.04);
  const totalBurned = bmr + active;

  const syncRecord = {
    id: `fastrack-${Date.now()}`,
    date,
    deviceName: deviceName || db.settings?.fastrackDeviceName || 'Fastrack Smartwatch',
    steps: Number(steps) || 0,
    activeCalories: active,
    restingCalories: bmr,
    totalBurned,
    distanceKm: Number(distanceKm) || Number(((Number(steps) || 0) * 0.00075).toFixed(2)),
    avgHeartRate: Number(avgHeartRate) > 0 ? Number(avgHeartRate) : null,
    peakHeartRate: Number(peakHeartRate) > 0 ? Number(peakHeartRate) : null,
    sleepHours: Number(sleepHours) > 0 ? Number(sleepHours) : null,
    syncedAt: new Date().toISOString()
  };

  // Replace or add
  db.fastrackLogs = db.fastrackLogs || [];
  const existingIdx = db.fastrackLogs.findIndex(l => l.date === date);
  if (existingIdx >= 0) {
    db.fastrackLogs[existingIdx] = syncRecord;
  } else {
    db.fastrackLogs.unshift(syncRecord);
  }

  writeDB(db);
  res.json({ success: true, log: syncRecord });
});

// Automatic Watch Sync telemetry endpoint (receives live streaming pulses)
app.post('/api/fastrack/auto-sync', (req, res) => {
  const db = readDB();
  const date = req.body.date || new Date().toISOString().split('T')[0];
  
  db.fastrackLogs = db.fastrackLogs || [];
  let existing = db.fastrackLogs.find(l => l.date === date);

  const bmr = FastrackService.calculateBMR(
    db.profile.weightKg,
    db.profile.heightCm,
    db.profile.age,
    db.profile.gender
  );

  const steps = req.body.steps !== undefined ? Number(req.body.steps) : (existing?.steps || 0);
  const activeCalories = req.body.activeCalories !== undefined 
    ? Number(req.body.activeCalories) 
    : (existing?.activeCalories || Math.round(steps * 0.04));
  const avgHeartRate = req.body.avgHeartRate !== undefined && Number(req.body.avgHeartRate) > 0 
    ? Number(req.body.avgHeartRate) 
    : (existing?.avgHeartRate || null);
  const peakHeartRate = Math.max(existing?.peakHeartRate || 0, Number(req.body.peakHeartRate) || (avgHeartRate || 0));
  const distanceKm = Number(((steps * 0.00075).toFixed(2)));
  const totalBurned = bmr + activeCalories;

  const autoRecord = {
    id: existing?.id || `fastrack-${Date.now()}`,
    date,
    deviceName: req.body.deviceName || existing?.deviceName || 'Fastrack Smartwatch',
    steps,
    activeCalories,
    restingCalories: bmr,
    totalBurned,
    distanceKm,
    avgHeartRate,
    peakHeartRate: peakHeartRate > 0 ? peakHeartRate : null,
    sleepHours: req.body.sleepHours !== undefined && Number(req.body.sleepHours) > 0 
      ? Number(req.body.sleepHours) 
      : (existing?.sleepHours || null),
    batteryLevel: req.body.batteryLevel !== undefined ? Number(req.body.batteryLevel) : (existing?.batteryLevel || null),
    isAutoSynced: true,
    lastAutoSyncAt: new Date().toISOString(),
    syncedAt: new Date().toISOString()
  };

  const existingIdx = db.fastrackLogs.findIndex(l => l.date === date);
  if (existingIdx >= 0) {
    db.fastrackLogs[existingIdx] = autoRecord;
  } else {
    db.fastrackLogs.unshift(autoRecord);
  }

  writeDB(db);
  res.json({ success: true, log: autoRecord, autoSync: true });
});

// --- ENERGY BALANCE (DIET + FASTRACK BURN) ---
app.get('/api/energy-balance', (req, res) => {
  const db = readDB();
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const meals = (db.meals || []).filter(m => m.date === date);
  const consumedCalories = meals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const fastrackLog = (db.fastrackLogs || []).find(l => l.date === date);

  const balance = FastrackService.calculateEnergyBalance(consumedCalories, fastrackLog, db.profile);
  res.json({ date, balance });
});

// --- WATER & WEIGHT LOGGING ---
app.get('/api/water', (req, res) => {
  const db = readDB();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const entry = (db.waterLogs || []).find(w => w.date === date) || { date, amountMl: 0 };
  res.json({ date, amountMl: entry.amountMl, targetMl: db.profile.dailyTargetWater || 3000 });
});

app.post('/api/water/log', (req, res) => {
  const db = readDB();
  const { date = new Date().toISOString().split('T')[0], amountMl = 250 } = req.body;

  db.waterLogs = db.waterLogs || [];
  const existing = db.waterLogs.find(w => w.date === date);
  if (existing) {
    existing.amountMl = Math.max(0, existing.amountMl + Number(amountMl));
  } else {
    db.waterLogs.push({ date, amountMl: Math.max(0, Number(amountMl)) });
  }

  writeDB(db);
  res.json({ success: true, water: existing || { date, amountMl } });
});

app.get('/api/weight', (req, res) => {
  const db = readDB();
  res.json({ weightLogs: db.weightLogs || [], currentWeight: db.profile.weightKg });
});

app.post('/api/weight/log', (req, res) => {
  const db = readDB();
  const { date = new Date().toISOString().split('T')[0], weightKg } = req.body;
  if (!weightKg) return res.status(400).json({ error: 'weightKg is required' });

  const numWeight = parseFloat(weightKg);
  db.profile.weightKg = numWeight;

  db.weightLogs = db.weightLogs || [];
  const existing = db.weightLogs.find(w => w.date === date);
  if (existing) {
    existing.weightKg = numWeight;
  } else {
    db.weightLogs.push({ date, weightKg: numWeight });
  }

  writeDB(db);
  res.json({ success: true, currentWeight: numWeight });
});

// --- AI FITNESS COACH CHAT ---
app.get('/api/coach/history', (req, res) => {
  const db = readDB();
  res.json({ chatHistory: db.chatHistory || [] });
});

app.delete('/api/coach/history', (req, res) => {
  const db = readDB();
  db.chatHistory = [];
  writeDB(db);
  res.json({ success: true, message: 'Chat history cleared' });
});

app.post('/api/coach/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const db = readDB();
    const today = new Date().toISOString().split('T')[0];

    // Build today's live stats
    const todayMeals = (db.meals || []).filter(m => m.date === today);
    const consumedCalories = todayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);
    const consumedProtein = Number(todayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0).toFixed(1));
    const consumedCarbs = Number(todayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0).toFixed(1));
    const consumedFat = Number(todayMeals.reduce((s, m) => s + (m.totalFat || 0), 0).toFixed(1));
    const waterEntry = (db.waterLogs || []).find(w => w.date === today);
    const fastrackLog = (db.fastrackLogs || []).find(l => l.date === today);

    const todayStats = {
      consumedCalories,
      consumedProtein,
      consumedCarbs,
      consumedFat,
      waterMl: waterEntry?.amountMl || 0,
      steps: fastrackLog?.steps || 0,
      activeCaloriesBurned: fastrackLog?.activeCalories || 0,
      sleepHours: fastrackLog?.sleepHours || 7
    };

    // User message
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    db.chatHistory = db.chatHistory || [];
    db.chatHistory.push(userMsg);

    aiService.setApiKey(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');
    const { reply, source } = await aiService.askCoachChat(message, db.chatHistory, db.profile, todayStats);

    const assistantMsg = {
      id: `msg-${Date.now() + 1}`,
      sender: 'assistant',
      text: reply,
      source,
      timestamp: new Date().toISOString()
    };

    db.chatHistory.push(assistantMsg);

    // Track usage
    if (db.settings?.tokenUsage) {
      db.settings.tokenUsage.requestsToday += 1;
      db.settings.tokenUsage.tokensEstimated += 400;
    }

    writeDB(db);
    res.json({ success: true, message: assistantMsg });
  } catch (err) {
    console.error('Error in coach chat:', err);
    res.status(500).json({ error: 'Failed to process chat', details: err.message });
  }
});

// --- SETTINGS & TOKEN TRACKER ---
app.get('/api/settings', (req, res) => {
  const db = readDB();
  const settings = { ...(db.settings || {}) };
  // Mask API key for security
  if (settings.geminiApiKey) {
    settings.hasApiKey = true;
    settings.maskedKey = `${settings.geminiApiKey.slice(0, 4)}...${settings.geminiApiKey.slice(-4)}`;
  } else {
    settings.hasApiKey = false;
    settings.maskedKey = '';
  }
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  const { geminiApiKey, fastrackDeviceName, useHeuristicFallback, cacheTokens } = req.body;

  db.settings = db.settings || {};
  if (typeof geminiApiKey === 'string') {
    db.settings.geminiApiKey = geminiApiKey.trim();
    aiService.setApiKey(db.settings.geminiApiKey);
  }
  if (fastrackDeviceName) db.settings.fastrackDeviceName = fastrackDeviceName;
  if (typeof useHeuristicFallback === 'boolean') db.settings.useHeuristicFallback = useHeuristicFallback;
  if (typeof cacheTokens === 'boolean') db.settings.cacheTokens = cacheTokens;

  writeDB(db);
  res.json({ success: true, message: 'Settings saved' });
});

// Serve frontend static build
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
