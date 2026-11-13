import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Smartphone, ArrowDownToLine } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { api } from '../api';

export default function AppUpdaterBanner() {
  const isNative = Capacitor.isNativePlatform();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestRelease, setLatestRelease] = useState(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const dismissed = localStorage.getItem('agy_apk_banner_dismissed');
      return dismissed === 'true' || Boolean(dismissed && dismissed.startsWith('v1.'));
    } catch {
      return false;
    }
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // Read current installed build (defaults to current live build 74)
  const currentBuild = Number(
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUILD_NUMBER) || 74
  );
  const currentTag = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RELEASE_TAG) || 'v1.1.0-b74';

  const checkUpdates = async () => {
    try {
      const data = await api.getAppVersion();
      if (data && data.releaseTag) {
        setLatestRelease(data);
        const latestBuildNum = Number(data.buildNumber) || 74;

        if (isNative) {
          // Inside Native APK: Alert only when a newer build is released
          if (latestBuildNum > currentBuild) {
            setUpdateAvailable(true);
          } else {
            setUpdateAvailable(false);
          }
        } else {
          // On Website: Always offer the latest Android APK download unless dismissed for this session
          setUpdateAvailable(true);
        }
      }
    } catch (e) {
      console.warn('Update check warning:', e);
    }
  };

  useEffect(() => {
    checkUpdates();

    const onFocus = () => checkUpdates();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [currentBuild, isNative]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('agy_apk_banner_dismissed', 'true');
    } catch {}
  };

  const handleDownloadUpdate = () => {
    setIsDownloading(true);
    const downloadUrl = latestRelease?.apkUrl || 'https://github.com/gokul202005/Diet-app/releases/latest/download/AGY-Fit-latest.apk';

    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Starting APK download... Open the downloaded file to install on your phone!', 'success', 'Downloading APK');
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'AGY-Fit-latest.apk');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 3000);
  };

  if (!updateAvailable || isDismissed) return null;

  const displayTag = latestRelease?.releaseTag || currentTag;

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-cyan-950/95 via-slate-950/95 to-indigo-950/95 border border-cyan-500/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl pointer-events-auto flex items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-950/50">
            {isNative ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Smartphone className="w-4 h-4 text-emerald-400 animate-bounce" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-black text-white tracking-wide">
                {isNative ? '🚀 New Android APK Update Available!' : '📱 Get the AGY Fit Android App (APK)'}
              </span>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-md shrink-0">
                {displayTag}
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/80 mt-0.5 truncate">
              {isNative ? (
                <>Installed: <span className="font-mono text-slate-300">{currentTag}</span> • Tap below to update to <span className="font-mono text-cyan-300">{displayTag}</span>.</>
              ) : (
                <>Download the native APK for live Fastrack Bluetooth sync, haptics & background coaching.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleDownloadUpdate}
            disabled={isDownloading}
            className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Downloading...' : isNative ? '1-Tap Update' : 'Download APK'}</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
