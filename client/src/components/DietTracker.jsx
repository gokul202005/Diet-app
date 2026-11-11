import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import LiveCameraModal from './LiveCameraModal';
import { openNativeCamera, isNativePlatform } from '../utils/cameraService';
import { 
  Search, 
  Sparkles, 
  Camera, 
  Upload,
  Mic,
  MicOff,
  Radio,
  Volume2,
  Plus, 
  Trash2, 
  Utensils, 
  Flame, 
  Zap, 
  Check, 
  AlertCircle,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { api } from '../api';

// Popular South Indian Food Items Categorized by Meal Type & Diet
export const POPULAR_FOODS_BY_MEAL = {
  breakfast: {
    veg: [
      'Idli', 'Ghee Roast Dosa', 'Pesarattu', 'Ven Pongal', 'Adai Avial', 
      'Kuzhi Paniyaram', 'Appam', 'Idiyappam', 'Podi Idli', 'Poori Masala', 'Masala Chai', 'Filter Coffee'
    ],
    nonVeg: [
      'Boiled Egg', 'Egg Dosa', 'Muttai Podimas', 'Egg Thokku', 'Muttai Paniyaram', 
      'South Indian Egg Omelet', 'Chicken Kari Dosa', 'Masala Chai', 'Filter Coffee'
    ]
  },
  lunch: {
    veg: [
      'Poondu Kara Kuzhambu (Karakolambu)', 'Ennai Kathirikai Kuzhambu', 'Vatha Kuzhambu', 
      'Curd Rice', 'Mor Kuzhambu', 'Paruppu Urundai Kuzhambu', 'Kollu Rasam', 
      'Sambar Sadam', 'Lemon Rice', 'Kerala Avial', 'Potato Roast'
    ],
    nonVeg: [
      'Poondu Kara Kuzhambu (Karakolambu)', 'Muttai Podimas', 'Chettinad Chicken Curry', 
      'Nattu Kozhi Kuzhambu', 'Vanjaram Fish Fry', 'Kerala Meen Curry', 
      'South Indian Egg Omelet', 'Seeraga Samba Chicken Biryani', 'Egg Thokku', 'Curd Rice'
    ]
  },
  snack: {
    veg: [
      'Masala Chai', 'Filter Coffee', 'Marie Biscuits', 'Parle-G', 'Good Day Biscuits', 'Tea Rusk', 'Bourbon Biscuits', 'Green Tea',
      'Kala Chana Sundal', 'Pachai Payaru Sundal', 'Masala Neer Mor', 
      'Sambar Vada', 'Medu Vada', 'Roasted Bengal Gram (Pottukadalai)', 'Tender Coconut Water', 'Banana'
    ],
    nonVeg: [
      'Masala Chai', 'Filter Coffee', 'Marie Biscuits', 'Tea Rusk', 'Boiled Egg', 'Egg White', 'Muttai Podimas', 'Nethili Fish Fry', 
      'Masala Neer Mor'
    ]
  },
  dinner: {
    veg: [
      'Kal Dosa', 'Plain Dosa', 'Steamed Idli', 'Idiyappam', 'Chettinad Kuzhi Paniyaram', 
      'Vegetable Kurma', 'Ragi Dosa', 'Pesarattu', 'Curd Rice'
    ],
    nonVeg: [
      'Egg Dosa', 'Muttai Podimas', 'Egg Thokku', 'South Indian Egg Omelet', 
      'Chettinad Chicken Curry', 'Kerala Meen Curry', 'Kothu Parotta', 'Curd Rice'
    ]
  }
};

export default function DietTracker({ selectedDate, profile }) {
  const [mealsData, setMealsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active logging mode: 'search' | 'ai-text' | 'photo'
  const [activeMode, setActiveMode] = useState('search');

  // Confirmation Modal state
  const [mealToDelete, setMealToDelete] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [dietCategory, setDietCategory] = useState('all'); // 'all' | 'veg' | 'non-veg'

  // AI Natural Language input
  const [aiText, setAiText] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  // Photo scan state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);
  const [photoAiPreview, setPhotoAiPreview] = useState(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  const handleCameraCapture = async (dataUrl) => {
    setPhotoPreviewUrl(dataUrl);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'meal-camera-snap.jpg', { type: 'image/jpeg' });
      setPhotoFile(file);
      setPhotoAiPreview(null);
    } catch (e) {
      console.error('Failed to convert camera snapshot:', e);
    }
  };

  const handleSnapCamera = async () => {
    if (isNativePlatform()) {
      try {
        const dataUrl = await openNativeCamera();
        if (dataUrl) {
          handleCameraCapture(dataUrl);
        }
      } catch (err) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(err.message || 'Could not access device camera', 'error', 'Camera Error');
        }
      }
    } else {
      setIsLiveCameraOpen(true);
    }
  };

  // Zero-Token Voice Logging state (Browser Speech Recognition)
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');

  const handleToggleVoice = (targetField = 'voice') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Speech Recognition is not supported by your current browser. Please open in Google Chrome on your phone or PC.', 'warning', 'Mic Unsupported');
      }
      return;
    }

    if (isListening) {
      if (window._dietSpeechRecognition) {
        window._dietSpeechRecognition.stop();
      }
      setIsListening(false);
      setVoiceStatus('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English handles Tamil & South Indian names seamlessly

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('Listening... Speak your South Indian meal now');
      };

      recognition.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        if (targetField === 'search') {
          setSearchQuery(transcript);
        } else if (targetField === 'ai') {
          setAiText(transcript);
        }
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
        setVoiceStatus(e.error === 'no-speech' ? 'No speech detected. Try again.' : `Error: ${e.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      window._dietSpeechRecognition = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Load meals
  const loadMeals = async () => {
    try {
      const data = await api.getMeals(selectedDate);
      setMealsData(data);
    } catch (err) {
      console.error('Error fetching meals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, [selectedDate]);

  // Live South Indian & Global Food Database Search with Veg/Non-Veg Filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchFoodDb(searchQuery, dietCategory);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, dietCategory]);

  // Add Item from Zero-Token Food Search
  const handleAddSearchItem = async (food) => {
    const qtyMult = Number(servingMultiplier) || 1;
    const foodItem = {
      name: food.name,
      quantity: `${qtyMult}x (${food.serving})`,
      calories: Math.round(food.calories * qtyMult),
      protein: Number((food.protein * qtyMult).toFixed(1)),
      carbs: Number((food.carbs * qtyMult).toFixed(1)),
      fat: Number((food.fat * qtyMult).toFixed(1)),
    };

    const mealPayload = {
      date: selectedDate,
      mealType: selectedMealType,
      name: food.name,
      foods: [foodItem],
      notes: 'Added from South Indian & Global Nutrition Database (0 Tokens)'
    };

    try {
      const res = await api.addMeal(mealPayload);
      if (res.success) {
        setSearchQuery('');
        setSearchResults([]);
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`Logged ${food.name} to ${selectedMealType.toUpperCase()}!`, 'success', 'Meal Added');
        }
        loadMeals();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to log meal: ' + err.message, 'error', 'Error');
      }
    }
  };

  // Run AI Text Analysis
  const handleAnalyzeAiText = async () => {
    if (!aiText.trim()) return;
    setIsAiAnalyzing(true);
    setAiPreview(null);
    try {
      const result = await api.analyzeMealText(aiText);
      setAiPreview(result);
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('AI analysis error: ' + err.message, 'error', 'Analysis Error');
      }
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Confirm and Log AI Text Breakdown
  const handleConfirmAiMeal = async () => {
    if (!aiPreview || !aiPreview.items) return;
    const mealPayload = {
      date: selectedDate,
      mealType: selectedMealType,
      name: aiPreview.mealName || aiText.slice(0, 30),
      foods: aiPreview.items,
      notes: aiPreview.nutritionNotes || ''
    };

    try {
      const res = await api.addMeal(mealPayload);
      if (res.success) {
        setAiText('');
        setAiPreview(null);
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`Logged ${mealPayload.name} to ${selectedMealType.toUpperCase()}!`, 'success', 'Meal Saved');
        }
        loadMeals();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to log AI meal: ' + err.message, 'error', 'Error');
      }
    }
  };

  // Handle Photo Selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      setPhotoAiPreview(null);
    }
  };

  // Run Photo Food Scan
  const handleScanPhoto = async () => {
    if (!photoFile) return;
    setIsPhotoScanning(true);
    setPhotoAiPreview(null);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      const result = await api.analyzeMealPhoto(formData);
      setPhotoAiPreview(result);
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Photo scanning error: ' + err.message, 'error', 'Vision Error');
      }
    } finally {
      setIsPhotoScanning(false);
    }
  };

  // Confirm and Log Photo Scanned Meal
  const handleConfirmPhotoMeal = async () => {
    if (!photoAiPreview || !photoAiPreview.items) return;
    const mealPayload = {
      date: selectedDate,
      mealType: selectedMealType,
      name: photoAiPreview.mealName || 'Scanned Meal Photo',
      foods: photoAiPreview.items,
      notes: photoAiPreview.nutritionNotes || ''
    };

    try {
      const res = await api.addMeal(mealPayload);
      if (res.success) {
        setPhotoFile(null);
        setPhotoPreviewUrl(null);
        setPhotoAiPreview(null);
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Photo meal logged to diary!', 'success', 'Plate Analyzed');
        }
        loadMeals();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to log photo meal: ' + err.message, 'error', 'Error');
      }
    }
  };

  // Delete Meal Confirmation Action
  const handleConfirmDeleteMeal = async () => {
    if (!mealToDelete) return;
    try {
      await api.deleteMeal(mealToDelete.id);
      loadMeals();
    } catch (err) {
      console.error('Failed to delete meal:', err);
    } finally {
      setMealToDelete(null);
    }
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Utensils className="w-4 h-4" />
              <span>South Indian & Smart Diet Tracker</span>
            </div>
            <h1 className="text-2xl font-black text-white">Log Today's Nutrition</h1>
            <p className="text-xs text-slate-400 mt-1">
              Search authentic South Indian foods, type meals in plain text, or snap a food photo.
            </p>
          </div>

          {/* Running Totals Widget */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Calories</div>
              <div className="text-base font-extrabold text-white">
                {mealsData?.totals?.calories || 0} / {profile?.dailyTargetCalories || 2100}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Protein</div>
              <div className="text-base font-extrabold text-sky-400">
                {mealsData?.totals?.protein || 0}g / {profile?.dailyTargetProtein || 140}g
              </div>
            </div>
          </div>
        </div>

        {/* Meal Type Selector & Veg/Non-Veg Diet Filter */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Meal:</span>
            {mealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedMealType(type)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                  selectedMealType === type
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Veg / Non-Veg Diet Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDietCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                dietCategory === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietCategory('veg')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                dietCategory === 'veg'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span>🥗</span>
              <span>Pure Veg</span>
            </button>
            <button
              onClick={() => setDietCategory('non-veg')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                dietCategory === 'non-veg'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span>🍗</span>
              <span>Non-Veg</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="inline-flex items-center bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg gap-1.5 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveMode('search')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all whitespace-nowrap shrink-0 ${
            activeMode === 'search'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Food Database</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
            activeMode === 'search' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-emerald-400'
          }`}>
            0 Tokens
          </span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-universal-voice'))}
          className="px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all whitespace-nowrap shrink-0 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 cursor-pointer shadow-sm active:scale-95"
          title="Speak naturally to log meals with AI preview and instant macro calculations"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Speak to Log</span>
        </button>

        <button
          onClick={() => setActiveMode('ai-text')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all whitespace-nowrap shrink-0 ${
            activeMode === 'ai-text'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>AI Meal Parser</span>
        </button>

        <button
          onClick={() => setActiveMode('photo')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all whitespace-nowrap shrink-0 ${
            activeMode === 'photo'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span>Photo Vision</span>
        </button>
      </div>

      {/* MODE 1: ZERO-TOKEN SOUTH INDIAN & GLOBAL DATABASE SEARCH */}
      {activeMode === 'search' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${dietCategory === 'veg' ? 'Veg' : dietCategory === 'non-veg' ? 'Non-Veg' : 'South Indian & Global'} foods: ${selectedMealType === 'breakfast' ? 'Idli, Dosa, Pongal...' : selectedMealType === 'lunch' ? 'Rice, Sambar, Chicken, Biryani...' : selectedMealType === 'snack' ? 'Vada, Neer Mor, Sundal...' : 'Kal Dosa, Egg Podimas, Kurma...'}`}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={() => handleToggleVoice('search')}
                className={`absolute right-3 top-2.5 p-1 rounded-lg transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                }`}
                title="Tap to speak meal name"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <span className="text-xs text-slate-400 font-medium">Quantity:</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={servingMultiplier}
                onChange={(e) => setServingMultiplier(e.target.value)}
                className="w-16 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-500">servings</span>
            </div>
          </div>

          {/* Dynamic Popular South Indian Pills based on selectedMealType & dietCategory */}
          {!searchQuery && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Popular for {selectedMealType.toUpperCase()} ({dietCategory === 'all' ? 'All Foods' : dietCategory === 'veg' ? 'Pure Veg' : 'Non-Veg'}):
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Click to search</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const currentMeal = POPULAR_FOODS_BY_MEAL[selectedMealType] || POPULAR_FOODS_BY_MEAL.lunch;
                  let activeQuickAdds = [];
                  if (dietCategory === 'veg') {
                    activeQuickAdds = currentMeal.veg;
                  } else if (dietCategory === 'non-veg') {
                    activeQuickAdds = currentMeal.nonVeg;
                  } else {
                    activeQuickAdds = Array.from(new Set([...currentMeal.veg.slice(0, 6), ...currentMeal.nonVeg.slice(0, 6)]));
                  }

                  return activeQuickAdds.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSearchQuery(item)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs text-slate-200 transition-all shadow-sm flex items-center space-x-1.5"
                    >
                      <span>+ {item}</span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Search Results Grid */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 pt-2">
              {searchResults.map((food, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-100">{food.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${
                        food.isNonVeg
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {food.isNonVeg ? '🔴 Non-Veg' : '🟢 Veg'}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                        {food.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Standard serving: {food.serving}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-3">
                      <span className="text-amber-400 font-semibold">{food.calories} kcal</span>
                      <span className="text-sky-400 font-semibold">P: {food.protein}g</span>
                      <span className="text-emerald-400 font-semibold">C: {food.carbs}g</span>
                      <span className="text-rose-400 font-semibold">F: {food.fat}g</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddSearchItem(food)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {servingMultiplier > 1 ? `(${servingMultiplier}x)` : ''}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: AI NATURAL LANGUAGE PARSER */}
      {activeMode === 'ai-text' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Natural Language Nutrition Engine</span>
            </div>
            <p className="text-xs text-slate-400">
              Type whatever you ate in plain English (e.g. <em>"3 idlis with 1 cup sambar, 2 spoons coconut chutney and 1 glass filter coffee"</em> or <em>"200g chicken breast with 1 plate curd rice"</em>).
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows="3"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="e.g. 2 masala dosas with sambar, 2 boiled eggs and 1 glass neer mor"
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />

            <button
              disabled={isAiAnalyzing || !aiText.trim()}
              onClick={handleAnalyzeAiText}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiAnalyzing ? 'Analyzing Macros...' : 'Analyze Meal with AI'}</span>
            </button>
          </div>

          {/* AI Analysis Preview */}
          {aiPreview && (
            <div className="bg-slate-950 border border-emerald-500/30 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white">{aiPreview.mealName}</h4>
                  <p className="text-[11px] text-emerald-400 font-medium">{aiPreview.nutritionNotes}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">{aiPreview.totalCalories} kcal</div>
                  <div className="text-xs text-sky-400 font-bold">{aiPreview.totalProtein}g Protein</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                {aiPreview.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                    <span className="text-slate-300">{item.quantity} {item.name}</span>
                    <div className="space-x-3 text-slate-400">
                      <span className="text-amber-400 font-semibold">{item.calories} kcal</span>
                      <span className="text-sky-400 font-semibold">{item.protein}g P</span>
                      <span className="text-emerald-400 font-semibold">{item.carbs}g C</span>
                      <span className="text-rose-400 font-semibold">{item.fat}g F</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmAiMeal}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Log to {selectedMealType.toUpperCase()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: PHOTO MEAL SCANNER */}
      {activeMode === 'photo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
              <Camera className="w-4 h-4" />
              <span>AI Computer Vision Food Scanner</span>
            </div>
            <p className="text-xs text-slate-400">
              Upload or snap a photo of your food plate. Gemini Vision inspects the dish, identifies items, and estimates macros.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3 bg-slate-950/40">
            {photoPreviewUrl ? (
              <div className="space-y-3">
                <img
                  src={photoPreviewUrl}
                  alt="Food Plate"
                  className="max-h-64 mx-auto rounded-xl border border-slate-700 object-cover shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreviewUrl(null); }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Remove & Choose Another Photo
                </button>
              </div>
            ) : (
              <div>
                <Camera className="w-10 h-10 text-emerald-400 mx-auto mb-2.5 animate-pulse" />
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSnapCamera}
                    className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap with Camera</span>
                  </button>
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 active:scale-95">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Upload from Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Take a live photo of your meal plate or select an image</p>
              </div>
            )}
          </div>

          {photoFile && !photoAiPreview && (
            <button
              disabled={isPhotoScanning}
              onClick={handleScanPhoto}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPhotoScanning ? 'Analyzing Food Plate with Gemini...' : 'Scan Photo with AI'}</span>
            </button>
          )}

          {/* Photo Scan Results */}
          {photoAiPreview && (
            photoAiPreview.isFood === false || photoAiPreview.error ? (
              <div className="bg-slate-950 border border-amber-500/40 p-5 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {photoAiPreview.needsApiKey 
                        ? 'Gemini Vision API Key Required' 
                        : (photoAiPreview.error && (photoAiPreview.error.includes('Vision analysis') || photoAiPreview.error.includes('failed') || photoAiPreview.error.includes('404')))
                        ? 'Vision Scanner Notice'
                        : 'No Food Detected in Image'}
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      {photoAiPreview.error || 'This image does not appear to contain edible food or a meal (e.g. person, clothing, or object).'}
                    </p>
                    {photoAiPreview.detectedObject && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Detected: <span className="text-slate-200 font-semibold">{photoAiPreview.detectedObject}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreviewUrl(null); setPhotoAiPreview(null); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Select Another Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('search')}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all"
                  >
                    Use Zero-Token Food Search
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-emerald-500/30 p-5 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">{photoAiPreview.mealName}</h4>
                    <p className="text-[11px] text-emerald-400 font-medium">{photoAiPreview.nutritionNotes}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white">{photoAiPreview.totalCalories} kcal</div>
                    <div className="text-xs text-sky-400 font-bold">{photoAiPreview.totalProtein}g Protein</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {photoAiPreview.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                      <span className="text-slate-300">{item.quantity} {item.name}</span>
                      <div className="space-x-3 text-slate-400">
                        <span className="text-amber-400 font-semibold">{item.calories} kcal</span>
                        <span className="text-sky-400 font-semibold">{item.protein}g P</span>
                        <span className="text-emerald-400 font-semibold">{item.carbs}g C</span>
                        <span className="text-rose-400 font-semibold">{item.fat}g F</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConfirmPhotoMeal}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Log to {selectedMealType.toUpperCase()}</span>
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* TODAY'S LOGGED MEALS STREAM */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span>Meals Logged for {selectedDate}</span>
        </h3>

        {mealsData?.meals && mealsData.meals.length > 0 ? (
          <div className="space-y-3">
            {mealsData.meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400">
                      {meal.mealType}
                    </span>
                    <span className="text-sm font-bold text-slate-100">{meal.name}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {meal.foods?.map(f => `${f.quantity} ${f.name}`).join(' • ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{meal.totalCalories} kcal</div>
                    <div className="text-[11px] text-slate-400 space-x-2">
                      <span className="text-sky-400 font-semibold">P: {meal.totalProtein}g</span>
                      <span className="text-amber-400 font-semibold">C: {meal.totalCarbs}g</span>
                      <span className="text-rose-400 font-semibold">F: {meal.totalFat}g</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setMealToDelete(meal)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Delete meal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
            No meals recorded yet for this day. Search or use AI above to log your first meal!
          </div>
        )}
      </div>

      {/* Sleek Dark Confirmation Modal for Deleting Meals */}
      <ConfirmModal
        isOpen={Boolean(mealToDelete)}
        onClose={() => setMealToDelete(null)}
        onConfirm={handleConfirmDeleteMeal}
        title="Remove Meal from Log?"
        message={`Are you sure you want to remove "${mealToDelete?.name || 'this meal'}"? Your daily calories and macronutrient totals will update automatically.`}
        confirmText="Yes, Remove Meal"
        cancelText="Cancel"
        danger={true}
      />

      {/* Live Web/Desktop Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Snap Food Plate Photo"
      />

    </div>
  );
}
