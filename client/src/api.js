// Central API Client for Diet & Fitness Tracker (Web & Capacitor Android)

import { Capacitor } from '@capacitor/core';

export const RENDER_BACKEND = 'https://diet-app-backend-udje.onrender.com';

// Dynamically determine the best API endpoint
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 1. If running locally (port 3000 Vite proxy, port 5000 Node, localhost) or directly on Render:
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('onrender.com') ||
      window.location.port === '5000' ||
      window.location.port === '3000'
    ) {
      return '/api';
    }
    // 2. If running inside Capacitor Native Android App:
    try {
      if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
        return `${RENDER_BACKEND}/api`;
      }
    } catch (e) {}
  }
  // 3. Fallback to live Render backend for external callers:
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

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

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
    // Intercept true cold-start HTML responses (e.g. Render spin-up 502/503/504 gateway pages)
    if (text.trim().startsWith('<')) {
      if (res.status === 502 || res.status === 503 || res.status === 504 || url.includes('onrender.com')) {
        console.warn(`[API] Server returned HTML (${res.status}) for ${url}. Backend is likely starting up on Render.`);
        return { 
          error: 'Backend server is starting up. Please allow 15-30 seconds...', 
          isWakingUp: true,
          status: 'turning-on' 
        };
      }
      return { 
        error: `Server returned unexpected HTML response (${res.status}).` 
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { error: text || 'Non-JSON server response' };
    }
  } catch (err) {
    console.warn(`[API] Request error for ${url}:`, err.message);
    return { error: err.message || 'Network connection failed' };
  }
}

export const api = {
  // Server Health & Connectivity Check
  checkServerHealth: async () => {
    try {
      const start = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return { status: 'running', latency, ...data };
      }
      return { status: 'turning-on', latency, error: 'Server waking up...' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { status: 'turning-on', latency: null, error: 'Server is waking up (takes ~15-25s)...' };
      }
      return { status: 'offline', latency: null, error: err.message };
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
  getSettings: async () => {
    return safeFetch(`${BASE_URL}/settings`);
  },
  updateSettings: async (settings) => {
    return safeFetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  }
};
