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
import { uploadImageToOnlineStorage, deleteImageFromOnlineStorage } from './services/cloudStorage.js';
import { 
  isSupabaseReady, 
  migrateLocalDataToSupabase, 
  getSupabase, 
  getPhotosFromSupabase, 
  getProfileFromSupabase, 
  saveProfileToSupabase, 
  resetSupabaseAllData,
  syncUserToSupabase,
  syncMealToSupabase,
  deleteMealFromSupabase,
  syncWorkoutToSupabase,
  deleteWorkoutFromSupabase,
  syncWatchLogToSupabase,
  fetchMealsFromSupabase,
  fetchWorkoutsFromSupabase,
  fetchWatchLogFromSupabase,
  syncWaterLogToSupabase,
  syncWeightLogToSupabase,
  syncMealPlanToSupabase,
  fetchMealPlanFromSupabase,
  getSupabaseInitError
} from './services/supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
initDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Multer for image uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local uploads folder for private physique vault photos
const VAULT_UPLOADS_DIR = path.join(__dirname, 'uploads', 'vault');
if (!fs.existsSync(VAULT_UPLOADS_DIR)) {
  fs.mkdirSync(VAULT_UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize AI Service
const dbInitial = readDB();
const aiService = new AIService(dbInitial.settings?.geminiApiKey || process.env.GEMINI_API_KEY || '');

// --- HEALTH & STATUS ---
app.get('/api/health', (req, res) => {
  try {
    const db = readDB();
    res.json({
      status: 'running',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0'
    });
  } catch (err) {
    res.status(500).json({ status: 'turning-on', error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  const db = readDB();
  res.json({
    status: 'running',
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    aiEnabled: Boolean(db.settings?.geminiApiKey || process.env.GEMINI_API_KEY),
    fastrackConnected: Boolean(db.fastrackLogs && db.fastrackLogs.length > 0)
  });
});

// --- MULTI-TENANT USER IDENTITY & PROFILE HELPERS ---
function getAuthUserId(req, db) {
  const headerId = req.headers['x-user-id'];
  if (headerId && typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  const queryId = req.query?.userId;
  if (queryId && typeof queryId === 'string' && queryId.trim()) {
    return queryId.trim();
  }
  const bodyId = req.body?.userId;
  if (bodyId && typeof bodyId === 'string' && bodyId.trim()) {
    return bodyId.trim();
  }
  return null;
}

function getUserProfile(db, userId, fallbackName = '') {
  db.profiles = db.profiles || {};
  if (!db.profiles[userId]) {
    const matchedUser = (db.users || []).find(u => u.id === userId);
    const name = matchedUser?.name || fallbackName || '';

    // Clean slate for new user: isConfigured is FALSE, zero pre-filled values!
    db.profiles[userId] = {
      isConfigured: false,
      name: name,
      age: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      goal: '',
      activityLevel: '',
      dailyTargetCalories: 2000,
      dailyTargetProtein: 130,
      dailyTargetCarbs: 200,
      dailyTargetFat: 55,
      dailyTargetWater: 3000,
      dailyTargetSteps: 10000,
      recalculateTargets: true,
      dietaryTags: [],
      focusAreas: [],
      goals: []
    };
    writeDB(db);
  }
  return db.profiles[userId];
}

// Helper: Retrieve isolated Gemini API Key unique for every user (NO cross-user leaking)
function getUserApiKey(db, userId) {
  let userKey = '';
  if (userId) {
    const profile = db.profiles && db.profiles[userId];
    const user = (db.users || []).find(u => u.id === userId);
    const userSettings = (db.userSettings && db.userSettings[userId]) || {};
    userKey = profile?.geminiApiKey || user?.geminiApiKey || userSettings.geminiApiKey || '';
  }
  return userKey || process.env.GEMINI_API_KEY || '';
}

// --- USER AUTHENTICATION & CLOUD SYNC ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = readDB();
    db.users = db.users || [];

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, provider: newUser.provider };

    // Initialize NEW user profile with clean slate (isConfigured: false, zero pre-filled values)
    db.profiles = db.profiles || {};
    db.profiles[newUser.id] = {
      isConfigured: false,
      name: newUser.name,
      age: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      goal: '',
      activityLevel: '',
      dailyTargetCalories: 2000,
      dailyTargetProtein: 130,
      dailyTargetCarbs: 200,
      dailyTargetFat: 55,
      dailyTargetWater: 3000,
      dailyTargetSteps: 10000,
      recalculateTargets: true,
      dietaryTags: [],
      focusAreas: [],
      goals: []
    };
    db.profile = db.profiles[newUser.id];

    writeDB(db);

    // Save directly to Supabase Cloud PostgreSQL immediately!
    if (isSupabaseReady()) {
      try {
        await syncUserToSupabase(newUser);
        await saveProfileToSupabase(newUser.id, { ...db.profiles[newUser.id], email: newUser.email });
      } catch (cloudErr) {
        console.warn('[Supabase Cloud Signup Sync Warning]:', cloudErr.message);
      }
    }

    res.status(201).json({
      success: true,
      user: db.currentUser,
      profile: db.profiles[newUser.id],
      message: 'Account created successfully and synced to Supabase'
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup error', details: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDB();
    db.users = db.users || [];

    let user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    
    // Check Supabase Cloud if user not in local memory/cache
    if (!user && isSupabaseReady() && email) {
      try {
        const { data: cloudUser } = await getSupabase()
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (cloudUser && (!cloudUser.password_hash || cloudUser.password_hash === password)) {
          user = {
            id: cloudUser.id,
            name: cloudUser.name || email.split('@')[0],
            email: cloudUser.email,
            password: cloudUser.password_hash || password,
            provider: cloudUser.provider || 'email',
            createdAt: cloudUser.created_at || new Date().toISOString()
          };
          db.users.push(user);
        }
      } catch (e) {
        console.warn('Supabase email login check notice:', e.message);
      }
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    db.currentUser = { id: user.id, name: user.name, email: user.email, provider: user.provider };
    let userProfile = getUserProfile(db, user.id, user.name);

    // If local profile is not configured, check Supabase Cloud PostgreSQL for returning user's saved profile
    if (!userProfile.isConfigured && isSupabaseReady()) {
      try {
        const cloudProfile = await getProfileFromSupabase(user.id);
        if (cloudProfile && cloudProfile.isConfigured) {
          db.profiles = db.profiles || {};
          db.profiles[user.id] = { ...userProfile, ...cloudProfile };
          userProfile = db.profiles[user.id];
        }
      } catch (e) {
        console.warn('Supabase profile check on login warning:', e.message);
      }
    }

    db.profile = userProfile;
    writeDB(db);

    res.json({
      success: true,
      user: db.currentUser,
      profile: db.profile,
      message: 'Logged in successfully'
    });
  } catch (err) {
    res.status(500).json({ error: 'Login error', details: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    let { email, name, picture, googleId, credential } = req.body;

    // Decode Google JWT if credential token was provided directly by Google SDK
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) email = payload.email;
          if (payload.name) name = payload.name;
          if (payload.picture) picture = payload.picture;
          if (payload.sub) googleId = payload.sub;
        }
      } catch (e) {
        console.warn('Failed to decode Google JWT token:', e.message);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    const db = readDB();
    db.users = db.users || [];

    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Check Supabase Cloud if user not in local database
    if (!user && isSupabaseReady()) {
      try {
        const { data: cloudUser } = await getSupabase()
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (cloudUser) {
          user = {
            id: cloudUser.id,
            name: cloudUser.name || name || email.split('@')[0],
            email: cloudUser.email,
            picture: cloudUser.avatar_url || picture || null,
            googleId: googleId || `gid-${Date.now()}`,
            provider: 'google',
            createdAt: cloudUser.created_at || new Date().toISOString()
          };
          db.users.push(user);
        }
      } catch (e) {
        console.warn('Supabase Google user lookup notice:', e.message);
      }
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // Deterministic, permanent stable user ID based on googleId or clean email
      const stableId = googleId 
        ? `user-google-${googleId}` 
        : `user-google-${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
      user = {
        id: stableId,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        picture: picture || null,
        googleId: googleId || `gid-${Date.now()}`,
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      if (name) user.name = name;
      if (picture) user.picture = picture;
    }

    db.currentUser = { id: user.id, name: user.name, email: user.email, picture: user.picture, provider: 'google' };
    db.profiles = db.profiles || {};

    // Check Supabase Cloud for saved configured profile
    let cloudProfile = null;
    if (isSupabaseReady()) {
      try {
        cloudProfile = await getProfileFromSupabase(user.id);
      } catch (e) {}
    }

    if (cloudProfile && cloudProfile.isConfigured) {
      db.profiles[user.id] = { ...cloudProfile, name: user.name };
      isNewUser = false;
    } else if (!db.profiles[user.id]) {
      // 100% clean slate: Zero pre-filled values
      db.profiles[user.id] = {
        isConfigured: false,
        name: user.name,
        age: '',
        gender: '',
        heightCm: '',
        weightKg: '',
        targetWeightKg: '',
        goal: '',
        activityLevel: '',
        dailyTargetCalories: 2000,
        dailyTargetProtein: 130,
        dailyTargetCarbs: 200,
        dailyTargetFat: 55,
        dailyTargetWater: 3000,
        dailyTargetSteps: 10000,
        recalculateTargets: true,
        dietaryTags: [],
        focusAreas: [],
        goals: []
      };
    }

    db.profile = db.profiles[user.id];
    writeDB(db);

    // Save directly to Supabase Cloud PostgreSQL immediately!
    if (isSupabaseReady()) {
      try {
        await syncUserToSupabase(user);
        await saveProfileToSupabase(user.id, { ...db.profiles[user.id], email: user.email });
      } catch (cloudErr) {
        console.warn('[Supabase Cloud Google Sync Warning]:', cloudErr.message);
      }
    }

    res.json({
      success: true,
      user: db.currentUser,
      profile: db.profile,
      message: 'Google authentication successful and synced to Supabase'
    });
  } catch (err) {
    res.status(500).json({ error: 'Google auth error', details: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  if (!userId) {
    return res.status(401).json({ success: false, user: null, message: 'Unauthenticated' });
  }
  const user = (db.users || []).find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, user: null, message: 'User not found' });
  }
  res.json({
    success: true,
    user
  });
});

app.get('/api/auth/google-client-id', (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

app.post('/api/auth/logout', (req, res) => {
  const db = readDB();
  db.currentUser = null;
  writeDB(db);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin / User Request: Reset all users and accounts to start fresh
app.post('/api/auth/reset-all', async (req, res) => {
  try {
    const cleanDb = {
      users: [],
      currentUser: null,
      profiles: {},
      profile: {
        isConfigured: false,
        name: '',
        age: '',
        gender: '',
        heightCm: '',
        weightKg: '',
        targetWeightKg: '',
        goal: '',
        activityLevel: '',
        dailyTargetCalories: 2000,
        dailyTargetProtein: 130,
        dailyTargetCarbs: 200,
        dailyTargetFat: 55,
        dailyTargetWater: 3000,
        dailyTargetSteps: 10000,
        recalculateTargets: true,
        dietaryTags: [],
        focusAreas: [],
        goals: []
      },
      meals: [],
      workouts: [],
      workoutPlans: [],
      fastrackLogs: [],
      waterLogs: [],
      weightLogs: [],
      photoVault: [],
      chatHistory: [],
      savedMealPlan: null,
      settings: {}
    };
    writeDB(cleanDb);

    // Clean up local vault upload photos from disk
    const vaultDir = path.join(__dirname, 'uploads', 'vault');
    if (fs.existsSync(vaultDir)) {
      try {
        const files = fs.readdirSync(vaultDir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try { fs.unlinkSync(path.join(vaultDir, file)); } catch (e) {}
          }
        }
      } catch (e) {}
    }

    // Delete all records & storage files from Supabase Cloud PostgreSQL
    let supabaseResult = null;
    if (isSupabaseReady()) {
      try {
        supabaseResult = await resetSupabaseAllData();
      } catch (err) {
        console.warn('Error clearing Supabase cloud database during reset-all:', err.message);
      }
    }

    res.json({
      success: true,
      message: 'All users, profiles, and data deleted from local database and Supabase Cloud. Clean slate ready.',
      supabase: supabaseResult
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

// --- USER PROFILE & GOALS ---
app.get('/api/profile', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required', isConfigured: false });
  }
  let profile = getUserProfile(db, userId);

  // If local profile is not configured, check Supabase Cloud PostgreSQL
  if (!profile.isConfigured && isSupabaseReady()) {
    try {
      const cloudProfile = await getProfileFromSupabase(userId);
      if (cloudProfile && cloudProfile.isConfigured) {
        db.profiles = db.profiles || {};
        db.profiles[userId] = { ...profile, ...cloudProfile };
        db.profile = db.profiles[userId];
        writeDB(db);
        profile = db.profiles[userId];
      }
    } catch (e) {
      console.warn('Error fetching profile from Supabase:', e.message);
    }
  }

  res.json(profile);
});

app.post('/api/profile/calculate', (req, res) => {
  const calculated = calculateNutritionTargets(req.body);
  res.json({ success: true, targets: calculated });
});

app.post('/api/profile', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const current = getUserProfile(db, userId);

  const shouldRecalculate = req.body.recalculateTargets;
  let targets = {};

  if (shouldRecalculate) {
    targets = calculateNutritionTargets({ ...current, ...req.body });
  }

  db.profiles = db.profiles || {};
  db.profiles[userId] = {
    ...current,
    ...req.body,
    ...targets,
    isConfigured: true
  };
  db.profile = db.profiles[userId];

  writeDB(db);

  // Auto-sync profile to Supabase PostgreSQL table
  if (isSupabaseReady()) {
    const matchedUser = (db.users || []).find(u => u.id === userId);
    saveProfileToSupabase(userId, { ...db.profiles[userId], email: matchedUser?.email }).catch(() => {});
  }

  res.json({ success: true, profile: db.profiles[userId] });
});

// --- FOOD DATABASE ZERO-TOKEN SEARCH ---
app.get('/api/nutrition-db/search', (req, res) => {
  const query = req.query.q || '';
  const diet = req.query.diet || 'all';
  const results = searchFoodDatabase(query, diet);
  res.json({ query, diet, results, count: results.length });
});

// --- DIET & MEAL TRACKING ---
app.get('/api/meals', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const date = req.query.date || new Date().toISOString().split('T')[0];

  let mealsForDate = null;
  if (isSupabaseReady()) {
    try {
      const cloudMeals = await fetchMealsFromSupabase(userId, date);
      if (Array.isArray(cloudMeals) && cloudMeals.length > 0) {
        mealsForDate = cloudMeals;
      }
    } catch (e) {}
  }

  if (!mealsForDate) {
    mealsForDate = (db.meals || []).filter(m => (!m.userId || m.userId === userId) && m.date === date);
  }

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
      calories: userProfile.dailyTargetCalories,
      protein: userProfile.dailyTargetProtein,
      carbs: userProfile.dailyTargetCarbs,
      fat: userProfile.dailyTargetFat
    }
  });
});

app.post('/api/meals', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
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
    userId,
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

  db.meals = db.meals || [];
  db.meals.unshift(newMeal);
  writeDB(db);

  if (isSupabaseReady()) {
    syncMealToSupabase(newMeal).catch(e => console.warn('[Supabase meal sync notice]:', e.message));
  }

  res.status(201).json({ success: true, meal: newMeal });
});

app.delete('/api/meals/:id', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const id = req.params.id;
  const initialLen = (db.meals || []).length;
  db.meals = (db.meals || []).filter(m => !(m.id === id && (!m.userId || m.userId === userId)));

  if (db.meals.length === initialLen) {
    return res.status(404).json({ error: 'Meal not found' });
  }

  writeDB(db);

  if (isSupabaseReady()) {
    deleteMealFromSupabase(id).catch(e => console.warn('[Supabase meal delete notice]:', e.message));
  }

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
    const userId = getAuthUserId(req, db);
    aiService.setApiKey(getUserApiKey(db, userId));

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
    const userId = getAuthUserId(req, db);
    aiService.setApiKey(getUserApiKey(db, userId));

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

// --- UNIVERSAL FULL-WEBSITE AI VOICE COMMAND ENGINE ---
function normalizeFitnessSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let clean = rawText;
  const replacements = [
    // Quantities & Homophones
    [/\bfree eggs\b/gi, '3 eggs'],
    [/\bto eggs\b/gi, '2 eggs'],
    [/\bfor eggs\b/gi, '4 eggs'],
    [/\bwon\b(?=.*(?:egg|roti|dosa|idli|banana))/gi, '1'],
    [/\bto\b(?=.*(?:eggs|rotis|dosas|idlis|bananas))/gi, '2'],
    // South Indian & Global Foods Phonetic Normalization
    [/\bcheap at ease\b/gi, 'chapatis'],
    [/\bcheap party\b/gi, 'chapati'],
    [/\bchapathi\b/gi, 'chapati'],
    [/\bchapattis?\b/gi, 'chapatis'],
    [/\bitaly\b/gi, 'idli'],
    [/\bidly\b/gi, 'idli'],
    [/\bidlies\b/gi, 'idlis'],
    [/\bedli\b/gi, 'idli'],
    [/\bdoshe\b/gi, 'dosa'],
    [/\bdosai\b/gi, 'dosa'],
    [/\bdhose\b/gi, 'dosa'],
    [/\bdose\b(?=.*(?:sambar|chutney))/gi, 'dosa'],
    [/\bsamba\b/gi, 'sambar'],
    [/\bsambhar\b/gi, 'sambar'],
    [/\bpanier\b/gi, 'paneer'],
    [/\bpanir\b/gi, 'paneer'],
    [/\bbriyani\b/gi, 'biryani'],
    [/\bbiriyani\b/gi, 'biryani'],
    [/\bcard\b(?=.*(?:rice|curd))/gi, 'curd'],
    [/\bcurds\b/gi, 'curd'],
    // Gym Exercises
    [/\bbench past\b/gi, 'bench press'],
    [/\bbench price\b/gi, 'bench press'],
    [/\bbench fresh\b/gi, 'bench press'],
    [/\bbiceps? girl\b/gi, 'bicep curls'],
    [/\bbiceps? cur\b/gi, 'bicep curl'],
    [/\bdead left\b/gi, 'deadlift'],
    [/\bdead lift\b/gi, 'deadlift'],
    [/\boverhead past\b/gi, 'overhead press'],
    // Weight & Water
    [/\bwait is\b/gi, 'weight is'],
    [/\brate is\b/gi, 'weight is'],
    [/\bmy wait\b/gi, 'my weight'],
    [/\bhalf (?:a )?liter\b/gi, '500ml water'],
    [/\bone liter\b/gi, '1000ml water'],
    [/\btwo liters?\b/gi, '2000ml water']
  ];
  for (const [pattern, rep] of replacements) {
    clean = clean.replace(pattern, rep);
  }
  return clean;
}

async function parseUniversalVoiceIntent(text, date = new Date().toISOString().split('T')[0], userId = 'default_guest') {
  const db = readDB();
  const normalizedText = normalizeFitnessSpeech(text);
  const clean = normalizedText.toLowerCase().trim();

  // 1. INTENT: COACH QUESTIONS
  const isQuestion = clean.startsWith('how') || clean.startsWith('what') || clean.startsWith('can i') || 
                     clean.startsWith('why') || clean.startsWith('tell me') || clean.startsWith('give me') || 
                     clean.startsWith('should i') || clean.endsWith('?');
  const hasFoodAction = clean.includes('ate') || clean.includes('had') || clean.includes('eaten') || clean.includes('drank');
  if (isQuestion && !hasFoodAction) {
    return {
      intent: 'coach',
      summaryTitle: 'Ask AI Coach',
      previewDetails: text,
      badgeText: 'AI Coach Question',
      badgeColor: 'sky',
      originalText: text,
      parsedData: { question: text }
    };
  }

  // 2. INTENT: GYM WORKOUT & BIOMECHANICS PROGRESSION
  const gymKeywords = [
    'bench', 'squat', 'deadlift', 'press', 'curl', 'dumbbell', 'barbell', 'sets', 'reps',
    'workout', 'pushups', 'push-ups', 'pullups', 'pull-ups', 'flyes', 'pulldown', 'lunges',
    'tricep', 'bicep', 'shoulder', 'chest', 'leg', 'rows', 'incline', 'plank', 'dip', 'dips',
    'lateral raise', 'overhead press', 'ohp', 'hip thrust', 'leg press', 'abs'
  ];
  const hasSetRepPattern = /\b\d+\s*(?:sets|reps|x)\b/i.test(clean) || /\b\d+\s*sets?\s*(?:of\s*)?\d+\s*reps?\b/i.test(clean);
  const isWorkout = gymKeywords.some(kw => clean.includes(kw)) || hasSetRepPattern;

  if (isWorkout) {
    let exerciseName = 'Barbell Flat Bench Press';
    if (clean.includes('incline') && (clean.includes('dumbbell') || clean.includes('press'))) exerciseName = 'Incline Dumbbell Press';
    else if (clean.includes('incline') && clean.includes('bench')) exerciseName = 'Incline Barbell Bench Press';
    else if (clean.includes('bench')) exerciseName = 'Barbell Flat Bench Press';
    else if (clean.includes('squat')) exerciseName = 'Barbell Back Squat';
    else if (clean.includes('deadlift')) exerciseName = 'Conventional Barbell Deadlift';
    else if (clean.includes('overhead') || clean.includes('ohp') || clean.includes('shoulder press')) exerciseName = 'Standing Overhead Barbell Press (OHP)';
    else if (clean.includes('bicep') || (clean.includes('curl') && !clean.includes('leg'))) exerciseName = 'Dumbbell / Barbell Bicep Curls';
    else if (clean.includes('leg curl')) exerciseName = 'Seated Hamstring Leg Curls';
    else if (clean.includes('tricep') || clean.includes('pushdown')) exerciseName = 'Tricep Cable Rope Pushdown';
    else if (clean.includes('lat') || clean.includes('pulldown')) exerciseName = 'Wide-Grip Lat Pulldown';
    else if (clean.includes('leg press')) exerciseName = 'Leg Press (45-Degree Sled)';
    else if (clean.includes('pushup') || clean.includes('push up')) exerciseName = 'Standard Push-ups';
    else if (clean.includes('pullup') || clean.includes('pull up') || clean.includes('chin up')) exerciseName = 'Pull-ups / Chin-ups';
    else if (clean.includes('lateral raise')) exerciseName = 'Dumbbell Lateral Raises';
    else if (clean.includes('row')) exerciseName = 'Bent-Over Barbell Rows';
    else if (clean.includes('lunge')) exerciseName = 'Walking Dumbbell Lunges';

    const setsMatch = clean.match(/(\d+)\s*sets?/i);
    const repsMatch = clean.match(/(\d+)\s*reps?/i);
    const weightMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kgs)\b/i);

    const setsCount = setsMatch ? parseInt(setsMatch[1]) : 3;
    const repsCount = repsMatch ? parseInt(repsMatch[1]) : 10;
    const weightKg = weightMatch ? parseFloat(weightMatch[1]) : 50;

    return {
      intent: 'workout',
      summaryTitle: exerciseName,
      previewDetails: `${setsCount} sets × ${repsCount} reps @ ${weightKg} kg`,
      badgeText: 'Strength Workout',
      badgeColor: 'amber',
      originalText: text,
      parsedData: {
        exerciseName,
        setsCount,
        repsCount,
        weightKg,
        durationMin: 35,
        caloriesBurned: Math.round(setsCount * repsCount * 1.5 + 80)
      }
    };
  }

  // 3. INTENT: SCALE BODY WEIGHT (Strict check: personal weight only, never food portions or gym weights)
  const hasBodyWeightPhrase = clean.includes('scale weight') || clean.includes('my weight') || 
                              clean.includes('weighed myself') || clean.includes('body weight') || 
                              clean.includes('scale says') || clean.includes('weighed in at') || 
                              clean.includes('morning weight');
  const foodKeywords = ['chicken', 'paneer', 'rice', 'meat', 'egg', 'fish', 'mutton', 'dal', 'roti', 'dosa', 'idli', 'gram', 'grams', ' gm ', ' g '];
  const isFoodText = foodKeywords.some(fk => clean.includes(fk));

  if (hasBodyWeightPhrase || ((clean.includes('weight') || clean.includes('weighed') || clean.includes('scale')) && !isFoodText && !isWorkout)) {
    const weightMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos)?/);
    if (weightMatch) {
      const numWeight = parseFloat(weightMatch[1]);
      if (numWeight >= 30 && numWeight <= 300) {
        return {
          intent: 'weight',
          summaryTitle: 'Morning Scale Weight',
          previewDetails: `${numWeight} kg`,
          badgeText: 'Body Weight',
          badgeColor: 'teal',
          originalText: text,
          parsedData: {
            weightKg: numWeight
          }
        };
      }
    }
  }

  // 4. INTENT: WATER HYDRATION (Pure water only, no caloric drinks)
  const caloricDrinks = ['shake', 'protein', 'milk', 'tea', 'chai', 'coffee', 'juice', 'smoothie', 'lassi', 'curd', 'buttermilk', 'coke', 'soda'];
  const hasCaloricDrink = caloricDrinks.some(cd => clean.includes(cd));
  const hasWaterWord = clean.includes('water') || clean.includes('thanni') || clean.includes('hydration') || 
                       (clean.includes('glass') && !clean.includes('idli') && !clean.includes('dosa')) || 
                       (clean.includes('bottle') && !clean.includes('gourd'));

  if (hasWaterWord && !hasCaloricDrink) {
    let amountMl = 250;
    const mlMatch = clean.match(/(\d+)\s*(?:ml|milliliter|millilitres)/i);
    const literMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|liters|litre|litres)\b/i);
    const glassMatch = clean.match(/(\d+)\s*(?:glass|glasses)/i);
    const bottleMatch = clean.match(/(\d+)\s*(?:bottle|bottles)/i);

    if (mlMatch) amountMl = parseInt(mlMatch[1]);
    else if (literMatch) amountMl = Math.round(parseFloat(literMatch[1]) * 1000);
    else if (clean.includes('half a liter') || clean.includes('half liter')) amountMl = 500;
    else if (glassMatch) amountMl = parseInt(glassMatch[1]) * 250;
    else if (bottleMatch) amountMl = parseInt(bottleMatch[1]) * 500;
    else if (clean.includes('two glasses') || clean.includes('2 glasses')) amountMl = 500;
    else if (clean.includes('three glasses') || clean.includes('3 glasses')) amountMl = 750;
    else if (clean.includes('one bottle') || clean.includes('a bottle')) amountMl = 500;

    return {
      intent: 'water',
      summaryTitle: 'Water Hydration',
      previewDetails: `+${amountMl} ml (${(amountMl / 1000).toFixed(2)} L)`,
      badgeText: 'Hydration',
      badgeColor: 'blue',
      originalText: text,
      parsedData: {
        amountMl
      }
    };
  }

  // 5. INTENT: FASTRACK STEPS
  if ((clean.includes('step') || clean.includes('steps') || clean.includes('walked')) && !clean.includes('bench')) {
    const stepsMatch = clean.match(/(\d+[\d,]*)\s*(?:steps)?/);
    if (stepsMatch) {
      const steps = parseInt(stepsMatch[1].replace(/,/g, ''));
      if (steps > 0 && steps < 100000) {
        const activeCalories = Math.round(steps * 0.04);
        return {
          intent: 'fastrack',
          summaryTitle: 'Fastrack Steps Log',
          previewDetails: `${steps.toLocaleString()} steps (+${activeCalories} active kcal)`,
          badgeText: 'Smartwatch Activity',
          badgeColor: 'emerald',
          originalText: text,
          parsedData: {
            steps,
            activeCalories
          }
        };
      }
    }
  }

  // 6. DEFAULT INTENT: DIET & MEAL (Food, Caloric Drinks, South Indian & Global items)
  let mealType = 'lunch';
  if (clean.includes('breakfast') || clean.includes('morning')) mealType = 'breakfast';
  else if (clean.includes('lunch') || clean.includes('afternoon')) mealType = 'lunch';
  else if (clean.includes('dinner') || clean.includes('night')) mealType = 'dinner';
  else if (clean.includes('snack') || clean.includes('tea') || clean.includes('evening') || clean.includes('shake')) mealType = 'snack';
  else {
    const currentHour = new Date().getHours();
    if (currentHour < 11) mealType = 'breakfast';
    else if (currentHour < 15) mealType = 'lunch';
    else if (currentHour < 19) mealType = 'snack';
    else mealType = 'dinner';
  }

  const apiKey = getUserApiKey(db, userId);
  aiService.setApiKey(apiKey);
  const analysis = await aiService.analyzeMealText(text);

  return {
    intent: 'meal',
    summaryTitle: analysis.mealName || text.slice(0, 35),
    previewDetails: `${analysis.totalCalories || 250} kcal • ${analysis.totalProtein || 15}g P • ${analysis.totalCarbs || 30}g C • ${analysis.totalFat || 8}g F`,
    badgeText: mealType.toUpperCase(),
    badgeColor: 'emerald',
    originalText: text,
    parsedData: {
      mealType,
      name: analysis.mealName || text.slice(0, 35),
      foods: analysis.items || [],
      totalCalories: analysis.totalCalories || 250,
      totalProtein: analysis.totalProtein || 15,
      totalCarbs: analysis.totalCarbs || 30,
      totalFat: analysis.totalFat || 8
    }
  };
}

// Commit verified voice intent to Database
async function commitUniversalVoice(intent, payload, originalText = '', date = new Date().toISOString().split('T')[0], userId = 'default_guest') {
  const db = readDB();

  // Commit MEAL
  if (intent === 'meal') {
    const newMeal = {
      id: `meal-${Date.now()}`,
      userId,
      date,
      mealType: payload.mealType || 'lunch',
      name: payload.name || originalText.slice(0, 35),
      foods: payload.foods || [],
      totalCalories: payload.totalCalories || 250,
      totalProtein: payload.totalProtein || 15,
      totalCarbs: payload.totalCarbs || 30,
      totalFat: payload.totalFat || 8,
      notes: `Logged via Universal Voice Assistant on ${date}`,
      loggedAt: new Date().toISOString()
    };
    db.meals = db.meals || [];
    db.meals.unshift(newMeal);
    writeDB(db);

    return {
      success: true,
      section: 'diet',
      action: 'log_meal',
      meal: newMeal,
      feedback: `Logged to ${newMeal.mealType.toUpperCase()}: ${newMeal.name} (+${newMeal.totalCalories} kcal, ${newMeal.totalProtein}g protein)!`
    };
  }

  // Commit WORKOUT
  if (intent === 'workout') {
    const newWorkout = {
      id: `workout-${Date.now()}`,
      userId,
      date,
      title: `${payload.exerciseName} Session`,
      splitType: 'Strength',
      exercises: [{
        name: payload.exerciseName,
        sets: Array.from({ length: payload.setsCount || 3 }, () => ({
          reps: payload.repsCount || 10,
          weight: payload.weightKg || 50,
          done: true
        }))
      }],
      durationMin: payload.durationMin || 35,
      caloriesBurned: payload.caloriesBurned || 125,
      notes: `Logged via Universal Voice Assistant: "${originalText}"`,
      loggedAt: new Date().toISOString()
    };
    db.workouts = db.workouts || [];
    db.workouts.unshift(newWorkout);
    writeDB(db);

    return {
      success: true,
      section: 'workouts',
      action: 'log_workout',
      workout: newWorkout,
      feedback: `Logged workout: ${payload.exerciseName} (${payload.setsCount} sets × ${payload.repsCount} reps @ ${payload.weightKg} kg)!`
    };
  }

  // Commit WATER
  if (intent === 'water') {
    const amountMl = payload.amountMl || 250;
    db.waterLogs = db.waterLogs || [];
    let waterEntry = db.waterLogs.find(w => (!w.userId || w.userId === userId) && w.date === date);
    if (waterEntry) {
      waterEntry.amountMl = Math.max(0, waterEntry.amountMl + amountMl);
    } else {
      waterEntry = { date, userId, amountMl };
      db.waterLogs.push(waterEntry);
    }
    writeDB(db);

    return {
      success: true,
      section: 'water',
      action: 'log_water',
      amountMl,
      totalMl: waterEntry.amountMl,
      feedback: `Logged +${amountMl} ml of water! Today's Total: ${waterEntry.amountMl} ml`
    };
  }

  // Commit SCALE WEIGHT
  if (intent === 'weight') {
    const numWeight = payload.weightKg;
    const userProfile = getUserProfile(db, userId);
    userProfile.weightKg = numWeight;
    db.weightLogs = db.weightLogs || [];
    const existing = db.weightLogs.find(w => (!w.userId || w.userId === userId) && w.date === date);
    if (existing) {
      existing.weightKg = numWeight;
    } else {
      db.weightLogs.push({ date, userId, weightKg: numWeight });
    }
    writeDB(db);

    return {
      success: true,
      section: 'weight',
      action: 'log_weight',
      weightKg: numWeight,
      feedback: `Recorded your scale weight: ${numWeight} kg!`
    };
  }

  // Commit FASTRACK STEPS
  if (intent === 'fastrack') {
    const steps = payload.steps || 5000;
    const activeCalories = payload.activeCalories || Math.round(steps * 0.04);
    db.fastrackLogs = db.fastrackLogs || [];
    let log = db.fastrackLogs.find(l => (!l.userId || l.userId === userId) && l.date === date);
    if (log) {
      log.steps = steps;
      log.activeCalories = activeCalories;
    } else {
      log = {
        date,
        userId,
        deviceName: 'Fastrack Smartwatch',
        steps,
        activeCalories,
        batteryLevel: 85,
        syncedAt: new Date().toISOString()
      };
      db.fastrackLogs.unshift(log);
    }
    writeDB(db);

    return {
      success: true,
      section: 'fastrack',
      action: 'log_steps',
      steps,
      feedback: `Logged ${steps.toLocaleString()} steps (+${activeCalories} active kcal) to Fastrack!`
    };
  }

  // Commit COACH QUESTION
  if (intent === 'coach') {
    aiService.setApiKey(getUserApiKey(db, userId));
    const userProfile = getUserProfile(db, userId);
    const todayMeals = (db.meals || []).filter(m => (!m.userId || m.userId === userId) && m.date === date);
    const consumedCalories = todayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);
    const consumedProtein = Number(todayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0).toFixed(1));
    const fastrackLog = (db.fastrackLogs || []).find(l => (!l.userId || l.userId === userId) && l.date === date);

    const coachStats = {
      consumedCalories,
      consumedProtein,
      steps: fastrackLog?.steps || 0,
      activeCaloriesBurned: fastrackLog?.activeCalories || 0
    };

    const userChat = (db.chatHistory || []).filter(c => !c.userId || c.userId === userId);
    const { reply } = await aiService.askCoachChat(originalText || payload.question, userChat, userProfile, coachStats);

    return {
      success: true,
      section: 'coach',
      action: 'coach_reply',
      reply,
      feedback: reply
    };
  }

  throw new Error(`Unknown intent type: ${intent}`);
}

async function executeUniversalVoice(text, date = new Date().toISOString().split('T')[0], userId = 'default_guest') {
  const parsed = await parseUniversalVoiceIntent(text, date, userId);
  return await commitUniversalVoice(parsed.intent, parsed.parsedData, text, date, userId);
}

// POST endpoint for previewing voice intent before saving
app.post('/api/ai/parse-voice-intent', async (req, res) => {
  try {
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const { text, date = new Date().toISOString().split('T')[0] } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Voice speech text is required' });
    }
    const preview = await parseUniversalVoiceIntent(text, date, userId);
    res.json({ success: true, ...preview });
  } catch (err) {
    console.error('Parse voice intent error:', err);
    res.status(500).json({ error: 'Failed to parse voice intent', details: err.message });
  }
});

// POST endpoint for executing universal voice (direct or confirmed)
app.post('/api/ai/universal-voice', async (req, res) => {
  try {
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const { text, confirmedIntent, payload, date = new Date().toISOString().split('T')[0] } = req.body;
    
    // If client verified intent in Step 2:
    if (confirmedIntent && payload) {
      const result = await commitUniversalVoice(confirmedIntent, payload, text || '', date, userId);
      return res.json(result);
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Voice speech text is required' });
    }
    const result = await executeUniversalVoice(text, date, userId);
    res.json(result);
  } catch (err) {
    console.error('Universal voice processing error:', err);
    res.status(500).json({ error: 'Failed to process voice command', details: err.message });
  }
});

// POST endpoint for direct audio recording upload with Gemini multimodal transcription
app.post('/api/ai/universal-voice-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No audio recording file provided' });
    }
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const apiKey = getUserApiKey(db, userId);

    if (!apiKey) {
      return res.json({
        success: false,
        needsApiKey: true,
        error: 'Gemini API Key Required',
        details: 'To transcribe direct voice audio files, please add your free Gemini API key in Settings, or use instant browser speech / text input.'
      });
    }

    aiService.setApiKey(apiKey);

    const mimeType = req.file.mimetype || 'audio/webm';
    let transcribedText = '';
    try {
      transcribedText = await aiService.transcribeAudio(req.file.buffer, mimeType);
    } catch (transcribeErr) {
      console.warn('Audio transcription error:', transcribeErr.message);
      return res.json({
        success: false,
        needsApiKey: true,
        error: 'Gemini Transcription: ' + transcribeErr.message,
        details: 'Could not transcribe with this Gemini API key. Ensure your key is valid in Google AI Studio, or tap the microphone to use browser speech recognition.'
      });
    }

    if (!transcribedText) {
      return res.json({ 
        success: false, 
        error: 'Could not detect clear speech in the audio. Please try speaking closer to the microphone or type what you did below.' 
      });
    }

    const preview = await parseUniversalVoiceIntent(transcribedText, date, userId);
    res.json({
      success: true,
      transcribedText,
      preview
    });
  } catch (err) {
    console.error('Voice audio upload error:', err);
    res.status(500).json({ error: 'Failed to process voice audio', details: err.message });
  }
});

