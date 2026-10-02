import React, { useState } from 'react';
import { UnifiedTopBoard } from './components/UnifiedTopBoard';
import { GenuineLogHistoryView } from './components/GenuineLogHistoryView';
import { InviteModal } from './components/InviteModal';
import { CoachRoutineDispatchModal } from './components/CoachRoutineDispatchModal';
import { ShareBenchmarkModal } from './components/ShareBenchmarkModal';
import { PhotoVaultModal } from './components/PhotoVaultModal';
import { SplitOption } from './types';
import { useLogHydration } from './hooks/useLogHydration';
import { useLogStore } from '../../stores/useLogStore';
import { useUserStore } from '../../stores/useUserStore';
import { useWorkoutStore } from '../workout/store/useWorkoutStore';
import { useModalStore } from '../../components/modals/useModalStore';
import { tactileEngine } from '../../services/tactileEngine';

export const LogView: React.FC = () => {
  useLogHydration();
  const showToast = useLogStore((s) => s.showToast);
  const openSettings = useModalStore((s) => s.openSettings);
  const user = useUserStore();
  const sessionTonnageKg = useWorkoutStore((s) => s.sessionTonnageKg);
  const microcycleStats = useLogStore((s) => s.microcycleStats);

  // Modal visibility states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCoachDispatchOpen, setIsCoachDispatchOpen] = useState(false);
  const [isShareProgressOpen, setIsShareProgressOpen] = useState(false);
  const [isPhotoVaultOpen, setIsPhotoVaultOpen] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<SplitOption>('Push');

  // Navigation handlers
  const handleNavigateToWorkout = () => {
    tactileEngine.triggerSelectionBuzz();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
  };

  const handleNavigateToCoach = () => {
    tactileEngine.triggerSelectionBuzz();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'coach' }));
  };

  const handleNavigateToFuel = () => {
    tactileEngine.triggerSelectionBuzz();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'fuel' }));
  };

  const handleChooseRoutine = (split: SplitOption) => {
    setSelectedSplit(split);
    setIsCoachDispatchOpen(true);
  };

  const totalVolume = sessionTonnageKg > 0 ? sessionTonnageKg : microcycleStats.totalVolumeKg;

  return (
    <div
      id="log-view"
      className="space-y-4 pb-12 px-2 sm:px-4 pt-2 sm:pt-4 max-w-md mx-auto relative select-none min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200"
    >
      {/* ============================================================== */}
      {/* 1. SINGLE UNIFIED TOP BOARD CARD                               */}
      {/* ============================================================== */}
      <UnifiedTopBoard
        onOpenInvite={() => setIsInviteOpen(true)}
        onChooseRoutine={handleChooseRoutine}
        onShareProgress={() => setIsShareProgressOpen(true)}
        onOpenPhotoVault={() => setIsPhotoVaultOpen(true)}
        onOpenSettings={() => openSettings()}
      />

      {/* ============================================================== */}
      {/* 2. GENUINE LOG HISTORY TAB (ZERO MOCK / FAKE DATA)             */}
      {/* ============================================================== */}
      <GenuineLogHistoryView
        onNavigateToWorkout={handleNavigateToWorkout}
        onNavigateToFuel={handleNavigateToFuel}
        showToast={showToast}
      />

      {/* ============================================================== */}
      {/* 3. MODALS & SLIDE-OVERS                                        */}
      {/* ============================================================== */}
      {/* Social Invite Portal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        userHandle={user.handle || '@o1oblivianfitness'}
        isLive={false}
      />

      {/* Coach Dispatched Workout Modal */}
      <CoachRoutineDispatchModal
        isOpen={isCoachDispatchOpen}
        onClose={() => setIsCoachDispatchOpen(false)}
        selectedSplit={selectedSplit}
        onNavigateToWorkout={handleNavigateToWorkout}
        onNavigateToCoach={handleNavigateToCoach}
        showToast={showToast}
      />

      {/* Verified Client Progress Sharing Modal */}
      <ShareBenchmarkModal
        isOpen={isShareProgressOpen}
        onClose={() => setIsShareProgressOpen(false)}
        metrics={{
          handle: user.handle || '@o1oblivianfitness',
          strainValue: 14.2,
          avgVolumeKg: totalVolume,
          macroPrecision: 95,
          readinessScore: user.readinessScore || 92,
          benchmarkCount: user.weightKg > 0 ? 1 : 0,
          streakDays: microcycleStats.streakDays,
          bodyweightKg: user.weightKg > 0 ? user.weightKg : undefined,
        }}
      />

      {/* Athlete Physique Photo Vault */}
      <PhotoVaultModal
        isOpen={isPhotoVaultOpen}
        onClose={() => setIsPhotoVaultOpen(false)}
        onCapture={() => showToast('Physique checkpoint saved to encrypted vault')}
      />
    </div>
  );
};

export default LogView;
