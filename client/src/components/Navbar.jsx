import React from 'react';
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
  LogIn,
  LogOut,
  Cloud
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
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

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
    { id: 'planner', label: 'Meal Planner', icon: Sparkles },
    { id: 'diet', label: 'Diet Tracker', icon: Utensils },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'progress', label: 'Progress & Vault', icon: TrendingUp },
    { id: 'fastrack', label: 'Fastrack', icon: Watch },
    { id: 'coach', label: 'AI Coach', icon: Bot },
  ];

  // Format date display (e.g. "Today" or "09 Nov")
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

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* 1. Left: Brand Logo */}
            <div 
              className="flex items-center space-x-2.5 cursor-pointer shrink-0" 
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Flame className="w-5 h-5 text-slate-950 font-black" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-sm tracking-tight text-white">AGY FIT</span>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    AI • WATCH
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Diet & Biomechanics</p>
              </div>
            </div>

            {/* 2. Center: Sleek Segmented Pill Navigation Bar */}
            <nav className="hidden lg:flex items-center bg-slate-900/90 border border-slate-800/80 p-1 rounded-2xl shadow-inner shadow-black/30 shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 3. Right: Voice Assistant + Date Switcher + User Profile + Settings */}
            <div className="flex items-center space-x-2 shrink-0">
              
              {/* Universal Voice Assistant Pill */}
              <button
                onClick={onOpenVoice || (() => window.dispatchEvent(new CustomEvent('open-universal-voice')))}
                className="flex items-center space-x-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold text-xs shadow-sm"
                title="Universal Voice Assistant: Speak to log meals, water, workouts, or weight"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span className="hidden sm:inline">Voice Log</span>
              </button>

              {/* Date Switcher Pill */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs text-slate-300">
                <button
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
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
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User Profile Badge */}
              <button
                onClick={onOpenProfile}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Edit Your Bio Details & Targets"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-black shrink-0">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left hidden md:block max-w-[90px]">
                  <div className="text-xs font-bold text-slate-200 leading-tight truncate">
                    {profile?.name || currentUser?.name || 'User'}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-semibold capitalize truncate">
                    {profile?.goal ? profile.goal.replace(/_/g, ' ') : 'Cutting'}
                  </div>
                </div>
              </button>

              {/* Settings Cog */}
              <button
                onClick={onOpenSettings}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Settings & API Key"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl text-slate-500 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  active 
                    ? 'text-emerald-400 font-extrabold scale-105' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] whitespace-nowrap leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
