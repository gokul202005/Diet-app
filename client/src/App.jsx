import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DietTracker from './components/DietTracker';
import WorkoutTracker from './components/WorkoutTracker';
import FastrackWatch from './components/FastrackWatch';
import CoachChat from './components/CoachChat';
import MealPlanner from './components/MealPlanner';
import ProgressAnalytics from './components/ProgressAnalytics';
import HunterSystem from './components/HunterSystem';
import OnboardingModal from './components/OnboardingModal';
import SettingsModal from './components/SettingsModal';
import UniversalVoiceAssistant from './components/UniversalVoiceAssistant';
import GlobalJarvis from './components/GlobalJarvis';
import AuthScreen from './components/AuthScreen';
import AppUpdaterBanner from './components/AppUpdaterBanner';
import { api } from './api';
import { healthConnectSync } from './utils/healthConnectSync';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch Profile and Current User on App Mount
  useEffect(() => {
    async function initProfileAndAuth() {
      try {
        const authData = await api.getCurrentUser().catch(() => null);
        if (authData?.success && authData?.user?.id) {
          setCurrentUser(authData.user);
          healthConnectSync.setUser(authData.user.id);
          localStorage.setItem('agy_current_user', JSON.stringify(authData.user));
          const profileData = await api.getProfile().catch(() => null);

          const cachedProfile = localStorage.getItem(`agy_profile_${authData.user.id}`);
          let parsedCached = null;
          try { if (cachedProfile) parsedCached = JSON.parse(cachedProfile); } catch (e) {}

          const effectiveProfile = (profileData && profileData.isConfigured)
            ? profileData
            : (parsedCached && parsedCached.isConfigured ? parsedCached : profileData);

          if (effectiveProfile) {
            setProfile(effectiveProfile);
            if (effectiveProfile.isConfigured) {
              localStorage.setItem(`agy_profile_${authData.user.id}`, JSON.stringify(effectiveProfile));
            }
          }

          // Only trigger onboarding setup wizard if user is brand new (never configured)
          const isDismissed = sessionStorage.getItem('onboarding_wizard_dismissed');
          if ((!effectiveProfile || !effectiveProfile.isConfigured) && !isDismissed) {
            setIsOnboardingOpen(true);
          } else {
            setIsOnboardingOpen(false);
          }
        } else {
          setCurrentUser(null);
          setProfile(null);
          localStorage.removeItem('agy_current_user');
          sessionStorage.removeItem('onboarding_wizard_dismissed');
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('agy_profile_')) {
                localStorage.removeItem(key);
              }
            });
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load profile or auth:', err);
        setCurrentUser(null);
        setProfile(null);
        localStorage.removeItem('agy_current_user');
        sessionStorage.removeItem('onboarding_wizard_dismissed');
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('agy_profile_')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    }
    initProfileAndAuth();
  }, []);

  // Listen for autonomous voice action navigation and modal triggers
  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      if (e.detail?.modal === 'settings') {
        setIsSettingsOpen(true);
      } else if (e.detail?.modal === 'profile') {
        setIsOnboardingOpen(true);
      }
    };

    const handleActionSync = (e) => {
      setRefreshKey(k => k + 1);
      if (e.detail?.section && ['diet', 'workouts', 'fastrack', 'progress'].includes(e.detail.section)) {
        setActiveTab(e.detail.section);
      }
    };

    window.addEventListener('agy-navigate-tab', handleNav);
    window.addEventListener('agy-action-completed', handleActionSync);
    return () => {
      window.removeEventListener('agy-navigate-tab', handleNav);
      window.removeEventListener('agy-action-completed', handleActionSync);
    };
  }, []);

  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
    if (currentUser?.id && updatedProfile?.isConfigured) {
      localStorage.setItem(`agy_profile_${currentUser.id}`, JSON.stringify(updatedProfile));
    }
  };

  const handleAuthSuccess = async (user, initialProfile) => {
    if (!user) return;
    localStorage.setItem('agy_current_user', JSON.stringify(user));
    setCurrentUser(user);
    healthConnectSync.setUser(user.id);

    const cachedProfile = localStorage.getItem(`agy_profile_${user.id}`);
    let parsedCached = null;
    try { if (cachedProfile) parsedCached = JSON.parse(cachedProfile); } catch (e) {}

    let effectiveProfile = (initialProfile && initialProfile.isConfigured) ? initialProfile : parsedCached;
    if (!effectiveProfile || !effectiveProfile.isConfigured) {
      try {
        const p = await api.getProfile();
        if (p && p.isConfigured) {
          effectiveProfile = p;
        }
      } catch (e) {}
    }

    if (effectiveProfile) {
      setProfile(effectiveProfile);
      if (effectiveProfile.isConfigured) {
        localStorage.setItem(`agy_profile_${user.id}`, JSON.stringify(effectiveProfile));
      }
    }

    // Only prompt wizard if user has NEVER configured their profile
    if (!effectiveProfile || !effectiveProfile.isConfigured) {
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    try {
      healthConnectSync.disconnectGoogleFit();
      healthConnectSync.setUser(null);
    } catch (e) {}
    setCurrentUser(null);
    setProfile(null);
    setIsOnboardingOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agy_current_user');
      localStorage.removeItem('agy_google_fit_token');
      localStorage.removeItem('agy_google_client_id');
      sessionStorage.removeItem('onboarding_wizard_dismissed');
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('agy_profile_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {}
    }
  };

  const handleVoiceActionCompleted = (res) => {
    // Automatically trigger live refresh of active views
    setRefreshKey(k => k + 1);
    if (res?.section === 'coach' && activeTab !== 'coach') {
      setActiveTab('coach');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Initializing AI Fitness & Diet Engine...</span>
      </div>
    );
  }

  // 1. Full-Screen Login & Signup Screen comes first if not signed in
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        profile={profile}
        currentUser={currentUser}
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onLogout={handleLogout}
      />

      {/* Automatic APK Version Alert & 1-Tap In-App Updater */}
      <AppUpdaterBanner />

      {/* Main App Content Body (Mobile Safe-Padding for Floating Dock) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 xl:pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            key={`dashboard-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            profile={profile}
            onNavigateToDiet={() => setActiveTab('diet')}
            onNavigateToWorkouts={() => setActiveTab('workouts')}
            onNavigateToFastrack={() => setActiveTab('fastrack')}
            onNavigateToProgress={() => setActiveTab('progress')}
            onNavigateToHunter={() => setActiveTab('hunter')}
            onOpenCoach={() => setActiveTab('coach')}
            onOpenProfile={() => setIsOnboardingOpen(true)}
          />
        )}

        {activeTab === 'planner' && (
          <MealPlanner
            key={`planner-${refreshKey}`}
            profile={profile}
            selectedDate={selectedDate}
            onPlanLogged={() => setActiveTab('diet')}
          />
        )}

        {activeTab === 'diet' && (
          <DietTracker
            key={`diet-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            profile={profile}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutTracker
            key={`workouts-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            profile={profile}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressAnalytics
            key={`progress-${refreshKey}`}
            profile={profile}
            selectedDate={selectedDate}
            onProfileUpdate={handleProfileSaved}
            onNavigateToDiet={() => setActiveTab('diet')}
            onNavigateToWorkouts={() => setActiveTab('workouts')}
          />
        )}

        {activeTab === 'hunter' && (
          <HunterSystem
            key={`hunter-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'fastrack' && (
          <FastrackWatch
            key={`fastrack-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            profile={profile}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'coach' && (
          <CoachChat
            key={`coach-${refreshKey}`}
            profile={profile}
            selectedDate={selectedDate}
          />
        )}
      </main>

      {/* Persistent Global Jarvis Voice Companion (Stays Active Across All Tabs) */}
      <GlobalJarvis
        profile={profile}
        selectedDate={selectedDate}
        onActionCompleted={() => setRefreshKey(k => k + 1)}
        onOpenCoach={() => setActiveTab('coach')}
      />

      {/* Universal Floating & Modal Voice Assistant (Active on Every Screen) */}
      <UniversalVoiceAssistant
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onOpen={() => setIsVoiceOpen(true)}
        selectedDate={selectedDate}
        onActionCompleted={handleVoiceActionCompleted}
      />

      {/* Interactive Onboarding / Profile Setup Wizard Modal */}
      {isOnboardingOpen && (
        <OnboardingModal
          key={currentUser?.id || 'new_user'}
          isOpen={isOnboardingOpen}
          onClose={() => {
            setIsOnboardingOpen(false);
            sessionStorage.setItem('onboarding_wizard_dismissed', 'true');
          }}
          currentProfile={profile}
          currentUser={currentUser}
          onProfileSaved={(p) => {
            handleProfileSaved(p);
            sessionStorage.setItem('onboarding_wizard_dismissed', 'true');
          }}
        />
      )}

      {/* Settings & Token Guard Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        currentUser={currentUser}
        onClose={() => setIsSettingsOpen(false)}
        onEditProfile={() => setIsOnboardingOpen(true)}
        onDataCleared={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

    </div>
  );
}
