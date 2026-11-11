import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log('[Supabase] Initialized cloud client with URL:', SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase] Initialization warning:', err.message);
  }
}

export function isSupabaseReady() {
  return Boolean(supabase && SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabase() {
  return supabase;
}

/**
 * Uploads a base64 or buffer photo directly into Supabase Storage ('physique_vault' bucket)
 * Returns the public URL of the uploaded image.
 */
export async function uploadPhotoToSupabase(imageData, { userId, date, pose, filename }) {
  if (!isSupabaseReady()) return null;

  try {
    let buffer;
    let contentType = 'image/jpeg';
    let ext = 'jpg';

    if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
      const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
        contentType = `image/${ext}`;
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        return null;
      }
    } else if (Buffer.isBuffer(imageData)) {
      buffer = imageData;
    } else {
      return null;
    }

    const cleanUserId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest';
    const cleanDate = date || new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const finalFilename = filename || `${cleanDate}_${pose ? pose.replace(/\s+/g, '_').toLowerCase() : 'photo'}_${timestamp}.${ext}`;
    const storagePath = `${cleanUserId}/${finalFilename}`;

    const { data, error } = await supabase.storage
      .from('physique_vault')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('physique_vault')
      .getPublicUrl(storagePath);

    return {
      publicUrl: publicData?.publicUrl || null,
      storagePath
    };
  } catch (err) {
    console.warn('[Supabase Storage] Exception during upload:', err.message);
    return null;
  }
}

/**
 * Migrates local fitness_db.json data into Supabase Cloud PostgreSQL tables
 */
export async function migrateLocalDataToSupabase(localDb) {
  if (!isSupabaseReady()) {
    return { success: false, message: 'Supabase URL or Key not configured in .env' };
  }

  const results = {
    usersMigrated: 0,
    profilesMigrated: 0,
    mealsMigrated: 0,
    workoutsMigrated: 0,
    watchLogsMigrated: 0,
    errors: []
  };

  try {
    // 1. Migrate Users
    const users = localDb.users || [];
    for (const u of users) {
      const { error } = await supabase.from('users').upsert({
        id: u.id,
        email: u.email,
        password_hash: u.password || null,
        name: u.name || 'User',
        avatar_url: u.avatarUrl || null,
        provider: u.provider || 'email'
      }, { onConflict: 'id' });
      if (error) results.errors.push(`User ${u.id}: ${error.message}`);
      else results.usersMigrated++;
    }

    // 2. Migrate Profiles
    const profiles = localDb.profiles || {};
    for (const [userId, p] of Object.entries(profiles)) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        name: p.name || 'User',
        age: p.age || 23,
        gender: p.gender || 'male',
        height_cm: p.heightCm || 175,
        weight_kg: p.weightKg || 70,
        target_weight_kg: p.targetWeightKg || 68,
        goal: p.goal || 'recomp',
        activity_level: p.activityLevel || 'moderately_active',
        daily_target_calories: p.dailyTargetCalories || 2100,
        daily_target_protein: p.dailyTargetProtein || 140,
        daily_target_carbs: p.dailyTargetCarbs || 220,
        daily_target_fat: p.dailyTargetFat || 60,
        daily_target_water: p.dailyTargetWater || 3000,
        daily_target_steps: p.dailyTargetSteps || 10000,
        dietary_tags: p.dietaryTags || ['🍗 Non-Veg'],
        focus_areas: p.focusAreas || ['🛡️ Full Body Balance'],
        goals: p.goals || ['recomp'],
        recalculate_targets: Boolean(p.recalculateTargets),
        is_configured: Boolean(p.isConfigured)
      }, { onConflict: 'user_id' });
      if (error) results.errors.push(`Profile ${userId}: ${error.message}`);
      else results.profilesMigrated++;
    }

    // 3. Migrate Meals
    const meals = localDb.meals || [];
    for (const m of meals) {
      const { error } = await supabase.from('meals').upsert({
        id: m.id || `${m.userId || 'guest'}_${m.date}_${Date.now()}`,
        user_id: m.userId || 'guest',
        date: m.date,
        meal_type: m.mealType || 'lunch',
        food_name: m.foodName || m.name || 'Meal',
        calories: m.calories || 0,
        protein: m.protein || 0,
        carbs: m.carbs || 0,
        fats: m.fats || 0,
        portion: m.portion || '1 serving',
        time: m.time || null,
        photo_url: m.photoUrl || null,
        is_ai_estimated: Boolean(m.isAiEstimated)
      }, { onConflict: 'id' });
      if (error) results.errors.push(`Meal ${m.id}: ${error.message}`);
      else results.mealsMigrated++;
    }

    // 4. Migrate Workouts
    const workouts = localDb.workouts || [];
    for (const w of workouts) {
      const { error } = await supabase.from('workouts').upsert({
        id: w.id || `workout_${Date.now()}`,
        user_id: w.userId || 'guest',
        date: w.date,
        exercise_name: w.exerciseName || w.name || 'Exercise',
        sets: w.sets || 3,
        reps: w.reps || 10,
        weight_kg: w.weightKg || 0,
        rest_seconds: w.restSeconds || 60,
        muscle_group: w.muscleGroup || null,
        is_completed: Boolean(w.isCompleted)
      }, { onConflict: 'id' });
      if (error) results.errors.push(`Workout ${w.id}: ${error.message}`);
      else results.workoutsMigrated++;
    }

    // 5. Migrate Fastrack Watch Logs
    const watchLogs = localDb.fastrackLogs || [];
    for (const wl of watchLogs) {
      const { error } = await supabase.from('watch_logs').upsert({
        id: wl.id || `watch_${wl.userId || 'guest'}_${wl.date}`,
        user_id: wl.userId || 'guest',
        date: wl.date,
        steps: wl.steps || 0,
        active_calories: wl.activeCalories || 0,
        avg_heart_rate: wl.avgHeartRate || null,
        sleep_hours: wl.sleepHours || null,
        battery_level: wl.batteryLevel || null,
        source: wl.source || 'Health Connect',
        is_auto_synced: wl.isAutoSynced !== false,
        last_auto_sync_at: wl.lastAutoSyncAt || null,
        synced_at: wl.syncedAt || new Date().toISOString()
      }, { onConflict: 'user_id, date' });
      if (error) results.errors.push(`WatchLog ${wl.date}: ${error.message}`);
      else results.watchLogsMigrated++;
    }

    return {
      success: results.errors.length === 0,
      ...results
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      ...results
    };
  }
}
