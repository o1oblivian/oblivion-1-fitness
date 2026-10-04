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
import { useRoleStore } from './stores/useRoleStore';
import { BasementOfflineBanner } from './components/common/BasementOfflineBanner';

export const MainAppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('tracker');

  const { activeModal } = useModalStore();
  const isTravelPassOpen = activeModal === 'TRAVEL_PASS';

  const handleTabSelect = React.useCallback((tab: TabMode) => {
    setActiveTab((prev) => (prev === tab ? prev : tab));
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
    <div className="relative min-h-dvh w-full bg-[#F4F4F7] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 overflow-x-hidden selection:bg-[#C4121A] selection:text-white transition-colors duration-200">
      {/* Global Tablet & Foldable Guardrail: Constrained to max-w-[480px] mx-auto min-h-dvh with clean centering */}
      <div
        className={`min-h-dvh w-full max-w-[480px] mx-auto bg-[#F4F4F7] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between font-sans origin-top transition-all duration-300 ease-out relative shadow-2xl ${
          isTravelPassOpen
            ? 'scale-[0.94] rounded-3xl brightness-75 overflow-hidden pointer-events-none select-none'
            : ''
        }`}
      >
        <BasementOfflineBanner />

        {/* Main Content Area: flexbox layout where scrollable container explicitly sets flex: 1 1 0%, min-height: 0, and overflow-y: auto */}
        <main
          className="w-full overflow-y-auto"
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(4rem + max(16px, env(safe-area-inset-bottom, 0px)))',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          <FeatureErrorBoundary key={activeTab} featureName={`${activeTab} View`}>
            {(activeTab === 'tracker' || activeTab === 'workout') && <WorkoutHub />}
            {activeTab === 'fuel' && <FuelHub />}
            {activeTab === 'radar' && <BuddyHub />}
            {activeTab === 'coach' && <CoachHub />}
            {(activeTab === 'client' || (activeTab as string) === 'log') && <LogView />}
          </FeatureErrorBoundary>
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