app.get('/api/ai/saved-meal-plan', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  let plan = null;
  if (isSupabaseReady()) {
    try {
      plan = await fetchMealPlanFromSupabase(userId);
    } catch (e) {}
  }
  if (!plan) {
    plan = db.savedMealPlan || null;
  }
  res.json({ success: true, plan });
});

app.post('/api/ai/save-meal-plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ error: 'Plan is required' });
    const db = readDB();
    const userId = getAuthUserId(req, db);
    db.savedMealPlan = plan;
    writeDB(db);

    if (isSupabaseReady()) {
      try {
        await syncMealPlanToSupabase(userId, plan);
      } catch (e) {}
    }

    res.json({ success: true, message: 'Meal plan saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save meal plan', details: err.message });
  }
});

app.post('/api/ai/generate-meal-plan', async (req, res) => {
  try {
    const { preference = 'south_indian_mixed', daysCount = 7, forceFresh = false, shuffle = false, seed = null } = req.body;
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const userProfile = getUserProfile(db, userId);

    aiService.setApiKey(getUserApiKey(db, userId));
    const shouldForceFresh = Boolean(forceFresh) || Boolean(shuffle) || Boolean(seed);
    const plan = await aiService.generateDailyMealPlan(userProfile, preference, Number(daysCount) || 7, {
      forceFresh: shouldForceFresh,
      seed
    });

    // Persist saved meal plan to local memory & Supabase PostgreSQL
    db.savedMealPlan = plan;

    if (isSupabaseReady()) {
      try {
        await syncMealPlanToSupabase(userId, plan);
      } catch (e) {}
    }

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

app.post('/api/ai/swap-meal', (req, res) => {
  try {
    const { mealType, currentTitle, targetCalories, targetProtein, preference } = req.body;
    const newMeal = aiService.swapMeal({
      mealType,
      currentTitle,
      targetCalories,
      targetProtein,
      preference
    });
    res.json({ success: true, meal: newMeal });
  } catch (err) {
    console.error('Error swapping meal:', err);
    res.status(500).json({ error: 'Failed to swap meal', details: err.message });
  }
});

// --- WORKOUT TRACKING & AI PLAN ANALYZER ---
app.get('/api/workouts', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const date = req.query.date;

  let workouts = null;
  if (isSupabaseReady()) {
    try {
      const cloudWorkouts = await fetchWorkoutsFromSupabase(userId, date);
      if (Array.isArray(cloudWorkouts) && cloudWorkouts.length > 0) {
        workouts = cloudWorkouts;
      }
    } catch (e) {}
  }

  if (!workouts) {
    workouts = (db.workouts || []).filter(w => !w.userId || w.userId === userId);
    if (date) {
      workouts = workouts.filter(w => w.date === date);
    }
  }
  res.json({ workouts });
});

app.post('/api/workouts', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const { date, title, splitType, exercises, durationMin, caloriesBurned, notes } = req.body;

  const newWorkout = {
    id: `workout-${Date.now()}`,
    userId,
    date: date || new Date().toISOString().split('T')[0],
    title: title || 'Workout Session',
    splitType: splitType || 'Strength',
    exercises: exercises || [],
    durationMin: Number(durationMin) || 45,
    caloriesBurned: Number(caloriesBurned) || 300,
    notes: notes || '',
    loggedAt: new Date().toISOString()
  };

  db.workouts = db.workouts || [];
  db.workouts.unshift(newWorkout);
  writeDB(db);

  if (isSupabaseReady()) {
    syncWorkoutToSupabase(newWorkout).catch(e => console.warn('[Supabase workout sync notice]:', e.message));
  }

  res.status(201).json({ success: true, workout: newWorkout });
});

app.delete('/api/workouts/:id', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const id = req.params.id;
  db.workouts = (db.workouts || []).filter(w => !(w.id === id && (!w.userId || w.userId === userId)));
  writeDB(db);

  if (isSupabaseReady()) {
    deleteWorkoutFromSupabase(id).catch(e => console.warn('[Supabase workout delete notice]:', e.message));
  }

  res.json({ success: true, message: 'Workout deleted' });
});

