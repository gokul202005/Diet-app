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
  ChevronDown
} from 'lucide-react';

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
  const userMenuRef = useRef(null);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

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
    { id: 'dashboard', label: 'Dashboard', icon: Flame },
    { id: 'diet', label: 'Diet Tracker', icon: Utensils },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'progress', label: 'Trends & Vault', icon: TrendingUp },
    { id: 'planner', label: 'Meal Plan', icon: Sparkles },
    { id: 'fastrack', label: 'Fastrack', icon: Watch },
    { id: 'coach', label: 'AI Coach', icon: Bot },
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
      {/* 1. TOP HEADER (CLEAN & ADAPTIVE) */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Left: Brand Logo */}
            <div 
              className="flex items-center space-x-2.5 cursor-pointer shrink-0 select-none" 
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 active:scale-95 transition-transform">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-black" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-xs sm:text-sm tracking-tight text-white">AGY FIT</span>
                  <span className="text-[8px] sm:text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    AI • WATCH
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-slate-400 leading-none mt-0.5">Diet & Biomechanics</p>
              </div>
            </div>

            {/* Center (Desktop): Sleek Segmented Pill Navigation */}
            <nav className="hidden xl:flex items-center bg-slate-900/90 border border-slate-800/80 p-1 rounded-2xl shadow-inner shadow-black/30 shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-black'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Date Picker + Voice Button + Server Health + User Menu */}
            <div className="flex items-center space-x-2 shrink-0">
              
              {/* Date Switcher Pill (Compact & Clean on all devices) */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs text-slate-300 shadow-sm">
                <button
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="px-1.5 font-bold flex items-center space-x-1 whitespace-nowrap text-[11px]">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>{formatDateDisplay()}</span>
                </div>
                <button
                  onClick={handleNextDay}
                  title="Next Day"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Server Status Pill (Compact on Desktop) */}
              <div className="hidden lg:block">
                <ServerStatusWidget variant="pill" />
              </div>

              {/* Unified User Avatar & Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1.5 p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                  title="User Profile & Settings"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-black shrink-0">
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

      {/* 2. EPIC FLOATING NATIVE MOBILE DOCK (NATIVE APP FEEL) */}
      <div className="xl:hidden fixed bottom-3 inset-x-3 sm:inset-x-8 max-w-md mx-auto z-40 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-between">
          
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 leading-none">Home</span>
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
            <span className="text-[9px] mt-0.5 leading-none">Diet</span>
          </button>

          {/* CENTER HERO: FLOATING GLOWING AI ACTION BUTTON */}
          <div className="px-1 -mt-5">
            <button
              onClick={onOpenVoice || (() => window.dispatchEvent(new CustomEvent('open-universal-voice')))}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-90 transition-all border-2 border-slate-900 cursor-pointer"
              title="Universal AI Voice Log"
            >
              <Mic className="w-6 h-6 animate-pulse text-slate-950 font-black" />
            </button>
          </div>

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
            <span className="text-[9px] mt-0.5 leading-none">Workouts</span>
          </button>

          {/* Tab 4: Vault & Trends */}
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 leading-none">Vault</span>
          </button>

          {/* Tab 5: More (Coach & Watch) */}
          <button
            onClick={() => setActiveTab(activeTab === 'coach' ? 'fastrack' : 'coach')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
              activeTab === 'coach' || activeTab === 'fastrack' || activeTab === 'planner'
                ? 'bg-emerald-500/15 text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 leading-none">{activeTab === 'coach' ? 'Coach' : activeTab === 'fastrack' ? 'Watch' : 'More'}</span>
          </button>

        </div>
      </div>
    </>
  );
}
