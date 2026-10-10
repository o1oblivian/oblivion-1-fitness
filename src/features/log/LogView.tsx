import React, { useEffect, useState } from 'react';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { OblivionReportModal } from '../report/components/OblivionReportModal';
import { useWeighInCapture } from '../report/weighInLog';
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
import { useTrainingSummary } from './useTrainingSummary';
import { useModalStore } from '../../components/modals/useModalStore';
import { tactileEngine } from '../../services/tactileEngine';
import { supabase } from '../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../services/authUser';
import { useCoachStore } from '../../stores/useCoachStore';
import { mapAssignedRow } from './todaySession';
import { athleteLabel } from './athleteLabel';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';

export const LogView: React.FC = () => {
  useLogHydration();
  useWeighInCapture();
  const showToast = useLogStore((s) => s.showToast);
  const openSettings = useModalStore((s) => s.openSettings);
  const user = useUserStore();
  const buddyName = useBuddyProfileStore((s) => s.displayName);
  const label = athleteLabel(user.name, user.handle, buddyName);
  const training = useTrainingSummary();

  // Modal visibility states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCoachDispatchOpen, setIsCoachDispatchOpen] = useState(false);
  const [isShareProgressOpen, setIsShareProgressOpen] = useState(false);
  const [isPhotoVaultOpen, setIsPhotoVaultOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<SplitOption>('Push');

  useEffect(() => {
    void getAuthenticatedUserId().then(async (id) => {
      if (!id) return;
      const { data, error } = await supabase
        .from('assigned_workouts')
        .select('*')
        .or(`client_id.eq.${id},athlete_id.eq.${id}`)
        .eq('status', 'pending');
      if (error || !Array.isArray(data)) return;
      data.forEach((row) => useCoachStore.getState().ingestAssigned(mapAssignedRow(row)));
    });
  }, []);

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

  return (
    <div
      id="log-view"
      className="space-y-2.5 pb-10 pt-1 relative select-none min-h-full h-auto text-neutral-100 transition-colors duration-200"
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

      {/* The Oblivion Report entry */}
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsReportOpen(true);
        }}
        className="w-full min-h-[56px] rounded-2xl bg-black border border-white/[0.07] px-4 py-2.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
      >
        <span className="o1-mark text-o1-gold">
          <BarChart3 />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">The Oblivion Report</div>
          <div className="text-[11px] text-neutral-500">Score, muscle map, strength trends</div>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
      </button>

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
        userHandle={user.handle || label}
        isLive={Boolean(user.userId)}
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
          name: label,
          handle: user.handle || '',
          volume7dKg: training.volume7dKg,
          sessions7d: training.sessions7d,
          streakDays: training.streakDays,
          bodyweightKg: user.weightKg > 0 ? user.weightKg : undefined,
          goalWeightKg: user.targetWeightKg > 0 ? user.targetWeightKg : undefined,
        }}
      />

      <OblivionReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

      {/* Athlete Physique Photo Vault */}
      <PhotoVaultModal
        isOpen={isPhotoVaultOpen}
        onClose={() => setIsPhotoVaultOpen(false)}
        onCapture={() => showToast('Physique checkpoint saved')}
      />
    </div>
  );
};

export default LogView;