// Calculate Personal Records (PR) & Last Session Weights per Exercise
app.get('/api/workouts/prs', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const workouts = (db.workouts || []).filter(w => !w.userId || w.userId === userId);
  
  // Sort ascending by date to track history sequentially
  const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const prs = {};
  
  sorted.forEach(w => {
    (w.exercises || []).forEach(ex => {
      const name = ex.name?.trim();
      if (!name) return;
      
      if (!prs[name]) {
        prs[name] = {
          name,
          maxWeight: 0,
          repsAtMaxWeight: 0,
          prDate: w.date,
          lastWeight: 0,
          lastReps: 0,
          lastDate: w.date,
          history: []
        };
      }
      
      let sessionMaxWeight = 0;
      let sessionRepsAtMax = 0;
      
      (ex.sets || []).forEach(set => {
        const wt = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        
        if (wt > sessionMaxWeight) {
          sessionMaxWeight = wt;
          sessionRepsAtMax = reps;
        } else if (wt === sessionMaxWeight && reps > sessionRepsAtMax) {
          sessionRepsAtMax = reps;
        }
      });
      
      if (sessionMaxWeight > 0) {
        prs[name].lastWeight = sessionMaxWeight;
        prs[name].lastReps = sessionRepsAtMax;
        prs[name].lastDate = w.date;
        
        if (sessionMaxWeight > prs[name].maxWeight || 
           (sessionMaxWeight === prs[name].maxWeight && sessionRepsAtMax > prs[name].repsAtMaxWeight)) {
          prs[name].maxWeight = sessionMaxWeight;
          prs[name].repsAtMaxWeight = sessionRepsAtMax;
          prs[name].prDate = w.date;
        }
        
        prs[name].history.push({
          date: w.date,
          weight: sessionMaxWeight,
          reps: sessionRepsAtMax
        });
      }
    });
  });
  
  res.json({ success: true, prs });
});

