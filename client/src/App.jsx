import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DietTracker from './components/DietTracker';
import WorkoutTracker from './components/WorkoutTracker';
import FastrackWatch from './components/FastrackWatch';
import CoachChat from './components/CoachChat';
import MealPlanner from './components/MealPlanner';
import ProgressAnalytics from './components/ProgressAnalytics';
import OnboardingModal from './components/OnboardingModal';
import SettingsModal from './components/SettingsModal';
import UniversalVoiceAssistant from './components/UniversalVoiceAssistant';
import AuthScreen from './components/AuthScreen';
import { api } from './api';

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
        const [profileData, authData] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getCurrentUser().catch(() => null)
        ]);

        if (profileData) setProfile(profileData);
        if (authData?.user) setCurrentUser(authData.user);

        // Automatically trigger onboarding wizard if user profile has not been configured yet
        if (!profileData || !profileData.isConfigured || !profileData.name) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Failed to load profile or auth:', err);
        setIsOnboardingOpen(true);
      } finally {
        setLoading(false);
      }
    }
    initProfileAndAuth();
  }, []);

  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (!profile || !profile.isConfigured || !profile.name) {
      setIsOnboardingOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
    } catch (e) {}
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

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            key={`dashboard-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            profile={profile}
            onNavigateToDiet={() => setActiveTab('diet')}
            onNavigateToWorkouts={() => setActiveTab('workouts')}
            onNavigateToFastrack={() => setActiveTab('fastrack')}
            onNavigateToProgress={() => setActiveTab('progress')}
            onOpenCoach={() => setActiveTab('coach')}
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
            onNavigateToDiet={() => setActiveTab('diet')}
            onNavigateToWorkouts={() => setActiveTab('workouts')}
          />
        )}

        {activeTab === 'fastrack' && (
          <FastrackWatch
            key={`fastrack-${selectedDate}-${refreshKey}`}
            selectedDate={selectedDate}
            profile={profile}
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

      {/* Universal Floating & Modal Voice Assistant (Active on Every Screen) */}
      <UniversalVoiceAssistant
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onOpen={() => setIsVoiceOpen(true)}
        selectedDate={selectedDate}
        onActionCompleted={handleVoiceActionCompleted}
      />

      {/* Interactive Onboarding / Profile Setup Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentProfile={profile}
        onProfileSaved={handleProfileSaved}
      />

      {/* Settings & Token Guard Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onEditProfile={() => setIsOnboardingOpen(true)}
      />

    </div>
  );
}
