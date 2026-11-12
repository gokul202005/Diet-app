// Central API Client for Diet & Fitness Tracker (Web & Capacitor Android)

import { Capacitor } from '@capacitor/core';

export const RENDER_BACKEND = 'https://diet-app-backend-udje.onrender.com';

// Dynamically determine the best API endpoint
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 1. FIRST: Check if running inside Capacitor Native Android / iOS App
    try {
      const isCapacitorNative = 
        (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) ||
        Boolean(window.Capacitor?.isNativePlatform?.()) ||
        window.location.protocol === 'capacitor:' ||
        // Capacitor Android local WebView runs on localhost with NO port
        (window.location.hostname === 'localhost' && !window.location.port && !window.location.search.includes('dev=true'));

      if (isCapacitorNative) {
        console.log('[API] Running in Capacitor Native Android Container -> Using Live Render Backend:', RENDER_BACKEND);
        return `${RENDER_BACKEND}/api`;
      }
    } catch (e) {
      console.warn('[API] Native platform check exception:', e);
    }

    // 2. If running locally with Vite proxy (port 3000) or Node (port 5000):
    if (
      window.location.port === '3000' || 
      window.location.port === '5000' ||
      window.location.port === '5173'
    ) {
      return '/api';
    }

    // 3. If running directly on Render web domain:
    if (window.location.hostname.includes('onrender.com')) {
      return '/api';
    }
  }

  // 4. Default to live Render backend for external callers & mobile web:
  return `${RENDER_BACKEND}/api`;
};

const BASE_URL = getBaseUrl();