// --- SOLO LEVELING HUNTER SYSTEM ---
app.get('/api/hunter/stats', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const profile = getUserProfile(db, userId);
  const today = req.query.date || new Date().toISOString().split('T')[0];

  // 1. Gather today's metrics
  let meals = (db.meals || []).filter(m => (!m.userId || m.userId === userId) && m.date === today);
  let workouts = (db.workouts || []).filter(w => (!w.userId || w.userId === userId) && w.date === today);
  let watchLog = (db.fastrackLogs || []).find(l => (!l.userId || l.userId === userId) && l.date === today);

  if (isSupabaseReady()) {
    try {
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 2000));
      const [cloudMealsRes, cloudWorkoutsRes, cloudWatchRes] = await Promise.allSettled([
        Promise.race([fetchMealsFromSupabase(userId, today), timeoutPromise]),
        Promise.race([fetchWorkoutsFromSupabase(userId, today), timeoutPromise]),
        Promise.race([fetchWatchLogFromSupabase(userId, today), timeoutPromise])
      ]);
      if (cloudMealsRes.status === 'fulfilled' && Array.isArray(cloudMealsRes.value) && cloudMealsRes.value.length > 0) {
        meals = cloudMealsRes.value;
      }
      if (cloudWorkoutsRes.status === 'fulfilled' && Array.isArray(cloudWorkoutsRes.value) && cloudWorkoutsRes.value.length > 0) {
        workouts = cloudWorkoutsRes.value;
      }
      if (cloudWatchRes.status === 'fulfilled' && cloudWatchRes.value) {
        watchLog = cloudWatchRes.value;
      }
    } catch (e) {
      console.warn('[Hunter Stats] Supabase query fallback:', e.message);
    }
  }

  const todayCalories = meals.reduce((a, m) => a + (Number(m.totalCalories) || 0), 0);
  const todayProtein = meals.reduce((a, m) => a + (Number(m.totalProtein) || 0), 0);
  const todaySteps = Number(watchLog?.steps) || 0;
  const todaySleep = Number(watchLog?.sleepHours) || 7.0;
  const todayWorkoutSets = workouts.reduce((a, w) => a + ((w.sets || []).length || 3), 0);

  // Lifetime user stats
  if (!db.hunterProfiles) db.hunterProfiles = {};
  if (!db.hunterProfiles[userId]) {
    db.hunterProfiles[userId] = {
      level: 1,
      xp: 0,
      totalQuestsCompleted: 0,
      claimedQuests: {},
      title: 'E-Rank Awakened Hunter'
    };
  }
  const hProfile = db.hunterProfiles[userId];

  // Calculate 5 Core Stats (Scaled 10 to 100)
  const str = Math.min(100, Math.round(15 + (todayWorkoutSets * 3.5) + (hProfile.level * 1.5)));
  const agi = Math.min(100, Math.round(15 + (todaySteps / 200) + (hProfile.level * 1.2)));
  const vit = Math.min(100, Math.round(15 + (todayProtein / 2.5) + (todaySleep * 2.5)));
  const intStat = Math.min(100, Math.round(20 + (hProfile.totalQuestsCompleted * 2)));
  const per = Math.min(100, Math.round(15 + (meals.length * 8) + (todayCalories > 0 ? 15 : 0)));

  // Daily Quests Status
  const targetProtein = profile.dailyTargetProtein || 130;
  const targetSteps = profile.dailyTargetSteps || 10000;

  const quests = [
    {
      id: 'quest_agi_steps',
      stat: 'AGI',
      title: 'Agility Trial: 10,000 Steps',
      description: 'Traverse the dungeon realm with 10k physical steps',
      target: targetSteps,
      current: todaySteps,
      isCompleted: todaySteps >= targetSteps,
      xp: 40
    },
    {
      id: 'quest_vit_protein',
      stat: 'VIT',
      title: 'Vitality Trial: Hit Protein Target',
      description: `Consume ${targetProtein}g of protein to regenerate muscle tissue`,
      target: targetProtein,
      current: Math.round(todayProtein),
      isCompleted: todayProtein >= targetProtein,
      xp: 40
    },
    {
      id: 'quest_str_gym',
      stat: 'STR',
      title: 'Strength Trial: Slay the Iron',
      description: 'Complete at least 1 gym workout session today',
      target: 1,
      current: workouts.length > 0 ? 1 : 0,
      isCompleted: workouts.length > 0,
      xp: 40
    },
    {
      id: 'quest_per_log',
      stat: 'PER',
      title: 'Perception Trial: Full Meal Logging',
      description: 'Log all 3 daily South Indian meals with awareness',
      target: 3,
      current: Math.min(3, meals.length),
      isCompleted: meals.length >= 3,
      xp: 30
    }
  ];

  // Rank Calculation
  let rank = 'E-Rank Hunter';
  let title = 'E-Rank Novice';
  const lv = hProfile.level || 1;
  if (lv >= 75) { rank = 'S-Rank Hunter'; title = 'Shadow Monarch / S-Rank Elite'; }
  else if (lv >= 50) { rank = 'A-Rank Hunter'; title = 'Dungeon Raid Leader'; }
  else if (lv >= 30) { rank = 'B-Rank Hunter'; title = 'High-Tier Awakened'; }
  else if (lv >= 15) { rank = 'C-Rank Hunter'; title = 'Dungeon Striker'; }
  else if (lv >= 6) { rank = 'D-Rank Hunter'; title = 'Awakened Fighter'; }

  // Check penalty condition (Past 10 PM and quests unfinished)
  const currentHour = new Date().getHours();
  const allQuestsCompleted = quests.every(q => q.isCompleted);
  const isPenaltyActive = currentHour >= 22 && !allQuestsCompleted;

  res.json({
    success: true,
    hunter: {
      userId,
      level: lv,
      xp: hProfile.xp || 0,
      xpToNextLevel: lv * 100,
      rank,
      title,
      totalQuestsCompleted: hProfile.totalQuestsCompleted || 0,
      claimedQuests: hProfile.claimedQuests?.[today] || [],
      stats: {
        str,
        agi,
        vit,
        int: intStat,
        per
      },
      quests,
      isPenaltyActive,
      penaltyDescription: '50 Push-Ups or 15-Minute Night Walk to evade the penalty zone!'
    }
  });
});

