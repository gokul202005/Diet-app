import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function AppUpdaterBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestRelease, setLatestRelease] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Read current installed build
  const currentBuild = Number(
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUILD_NUMBER) || 67
  );
  const currentTag = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RELEASE_TAG) || 'v1.1.0-b67';

  const checkUpdates = async (silent = true) => {
    try {
      const data = await api.getAppVersion();
      if (data && data.buildNumber) {
        const latestBuildNum = Number(data.buildNumber);
        setLatestRelease(data);
        if (latestBuildNum > currentBuild) {
          setUpdateAvailable(true);
        } else {
          setUpdateAvailable(false);
          if (!silent && typeof window !== 'undefined' && window.showToast) {
            window.showToast(`You are on the latest AGY Fit build (${currentTag})!`, 'success', 'Up to Date');
          }
        }
      }
    } catch (e) {
      console.warn('Update check warning:', e);
    }
  };

  useEffect(() => {
    checkUpdates(true);

    // Re-check when app regains focus
    const onFocus = () => checkUpdates(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [currentBuild]);

  const handleDownloadUpdate = () => {
    setIsDownloading(true);
    const downloadUrl = latestRelease?.apkUrl || 'https://github.com/gokul202005/Diet-app/releases/latest/download/AGY-Fit-latest.apk';

    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Starting APK download... Tap the download notification on your phone to install!', 'success', 'Downloading Update');
    }

    // Trigger direct binary download
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

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-cyan-950/95 via-indigo-950/95 to-purple-950/95 border border-cyan-500/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl pointer-events-auto flex items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-white tracking-wide">
                🚀 New Android APK Update Available!
              </span>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-md">
                {latestRelease?.releaseTag || 'New Build'}
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/80 mt-0.5">
              Current: <span className="font-mono">{currentTag}</span>. Tap below to download & install the new release directly.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleDownloadUpdate}
            disabled={isDownloading}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Downloading...' : '1-Tap Update'}</span>
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Dismiss update banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
