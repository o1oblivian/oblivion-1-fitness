import React, { useEffect } from 'react';
import { useModalStore } from './useModalStore';

// Modal component imports
import { SettingsModal } from '../SettingsModal';
import { ReelsHub } from '../../features/reels/ReelsHub';
import { CardioTelemetryModal } from '../../features/workout/components/cardio/CardioTelemetryModal';
import { RoutineSwapperModal } from '../../features/workout/components/RoutineSwapperModal';
import { HydrationIntelligenceModal } from '../../features/workout/components/HydrationIntelligenceModal';
import { SupplementTimingModal } from '../../features/workout/components/SupplementTimingModal';

import {
  CardioScannerPayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  GenericToastPayload,
  EliteReelsPayload,
} from './types';
import { REEL_LINK_EVENT, consumeReelLink } from '../../features/reels/services/reelLinks';

/**
 * Unified Modal Registry
 * Renders the active modal based on centralized store state.
 * Eliminates prop drilling and bloated layout states while preserving 100% visual parity and animations.
 */
export const ModalRegistry: React.FC = () => {
  const { activeModal, payload, closeModal, openFullEliteReels } = useModalStore();

  useEffect(() => {
    const openPending = () => {
      const link = consumeReelLink();
      if (!link) return;
      openFullEliteReels({
        initialMode: link.reelId ? 'player' : 'grid',
        initialReelId: link.reelId,
        initialCoachId: link.reelId ? undefined : link.coachId,
      });
    };
    openPending();
    window.addEventListener(REEL_LINK_EVENT, openPending);
    const closeOnSignOut = () => closeModal();
    window.addEventListener('o1fc_signed_out', closeOnSignOut);
    return () => {
      window.removeEventListener(REEL_LINK_EVENT, openPending);
      window.removeEventListener('o1fc_signed_out', closeOnSignOut);
    };
  }, [openFullEliteReels, closeModal]);

  if (!activeModal) return null;

  return (
    <>
      {/* 1. Settings Modal */}
      <SettingsModal
        isOpen={activeModal === 'SETTINGS'}
        onClose={closeModal}
        onShowToast={(payload as GenericToastPayload)?.onShowToast}
      />

      {/* 3. Full Elite Reels Modal (ReelsHub) */}
      <ReelsHub
        isOpen={activeModal === 'FULL_ELITE_REELS'}
        onClose={closeModal}
        initialMode={(payload as EliteReelsPayload | null)?.initialMode}
        initialReelId={(payload as EliteReelsPayload | null)?.initialReelId}
        initialCoachId={(payload as EliteReelsPayload | null)?.initialCoachId}
        initialProfileTab={(payload as EliteReelsPayload | null)?.initialProfileTab}
      />

      {/* 4. Cardio Scanner Modal (CardioTelemetryModal) */}
      <CardioTelemetryModal
        isOpen={activeModal === 'CARDIO_SCANNER'}
        onClose={closeModal}
        onPostCardio={(data) => {
          const cb = (payload as CardioScannerPayload)?.onPostCardio;
          if (cb) {
            cb({
              type: data.deviceType === 'watch' ? 'Smartwatch Pedometer' : 'Console Telemetry',
              calories: data.caloriesBurned || 0,
              durationMins:
                data.elapsedMinutes != null ? Math.max(1, Math.round(data.elapsedMinutes)) : 0,
              avgHr: data.avgHeartRateBpm || 0,
              steps:
                data.steps || (data.distanceKm != null ? Math.round(data.distanceKm * 1312) : 0),
            });
          }
          closeModal();
        }}
      />

      {/* 6. Exercise Swapper Modal (RoutineSwapperModal) */}
      <RoutineSwapperModal
        isOpen={activeModal === 'EXERCISE_SWAPPER'}
        onClose={closeModal}
        activePreset={(payload as ExerciseSwapperPayload)?.activePreset || 'Functional Hypertrophy'}
        onSelectPreset={(preset) => {
          const cb = (payload as ExerciseSwapperPayload)?.onSelectPreset;
          if (cb) cb(preset);
          closeModal();
        }}
      />

      {/* 7. Hydration Intelligence Modal */}
      <HydrationIntelligenceModal
        isOpen={activeModal === 'HYDRATION'}
        onClose={closeModal}
        currentLiters={(payload as HydrationPayload)?.currentLiters ?? 0}
        onAddLiters={(amount) => {
          const cb = (payload as HydrationPayload)?.onAddLiters;
          if (cb) cb(amount);
        }}
      />

      {/* 9. Supplement Timing Modal */}
      <SupplementTimingModal
        isOpen={activeModal === 'SUPPLEMENTS'}
        onClose={closeModal}
        onShowToast={(payload as GenericToastPayload)?.onShowToast}
      />
    </>
  );
};