app.post('/api/hunter/claim-quest', (req, res) => {
  const { questId, date } = req.body;
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const today = date || new Date().toISOString().split('T')[0];

  if (!db.hunterProfiles) db.hunterProfiles = {};
  if (!db.hunterProfiles[userId]) {
    db.hunterProfiles[userId] = { level: 1, xp: 0, totalQuestsCompleted: 0, claimedQuests: {} };
  }
  const h = db.hunterProfiles[userId];
  if (!h.claimedQuests) h.claimedQuests = {};
  if (!h.claimedQuests[today]) h.claimedQuests[today] = [];

  if (h.claimedQuests[today].includes(questId)) {
    return res.json({ success: true, message: 'Already claimed', level: h.level, xp: h.xp });
  }

  h.claimedQuests[today].push(questId);
  h.xp = (h.xp || 0) + 40;
  h.totalQuestsCompleted = (h.totalQuestsCompleted || 0) + 1;

  // Level up calculation
  let leveledUp = false;
  while (h.xp >= h.level * 100) {
    h.xp -= h.level * 100;
    h.level += 1;
    leveledUp = true;
  }

  writeDB(db);
  res.json({ success: true, level: h.level, xp: h.xp, leveledUp });
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
    const userId = getAuthUserId(req, db);
    const userProfile = getUserProfile(db, userId);
    aiService.setApiKey(getUserApiKey(db, userId));

    const analysis = await aiService.analyzeWorkoutPlan(planText, userProfile);

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
app.get('/api/fastrack/summary', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const bmr = FastrackService.calculateBMR(
    userProfile.weightKg || 70,
    userProfile.heightCm || 175,
    userProfile.age || 24,
    userProfile.gender || 'male'
  );

  let cloudLog = null;
  if (isSupabaseReady()) {
    try {
      cloudLog = await fetchWatchLogFromSupabase(userId, date);
    } catch (e) {}
  }

  const defaultLog = {
    date,
    userId,
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

  const localLog = (db.fastrackLogs || []).find(l => (!l.userId || l.userId === userId) && l.date === date);
  const log = cloudLog || localLog || defaultLog;

  res.json({ success: true, log });
});

app.post('/api/fastrack/sync', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
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
    userProfile.weightKg,
    userProfile.heightCm,
    userProfile.age,
    userProfile.gender
  );

  const active = Number(activeCalories) || Math.round((Number(steps) || 0) * 0.04);
  const totalBurned = bmr + active;

  const syncRecord = {
    id: `fastrack-${Date.now()}`,
    userId,
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

  // Replace or add isolated by user and date
  db.fastrackLogs = db.fastrackLogs || [];
  const existingIdx = db.fastrackLogs.findIndex(l => (!l.userId || l.userId === userId) && l.date === date);
  if (existingIdx >= 0) {
    db.fastrackLogs[existingIdx] = syncRecord;
  } else {
    db.fastrackLogs.unshift(syncRecord);
  }

  writeDB(db);

  if (isSupabaseReady()) {
    syncWatchLogToSupabase(syncRecord).catch(() => {});
  }

  res.json({ success: true, log: syncRecord });
});

// Automatic Watch Sync telemetry endpoint (receives live streaming pulses)
app.post('/api/fastrack/auto-sync', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const date = req.body.date || new Date().toISOString().split('T')[0];
  
  db.fastrackLogs = db.fastrackLogs || [];
  let existing = db.fastrackLogs.find(l => (!l.userId || l.userId === userId) && l.date === date);

  const bmr = FastrackService.calculateBMR(
    userProfile.weightKg,
    userProfile.heightCm,
    userProfile.age,
    userProfile.gender
  );

  const incomingSteps = req.body.steps !== undefined ? Number(req.body.steps) : null;
  const steps = (incomingSteps !== null && incomingSteps > 0) 
    ? Math.max(existing?.steps || 0, incomingSteps) 
    : (existing?.steps || 0);

  const incomingActive = req.body.activeCalories !== undefined ? Number(req.body.activeCalories) : null;
  const activeCalories = (incomingActive !== null && incomingActive > 0)
    ? incomingActive
    : (existing?.activeCalories || Math.round(steps * 0.04));

  const avgHeartRate = req.body.avgHeartRate !== undefined && Number(req.body.avgHeartRate) > 0 
    ? Number(req.body.avgHeartRate) 
    : (existing?.avgHeartRate || null);
  const peakHeartRate = Math.max(existing?.peakHeartRate || 0, Number(req.body.peakHeartRate) || (avgHeartRate || 0));
  const incomingDist = req.body.distanceKm !== undefined ? Number(req.body.distanceKm) : null;
  const distanceKm = (incomingDist !== null && incomingDist > 0)
    ? Number(incomingDist.toFixed(2))
    : Number(((steps * 0.00075).toFixed(2)));
  const totalBurned = bmr + activeCalories;

  const autoRecord = {
    id: existing?.id || `fastrack-${Date.now()}`,
    userId,
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

  const existingIdx = db.fastrackLogs.findIndex(l => (!l.userId || l.userId === userId) && l.date === date);
  if (existingIdx >= 0) {
    db.fastrackLogs[existingIdx] = autoRecord;
  } else {
    db.fastrackLogs.unshift(autoRecord);
  }

  writeDB(db);

  if (isSupabaseReady()) {
    syncWatchLogToSupabase(autoRecord).catch(e => console.warn('[Supabase watch log sync notice]:', e.message));
  }

  res.json({ success: true, log: autoRecord, autoSync: true });
});

// --- ENERGY BALANCE (DIET + FASTRACK BURN) ---
app.get('/api/energy-balance', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const meals = (db.meals || []).filter(m => (!m.userId || m.userId === userId) && m.date === date);
  const consumedCalories = meals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const fastrackLog = (db.fastrackLogs || []).find(l => (!l.userId || l.userId === userId) && l.date === date);

  const balance = FastrackService.calculateEnergyBalance(consumedCalories, fastrackLog, userProfile);
  res.json({ date, balance });
});

