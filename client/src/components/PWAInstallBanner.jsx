import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { pwaManager } from '../utils/pwaService';

export default function PWAInstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (snooze for 24h)
    const dismissedTime = localStorage.getItem('agy_pwa_banner_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 24 * 60 * 60 * 1000) {
      setIsDismissed(true);
    }

    const unsubscribe = pwaManager.subscribeToInstall((state) => {
      setCanInstall(state.canInstall);
      setIsInstalled(state.isInstalled);
      setIsIOS(state.isIOS);
    });

    return () => unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    setIsInstalling(true);
    try {
      const res = await pwaManager.promptInstall();
      if (res.success) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('AGY Fit installed successfully! Launch it anytime from your Home Screen.', 'success', 'App Installed');
        }
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('agy_pwa_banner_dismissed', String(Date.now()));
  };

  // If already running inside installed standalone PWA or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if browser can prompt or if iOS Safari
  if (!canInstall && !isIOS) {
    return null;
  }

  return (
    <>
      <aside aria-label="Install App Banner" className="relative z-30 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-950/95 border-b border-emerald-500/30 px-4 py-2.5 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center space-x-3 text-slate-200">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white tracking-wide">Install AGY Fit Directly</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-semibold flex items-center space-x-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>No APK Needed</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isIOS
                  ? "Install directly from Safari for fullscreen app mode and background health sync."
                  : "Tap Install to add AGY Fit to your Home Screen with automatic updates & offline support."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalling ? 'Installing...' : isIOS ? 'How to Install' : 'Install App'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss for 24 hours"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Share className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Install on iPhone / iPad</h3>
              <p className="text-xs text-slate-400 mt-1">
                Safari lets you install AGY Fit right to your home screen in 2 quick steps:
              </p>
            </div>

            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start space-x-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  Tap the <strong className="text-white">Share</strong> button at the bottom of Safari (square with arrow pointing up).
                </div>
              </li>
              <li className="flex items-start space-x-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  Scroll down and tap <strong className="text-emerald-400">Add to Home Screen</strong>, then tap <strong className="text-white">Add</strong>.
                </div>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
