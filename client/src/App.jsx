import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DietTracker from './components/DietTracker';
import WorkoutTracker from './components/WorkoutTracker';
import FastrackWatch from './components/FastrackWatch';
import CoachChat from './components/CoachChat';
import MealPlanner from './components/MealPlanner';
import OnboardingModal from './components/OnboardingModal';
import SettingsModal from './components/SettingsModal';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [profile, setProfile] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Profile on App Mount
  useEffect(() => {
    async function initProfile() {
      try {
        const data = await api.getProfile();
        setProfile(data);
        // Automatically trigger onboarding wizard if user profile has not been configured yet
        if (!data || !data.isConfigured || !data.name) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setIsOnboardingOpen(true);
      } finally {
        setLoading(false);
      }
    }
    initProfile();
  }, []);

  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Initializing AI Fitness & Diet Engine...</span>
      </div>
    );
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
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            selectedDate={selectedDate}
            profile={profile}
            onNavigateToDiet={() => setActiveTab('diet')}
            onNavigateToWorkouts={() => setActiveTab('workouts')}
            onNavigateToFastrack={() => setActiveTab('fastrack')}
            onOpenCoach={() => setActiveTab('coach')}
          />
        )}

        {activeTab === 'planner' && (
          <MealPlanner
            profile={profile}
            selectedDate={selectedDate}
            onPlanLogged={() => setActiveTab('diet')}
          />
        )}

        {activeTab === 'diet' && (
          <DietTracker
            selectedDate={selectedDate}
            profile={profile}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutTracker
            selectedDate={selectedDate}
            profile={profile}
          />
        )}

        {activeTab === 'fastrack' && (
          <FastrackWatch
            selectedDate={selectedDate}
            profile={profile}
          />
        )}

        {activeTab === 'coach' && (
          <CoachChat
            profile={profile}
            selectedDate={selectedDate}
          />
        )}
      </main>

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
