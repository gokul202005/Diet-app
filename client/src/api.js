// Central API Client for Diet & Fitness Tracker

const BASE_URL = '/api';

export const api = {
  // Profile
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/profile`);
    return res.json();
  },
  updateProfile: async (data, recalculateTargets = true) => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, recalculateTargets })
    });
    return res.json();
  },
  calculateTargets: async (data) => {
    const res = await fetch(`${BASE_URL}/profile/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Meals & Diet
  getMeals: async (date) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/meals${query}`);
    return res.json();
  },
  addMeal: async (mealData) => {
    const res = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealData)
    });
    return res.json();
  },
  deleteMeal: async (id) => {
    const res = await fetch(`${BASE_URL}/meals/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Food Database (Zero-Token Search)
  searchFoodDb: async (q, diet = 'all') => {
    if (!q) return [];
    const res = await fetch(`${BASE_URL}/nutrition-db/search?q=${encodeURIComponent(q)}&diet=${encodeURIComponent(diet)}`);
    const data = await res.json();
    return data.results || [];
  },

  // AI Meal Breakdown
  analyzeMealText: async (text) => {
    const res = await fetch(`${BASE_URL}/ai/analyze-meal-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  analyzeMealPhoto: async (formData) => {
    const res = await fetch(`${BASE_URL}/ai/analyze-meal-photo`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  getSavedMealPlan: async () => {
    const res = await fetch(`${BASE_URL}/ai/saved-meal-plan`);
    return res.json();
  },
  generateMealPlan: async (payload) => {
    const res = await fetch(`${BASE_URL}/ai/generate-meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Workouts
  getWorkouts: async (date) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/workouts${query}`);
    return res.json();
  },
  addWorkout: async (workoutData) => {
    const res = await fetch(`${BASE_URL}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData)
    });
    return res.json();
  },
  deleteWorkout: async (id) => {
    const res = await fetch(`${BASE_URL}/workouts/${id}`, { method: 'DELETE' });
    return res.json();
  },
  getWorkoutPlans: async () => {
    const res = await fetch(`${BASE_URL}/workout-plans`);
    return res.json();
  },
  getWorkoutPRs: async () => {
    const res = await fetch(`${BASE_URL}/workouts/prs`);
    return res.json();
  },
  analyzeWorkoutPlan: async (planText) => {
    const res = await fetch(`${BASE_URL}/ai/analyze-workout-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planText })
    });
    return res.json();
  },

  // Fastrack Smartwatch
  getFastrackSummary: async (date) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/fastrack/summary${query}`);
    return res.json();
  },
  syncFastrack: async (syncData) => {
    const res = await fetch(`${BASE_URL}/fastrack/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData)
    });
    return res.json();
  },
  autoSyncFastrack: async (syncData) => {
    const res = await fetch(`${BASE_URL}/fastrack/auto-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData)
    });
    return res.json();
  },

  // Energy Balance
  getEnergyBalance: async (date) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/energy-balance${query}`);
    return res.json();
  },

  // Water & Weight
  getWater: async (date) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/water${query}`);
    return res.json();
  },
  logWater: async (amountMl, date) => {
    const res = await fetch(`${BASE_URL}/water/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountMl, date })
    });
    return res.json();
  },
  getWeight: async () => {
    const res = await fetch(`${BASE_URL}/weight`);
    return res.json();
  },
  logWeight: async (weightKg, date) => {
    const res = await fetch(`${BASE_URL}/weight/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg, date })
    });
    return res.json();
  },

  // Trends & Analytics
  getTrends: async (days = 7) => {
    const res = await fetch(`${BASE_URL}/analytics/trends?days=${days}`);
    return res.json();
  },

  // Progress Photo Vault
  getProgressPhotos: async () => {
    const res = await fetch(`${BASE_URL}/progress/photos`);
    return res.json();
  },
  addProgressPhoto: async (payload) => {
    const res = await fetch(`${BASE_URL}/progress/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteProgressPhoto: async (id) => {
    const res = await fetch(`${BASE_URL}/progress/photos/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // AI Coach Chat
  getChatHistory: async () => {
    const res = await fetch(`${BASE_URL}/coach/history`);
    return res.json();
  },
  sendCoachMessage: async (message) => {
    const res = await fetch(`${BASE_URL}/coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    return res.json();
  },
  clearChatHistory: async () => {
    const res = await fetch(`${BASE_URL}/coach/history`, { method: 'DELETE' });
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${BASE_URL}/settings`);
    return res.json();
  },
  updateSettings: async (settings) => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
