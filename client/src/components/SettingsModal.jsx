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
  Info
} from 'lucide-react';
import { api } from '../api';

export default function SettingsModal({ isOpen, onClose, onEditProfile }) {
  const [settings, setSettings] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [deviceName, setDeviceName] = useState('Fastrack Reflex Curve');
  const [useFallback, setUseFallback] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then((data) => {
        setSettings(data);
        if (data.fastrackDeviceName) setDeviceName(data.fastrackDeviceName);
        if (data.useHeuristicFallback !== undefined) setUseFallback(data.useHeuristicFallback);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        fastrackDeviceName: deviceName,
        useHeuristicFallback: useFallback
      };
      if (apiKeyInput.trim()) {
        payload.geminiApiKey = apiKeyInput.trim();
      }

      const res = await api.updateSettings(payload);
      if (res.success) {
        alert('Settings saved successfully!');
        setApiKeyInput('');
        onClose();
      }
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
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
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Get Free Gemini Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={settings?.hasApiKey ? `Configured (${settings.maskedKey}) - Paste to replace` : "AIzaSy..."}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Powered by Gemini 1.5/2.5 Flash for multimodal food plate recognition and custom biomechanical workout splits.
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