// --- WATER & WEIGHT LOGGING ---
app.get('/api/water', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const entry = (db.waterLogs || []).find(w => (!w.userId || w.userId === userId) && w.date === date) || { date, amountMl: 0 };
  res.json({ date, amountMl: entry.amountMl, targetMl: userProfile.dailyTargetWater || 3000 });
});

app.post('/api/water/log', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const { date = new Date().toISOString().split('T')[0], amountMl = 250 } = req.body;

  db.waterLogs = db.waterLogs || [];
  const existing = db.waterLogs.find(w => (!w.userId || w.userId === userId) && w.date === date);
  if (existing) {
    existing.amountMl = Math.max(0, existing.amountMl + Number(amountMl));
    existing.userId = userId;
  } else {
    db.waterLogs.push({ userId, date, amountMl: Math.max(0, Number(amountMl)) });
  }

  writeDB(db);
  if (isSupabaseReady()) {
    const totalMl = existing ? existing.amountMl : Math.max(0, Number(amountMl));
    syncWaterLogToSupabase(userId, date, Math.round(totalMl / 250), totalMl).catch(() => {});
  }
  res.json({ success: true, water: existing || { date, amountMl } });
});

app.get('/api/weight', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const userWeightLogs = (db.weightLogs || []).filter(w => !w.userId || w.userId === userId);
  res.json({ weightLogs: userWeightLogs, currentWeight: userProfile.weightKg });
});

