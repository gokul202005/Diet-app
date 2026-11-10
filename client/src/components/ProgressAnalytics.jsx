import React, { useState, useEffect, useMemo } from 'react';
import ConfirmModal from './ConfirmModal';
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
  RefreshCw
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

  // Photo Vault state
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoPose, setPhotoPose] = useState('front');
  const [photoType, setPhotoType] = useState('checkin');
  const [photoNotes, setPhotoNotes] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50); // For Before/After slider

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
        if (onProfileUpdate) {
          onProfileUpdate({ ...(profile || {}), weightKg: num });
        }
        await loadTrendsAndPhotos();
      }
    } catch (err) {
      alert('Failed to save weight: ' + err.message);
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

  // Submit Photo to Vault
  const handleSavePhoto = async () => {
    if (!photoPreview) return;
    try {
      const payload = {
        date: selectedDate,
        type: photoType,
        pose: photoPose,
        photoUrl: photoPreview,
        weightKg: profile?.weightKg || null,
        notes: photoNotes
      };
      const res = await api.addProgressPhoto(payload);
      if (res.success) {
        setIsAddingPhoto(false);
        setPhotoPreview('');
        setPhotoFile(null);
        setPhotoNotes('');
        loadTrendsAndPhotos();
      }
    } catch (err) {
      alert('Failed to save photo: ' + err.message);
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

  const trendList = trendsData?.dailyTrend || [];
  const maxCalories = useMemo(() => Math.max(...trendList.map(d => Math.max(d.calories, d.targetCalories, 2500))), [trendList]);
  const maxProtein = useMemo(() => Math.max(...trendList.map(d => Math.max(d.protein, d.targetProtein, 160))), [trendList]);
  const maxSteps = useMemo(() => Math.max(...trendList.map(d => Math.max(d.steps, 10000))), [trendList]);

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

        {/* Upload Form Modal/Card */}
        {isAddingPhoto && (
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Upload New Physique Check-In</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tag As:</label>
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="before">Baseline / Before Photo</option>
                  <option value="after">Latest Progress / After Photo</option>
                  <option value="checkin">Weekly Check-in</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Pose:</label>
                <select
                  value={photoPose}
                  onChange={(e) => setPhotoPose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="front">Front Relaxed / Flexed</option>
                  <option value="side">Side Profile</option>
                  <option value="back">Back Lat Spread</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Scale Weight (kg):</label>
                <input
                  type="text"
                  defaultValue={profile?.weightKg || ''}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Notes / Reflection:</label>
              <input
                type="text"
                value={photoNotes}
                onChange={(e) => setPhotoNotes(e.target.value)}
                placeholder="e.g. Week 4 cutting, noticing serratus & upper ab definition"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center">
              {photoPreview ? (
                <div className="space-y-3">
                  <img src={photoPreview} alt="Preview" className="max-h-56 mx-auto rounded-lg object-contain" />
                  <button
                    onClick={() => { setPhotoPreview(''); setPhotoFile(null); }}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <Camera className="w-10 h-10 text-emerald-400 mx-auto mb-2.5 animate-pulse" />
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                      <Camera className="w-4 h-4" />
                      <span>Snap with Camera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 active:scale-95">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Choose from Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-2">Take a live progress photo or upload from phone storage</span>
                </div>
              )}
            </div>

            {photoPreview && (
              <button
                onClick={handleSavePhoto}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                Confirm & Add to Photo Vault
              </button>
            )}
          </div>
        )}

        {/* COMPARISON SLIDER VIEW */}
        {photos.length >= 2 ? (
          <div className="space-y-4">
            
            {/* Selector Dropdowns for Comparison */}
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
                      {p.date} • {p.weightKg ? `${p.weightKg} kg` : ''} ({p.type} - {p.pose})
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
                      {p.date} • {p.weightKg ? `${p.weightKg} kg` : ''} ({p.type} - {p.pose})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split Visual Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left: Before Photo Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Before Baseline</span>
                  <span className="text-[11px] text-slate-500 font-mono">{selectedBeforePhoto?.date}</span>
                </div>
                <div className="aspect-[3/4] max-h-80 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img 
                    src={selectedBeforePhoto?.photoUrl} 
                    alt="Before Progress" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-white">{selectedBeforePhoto?.weightKg} kg</span>
                  <span className="text-slate-400 text-[11px]">{selectedBeforePhoto?.notes || selectedBeforePhoto?.pose}</span>
                </div>
              </div>

              {/* Right: After Photo Card */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Current Physique</span>
                  <span className="text-[11px] text-emerald-400 font-mono">{selectedAfterPhoto?.date}</span>
                </div>
                <div className="aspect-[3/4] max-h-80 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img 
                    src={selectedAfterPhoto?.photoUrl} 
                    alt="After Progress" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-emerald-400">{selectedAfterPhoto?.weightKg} kg</span>
                  <span className="text-slate-400 text-[11px]">{selectedAfterPhoto?.notes || selectedAfterPhoto?.pose}</span>
                </div>
              </div>

            </div>

          </div>
        ) : photos.length === 1 ? (
          <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
            <Camera className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <h4 className="text-sm font-bold text-white">1 Check-in Photo Saved</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your second check-in photo above after 2-4 weeks to unlock the interactive side-by-side physique comparison!
            </p>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-1" />
            <h4 className="text-sm font-bold text-slate-300">Your Progress Vault is Empty</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Snap a baseline front or side photo today to visually record your fat loss and muscle building journey over time.
            </p>
            <button
              onClick={() => setIsAddingPhoto(true)}
              className="mt-3 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all inline-block"
            >
              Take Baseline Photo
            </button>
          </div>
        )}

        {/* Mini Gallery of all photos */}
        {photos.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Photo History ({photos.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="group relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-[3/4]">
                  <img src={p.photoUrl} alt="Vault item" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-end text-[10px]">
                    <span className="font-bold text-white truncate">{p.date}</span>
                    <span className="text-slate-400">{p.weightKg ? `${p.weightKg} kg` : p.pose}</span>
                  </div>
                  <button
                    onClick={() => setPhotoToDelete(p)}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-500/80 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sleek Dark Confirmation Modal for Progress Photos */}
      <ConfirmModal
        isOpen={Boolean(photoToDelete)}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDeletePhoto}
        title="Delete Progress Photo?"
        message={`Are you sure you want to delete this ${photoToDelete?.pose || ''} physique check-in from ${photoToDelete?.date || 'your vault'}?`}
        confirmText="Yes, Delete Photo"
        cancelText="Cancel"
        danger={true}
      />

    </div>
  );
}
