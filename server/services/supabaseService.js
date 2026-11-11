import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tfamtanfyqtungrypdkh.supabase.co';
const SUPABASE_KEY = 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  '';

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
 * AND records the metadata into the 'vault_photos' PostgreSQL table in Supabase.
 * Returns { publicUrl, storagePath }.
 */
export async function uploadPhotoToSupabase(imageData, { userId, date, pose, filename, id, photoId, weightKg, notes, type }) {
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
    const finalFilename = filename || `${cleanDate}_${pose ? String(pose).replace(/\s+/g, '_').toLowerCase() : 'photo'}_${timestamp}.${ext}`;
    const storagePath = `${cleanUserId}/${finalFilename}`;
    const finalPhotoId = photoId || id || `photo-${cleanUserId}-${timestamp}`;

    // 1. Upload binary buffer to Supabase Storage ('physique_vault' bucket)
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('physique_vault')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

    if (uploadErr) {
      console.warn('[Supabase Storage] Upload error:', uploadErr.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('physique_vault')
      .getPublicUrl(storagePath);

    const publicUrl = publicData?.publicUrl || null;

    // 2. Ensure foreign key exists in public.users table
    try {
      await supabase.from('users').upsert({
        id: cleanUserId,
        email: `${cleanUserId}@agyfit.local`,
        name: 'Athlete',
        provider: 'local'
      }, { onConflict: 'id' });
    } catch (e) {}

    // 3. Save entry into Supabase 'vault_photos' table
    try {
      await supabase.from('vault_photos').upsert({
        id: finalPhotoId,
        user_id: cleanUserId,
        date: cleanDate,
        pose: pose || 'Front Pose',
        photo_url: publicUrl,
        storage_path: storagePath,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        notes: notes || '',
        tags: [type || 'checkin', pose || 'front']
      }, { onConflict: 'id' });
    } catch (dbErr) {
      console.warn('[Supabase vault_photos table] Record insertion note:', dbErr.message);
    }

    return {
      publicUrl,
      storagePath
    };
  } catch (err) {
    console.warn('[Supabase Storage] Exception during upload:', err.message);
    return null;
  }
}

/**
 * Deletes a photo from Supabase Storage and vault_photos table
 */
export async function deletePhotoFromSupabase({ photoUrl, storagePath, id }) {
  if (!isSupabaseReady()) return;
  try {
    if (id) {
      await supabase.from('vault_photos').delete().eq('id', id);
    }
    if (storagePath) {
      await supabase.storage.from('physique_vault').remove([storagePath]);
    } else if (photoUrl && photoUrl.includes('/physique_vault/')) {
      const parts = photoUrl.split('/physique_vault/');
      if (parts[1]) {
        const pathOnStorage = decodeURIComponent(parts[1].split('?')[0]);
        await supabase.storage.from('physique_vault').remove([pathOnStorage]);
      }
    }
  } catch (e) {
    console.warn('[Supabase deletePhoto] Error:', e.message);
  }
}

/**
 * Retrieves user's progress photos from Supabase 'vault_photos' table
 */
export async function getPhotosFromSupabase(userId) {
  if (!isSupabaseReady()) return null;
  try {
    const cleanUserId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, '_') : null;
    let query = supabase.from('vault_photos').select('*').order('date', { ascending: false });
    if (cleanUserId && cleanUserId !== 'guest') {
      query = query.or(`user_id.eq.${cleanUserId},user_id.eq.guest`);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase getPhotos] Error:', error.message);
      return null;
    }
    return (data || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      date: p.date,
      pose: p.pose,
      photoUrl: p.photo_url,
      storagePath: p.storage_path,
      weightKg: p.weight_kg,
      notes: p.notes,
      type: Array.isArray(p.tags) && p.tags.includes('before') 
        ? 'before' 
        : (Array.isArray(p.tags) && p.tags.includes('after') ? 'after' : 'checkin'),
      createdAt: p.created_at
    }));
  } catch (err) {
    console.warn('[Supabase getPhotos] Exception:', err.message);
    return null;
  }
}

/**
 * Retrieves a user's profile from Supabase 'profiles' PostgreSQL table
 */