app.post('/api/weight/log', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const { date = new Date().toISOString().split('T')[0], weightKg } = req.body;
  if (!weightKg) return res.status(400).json({ error: 'weightKg is required' });

  const numWeight = parseFloat(weightKg);
  userProfile.weightKg = numWeight;
  if (userId && db.profiles && db.profiles[userId]) {
    db.profiles[userId].weightKg = numWeight;
  }
  db.profile.weightKg = numWeight;

  db.weightLogs = db.weightLogs || [];
  const existing = db.weightLogs.find(w => (!w.userId || w.userId === userId) && w.date === date);
  if (existing) {
    existing.weightKg = numWeight;
    existing.userId = userId;
  } else {
    db.weightLogs.push({ userId, date, weightKg: numWeight });
  }

  writeDB(db);
  if (isSupabaseReady()) {
    syncWeightLogToSupabase(userId, date, numWeight).catch(() => {});
  }
  res.json({ success: true, currentWeight: numWeight, profile: userProfile });
});

// --- INTERACTIVE 7-DAY & 30-DAY TREND ANALYTICS ---
app.get('/api/analytics/trends', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const profile = getUserProfile(db, userId);
  const daysCount = parseInt(req.query.days) || 7;
  
  const targetCalories = Number(profile.dailyTargetCalories) || 2100;
  const targetProtein = Number(profile.dailyTargetProtein) || 140;
  const targetSteps = Number(profile.dailyTargetSteps) || 10000;
  const bmr = Number(profile.weightKg ? profile.weightKg * 22 : 1800);

  const today = new Date();
  const dailyTrend = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Meals on this date (isolated by userId)
    const dayMeals = (db.meals || []).filter(m => (!m.userId || m.userId === userId) && m.date === dateStr);
    const calories = dayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);
    const protein = Number(dayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0).toFixed(1));
    const carbs = Number(dayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0).toFixed(1));
    const fat = Number(dayMeals.reduce((s, m) => s + (m.totalFat || 0), 0).toFixed(1));

    // Fastrack log
    const watchLog = (db.fastrackLogs || []).find(l => (!l.userId || l.userId === userId) && l.date === dateStr);
    const steps = watchLog?.steps || 0;
    const activeBurn = watchLog?.activeCalories || 0;
    const totalBurn = Math.round(bmr + activeBurn);

    // Water log
    const waterEntry = (db.waterLogs || []).find(w => (!w.userId || w.userId === userId) && w.date === dateStr);
    const waterMl = waterEntry?.amountMl || 0;

    // Weight log
    const weightEntry = (db.weightLogs || []).find(w => (!w.userId || w.userId === userId) && w.date === dateStr);
    const weightKg = weightEntry?.weightKg || null;

    // Workouts
    const dayWorkouts = (db.workouts || []).filter(w => (!w.userId || w.userId === userId) && w.date === dateStr);

    dailyTrend.push({
      date: dateStr,
      dayLabel,
      shortDate,
      calories,
      targetCalories,
      protein,
      targetProtein,
      carbs,
      fat,
      waterMl,
      steps,
      targetSteps,
      activeBurn,
      totalBurn,
      netDeficit: totalBurn - calories,
      weightKg,
      workoutsCount: dayWorkouts.length
    });
  }

  // Calculate summary metrics
  const loggedDaysWithFood = dailyTrend.filter(d => d.calories > 0);
  const avgCalories = loggedDaysWithFood.length > 0 
    ? Math.round(loggedDaysWithFood.reduce((s, d) => s + d.calories, 0) / loggedDaysWithFood.length) 
    : 0;

  const avgProtein = loggedDaysWithFood.length > 0 
    ? Math.round(loggedDaysWithFood.reduce((s, d) => s + d.protein, 0) / loggedDaysWithFood.length) 
    : 0;

  const loggedDaysWithSteps = dailyTrend.filter(d => d.steps > 0);
  const avgSteps = loggedDaysWithSteps.length > 0 
    ? Math.round(loggedDaysWithSteps.reduce((s, d) => s + d.steps, 0) / loggedDaysWithSteps.length) 
    : 0;

  const proteinHitDays = loggedDaysWithFood.filter(d => d.protein >= targetProtein * 0.85).length;
  const proteinConsistencyRate = loggedDaysWithFood.length > 0 
    ? Math.round((proteinHitDays / loggedDaysWithFood.length) * 100) 
    : 0;

  res.json({
    success: true,
    daysCount,
    dailyTrend,
    summary: {
      avgCalories,
      avgProtein,
      avgSteps,
      proteinConsistencyRate,
      currentWeight: profile.weightKg || null
    }
  });
});

// --- BEFORE / AFTER BODY PROGRESS PHOTO VAULT (ONLINE CLOUD STORAGE & BACKEND HOSTED) ---
app.get('/api/progress/photos', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  let photos = (db.photoVault || []).filter(p => !p.userId || p.userId === userId);

  if (isSupabaseReady()) {
    try {
      const cloudPhotos = await getPhotosFromSupabase(userId);
      if (cloudPhotos && cloudPhotos.length > 0) {
        const photoMap = new Map();
        photos.forEach(p => photoMap.set(p.id, p));
        cloudPhotos.forEach(p => photoMap.set(p.id, p));
        photos = Array.from(photoMap.values());
      }
    } catch (e) {
      console.warn('Error fetching photos from Supabase:', e.message);
    }
  }

  photos.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json({ success: true, photos });
});

app.post('/api/progress/photos', async (req, res) => {
  try {
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const userProfile = getUserProfile(db, userId);
    const { date = new Date().toISOString().split('T')[0], type = 'checkin', photoUrl, weightKg, pose = 'front', notes = '' } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'photoUrl is required' });
    }

    const photoId = `photo-${Date.now()}`;
    const effectiveWeight = weightKg ? parseFloat(weightKg) : (userProfile.weightKg || null);
    const savedUrl = await uploadImageToOnlineStorage(photoUrl, { 
      userId, 
      date, 
      pose, 
      id: photoId, 
      weightKg: effectiveWeight, 
      notes, 
      type 
    });

    const newPhoto = {
      id: photoId,
      userId,
      date,
      type, // 'before' | 'after' | 'checkin'
      pose, // 'front' | 'side' | 'back'
      photoUrl: savedUrl,
      weightKg: weightKg ? parseFloat(weightKg) : (userProfile.weightKg || null),
      notes,
      createdAt: new Date().toISOString()
    };

    db.photoVault = db.photoVault || [];
    db.photoVault.unshift(newPhoto);
    writeDB(db);

    res.status(201).json({ success: true, photo: newPhoto });
  } catch (err) {
    console.error('Error saving single photo to vault:', err);
    res.status(500).json({ error: 'Failed to save photo to cloud vault', details: err.message });
  }
});

