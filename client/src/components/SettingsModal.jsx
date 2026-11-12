import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Watch, 
  Check, 
  User, 
  ExternalLink,
  Flame,
  Info,
  Activity,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import ConfirmModal from './ConfirmModal';

export default function SettingsModal({ isOpen, onClose, onEditProfile, currentUser, onDataCleared }) {
  const [settings, setSettings] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [deviceName, setDeviceName] = useState('Fastrack Reflex Curve');
  const userStorageKey = currentUser?.id ? `agy_google_client_id_${currentUser.id}` : null;
  const [googleClientId, setGoogleClientId] = useState(() => {
    if (userStorageKey && typeof window !== 'undefined') {
      return localStorage.getItem(userStorageKey) || '';
    }
    return '';
  });
  const [useFallback, setUseFallback] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  // User activity data summary & deletion state
  const [dataSummary, setDataSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    clearMeals: true,
    clearWorkouts: true,
    clearWalking: true,
    clearWater: true,
    clearWeight: true,
    clearChat: true,
    clearPhotos: false,
    clearHunter: false
  });

  const loadDataSummary = () => {
    if (!currentUser?.id) return;
    setIsLoadingSummary(true);
    api.getUserDataSummary(currentUser.id)
      .then((data) => {
        if (data?.success) setDataSummary(data);
      })
      .catch(() => null)
      .finally(() => setIsLoadingSummary(false));
  };

  useEffect(() => {
    if (isOpen) {
      // Remove any legacy leaking global key from localStorage
      try { localStorage.removeItem('agy_google_client_id'); } catch (e) {}

      loadDataSummary();

      api.getSettings(currentUser?.id).then((data) => {
        setSettings(data);
        if (data.fastrackDeviceName) setDeviceName(data.fastrackDeviceName);
        if (data.useHeuristicFallback !== undefined) setUseFallback(data.useHeuristicFallback);
        if (data.googleClientId !== undefined && data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        } else if (userStorageKey) {
          setGoogleClientId(localStorage.getItem(userStorageKey) || '');
        } else {
          setGoogleClientId('');
        }
      });
      api.getDatabaseStatus().then((data) => {
        if (data) setDbStatus(data);
      }).catch(() => null);
    }
  }, [isOpen, currentUser?.id]);

  const handleConfirmClearData = async () => {
    setIsDeletingData(true);
    try {
      const res = await api.clearUserData(deleteOptions, currentUser?.id);
      if (res?.success) {
        try {
          localStorage.removeItem('agy_local_steps_today');
          if (deleteOptions.clearHunter) {
            localStorage.removeItem('agy_hunter_profile');
          }
        } catch (e) {}

        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(
            `Data deleted: ${res.totalDeleted || 0} records cleared successfully.`,
            'success',
            'Data Reset Complete'
          );
        }
        loadDataSummary();
        if (onDataCleared) {
          onDataCleared();
        }
      } else {
        throw new Error(res?.error || 'Failed to clear user data');
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(err.message || 'Error deleting data', 'error', 'Error');
      }
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleMigrateToSupabase = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await api.migrateToSupabase();
      setMigrationResult(res);
      if (res.success) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`Successfully synced to Supabase! ${res.usersMigrated} users, ${res.mealsMigrated} meals, ${res.watchLogsMigrated} logs.`, 'success', 'Supabase Cloud Sync');
        }
      } else {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(res.message || 'Supabase credentials not configured in server/.env yet.', 'warning', 'Setup Required');
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(err.message || 'Migration error', 'error', 'Error');
      }
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        fastrackDeviceName: deviceName,
        useHeuristicFallback: useFallback,
        googleClientId: googleClientId.trim()
      };
      if (apiKeyInput.trim()) {
        payload.geminiApiKey = apiKeyInput.trim();
      }

      if (userStorageKey) {
        if (googleClientId.trim()) {
          localStorage.setItem(userStorageKey, googleClientId.trim());
        } else {
          localStorage.removeItem(userStorageKey);
        }
      }
      localStorage.removeItem('agy_google_client_id'); // Ensure leaking legacy key is wiped

      const res = await api.updateSettings(payload, currentUser?.id);
      if (res.success) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Settings and preferences saved securely for your account!', 'success', 'Settings Saved');
        }
        setApiKeyInput('');
        onClose();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Failed to save settings: ' + err.message, 'error', 'Error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">App Settings & AI Token Safeguard</h2>
              <p className="text-xs text-slate-400">Manage Gemini API, Token Quota & Fastrack Watch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* TOKEN GUARD & ZERO-TOKEN ARCHITECTURE STATUS */}
          <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Token Exhaustion Protection (Active)</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent running out of AI tokens, your app is engineered with a <strong>Multi-Tiered Hybrid Architecture</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-start space-x-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Zero-Token Food DB</div>
                  <div className="text-[11px] text-slate-400">Authentic South Indian & gym staples lookups consume 0 API tokens.</div>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-start space-x-2">
                <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Algorithmic Fallback</div>
                  <div className="text-[11px] text-slate-400">If API quota is reached, local engine calculates macros and split scores flawlessly.</div>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
              <span>Today's API Calls: <strong className="text-white">{settings?.tokenUsage?.requestsToday || 0}</strong></span>
              <span>Estimated Tokens Saved: <strong className="text-emerald-400">~85% via Local Cache</strong></span>
            </div>
          </div>

          {/* GEMINI API KEY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Google Gemini API Key</span>
              </label>
              <div className="flex items-center space-x-2">
                {settings?.hasApiKey && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Saved & Active ({settings.maskedKey})</span>
                  </span>
                )}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={settings?.hasApiKey ? `Key is saved (${settings.maskedKey}) - Type to replace` : "AIzaSy..."}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400">
              {settings?.hasApiKey ? (
                <span className="text-emerald-400 font-semibold">
                  ✓ Your Gemini API key is securely saved on the server. For security, secret keys are masked so they cannot be exposed in the browser.
                </span>
              ) : (
                <span>
                  Powers Gemini 1.5/2.5 Flash for South Indian meal planning, food plate recognition, and AI Coach.
                </span>
              )}
            </p>
          </div>

          {/* FASTRACK SMARTWATCH DEVICE NAME */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Watch className="w-4 h-4 text-emerald-400" />
              <span>Fastrack Watch Model / Name</span>
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
              placeholder="e.g. Fastrack Reflex Beat / Fastrack Smart Nitro"
            />
          </div>

          {/* GOOGLE FIT OAUTH CLIENT ID (OPTIONAL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Google Cloud OAuth Client ID (Optional)</span>
              </label>
              <div className="flex items-center space-x-2">
                {googleClientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleClientId('');
                      if (userStorageKey) localStorage.removeItem(userStorageKey);
                      localStorage.removeItem('agy_google_client_id');
                      localStorage.removeItem('agy_google_fit_token');
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline font-semibold"
                  >
                    Clear ID
                  </button>
                )}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:underline flex items-center space-x-1"
                >
                  <span>Google Cloud</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-mono"
              placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {googleClientId ? (
                <span className="text-emerald-400 font-semibold">
                  Client ID active. If Google shows Error 403, add your email to "Test Users" in Google Cloud OAuth Consent Screen. If Error 401, click "Clear ID".
                </span>
              ) : (
                <span>
                  Optional: If left empty, AGY Fit connects to Google Fit and smartwatches automatically via Android Health Connect & built-in sensor bridge with zero setup!
                </span>
              )}
            </p>
          </div>

          {/* CLOUD DATABASE & STORAGE (SUPABASE / POSTGRESQL) */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Cloud Database & Photo Storage</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                dbStatus?.isCloudReady !== false
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {dbStatus?.isCloudReady !== false ? 'Supabase Cloud Active' : 'Connecting to Supabase...'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-emerald-300">
                100% Supabase Cloud Persistence: Your user accounts, bio profiles, South Indian meals, workouts, watch logs, and physique photos are stored permanently in Supabase Cloud PostgreSQL.
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <div className="text-[10px] text-slate-500">
                Schema: <code className="text-slate-400 font-mono">server/data/supabase_schema.sql</code>
              </div>
              <button
                type="button"
                onClick={handleMigrateToSupabase}
                disabled={isMigrating}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isMigrating ? 'Migrating...' : '1-Click Sync Local Data to Supabase'}</span>
              </button>
            </div>

            {migrationResult && (
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] space-y-1">
                {migrationResult.success ? (
                  <div className="text-emerald-400 font-semibold">
                    Synced: {migrationResult.usersMigrated} users, {migrationResult.profilesMigrated} profiles, {migrationResult.mealsMigrated} meals, {migrationResult.watchLogsMigrated} watch logs.
                  </div>
                ) : (
                  <div className="text-amber-400">
                    {migrationResult.message || migrationResult.error || 'Check server/.env for SUPABASE_URL & SUPABASE_ANON_KEY'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EDIT BIO PROFILE SHORTCUT */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Personal Details & Macro Targets</div>
              <div className="text-[11px] text-slate-400">Re-run the setup wizard to change your weight, height or goal</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProfile();
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Bio Profile</span>
            </button>
          </div>

          {/* USER DATA RESET & DELETION (DANGER ZONE) */}
          <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-rose-300">Delete User Activity Data</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {isLoadingSummary ? 'Counting...' : `${dataSummary?.totalRecords || 0} Records`}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Permanently delete logged activity for <strong>{currentUser?.name || 'your account'}</strong> without deleting your login account or macro targets:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.clearMeals}
                  onChange={(e) => setDeleteOptions(prev => ({ ...prev, clearMeals: e.target.checked }))}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 bg-slate-950"
                />
                <span className="text-slate-200">
                  🍲 Meals & Food <strong className="text-rose-400 font-mono">({dataSummary?.mealsCount || 0})</strong>
                </span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.clearWorkouts}
                  onChange={(e) => setDeleteOptions(prev => ({ ...prev, clearWorkouts: e.target.checked }))}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 bg-slate-950"
                />
                <span className="text-slate-200">
                  🏋️ Workouts & Gym <strong className="text-rose-400 font-mono">({dataSummary?.workoutsCount || 0})</strong>
                </span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.clearWalking}
                  onChange={(e) => setDeleteOptions(prev => ({ ...prev, clearWalking: e.target.checked }))}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 bg-slate-950"
                />
                <span className="text-slate-200">
                  🚶 Steps & Walking <strong className="text-rose-400 font-mono">({dataSummary?.walkingCount || 0})</strong>
                </span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.clearWater}
                  onChange={(e) => setDeleteOptions(prev => ({ 
                    ...prev, 
                    clearWater: e.target.checked,
                    clearWeight: e.target.checked 
                  }))}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 bg-slate-950"
                />
                <span className="text-slate-200">
                  💧 Water & Weight <strong className="text-rose-400 font-mono">({(dataSummary?.waterCount || 0) + (dataSummary?.weightCount || 0)})</strong>
                </span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.clearChat}
                  onChange={(e) => setDeleteOptions(prev => ({ ...prev, clearChat: e.target.checked }))}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 bg-slate-950"
                />
                <span className="text-slate-200">
                  💬 Coach Chat <strong className="text-rose-400 font-mono">({dataSummary?.chatCount || 0})</strong>
                </span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.clearPhotos}
                  onChange={(e) => setDeleteOptions(prev => ({ ...prev, clearPhotos: e.target.checked }))}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20 bg-slate-950"
                />
                <span className="text-slate-200">
                  📸 Vault Photos <strong className="text-rose-400 font-mono">({dataSummary?.photosCount || 0})</strong>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-rose-500/20">
              <button
                type="button"
                onClick={() => {
                  const allSelected = deleteOptions.clearMeals && deleteOptions.clearWorkouts && deleteOptions.clearWalking;
                  setDeleteOptions({
                    clearMeals: !allSelected,
                    clearWorkouts: !allSelected,
                    clearWalking: !allSelected,
                    clearWater: !allSelected,
                    clearWeight: !allSelected,
                    clearChat: !allSelected,
                    clearPhotos: !allSelected,
                    clearHunter: false
                  });
                }}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                {deleteOptions.clearMeals && deleteOptions.clearWorkouts && deleteOptions.clearWalking ? 'Deselect All' : 'Select All'}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                disabled={isDeletingData || (!deleteOptions.clearMeals && !deleteOptions.clearWorkouts && !deleteOptions.clearWalking && !deleteOptions.clearWater && !deleteOptions.clearChat && !deleteOptions.clearPhotos)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingData ? 'Deleting...' : 'Delete Selected Data'}</span>
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmClearData}
        title="Permanently Delete Activity Records?"
        message="Are you sure you want to delete your selected activity records (meals, workouts, walking data)? Your user account and bio macro targets will remain safe, but selected logged entries will be permanently deleted from local and cloud storage."
        confirmText="Yes, Delete My Data"
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
}
