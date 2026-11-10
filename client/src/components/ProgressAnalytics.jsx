import React, { useState, useEffect, useMemo } from 'react';
import ConfirmModal from './ConfirmModal';
import LiveCameraModal from './LiveCameraModal';
import { openNativeCamera, isNativePlatform } from '../utils/cameraService';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Flame, 
  Utensils, 
  Watch, 
  Camera, 
  Upload,
  Shield, 
  Calendar, 
  Plus, 
  Trash2, 
  Award, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Sliders,
  RefreshCw,
  Maximize2,
  Grid
} from 'lucide-react';
import { api } from '../api';

export default function ProgressAnalytics({ profile, selectedDate, onProfileUpdate, onNavigateToDiet, onNavigateToWorkouts }) {
  const [timeRange, setTimeRange] = useState(7); // 7 or 30 days
  const [trendsData, setTrendsData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weight entry state
  const [displayWeight, setDisplayWeight] = useState(profile?.weightKg || '');
  const [newWeight, setNewWeight] = useState(profile?.weightKg || '');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  useEffect(() => {
    if (profile?.weightKg) {
      setDisplayWeight(profile.weightKg);
      if (!newWeight) setNewWeight(profile.weightKg);
    }
  }, [profile?.weightKg]);

  // Day Check-in session state (holds Front, Side, Back poses for a specific day)
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [activeSlotForCamera, setActiveSlotForCamera] = useState('front'); // 'front' | 'side' | 'back'
  const [dayCheckinDate, setDayCheckinDate] = useState(selectedDate);
  const [dayCheckinType, setDayCheckinType] = useState('checkin'); // 'before' | 'after' | 'checkin'
  const [dayCheckinWeight, setDayCheckinWeight] = useState(profile?.weightKg || '');
  const [dayCheckinNotes, setDayCheckinNotes] = useState('');
  const [dayPhotos, setDayPhotos] = useState({
    front: null,
    side: null,
    back: null
  });
  const [isSubmittingDay, setIsSubmittingDay] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);

  const [sliderPosition, setSliderPosition] = useState(50); // For Before/After slider
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState(null);
  const [albumViewMode, setAlbumViewMode] = useState('album'); // 'album' | 'compare'
  const [albumTagFilter, setAlbumTagFilter] = useState('all'); // 'all' | 'before' | 'after' | 'checkin'

  // Sync date and weight when props change
  useEffect(() => {
    if (selectedDate) setDayCheckinDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (profile?.weightKg) setDayCheckinWeight(profile.weightKg);
  }, [profile?.weightKg]);

  // Client-side image optimizer to keep uploads fast and well below server limits
  const compressImage = (dataUrl, maxWidth = 1200, quality = 0.82) => {
    return new Promise((resolve) => {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSnapCameraForSlot = async (slot) => {
    setActiveSlotForCamera(slot);
    if (isNativePlatform()) {
      try {
        const dataUrl = await openNativeCamera();
        if (dataUrl) {
          const compressed = await compressImage(dataUrl);
          setDayPhotos(prev => ({ ...prev, [slot]: compressed }));
        }
      } catch (err) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(err.message || 'Could not access camera', 'error', 'Camera Error');
        }
      }
    } else {
      setIsLiveCameraOpen(true);
    }
  };

  const handleSlotFileUpload = (slot, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result);
      setDayPhotos(prev => ({ ...prev, [slot]: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearSlot = (slot) => {
    setDayPhotos(prev => ({ ...prev, [slot]: null }));
  };

  // Comparison selections
  const [beforePhotoId, setBeforePhotoId] = useState(null);
  const [afterPhotoId, setAfterPhotoId] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  // Fetch Trends & Photos
  const loadTrendsAndPhotos = async () => {
    setLoading(true);
    try {
      const [trendRes, photoRes] = await Promise.all([
        api.getTrends(timeRange),
        api.getProgressPhotos()
      ]);

      if (trendRes.success) setTrendsData(trendRes);
      if (photoRes.success) {
        setPhotos(photoRes.photos || []);
        // Auto-select first before and after if available
        const befores = (photoRes.photos || []).filter(p => p.type === 'before');
        const afters = (photoRes.photos || []).filter(p => p.type === 'after');
        if (befores.length > 0 && !beforePhotoId) setBeforePhotoId(befores[0].id);
        if (afters.length > 0 && !afterPhotoId) setAfterPhotoId(afters[0].id);
        else if (photoRes.photos.length > 1 && !afterPhotoId) setAfterPhotoId(photoRes.photos[0].id);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrendsAndPhotos();
  }, [timeRange]);

  // Handle Quick Weight Logging
  const handleSaveWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || isNaN(newWeight)) return;
    const num = parseFloat(newWeight);
    setIsLoggingWeight(true);
    try {
      const res = await api.logWeight(num, selectedDate);
      if (res.success) {
        setDisplayWeight(num);
        setNewWeight(num);
        setTrendsData(prev => prev ? {
          ...prev,
          summary: {
            ...(prev.summary || {}),
            currentWeight: num
          }
        } : prev);
        if (onProfileUpdate) {
          onProfileUpdate({ ...(profile || {}), weightKg: num });
        }
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`Saved scale weight: ${num} kg!`, 'success', 'Weight Logged');
        }
        await loadTrendsAndPhotos();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to save weight: ' + err.message, 'error', 'Weight Error');
      }
    } finally {
      setIsLoggingWeight(false);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Full Day's Check-in to Vault (Front, Side, Back together)
  const handleSaveDayCheckin = async () => {
    const photoList = [];
    if (dayPhotos.front) photoList.push({ pose: 'front', photoUrl: dayPhotos.front });
    if (dayPhotos.side) photoList.push({ pose: 'side', photoUrl: dayPhotos.side });
    if (dayPhotos.back) photoList.push({ pose: 'back', photoUrl: dayPhotos.back });

    if (photoList.length === 0) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Please snap or choose at least one photo (e.g. Front or Side pose)', 'warning', 'No Photos');
      }
      return;
    }

    setIsSubmittingDay(true);
    try {
      const payload = {
        date: dayCheckinDate || selectedDate,
        type: dayCheckinType,
        weightKg: dayCheckinWeight ? parseFloat(dayCheckinWeight) : (profile?.weightKg || null),
        notes: dayCheckinNotes,
        photos: photoList
      };

      const res = await api.saveDayCheckin(payload);
      if (res.success) {
        setIsAddingPhoto(false);
        setDayPhotos({ front: null, side: null, back: null });
        setDayCheckinNotes('');
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`Saved Day Check-In with ${res.savedCount || photoList.length} photos for ${payload.date}!`, 'success', 'Check-In Saved');
        }
        await loadTrendsAndPhotos();
      } else {
        throw new Error(res.error || 'Failed to save check-in');
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to save day check-in: ' + err.message, 'error', 'Check-in Error');
      }
    } finally {
      setIsSubmittingDay(false);
    }
  };

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return;
    try {
      await api.deleteProgressPhoto(photoToDelete.id);
      loadTrendsAndPhotos();
    } catch (err) {
      console.error('Failed to delete photo:', err);
    } finally {
      setPhotoToDelete(null);
    }
  };

  const handleConfirmDeleteDay = async () => {
    if (!dayToDelete) return;
    try {
      await api.deleteDayCheckin(dayToDelete.date);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`Deleted check-in session for ${dayToDelete.date}`, 'success', 'Session Deleted');
      }
      loadTrendsAndPhotos();
    } catch (err) {
      console.error('Failed to delete day session:', err);
    } finally {
      setDayToDelete(null);
    }
  };

  const trendList = trendsData?.dailyTrend || [];
  const maxCalories = useMemo(() => Math.max(...trendList.map(d => Math.max(d.calories, d.targetCalories, 2500))), [trendList]);
  const maxProtein = useMemo(() => Math.max(...trendList.map(d => Math.max(d.protein, d.targetProtein, 160))), [trendList]);
  const maxSteps = useMemo(() => Math.max(...trendList.map(d => Math.max(d.steps, 10000))), [trendList]);

  // Group photos by date into cohesive Day Check-In Sessions (Front, Side, Back together)
  const daySessions = useMemo(() => {
    const map = {};
    (photos || []).forEach(p => {
      const d = p.date || 'Unknown Date';
      if (!map[d]) {
        map[d] = {
          date: d,
          weightKg: p.weightKg,
          type: p.type || 'checkin',
          notes: p.notes || '',
          photos: []
        };
      }
      map[d].photos.push(p);
      if (p.weightKg) map[d].weightKg = p.weightKg;
      if (p.notes && !map[d].notes) map[d].notes = p.notes;
      if (p.type === 'before' || p.type === 'after') map[d].type = p.type;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [photos]);

  const selectedBeforePhoto = photos.find(p => p.id === beforePhotoId) || photos[photos.length - 1];
  const selectedAfterPhoto = photos.find(p => p.id === afterPhotoId) || photos[0];

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Header Banner & Range Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Bio-Analytics & Body Progression</span>
            </div>
            <h1 className="text-2xl font-black text-white">Body Recomposition Trends</h1>
            <p className="text-xs text-slate-400 mt-1">
              Visual metrics tracking caloric deficit consistency, protein intake, and physical transformation.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === 7 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === 30 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* 4 Core Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          
          {/* Average Calories */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Daily Calories</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {trendsData?.summary?.avgCalories || '--'}{' '}
              <span className="text-xs font-normal text-slate-500">kcal</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Target: {profile?.dailyTargetCalories || 2100} kcal
            </div>
          </div>

          {/* Protein Consistency */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Protein Target Hit</span>
              <Award className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-400 mt-1">
              {trendsData?.summary?.proteinConsistencyRate || 0}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg: {trendsData?.summary?.avgProtein || '--'}g / {profile?.dailyTargetProtein || 140}g
            </div>
          </div>

          {/* Daily Steps */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Daily Avg Steps</span>
              <Watch className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {(trendsData?.summary?.avgSteps || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Fastrack watch average
            </div>
          </div>

          {/* Current Scale Weight */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Weight</span>
              <Scale className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {displayWeight || profile?.weightKg || '--'} <span className="text-xs font-normal text-slate-500">kg</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 capitalize">
              Goal: {profile?.goal ? profile.goal.replace(/_/g, ' ') : 'Recomp'}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Quick Weight Logger Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Log Today's Scale Weight</div>
            <div className="text-[11px] text-slate-400">Consistent morning weighing tracks true fat loss vs water retention</div>
          </div>
        </div>

        <form onSubmit={handleSaveWeight} className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="e.g. 110.5"
              className="w-20 bg-transparent text-white font-black text-sm text-center focus:outline-none"
            />
            <span className="text-xs text-slate-400 ml-1">kg</span>
          </div>
          <button
            type="submit"
            disabled={isLoggingWeight}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            {isLoggingWeight ? 'Saving...' : 'Save Weight'}
          </button>
        </form>
      </div>

      {/* 3. INTERACTIVE TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: CALORIE DEFICIT & INTAKE TREND */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Calories Eaten vs Target</h3>
            </div>
            <span className="text-[11px] text-slate-500">Goal: {profile?.dailyTargetCalories || 2100} kcal</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-52 w-full pt-4 flex items-end justify-between gap-1 sm:gap-2 px-1">
            {trendList.map((day, idx) => {
              const heightPercent = Math.min(100, Math.max(8, Math.round((day.calories / maxCalories) * 100)));
              const isOverTarget = day.calories > day.targetCalories;
              const hasData = day.calories > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 text-[10px] text-white px-2 py-1 rounded-lg pointer-events-none z-20 whitespace-nowrap shadow-lg">
                    <span className="font-bold">{day.shortDate}</span>: {day.calories} kcal ({day.netDeficit >= 0 ? `-${day.netDeficit} deficit` : `+${Math.abs(day.netDeficit)} surplus`})
                  </div>

                  {/* Target reference line marker */}
                  <div 
                    className="absolute w-full border-t border-dashed border-slate-700 pointer-events-none z-0" 
                    style={{ bottom: `${(day.targetCalories / maxCalories) * 100}%` }}
                  />

                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all relative z-10 ${
                      !hasData 
                        ? 'bg-slate-800/40' 
                        : isOverTarget 
                          ? 'bg-gradient-to-t from-amber-500 to-rose-500' 
                          : 'bg-gradient-to-t from-emerald-600 to-teal-400'
                    }`}
                  />

                  {/* X Axis Label */}
                  <span className="text-[10px] text-slate-500 mt-2 font-semibold">
                    {timeRange === 7 ? day.dayLabel : idx % 5 === 0 ? day.shortDate.split(' ')[1] : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center space-x-6 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-md bg-emerald-500" />
              <span>In Deficit Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-md bg-amber-500" />
              <span>Over Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 border-t border-dashed border-slate-500" />
              <span>Target Line</span>
            </div>
          </div>
        </div>

        {/* CHART 2: PROTEIN CONSISTENCY */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-black text-white">Daily Protein Consistency (Muscle Recovery)</h3>
            </div>
            <span className="text-[11px] text-sky-400 font-bold">{profile?.dailyTargetProtein || 140}g / day</span>
          </div>

          {/* SVG Bar Chart for Protein */}
          <div className="h-52 w-full pt-4 flex items-end justify-between gap-1 sm:gap-2 px-1">
            {trendList.map((day, idx) => {
              const heightPercent = Math.min(100, Math.max(8, Math.round((day.protein / maxProtein) * 100)));
              const targetPercent = Math.round((day.targetProtein / maxProtein) * 100);
              const isHit = day.protein >= day.targetProtein * 0.9;
              const hasData = day.protein > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 text-[10px] text-white px-2 py-1 rounded-lg pointer-events-none z-20 whitespace-nowrap shadow-lg">
                    <span className="font-bold">{day.shortDate}</span>: {day.protein}g protein ({Math.round((day.protein / day.targetProtein) * 100)}%)
                  </div>

                  {/* Target line */}
                  <div 
                    className="absolute w-full border-t border-dashed border-sky-500/40 pointer-events-none z-0" 
                    style={{ bottom: `${targetPercent}%` }}
                  />

                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all relative z-10 ${
                      !hasData 
                        ? 'bg-slate-800/40' 
                        : isHit 
                          ? 'bg-gradient-to-t from-sky-600 to-cyan-400 shadow-sm shadow-sky-500/20' 
                          : 'bg-gradient-to-t from-slate-700 to-slate-500'
                    }`}
                  />

                  {/* X Axis Label */}
                  <span className="text-[10px] text-slate-500 mt-2 font-semibold">
                    {timeRange === 7 ? day.dayLabel : idx % 5 === 0 ? day.shortDate.split(' ')[1] : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center space-x-6 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-md bg-cyan-400" />
              <span>Target Hit (&gt;90%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-md bg-slate-600" />
              <span>Under Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 border-t border-dashed border-sky-400" />
              <span>Target Line ({profile?.dailyTargetProtein || 140}g)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. BEFORE / AFTER BODY PROGRESS PHOTO VAULT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Shield className="w-4 h-4" />
              <span>Secure Local-Only Physique Vault</span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">Physical Body Recomposition Comparison</h2>
            <p className="text-xs text-slate-400 mt-1">
              Side-by-side and interactive split slider to evaluate muscle tone, posture, and body recomposition month-over-month.
            </p>
          </div>

          <button
            onClick={() => setIsAddingPhoto(!isAddingPhoto)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{isAddingPhoto ? 'Cancel Upload' : '+ Add Physique Photo'}</span>
          </button>
        </div>

        {/* Day Check-In Upload Form (Upload Front, Side, Back together for a single day) */}
        {isAddingPhoto && (
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 space-y-5 animate-in fade-in duration-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Record Day Physique Check-In</h3>
                  <p className="text-[11px] text-slate-400">Capture your Front, Side, and Back poses together for this day</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPhoto(false)}
                className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            {/* Check-In Meta Info (Date, Tag, Scale Weight) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Check-in Date:</label>
                <input
                  type="date"
                  value={dayCheckinDate}
                  onChange={(e) => setDayCheckinDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Milestone Tag:</label>
                <select
                  value={dayCheckinType}
                  onChange={(e) => setDayCheckinType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="checkin">Weekly Check-in</option>
                  <option value="before">Baseline / Day 1 Photo</option>
                  <option value="after">Latest Progress / Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Scale Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  value={dayCheckinWeight}
                  onChange={(e) => setDayCheckinWeight(e.target.value)}
                  placeholder="e.g. 111.0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>
            </div>

            {/* Notes / Reflection for the day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Session Notes / Biomechanical Reflection:</label>
              <input
                type="text"
                value={dayCheckinNotes}
                onChange={(e) => setDayCheckinNotes(e.target.value)}
                placeholder="e.g. Morning fasted check-in: waist down 2cm, arms looking fuller, posture improved"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
              />
            </div>

            {/* 3 Pose Slots (Front, Side, Back) for this Day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-2">
                Pose Photos for this Day (Snap or upload each angle):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* SLOT 1: FRONT POSE */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  dayPhotos.front 
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/10' 
                    : 'bg-slate-900/40 border-slate-800 border-dashed hover:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center space-x-1.5">
                      <span>Front Pose</span>
                      {dayPhotos.front && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    {dayPhotos.front && (
                      <button
                        type="button"
                        onClick={() => handleClearSlot('front')}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {dayPhotos.front ? (
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/60 border border-slate-800 group">
                      <img src={dayPhotos.front} alt="Front Pose" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSnapCameraForSlot('front')}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-3 text-center space-y-2.5">
                      <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div className="space-y-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleSnapCameraForSlot('front')}
                          className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Snap Front</span>
                        </button>
                        <label className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all border border-slate-700 cursor-pointer flex items-center justify-center space-x-1 block">
                          <Upload className="w-3 h-3 text-slate-400" />
                          <span>From Gallery</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlotFileUpload('front', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* SLOT 2: SIDE PROFILE */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  dayPhotos.side 
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/10' 
                    : 'bg-slate-900/40 border-slate-800 border-dashed hover:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-teal-400 flex items-center space-x-1.5">
                      <span>Side Profile</span>
                      {dayPhotos.side && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    {dayPhotos.side && (
                      <button
                        type="button"
                        onClick={() => handleClearSlot('side')}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {dayPhotos.side ? (
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/60 border border-slate-800 group">
                      <img src={dayPhotos.side} alt="Side Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSnapCameraForSlot('side')}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-3 text-center space-y-2.5">
                      <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div className="space-y-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleSnapCameraForSlot('side')}
                          className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Snap Side</span>
                        </button>
                        <label className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all border border-slate-700 cursor-pointer flex items-center justify-center space-x-1 block">
                          <Upload className="w-3 h-3 text-slate-400" />
                          <span>From Gallery</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlotFileUpload('side', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* SLOT 3: BACK POSE (OPTIONAL) */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  dayPhotos.back 
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/10' 
                    : 'bg-slate-900/40 border-slate-800 border-dashed hover:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-sky-400 flex items-center space-x-1.5">
                      <span>Back Pose (Opt)</span>
                      {dayPhotos.back && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    {dayPhotos.back && (
                      <button
                        type="button"
                        onClick={() => handleClearSlot('back')}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {dayPhotos.back ? (
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/60 border border-slate-800 group">
                      <img src={dayPhotos.back} alt="Back Pose" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSnapCameraForSlot('back')}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-3 text-center space-y-2.5">
                      <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div className="space-y-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleSnapCameraForSlot('back')}
                          className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Snap Back</span>
                        </button>
                        <label className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all border border-slate-700 cursor-pointer flex items-center justify-center space-x-1 block">
                          <Upload className="w-3 h-3 text-slate-400" />
                          <span>From Gallery</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlotFileUpload('back', e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Commit Button */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsAddingPhoto(false)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDayCheckin}
                disabled={isSubmittingDay || (!dayPhotos.front && !dayPhotos.side && !dayPhotos.back)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmittingDay 
                    ? 'Saving Day Check-In...' 
                    : `Save Day Check-In (${[dayPhotos.front, dayPhotos.side, dayPhotos.back].filter(Boolean).length} Photos)`
                  }
                </span>
              </button>
            </div>
          </div>
        )}

        {/* PHOTO VAULT ALBUM & COMPARISON SECTION */}
        {photos.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-1" />
            <h4 className="text-sm font-bold text-slate-300">Your Progress Vault is Empty</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Snap a baseline front and side photo today to visually record your fat loss and muscle building journey over time.
            </p>
            <button
              onClick={() => setIsAddingPhoto(true)}
              className="mt-3 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all inline-block cursor-pointer"
            >
              Take Baseline Day Check-In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Album Header & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              {/* Category Filter Pills (Based on Day Check-in Sessions) */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => { setAlbumTagFilter('all'); setAlbumViewMode('album'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    albumViewMode === 'album' && albumTagFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Days ({daySessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setAlbumTagFilter('before'); setAlbumViewMode('album'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    albumViewMode === 'album' && albumTagFilter === 'before'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Baseline ({daySessions.filter(s => s.type === 'before').length})
                </button>
                <button
                  type="button"
                  onClick={() => { setAlbumTagFilter('after'); setAlbumViewMode('album'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    albumViewMode === 'album' && albumTagFilter === 'after'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Current ({daySessions.filter(s => s.type === 'after').length})
                </button>
                <button
                  type="button"
                  onClick={() => { setAlbumTagFilter('checkin'); setAlbumViewMode('album'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    albumViewMode === 'album' && albumTagFilter === 'checkin'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Check-ins ({daySessions.filter(s => s.type === 'checkin' || !s.type).length})
                </button>
              </div>

              {/* View Mode Toggle: Grid Album vs Compare Slider */}
              {photos.length >= 2 && (
                <div className="flex items-center space-x-1 shrink-0 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setAlbumViewMode('album')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      albumViewMode === 'album' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Album Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumViewMode('compare')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      albumViewMode === 'compare' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>
                </div>
              )}
            </div>

            {/* VIEW MODE 1: COMPARE SPLIT SLIDER */}
            {albumViewMode === 'compare' && photos.length >= 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Baseline Photo (Left):</span>
                    <select
                      value={beforePhotoId || ''}
                      onChange={(e) => setBeforePhotoId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold cursor-pointer"
                    >
                      {photos.map((p) => (
                        <option key={`b-${p.id}`} value={p.id}>
                          {p.date} • {p.weightKg ? `${p.weightKg} kg` : ''} ({p.type || 'checkin'} - {p.pose})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Current Progress Photo (Right):</span>
                    <select
                      value={afterPhotoId || ''}
                      onChange={(e) => setAfterPhotoId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold cursor-pointer"
                    >
                      {photos.map((p) => (
                        <option key={`a-${p.id}`} value={p.id}>
                          {p.date} • {p.weightKg ? `${p.weightKg} kg` : ''} ({p.type || 'checkin'} - {p.pose})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Split Visual Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Before */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">Baseline Photo</span>
                      <span className="text-[11px] text-slate-500 font-mono">{selectedBeforePhoto?.date}</span>
                    </div>
                    <div 
                      onClick={() => setSelectedZoomPhoto(selectedBeforePhoto)}
                      className="aspect-[3/4] max-h-80 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer group relative"
                    >
                      <img 
                        src={selectedBeforePhoto?.photoUrl} 
                        alt="Before Progress" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1 bg-black/70 text-white rounded-lg text-xs font-bold flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Fullscreen</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-white">{selectedBeforePhoto?.weightKg ? `${selectedBeforePhoto.weightKg} kg` : '--'}</span>
                      <span className="text-slate-400 text-[11px]">{selectedBeforePhoto?.notes || selectedBeforePhoto?.pose}</span>
                    </div>
                  </div>

                  {/* Right: After */}
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Current Physique</span>
                      <span className="text-[11px] text-emerald-400 font-mono">{selectedAfterPhoto?.date}</span>
                    </div>
                    <div 
                      onClick={() => setSelectedZoomPhoto(selectedAfterPhoto)}
                      className="aspect-[3/4] max-h-80 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer group relative"
                    >
                      <img 
                        src={selectedAfterPhoto?.photoUrl} 
                        alt="After Progress" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1 bg-black/70 text-white rounded-lg text-xs font-bold flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Fullscreen</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-emerald-400">{selectedAfterPhoto?.weightKg ? `${selectedAfterPhoto.weightKg} kg` : '--'}</span>
                      <span className="text-slate-400 text-[11px]">{selectedAfterPhoto?.notes || selectedAfterPhoto?.pose}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE 2: ORGANIZED BY DAY CHECK-IN SESSIONS */
              <div className="space-y-6">
                {daySessions
                  .filter((session) => {
                    if (albumTagFilter === 'all') return true;
                    if (albumTagFilter === 'before') return session.type === 'before';
                    if (albumTagFilter === 'after') return session.type === 'after';
                    if (albumTagFilter === 'checkin') return session.type === 'checkin' || !session.type;
                    return true;
                  })
                  .map((session) => {
                    const isBefore = session.type === 'before';
                    const isAfter = session.type === 'after';

                    return (
                      <div 
                        key={session.date}
                        className="bg-slate-950 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-5 shadow-xl transition-all space-y-4"
                      >
                        {/* Day Session Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-900">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center space-x-2 text-white font-black text-sm">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              <span>{session.date}</span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                              isBefore
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : isAfter
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}>
                              {isBefore ? 'Baseline' : isAfter ? 'Current Progress' : 'Day Check-in'}
                            </span>

                            {session.weightKg && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs font-bold">
                                {session.weightKg} kg
                              </span>
                            )}

                            <span className="text-[11px] text-slate-500">
                              • {session.photos.length} {session.photos.length === 1 ? 'pose' : 'poses'} ({session.photos.map(p => p.pose || 'pose').join(', ')})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDayToDelete(session)}
                            className="self-end sm:self-auto p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer text-xs flex items-center space-x-1"
                            title="Delete all photos for this day"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Delete Day</span>
                          </button>
                        </div>

                        {/* Poses Side-by-Side Grid for this Date */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                          {session.photos.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => setSelectedZoomPhoto(p)}
                              className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 aspect-[3/4] cursor-pointer shadow-lg transition-all"
                            >
                              <img 
                                src={p.photoUrl} 
                                alt={`${session.date} - ${p.pose}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />

                              {/* Top Pose Badge */}
                              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 pointer-events-none">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                                  {p.pose ? `${p.pose.toUpperCase()} POSE` : 'PHOTO'}
                                </span>
                              </div>

                              {/* Hover Actions */}
                              <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedZoomPhoto(p); }}
                                  className="p-1.5 bg-black/80 hover:bg-black text-white rounded-lg cursor-pointer"
                                  title="Inspect fullscreen"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPhotoToDelete(p); }}
                                  className="p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-lg cursor-pointer"
                                  title="Delete this pose"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Notes reflection if available */}
                        {session.notes && (
                          <div className="text-xs text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-900">
                            "{session.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedZoomPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setSelectedZoomPhoto(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase">
                  {selectedZoomPhoto.type === 'before' ? 'Baseline Photo' : selectedZoomPhoto.type === 'after' ? 'Current Progress' : 'Check-in'}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedZoomPhoto.date}</h4>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {selectedZoomPhoto.pose} pose {selectedZoomPhoto.weightKg ? `• ${selectedZoomPhoto.weightKg} kg` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedZoomPhoto;
                    setSelectedZoomPhoto(null);
                    setPhotoToDelete(p);
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZoomPhoto(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Photo View */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden min-h-[300px]">
              <img 
                src={selectedZoomPhoto.photoUrl} 
                alt="Enlarged Progress View" 
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            {/* Footer Notes */}
            {selectedZoomPhoto.notes && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-0.5">Notes / Reflection:</span>
                <p className="italic">"{selectedZoomPhoto.notes}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sleek Dark Confirmation Modal for Individual Progress Photos */}
      <ConfirmModal
        isOpen={Boolean(photoToDelete)}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDeletePhoto}
        title="Delete Progress Photo?"
        message={`Are you sure you want to delete this ${photoToDelete?.pose || ''} physique photo from ${photoToDelete?.date || 'your vault'}?`}
        confirmText="Yes, Delete Photo"
        cancelText="Cancel"
        danger={true}
      />

      {/* Sleek Dark Confirmation Modal for Full Day Check-in Session */}
      <ConfirmModal
        isOpen={Boolean(dayToDelete)}
        onClose={() => setDayToDelete(null)}
        onConfirm={handleConfirmDeleteDay}
        title="Delete Day Check-In Session?"
        message={`Are you sure you want to delete all photos taken on ${dayToDelete?.date}? This will delete all ${dayToDelete?.photos?.length || 0} poses recorded for this date.`}
        confirmText="Yes, Delete Day"
        cancelText="Cancel"
        danger={true}
      />

      {/* Live Web/Desktop Viewfinder Camera Modal */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={async (dataUrl) => {
          const compressed = await compressImage(dataUrl);
          setDayPhotos(prev => ({ ...prev, [activeSlotForCamera]: compressed }));
          setIsLiveCameraOpen(false);
        }}
        title={`Snap ${activeSlotForCamera.toUpperCase()} Progress Photo`}
      />

    </div>
  );
}