// Batch Save a Full Day's Check-in Session (Front, Side, Back poses together)
// NEVER deletes old days: all days are permanently preserved online in chronological order.
app.post('/api/progress/day-checkin', async (req, res) => {
  try {
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const userProfile = getUserProfile(db, userId);
    const { 
      date = new Date().toISOString().split('T')[0], 
      type = 'checkin', 
      weightKg, 
      notes = '', 
      photos = [] // Array of { pose: 'front'|'side'|'back', photoUrl: '...' }
    } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'At least one photo (front, side, or back) is required for day check-in' });
    }

    const effectiveWeight = weightKg ? parseFloat(weightKg) : (userProfile.weightKg || null);
    db.photoVault = db.photoVault || [];

    const savedPhotos = [];
    const baseTime = Date.now();

    for (let index = 0; index < photos.length; index++) {
      const item = photos[index];
      if (item && item.photoUrl) {
        const photoId = `photo-${baseTime}-${index}`;
        const savedUrl = await uploadImageToOnlineStorage(item.photoUrl, { 
          userId, 
          date, 
          pose: item.pose || 'front', 
          id: photoId, 
          weightKg: effectiveWeight, 
          notes: item.notes || notes || '', 
          type 
        });

        // If user is updating the EXACT same pose for the SAME date, clean up the old file & replace
        const existingIdx = db.photoVault.findIndex(p => p.userId === userId && p.date === date && p.pose === (item.pose || 'front'));
        if (existingIdx !== -1) {
          deleteImageFromOnlineStorage(db.photoVault[existingIdx].photoUrl, db.photoVault[existingIdx].id);
          db.photoVault.splice(existingIdx, 1);
        }

        const newPhoto = {
          id: photoId,
          userId,
          date,
          type, // 'before' | 'after' | 'checkin'
          pose: item.pose || 'front',
          photoUrl: savedUrl,
          weightKg: effectiveWeight,
          notes: item.notes || notes || '',
          createdAt: new Date().toISOString()
        };
        db.photoVault.unshift(newPhoto);
        savedPhotos.push(newPhoto);
      }
    }

    writeDB(db);
    res.status(201).json({ success: true, savedCount: savedPhotos.length, photos: savedPhotos });
  } catch (err) {
    console.error('Error saving day check-in session:', err);
    res.status(500).json({ error: 'Failed to save day check-in session', details: err.message });
  }
});

// Delete an entire day's progress check-in session
app.delete('/api/progress/day/:date', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const targetDate = req.params.date;
  const toDelete = (db.photoVault || []).filter(p => p.date === targetDate && (!p.userId || p.userId === userId));
  toDelete.forEach(p => deleteImageFromOnlineStorage(p.photoUrl, p.id));
  db.photoVault = (db.photoVault || []).filter(p => p.date !== targetDate || (p.userId && p.userId !== userId));
  writeDB(db);
  res.json({ success: true, message: `All check-in photos for ${targetDate} deleted` });
});

app.delete('/api/progress/photos/:id', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const id = req.params.id;
  const toDelete = (db.photoVault || []).find(p => p.id === id && (!p.userId || p.userId === userId));
  if (toDelete) deleteImageFromOnlineStorage(toDelete.photoUrl, toDelete.id);
  db.photoVault = (db.photoVault || []).filter(p => p.id !== id || (p.userId && p.userId !== userId));
  writeDB(db);
  res.json({ success: true, message: 'Photo deleted' });
});

// --- AI DYNAMIC WORKOUT SPLIT GENERATOR ---
app.post('/api/workouts/generate-ai-split', async (req, res) => {
  try {
    const db = readDB();
    const userId = getAuthUserId(req, db);
    const userProfile = getUserProfile(db, userId);
    const {
      splitType = 'PPL',
      daysCount = 4,
      goal = userProfile.goal || 'recomp',
      experienceLevel = 'intermediate',
      focusAreas = userProfile.focusAreas || []
    } = req.body;

    aiService.setApiKey(getUserApiKey(db, userId));
    const plan = await aiService.generateWorkoutPlan({
      splitType,
      goal,
      daysCount: Number(daysCount) || 4,
      experienceLevel,
      focusAreas,
      userProfile
    });

    res.json({ success: true, plan });
  } catch (err) {
    console.error('AI workout split generation error:', err);
    res.status(500).json({ error: 'Failed to generate workout split', details: err.message });
  }
});

// --- AI FITNESS COACH CHAT ---
app.get('/api/coach/history', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userChat = (db.chatHistory || []).filter(c => !c.userId || c.userId === userId);
  res.json({ chatHistory: userChat });
});

app.delete('/api/coach/history', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  db.chatHistory = (db.chatHistory || []).filter(c => c.userId && c.userId !== userId);
  writeDB(db);
  res.json({ success: true, message: 'Chat history cleared' });
});

app.post('/api/coach/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const db = readDB();
    const userId = getAuthUserId(req, db);
    const userProfile = getUserProfile(db, userId);
    const today = new Date().toISOString().split('T')[0];

    // Build today's live stats for this user
    const todayMeals = (db.meals || []).filter(m => (!m.userId || m.userId === userId) && m.date === today);
    const consumedCalories = todayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);
    const consumedProtein = Number(todayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0).toFixed(1));
    const consumedCarbs = Number(todayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0).toFixed(1));
    const consumedFat = Number(todayMeals.reduce((s, m) => s + (m.totalFat || 0), 0).toFixed(1));
    const waterEntry = (db.waterLogs || []).find(w => (!w.userId || w.userId === userId) && w.date === today);
    const fastrackLog = (db.fastrackLogs || []).find(l => (!l.userId || l.userId === userId) && l.date === today);

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
      userId,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    db.chatHistory = db.chatHistory || [];
    db.chatHistory.push(userMsg);

    aiService.setApiKey(getUserApiKey(db, userId));
    const userHistory = db.chatHistory.filter(c => !c.userId || c.userId === userId);
    const { reply, source } = await aiService.askCoachChat(message, userHistory, userProfile, todayStats);

    const assistantMsg = {
      id: `msg-${Date.now() + 1}`,
      userId,
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

// --- SETTINGS & TOKEN TRACKER (USER ISOLATED - ZERO DATA LEAKS) ---
app.get('/api/settings', (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userSettings = (userId && db.userSettings && db.userSettings[userId]) || {};
  const user = (db.users || []).find(u => u.id === userId);
  const profile = db.profiles && db.profiles[userId];

  // Strictly user-scoped key: NEVER fall back to global db.settings or another user's key!
  const key = profile?.geminiApiKey || user?.geminiApiKey || userSettings.geminiApiKey || '';
  const fastrackDeviceName = userSettings.fastrackDeviceName || profile?.fastrackDeviceName || '';
  const googleClientId = userSettings.googleClientId || profile?.googleClientId || '';

  const settings = {
    hasApiKey: Boolean(key),
    maskedKey: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '',
    fastrackDeviceName: fastrackDeviceName || 'Fastrack Reflex Curve',
    googleClientId,
    useHeuristicFallback: userSettings.useHeuristicFallback !== false
  };

  res.json(settings);
});

app.post('/api/settings', async (req, res) => {
  const db = readDB();
  const userId = getAuthUserId(req, db);
  const userProfile = getUserProfile(db, userId);
  const { geminiApiKey, fastrackDeviceName, googleClientId, useHeuristicFallback, cacheTokens } = req.body;

  if (userId) {
    db.userSettings = db.userSettings || {};
    db.userSettings[userId] = db.userSettings[userId] || {};

    if (typeof geminiApiKey === 'string') {
      const cleanKey = geminiApiKey.trim();
      userProfile.geminiApiKey = cleanKey;
      if (db.profiles && db.profiles[userId]) {
        db.profiles[userId].geminiApiKey = cleanKey;
      }
      const matchedUser = (db.users || []).find(u => u.id === userId);
      if (matchedUser) {
        matchedUser.geminiApiKey = cleanKey;
      }
      db.userSettings[userId].geminiApiKey = cleanKey;
      aiService.setApiKey(cleanKey);
    }

    if (typeof googleClientId === 'string') {
      const cleanId = googleClientId.trim();
      db.userSettings[userId].googleClientId = cleanId;
      if (db.profiles && db.profiles[userId]) {
        db.profiles[userId].googleClientId = cleanId;
      }
    }

    if (typeof fastrackDeviceName === 'string') {
      db.userSettings[userId].fastrackDeviceName = fastrackDeviceName;
    }

    if (typeof useHeuristicFallback === 'boolean') {
      db.userSettings[userId].useHeuristicFallback = useHeuristicFallback;
    }

    // Save profile with keys to Supabase Cloud if ready
    if (isSupabaseReady() && db.profiles && db.profiles[userId]) {
      try {
        const userObj = (db.users || []).find(u => u.id === userId);
        await saveProfileToSupabase(userId, { ...db.profiles[userId], email: userObj?.email });
      } catch (e) {}
    }
  }

  // Purge any legacy global keys from db.settings so they never leak
  if (db.settings) {
    delete db.settings.geminiApiKey;
    delete db.settings.googleClientId;
    delete db.settings.fastrackDeviceName;
  }

  writeDB(db);
  res.json({ success: true, message: 'Settings saved securely for your account' });
});

// --- CLOUD DATABASE (SUPABASE / POSTGRESQL) STATUS & MIGRATION ---
app.get('/api/database/status', (req, res) => {
  const ready = isSupabaseReady();
  const db = readDB();
  res.json({
    status: 'ok',
    provider: ready ? 'supabase' : 'local_json',
    isCloudReady: ready,
    initError: getSupabaseInitError(),
    supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.slice(0, 20)}...` : null,
    localStats: {
      usersCount: (db.users || []).length,
      mealsCount: (db.meals || []).length,
      workoutsCount: (db.workouts || []).length,
      watchLogsCount: (db.fastrackLogs || []).length
    }
  });
});

app.post('/api/database/migrate-to-supabase', async (req, res) => {
  if (!isSupabaseReady()) {
    return res.status(400).json({
      success: false,
      message: 'Supabase is not configured yet. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your server/.env file or run the schema.sql in Supabase SQL Editor.'
    });
  }

  const localDb = readDB();
  const result = await migrateLocalDataToSupabase(localDb);
  res.json(result);
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
