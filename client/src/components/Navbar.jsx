import React, { useState, useRef, useEffect } from 'react';
import ServerStatusWidget from './ServerStatusWidget';
import { 
  Flame, 
  Utensils, 
  Dumbbell, 
  Watch, 
  Bot, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Sparkles,
  User,
  TrendingUp,
  Mic,
  LogOut,
  X,
  Activity,
  Layers,
  ChevronDown,
  Download,
  Shield,
  Radio
} from 'lucide-react';
import { pwaManager } from '../utils/pwaService';
import { api } from '../api';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  selectedDate, 
  setSelectedDate, 
  profile, 
  currentUser,
  onOpenProfile, 
  onOpenSettings,
  onOpenVoice,
  onOpenAuth,
  onLogout
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [appVersionInfo, setAppVersionInfo] = useState({
    releaseTag: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RELEASE_TAG) || 'v1.1.0-b74',
    buildNumber: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUILD_NUMBER) || '74',
    apkUrl: 'https://github.com/gokul202005/Diet-app/releases/latest/download/AGY-Fit-latest.apk'
  });
  const userMenuRef = useRef(null);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Fetch live latest build / APK release version
  useEffect(() => {
    api.getAppVersion().then(data => {
      if (data?.releaseTag) {
        setAppVersionInfo(data);
      }
    }).catch(() => null);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: Flame },
    { id: 'diet', label: 'Diet Tracker', shortLabel: 'Diet', icon: Utensils },
    { id: 'workouts', label: 'Workouts', shortLabel: 'Gym', icon: Dumbbell },
    { id: 'progress', label: 'Trends & Vault', shortLabel: 'Vault', icon: TrendingUp },
    { id: 'hunter', label: 'Hunter Rank', shortLabel: 'Hunter', icon: Shield },
    { id: 'planner', label: 'Meal Plan', shortLabel: 'Plan', icon: Sparkles },
    { id: 'fastrack', label: 'Fastrack', shortLabel: 'Watch', icon: Watch },
    { id: 'coach', label: 'AI Coach', shortLabel: 'Coach', icon: Bot },
  ];

  const formatDateDisplay = () => {
    if (isToday) return 'Today';
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return selectedDate;
    }
  };

  const displayName = profile?.name || currentUser?.name || 'Athlete';
  const displayGoal = profile?.goal ? profile.goal.replace(/_/g, ' ') : 'Recomp';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* 1. TOP HEADER (SLIM, NOTCH-SAFE & BALANCED PC/MOBILE ALIGNMENT) */}
      <header 
        className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)'
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14 gap-1.5 sm:gap-3">
            
            {/* Left: Brand Logo (Always 100% visible, never clipped) */}
            <div 
              className="flex items-center space-x-1.5 cursor-pointer shrink-0 select-none pl-1" 
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 active:scale-95 transition-transform shrink-0">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 font-black" />
              </div>
              <div className="shrink-0">
                <div className="flex items-center space-x-1">
                  <span className="font-black text-xs sm:text-sm tracking-tight text-white">AGY FIT</span>
                </div>
                <p className="hidden md:block text-[9px] text-slate-400 leading-none mt-0.5">Diet & Biomechanics</p>
              </div>
            </div>

            {/* Center (Desktop): Sleek Segmented Pill Navigation */}
            <nav className="hidden xl:flex items-center bg-slate-900/90 border border-slate-800/80 p-0.5 rounded-2xl shadow-inner shadow-black/30 shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-black'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden 2xl:inline">{tab.label}</span>
                    <span className="2xl:hidden">{tab.shortLabel || tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Watch Pill + Jarvis Button + Date Switcher + User Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              
              {/* Direct Fastrack Smartwatch Pill Button */}
              <button
                onClick={() => setActiveTab('fastrack')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all cursor-pointer border shrink-0 active:scale-95 ${
                  activeTab === 'fastrack'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30 font-black'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/30'
                }`}
                title="Fastrack Smartwatch & Telemetry"
              >
                <Watch className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="hidden xs:inline">WATCH</span>
              </button>

              {/* Instant 1-Tap Jarvis Voice Assistant */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('agy-open-jarvis'))}
                className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer shadow-md shadow-cyan-950/40 active:scale-95 shrink-0"
                title="Open Jarvis Voice AI Assistant from anywhere"
              >
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
                <span className="tracking-wider">JARVIS</span>
              </button>

              {/* Date Switcher Pill (Compact & Clean on all devices) */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs text-slate-300 shadow-sm shrink-0">
                <button
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div className="px-1 font-bold flex items-center space-x-1 whitespace-nowrap text-[10px] sm:text-xs">
                  <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{formatDateDisplay()}</span>
                </div>
                <button
                  onClick={handleNextDay}
                  title="Next Day"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Unified User Avatar & Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 p-0.5 sm:p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                  title="User Profile & Settings"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-black shrink-0">
                    {initial}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Card */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-2">
                      <div className="text-xs font-bold text-white truncate">{displayName}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold capitalize mt-0.5">
                        Goal: {displayGoal}
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onOpenProfile(); }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer text-left font-medium"
                      >
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>Profile & Biometrics</span>
                      </button>

                      <button
                        onClick={() => { setIsUserMenuOpen(false); onOpenSettings(); }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer text-left font-medium"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings & API Key</span>
                      </button>

                      {/* 1-Tap PWA Install in Dropdown */}
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          if (pwaManager.isStandalone()) {
                            window.showToast?.('App is already installed on this device!', 'info', 'AGY Fit PWA');
                          } else {
                            await pwaManager.promptInstall();
                          }
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left font-medium"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Install App (PWA)</span>
                      </button>

                      {/* Direct Android APK Download */}
                      <a
                        href={appVersionInfo.apkUrl || "https://github.com/gokul202005/Diet-app/releases/latest/download/AGY-Fit-latest.apk"}
                        download="AGY-Fit-latest.apk"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer text-left font-medium"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span>Download Android APK</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded-md flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>{appVersionInfo.releaseTag}</span>
                        </span>
                      </a>

                      {/* Server Status Trigger inside Dropdown */}
                      <div className="px-3 py-1.5 border-t border-slate-800/60 my-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Cloud Backend</div>
                        <ServerStatusWidget variant="pill" />
                      </div>

                      {onLogout && (
                        <button
                          onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-medium border-t border-slate-800/60 mt-1"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* 2. EPIC FLOATING NATIVE MOBILE DOCK (HOME-BAR SAFE & CENTERED SPEAKER) */}
      <div 
        className="xl:hidden fixed inset-x-2 sm:inset-x-8 max-w-lg mx-auto z-40 pointer-events-none"
        style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
      >
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-between">
          
          {/* Tab 1: Home / Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Home</span>
          </button>

          {/* Tab 2: Diet */}
          <button
            onClick={() => setActiveTab('diet')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'diet'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Diet</span>
          </button>

          {/* Tab 3: Workouts */}
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'workouts'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Gym</span>
          </button>

          {/* Tab 4: Fastrack Smartwatch (Integrated in Dock - No Overlapping Floating Buttons) */}
          <button
            onClick={() => setActiveTab('fastrack')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'fastrack'
                ? 'bg-cyan-500/15 text-cyan-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Watch className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Watch</span>
          </button>

          {/* CENTER SPEAKER HERO: 100% IN THE DEAD MIDDLE (4 items left, 4 items right) */}
          <div className="px-1 -mt-6 shrink-0">
            <button
              onClick={onOpenVoice || (() => window.dispatchEvent(new CustomEvent('open-universal-voice')))}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-90 transition-all border-2 border-slate-900 cursor-pointer hover:scale-105"
              title="Universal AI Voice Speaker"
            >
              <Mic className="w-6 h-6 animate-pulse text-slate-950 font-black" />
            </button>
          </div>

          {/* Tab 5: Hunter Rank */}
          <button
            onClick={() => setActiveTab('hunter')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'hunter'
                ? 'bg-purple-500/15 text-purple-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Hunter</span>
          </button>

          {/* Tab 6: Vault & Trends */}
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Vault</span>
          </button>

          {/* Tab 7: Meal Plan */}
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'planner'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Plan</span>
          </button>

          {/* Tab 8: Dedicated AI Coach Bot */}
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'coach'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">Coach</span>
          </button>

        </div>
      </div>
    </>
  );
}
