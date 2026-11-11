// AGY Fit PWA & Service Worker Registration Manager
// Manages App Install Prompts, Offline Support & Background Sync Registration

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.swRegistration = null;
    this.installListeners = new Set();
    this.syncListeners = new Set();
    this.isAppInstalled = false;

    if (typeof window !== 'undefined') {
      this.checkStandalone();
      this.initListeners();
    }
  }

  checkStandalone() {
    const isStandalone = 
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && (navigator.standalone === true || Boolean(window.Capacitor?.isNativePlatform?.())));
    this.isAppInstalled = Boolean(isStandalone);
  }

  initListeners() {
    // 1. Capture beforeinstallprompt (Chrome / Android / Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyInstallListeners(true);
      console.log('[PWA] beforeinstallprompt event captured and ready for 1-tap install.');
    });

    // 2. Track successful install
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isAppInstalled = true;
      this.notifyInstallListeners(false);
      console.log('[PWA] AGY Fit installed successfully to Home Screen!');
    });

    // 3. Listen for SW messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'HEALTH_BACKGROUND_SYNC_PULSE') {
          this.syncListeners.forEach(cb => {
            try { cb(event.data); } catch (e) { console.warn(e); }
          });
        }
      });
    }
  }

  // Register Service Worker and Periodic Background Sync
  async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported in this environment.');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = registration;
      console.log('[PWA] Service Worker registered with scope:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available! Activating...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Register Periodic Background Sync if supported (Android Chrome PWA)
      if ('periodicSync' in registration) {
        try {
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') {
            await registration.periodicSync.register('health-periodic-sync', {
              minInterval: 15 * 60 * 1000 // 15 minutes minimum interval
            });
            console.log('[PWA] Periodic Health Background Sync registered (15 min interval).');
          }
        } catch (err) {
          console.log('[PWA] Periodic sync permission note:', err.message);
        }
      }

      // Register One-Shot Background Sync (SyncManager)
      if ('sync' in registration) {
        try {
          await registration.sync.register('sync-health-telemetry');
          console.log('[PWA] One-shot health telemetry background sync registered.');
        } catch (err) {
          console.log('[PWA] Background sync registration note:', err.message);
        }
      }

      return registration;
    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
      return null;
    }
  }

  // Trigger 1-Tap App Install Prompt
  async promptInstall() {
    if (!this.deferredPrompt) {
      return { success: false, reason: 'no-prompt' };
    }

    try {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      console.log('[PWA] User installation choice:', choice.outcome);
      if (choice.outcome === 'accepted') {
        this.isAppInstalled = true;
        this.deferredPrompt = null;
        this.notifyInstallListeners(false);
        return { success: true };
      }
      return { success: false, reason: 'dismissed' };
    } catch (err) {
      console.error('[PWA] Prompt install error:', err);
      return { success: false, error: err.message };
    }
  }

  // Check if iOS Safari
  isIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }

  // Check if app is running in standalone mode (already installed)
  isStandalone() {
    this.checkStandalone();
    return this.isAppInstalled;
  }

  // Can prompt direct install (Android/Chrome/Edge)
  canInstall() {
    return Boolean(this.deferredPrompt) && !this.isStandalone();
  }

  // Subscribe to install availability changes
  subscribeToInstall(callback) {
    this.installListeners.add(callback);
    // Initial emit
    callback({
      canInstall: this.canInstall(),
      isInstalled: this.isStandalone(),
      isIOS: this.isIOS()
    });
    return () => this.installListeners.delete(callback);
  }

  notifyInstallListeners(canInstall) {
    this.installListeners.forEach(cb => {
      try {
        cb({
          canInstall,
          isInstalled: this.isStandalone(),
          isIOS: this.isIOS()
        });
      } catch (e) {
        console.warn(e);
      }
    });
  }

  // Subscribe to background sync wake-ups
  subscribeToSyncPulse(callback) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }
}

export const pwaManager = new PWAManager();
