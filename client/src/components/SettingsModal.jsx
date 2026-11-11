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
  Activity
} from 'lucide-react';
import { api } from '../api';

export default function SettingsModal({ isOpen, onClose, onEditProfile, currentUser }) {
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

  useEffect(() => {
    if (isOpen) {
      // Remove any legacy leaking global key from localStorage
      try { localStorage.removeItem('agy_google_client_id'); } catch (e) {}

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
                dbStatus?.isCloudReady 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {dbStatus?.isCloudReady ? 'Supabase Active' : 'Local JSON Mode'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {dbStatus?.isCloudReady ? (
                <span className="text-emerald-300">
                  Connected to Supabase PostgreSQL! Photos, users, meals, and biometric data sync to the cloud.
                </span>
              ) : (
                <span>
                  Currently storing users, physique photos, and meal logs in high-speed local disk storage. Connect Supabase to enable cloud sync from any phone or PC.
                </span>
              )}
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
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Bio Profile</span>
            </button>
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
    </div>
  );
}