// Safe Fetch Wrapper: Handles HTML/502/cold-start gracefully without crashing on res.json()
async function safeFetch(url, options = {}) {
  let authUserId = '';
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('agy_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) authUserId = parsed.id;
      }
    } catch {}
  }

  const customHeaders = options.headers || {};
  const headers = {
    'Accept': 'application/json',
    ...(authUserId ? { 'x-user-id': authUserId } : {}),
    ...customHeaders
  };

  const controller = new AbortController();
  const timeoutMs = options.timeout || 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
    clearTimeout(timeoutId);

    if (res.status === 413) {
      return { 
        error: 'Payload Too Large: Photo file size exceeds upload limit. Please choose a slightly smaller photo.', 
        status: 413 
      };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok && !data.error) {
        data.error = `Server error (${res.status}): ${res.statusText}`;
      }
      return data;
    }

    const text = await res.text();
    // Intercept true cold-start HTML responses (e.g. Render spin-up 502/503/504 gateway pages or WebView redirects)
    if (text.trim().startsWith('<')) {
      console.warn(`[API] Server returned HTML (${res.status}) for ${url}.`);
      return { 
        error: 'Cloud backend is warming up or connecting. Please tap Sign In again in a few moments.', 
        isWakingUp: true,
        status: 'turning-on' 
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { error: text || 'Non-JSON server response' };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[API] Request error for ${url}:`, err.message);

    // Fallback: If local /api failed with "Failed to fetch", retry on live cloud backend
    if (typeof url === 'string' && url.startsWith('/api') && !url.includes('onrender.com')) {
      try {
        console.log(`[API] Retrying on live cloud backend: ${RENDER_BACKEND}${url}`);
        const cloudRes = await fetch(`${RENDER_BACKEND}${url}`, {
          ...options,
          headers,
          signal: options.signal
        });
        const contentType = cloudRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await cloudRes.json();
        }
      } catch (cloudErr) {
        console.warn('[API] Cloud fallback error:', cloudErr.message);
      }
    }

    if (err.message?.includes('Failed to fetch') || err.name === 'AbortError') {
      return { 
        error: 'Unable to connect to server. Please check your network or try again in a moment.',
        isNetworkError: true 
      };
    }
    return { error: err.message || 'Network connection failed' };
  }
}

export const api = {
  // Server Health & Connectivity Check (Intelligently detects Localhost vs Cloud Backend)
  checkServerHealth: async () => {
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    ) && Boolean(window.location.port);

    const targetUrl = isLocalhost ? '/api/health' : `${RENDER_BACKEND}/api/health`;
    const targetHost = isLocalhost ? `localhost:${window.location.port}` : RENDER_BACKEND;

    try {
      const start = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return { 
          status: 'running', 
          latency, 
          host: targetHost, 
          serverType: isLocalhost ? 'Local Server' : 'Render Cloud Backend',
          ...data 
        };
      }
      return { status: 'turning-on', latency, host: targetHost, error: 'Server waking up...' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { status: 'turning-on', latency: null, host: targetHost, error: 'Connection timeout...' };
      }
      return { status: 'offline', latency: null, host: targetHost, error: err.message };
    }
  },

  // Authentication & Cloud Sync
  signup: async (userData) => {
    const res = await safeFetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.user && typeof window !== 'undefined') {
      localStorage.setItem('agy_current_user', JSON.stringify(res.user));
    }
    return res;
  },
  login: async (credentials) => {
    const res = await safeFetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (res.user && typeof window !== 'undefined') {
      localStorage.setItem('agy_current_user', JSON.stringify(res.user));
    }
    return res;
  },
  googleAuth: async (googleData) => {
    const res = await safeFetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData)
    });
    if (res.user && typeof window !== 'undefined') {
      localStorage.setItem('agy_current_user', JSON.stringify(res.user));
    }
    return res;
  },
  getCurrentUser: async () => {
    return safeFetch(`${BASE_URL}/auth/me`);
  },
  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agy_current_user');
    }
    return safeFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
  },
  getGoogleClientId: async () => {
    return safeFetch(`${BASE_URL}/auth/google-client-id`);
  },

  // Profile
  getProfile: async () => {
    return safeFetch(`${BASE_URL}/profile`);
  },
  updateProfile: async (data, recalculateTargets = true) => {
    return safeFetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, recalculateTargets })
    });
  },
  calculateTargets: async (data) => {
    return safeFetch(`${BASE_URL}/profile/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Meals & Diet
  getMeals: async (date) => {
    const query = date ? `?date=${date}` : '';
    return safeFetch(`${BASE_URL}/meals${query}`);
  },
  addMeal: async (mealData) => {
    return safeFetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealData)
    });
  },
  deleteMeal: async (id) => {
    return safeFetch(`${BASE_URL}/meals/${id}`, { method: 'DELETE' });
  },

  // Food Database (Zero-Token Search)
  searchFoodDb: async (q, diet = 'all') => {
    if (!q) return [];
    const data = await safeFetch(`${BASE_URL}/nutrition-db/search?q=${encodeURIComponent(q)}&diet=${encodeURIComponent(diet)}`);
    return data.results || [];
  },

  // AI Meal Breakdown
  analyzeMealText: async (text) => {
    return safeFetch(`${BASE_URL}/ai/analyze-meal-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  },
  analyzeMealPhoto: async (formData) => {
    return safeFetch(`${BASE_URL}/ai/analyze-meal-photo`, {
      method: 'POST',
      body: formData
    });
  },
  getSavedMealPlan: async () => {
    return safeFetch(`${BASE_URL}/ai/saved-meal-plan`);
  },
  generateMealPlan: async (payload) => {
    return safeFetch(`${BASE_URL}/ai/generate-meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  swapMeal: async (payload) => {
    return safeFetch(`${BASE_URL}/ai/swap-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  saveMealPlan: async (plan) => {
    return safeFetch(`${BASE_URL}/ai/save-meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
  },

  // Universal Full-Website Voice Command Engine
  parseVoiceIntent: async (text, date) => {
    return safeFetch(`${BASE_URL}/ai/parse-voice-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, date })
    });
  },
  universalVoiceCommand: async (param, date) => {
    const body = typeof param === 'string' 
      ? { text: param, date } 
      : { ...param, date: date || param.date };
    return safeFetch(`${BASE_URL}/ai/universal-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  universalVoiceAudio: async (audioBlob, date) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-recording.webm');
    if (date) formData.append('date', date);
    return safeFetch(`${BASE_URL}/ai/universal-voice-audio`, {
      method: 'POST',
      body: formData
    });
  },

  // Workouts
  getWorkouts: async (date) => {
    const query = date ? `?date=${date}` : '';
    return safeFetch(`${BASE_URL}/workouts${query}`);
  },
  addWorkout: async (workoutData) => {
    return safeFetch(`${BASE_URL}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData)
    });
  },
  deleteWorkout: async (id) => {
    return safeFetch(`${BASE_URL}/workouts/${id}`, { method: 'DELETE' });
  },
  getWorkoutPlans: async () => {
    return safeFetch(`${BASE_URL}/workout-plans`);
  },
  getWorkoutPRs: async () => {
    return safeFetch(`${BASE_URL}/workouts/prs`);
  },
  analyzeWorkoutPlan: async (planText) => {
    return safeFetch(`${BASE_URL}/ai/analyze-workout-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planText })
    });
  },
  generateAiWorkoutSplit: async (params) => {
    return safeFetch(`${BASE_URL}/workouts/generate-ai-split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  // Fastrack Smartwatch
  getFastrackSummary: async (date) => {
    const query = date ? `?date=${date}` : '';
    return safeFetch(`${BASE_URL}/fastrack/summary${query}`);
  },
  syncFastrack: async (syncData) => {
    return safeFetch(`${BASE_URL}/fastrack/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData)
    });
  },
  autoSyncFastrack: async (syncData) => {
    return safeFetch(`${BASE_URL}/fastrack/auto-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData)
    });
  },

  // Energy Balance
  getEnergyBalance: async (date) => {
    const query = date ? `?date=${date}` : '';
    return safeFetch(`${BASE_URL}/energy-balance${query}`);
  },

  // Water & Weight
  getWater: async (date) => {
    const query = date ? `?date=${date}` : '';
    return safeFetch(`${BASE_URL}/water${query}`);
  },
  logWater: async (amountMl, date) => {
    return safeFetch(`${BASE_URL}/water/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountMl, date })
    });
  },
  getWeight: async () => {
    return safeFetch(`${BASE_URL}/weight`);
  },
  logWeight: async (weightKg, date) => {
    return safeFetch(`${BASE_URL}/weight/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg, date })
    });
  },

  // Trends & Analytics
  getTrends: async (days = 7) => {
    return safeFetch(`${BASE_URL}/analytics/trends?days=${days}`);
  },

  // Progress Photo Vault
  resolvePhotoUrl: (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    try {
      if (typeof window !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
        return `${RENDER_BACKEND}${url.startsWith('/') ? '' : '/'}${url}`;
      }
    } catch {}
    return url;
  },
  getProgressPhotos: async () => {
    return safeFetch(`${BASE_URL}/progress/photos`);
  },
  addProgressPhoto: async (payload) => {
    return safeFetch(`${BASE_URL}/progress/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  saveDayCheckin: async (payload) => {
    return safeFetch(`${BASE_URL}/progress/day-checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  deleteProgressPhoto: async (id) => {
    return safeFetch(`${BASE_URL}/progress/photos/${id}`, { method: 'DELETE' });
  },
  deleteDayCheckin: async (date) => {
    return safeFetch(`${BASE_URL}/progress/day/${encodeURIComponent(date)}`, { method: 'DELETE' });
  },

  // AI Coach Chat
  getChatHistory: async () => {
    return safeFetch(`${BASE_URL}/coach/history`);
  },
  sendCoachMessage: async (message) => {
    return safeFetch(`${BASE_URL}/coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  },
  clearChatHistory: async () => {
    return safeFetch(`${BASE_URL}/coach/history`, { method: 'DELETE' });
  },

  // Settings
  getSettings: async (userId) => {
    const customHeaders = userId ? { 'x-user-id': userId } : {};
    return safeFetch(`${BASE_URL}/settings`, { headers: customHeaders });
  },
  updateSettings: async (settings, userId) => {
    const customHeaders = userId ? { 'x-user-id': userId } : {};
    return safeFetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...customHeaders },
      body: JSON.stringify(settings)
    });
  },

  // Cloud Database (Supabase / PostgreSQL)
  getDatabaseStatus: async () => {
    return safeFetch(`${BASE_URL}/database/status`);
  },
  migrateToSupabase: async () => {
    return safeFetch(`${BASE_URL}/database/migrate-to-supabase`, {
      method: 'POST'
    });
  },

  // Solo Leveling Hunter System
  getHunterStats: async (date) => {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return safeFetch(`${BASE_URL}/hunter/stats${q}`);
  },
  claimHunterQuest: async (questId, date) => {
    return safeFetch(`${BASE_URL}/hunter/claim-quest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId, date })
    });
  }
};