export async function getProfileFromSupabase(userId) {
  if (!isSupabaseReady() || !userId) return null;
  try {
    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name || '',
      age: data.age || '',
      gender: data.gender || '',
      heightCm: data.height_cm || '',
      weightKg: data.weight_kg || '',
      targetWeightKg: data.target_weight_kg || '',
      goal: data.goal || '',
      activityLevel: data.activity_level || '',
      dailyTargetCalories: data.daily_target_calories || 2000,
      dailyTargetProtein: data.daily_target_protein || 130,
      dailyTargetCarbs: data.daily_target_carbs || 200,
      dailyTargetFat: data.daily_target_fat || 55,
      dailyTargetWater: data.daily_target_water || 3000,
      dailyTargetSteps: data.daily_target_steps || 10000,
      dietaryTags: Array.isArray(data.dietary_tags) ? data.dietary_tags : [],
      focusAreas: Array.isArray(data.focus_areas) ? data.focus_areas : [],
      goals: Array.isArray(data.goals) ? data.goals : (data.goal ? [data.goal] : []),
      recalculateTargets: Boolean(data.recalculate_targets),
      isConfigured: Boolean(data.is_configured)
    };
  } catch (err) {
    console.warn('[Supabase getProfile] Exception:', err.message);
    return null;
  }
}

/**
 * Saves or updates a user's profile in Supabase 'profiles' PostgreSQL table
 */
export async function saveProfileToSupabase(userId, p) {
  if (!isSupabaseReady() || !userId || !p) return null;
  try {
    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');

    // Ensure user row exists first (foreign key check)
    try {
      await supabase.from('users').upsert({
        id: cleanUserId,
        email: `${cleanUserId}@agyfit.local`,
        name: p.name || 'User',
        provider: 'local'
      }, { onConflict: 'id' });
    } catch (e) {}

    const { error } = await supabase.from('profiles').upsert({
      user_id: cleanUserId,
      name: p.name || 'User',
      age: p.age ? parseInt(p.age) : null,
      gender: p.gender || 'male',
      height_cm: p.heightCm ? parseFloat(p.heightCm) : null,
      weight_kg: p.weightKg ? parseFloat(p.weightKg) : null,
      target_weight_kg: p.targetWeightKg ? parseFloat(p.targetWeightKg) : null,
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
      goals: p.goals || [p.goal || 'recomp'],
      recalculate_targets: Boolean(p.recalculateTargets),
      is_configured: Boolean(p.isConfigured !== false)
    }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Supabase saveProfile] Error:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase saveProfile] Exception:', err.message);
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
    photosMigrated: 0,
    errors: []
  };

  try {
    // 0. Ensure all referenced user IDs exist in the users table first (satisfies foreign key)
    const allUserIds = new Set([
      ...(localDb.users || []).map(u => u.id),
      ...Object.keys(localDb.profiles || {}),
      ...(localDb.fastrackLogs || []).map(wl => wl.userId || 'guest'),
      ...(localDb.meals || []).map(m => m.userId || 'guest'),
      ...(localDb.workouts || []).map(w => w.userId || 'guest')
    ]);

    for (const uid of allUserIds) {
      if (!uid) continue;
      const matched = (localDb.users || []).find(u => u.id === uid);
      const profileName = localDb.profiles?.[uid]?.name;
      const { error } = await supabase.from('users').upsert({
        id: uid,
        email: matched?.email || `${uid}@agyfit.local`,
        password_hash: matched?.password || null,
        name: matched?.name || profileName || 'User',
        avatar_url: matched?.avatarUrl || null,
        provider: matched?.provider || 'local'
      }, { onConflict: 'id' });
      if (error) results.errors.push(`User ${uid}: ${error.message}`);
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

    // 6. Migrate Progress Photos
    const photos = localDb.photoVault || [];
    for (const p of photos) {
      if (!p.id || !p.photoUrl) continue;
      const { error } = await supabase.from('vault_photos').upsert({
        id: p.id,
        user_id: p.userId || 'guest',
        date: p.date || new Date().toISOString().split('T')[0],
        pose: p.pose || 'front',
        photo_url: p.photoUrl,
        storage_path: p.storagePath || null,
        weight_kg: p.weightKg ? parseFloat(p.weightKg) : null,
        notes: p.notes || '',
        tags: [p.type || 'checkin', p.pose || 'front']
      }, { onConflict: 'id' });
      if (error) results.errors.push(`Photo ${p.id}: ${error.message}`);
      else results.photosMigrated++;
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
