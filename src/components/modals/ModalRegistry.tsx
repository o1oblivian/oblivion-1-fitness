import React, { Suspense, lazy, useEffect } from 'react';
import { useModalStore } from './useModalStore';

// Modal component imports

import {
  CardioScannerPayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  GenericToastPayload,
  EliteReelsPayload,
} from './types';
import { REEL_LINK_EVENT, consumeReelLink } from '../../features/reels/services/reelLinks';

// Each sheet is its own chunk and is fetched the first time it opens, so none of them weigh on the first screen.
const SettingsModal = lazy(() =>
  import('../SettingsModal').then((m) => ({ default: m.SettingsModal })),
);
const ReelsHub = lazy(() =>
  import('../../features/reels/ReelsHub').then((m) => ({ default: m.ReelsHub })),
);
const CardioTelemetryModal = lazy(() =>
  import('../../features/workout/components/cardio/CardioTelemetryModal').then((m) => ({
    default: m.CardioTelemetryModal,
  })),
);
const RoutineSwapperModal = lazy(() =>
  import('../../features/workout/components/RoutineSwapperModal').then((m) => ({
    default: m.RoutineSwapperModal,
  })),
);
const HydrationIntelligenceModal = lazy(() =>
  import('../../features/workout/components/HydrationIntelligenceModal').then((m) => ({
    default: m.HydrationIntelligenceModal,
  })),
);
const SupplementTimingModal = lazy(() =>
  import('../../features/workout/components/SupplementTimingModal').then((m) => ({
    default: m.SupplementTimingModal,
  })),
);
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
    <Suspense fallback={null}>
      {/* 1. Settings Modal */}
      {activeModal === 'SETTINGS' && (
        <SettingsModal
          isOpen={activeModal === 'SETTINGS'}
          onClose={closeModal}
          onShowToast={(payload as GenericToastPayload)?.onShowToast}
        />
      )}

      {/* 3. Full Elite Reels Modal (ReelsHub) */}
      {activeModal === 'FULL_ELITE_REELS' && (
        <ReelsHub
          isOpen={activeModal === 'FULL_ELITE_REELS'}
          onClose={closeModal}
          initialMode={(payload as EliteReelsPayload | null)?.initialMode}
          initialReelId={(payload as EliteReelsPayload | null)?.initialReelId}
          initialCoachId={(payload as EliteReelsPayload | null)?.initialCoachId}
          initialProfileTab={(payload as EliteReelsPayload | null)?.initialProfileTab}
        />
      )}

      {/* 4. Cardio Scanner Modal (CardioTelemetryModal) */}
      {activeModal === 'CARDIO_SCANNER' && (
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
      )}

      {/* 6. Exercise Swapper Modal (RoutineSwapperModal) */}
      {activeModal === 'EXERCISE_SWAPPER' && (
        <RoutineSwapperModal
          isOpen={activeModal === 'EXERCISE_SWAPPER'}
          onClose={closeModal}
          activePreset={
            (payload as ExerciseSwapperPayload)?.activePreset || 'Functional Hypertrophy'
          }
          onSelectPreset={(preset) => {
            const cb = (payload as ExerciseSwapperPayload)?.onSelectPreset;
            if (cb) cb(preset);
            closeModal();
          }}
        />
      )}

      {/* 7. Hydration Intelligence Modal */}
      {activeModal === 'HYDRATION' && (
        <HydrationIntelligenceModal
          isOpen={activeModal === 'HYDRATION'}
          onClose={closeModal}
          currentLiters={(payload as HydrationPayload)?.currentLiters ?? 0}
          onAddLiters={(amount) => {
            const cb = (payload as HydrationPayload)?.onAddLiters;
            if (cb) cb(amount);
          }}
        />
      )}

      {/* 9. Supplement Timing Modal */}
      {activeModal === 'SUPPLEMENTS' && (
        <SupplementTimingModal
          isOpen={activeModal === 'SUPPLEMENTS'}
          onClose={closeModal}
          onShowToast={(payload as GenericToastPayload)?.onShowToast}
        />
      )}
    </Suspense>
  );
};
