import React, { useState } from 'react';
import { TabMode, NavigationDock } from './components/NavigationDock';
import { WorkoutHub } from './features/workout/WorkoutHub';
import { FuelView as FuelHub } from './features/fuel/FuelView';
import { BuddyView as BuddyHub } from './features/radar/BuddyView';
import { CoachView as CoachHub } from './features/coach/CoachView';
import { LogView } from './features/log/LogView';
import { FeatureErrorBoundary } from './components/common/FeatureErrorBoundary';
import { ModalRegistry } from './components/modals/ModalRegistry';
import { useModalStore } from './components/modals/useModalStore';
import { BasementOfflineBanner } from './components/common/BasementOfflineBanner';
import { armAthleteReminders } from './services/athleteReminderScheduler';

export const MainAppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('tracker');

  const { activeModal } = useModalStore();
  const isTravelPassOpen = activeModal === 'TRAVEL_PASS';

  const handleTabSelect = React.useCallback((tab: TabMode) => {
    setActiveTab((prev) => (prev === tab ? prev : tab));
  }, []);

  React.useEffect(() => {
    return armAthleteReminders();
  }, []);

  React.useEffect(() => {
    const handleNavEvent = (e: CustomEvent<TabMode>) => {
      if (e.detail) {
        handleTabSelect(e.detail);
      }
    };
    window.addEventListener('app_navigate_tab' as any, handleNavEvent);
    return () => window.removeEventListener('app_navigate_tab' as any, handleNavEvent);
  }, [handleTabSelect]);

  return (
    <div className="relative min-h-dvh w-full bg-black text-o1-bone overflow-x-hidden selection:bg-o1-crimson selection:text-o1-bone transition-colors duration-200">
      <div
        className={`min-h-dvh w-full bg-transparent text-o1-bone flex flex-col justify-between font-sans origin-top transition-all duration-300 ease-out relative ${
          isTravelPassOpen
            ? 'scale-[0.94] rounded-2xl brightness-75 overflow-hidden pointer-events-none select-none'
            : ''
        }`}
      >
        <BasementOfflineBanner />

        <main
          className="w-full overflow-y-auto"
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(4rem + max(16px, env(safe-area-inset-bottom, 0px)))',
          }}
        >
          <div className="o1-shell">
            <FeatureErrorBoundary key={activeTab} featureName={`${activeTab} View`}>
              {(activeTab === 'tracker' || activeTab === 'workout') && <WorkoutHub />}
              {activeTab === 'fuel' && <FuelHub />}
              {activeTab === 'radar' && <BuddyHub />}
              {activeTab === 'coach' && <CoachHub />}
              {(activeTab === 'client' || (activeTab as string) === 'log') && <LogView />}
            </FeatureErrorBoundary>
          </div>
        </main>

        {/* Floating Bottom Navigation Bar */}
        <NavigationDock currentMode={activeTab} onSelectTab={handleTabSelect} />
      </div>

      {/* Centralized Modals (Mounted single source of truth inside ModalRegistry) */}
      <ModalRegistry />
    </div>
  );
};
export default MainAppLayout;
