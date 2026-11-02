import React, { Suspense, lazy, useEffect } from 'react';
import { useModalStore } from './useModalStore';

// Modal component imports

import {
  CoachProfilePayload,
  ReelsPayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  GenericToastPayload,
} from './types';
import { COACH_LINK_EVENT, consumeCoachLink } from '../../features/coach/services/coachLinks';
import { REEL_LINK_EVENT, consumeReelLink } from '../../features/reels/services/reelLinks';

// Each sheet is its own chunk and is fetched the first time it opens, so none of them weigh on the first screen.
const SettingsModal = lazy(() =>
  import('../SettingsModal').then((m) => ({ default: m.SettingsModal })),
);
const ReelsHub = lazy(() =>
  import('../../features/reels/ReelsHub').then((m) => ({ default: m.ReelsHub })),
);
const CoachProfileModal = lazy(() =>
  import('../../features/coach/components/profile/CoachProfileModal').then((m) => ({
    default: m.CoachProfileModal,
  })),
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
  const { activeModal, payload, closeModal, openCoachProfile, openReels } = useModalStore();

  useEffect(() => {
    const detailOf = (event?: Event) =>
      event instanceof CustomEvent && typeof event.detail === 'string' ? event.detail : null;
    const openPendingCoach = (event?: Event) => {
      const coachId = consumeCoachLink() ?? detailOf(event);
      if (coachId) openCoachProfile({ coachId });
    };
    const openPendingReel = (event?: Event) => {
      const reelId = consumeReelLink() ?? detailOf(event);
      if (reelId) openReels({ initialMode: 'player', initialReelId: reelId });
    };
    openPendingCoach();
    openPendingReel();
    window.addEventListener(COACH_LINK_EVENT, openPendingCoach);
    window.addEventListener(REEL_LINK_EVENT, openPendingReel);
    const closeOnSignOut = () => closeModal();
    window.addEventListener('o1fc_signed_out', closeOnSignOut);
    return () => {
      window.removeEventListener(COACH_LINK_EVENT, openPendingCoach);
      window.removeEventListener(REEL_LINK_EVENT, openPendingReel);
      window.removeEventListener('o1fc_signed_out', closeOnSignOut);
    };
  }, [openCoachProfile, openReels, closeModal]);

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

      {/* 2. Reels: the member feed, the player and the upload sheet */}
      {activeModal === 'REELS' && (
        <ReelsHub
          isOpen
          onClose={closeModal}
          initialMode={(payload as ReelsPayload | null)?.initialMode}
          initialReelId={(payload as ReelsPayload | null)?.initialReelId}
          initialCategory={(payload as ReelsPayload | null)?.initialCategory}
          openUpload={(payload as ReelsPayload | null)?.openUpload}
        />
      )}

      {/* 3. Coach profile (Coach tab cards, program owners, shared coach links) */}
      {activeModal === 'COACH_PROFILE' && (payload as CoachProfilePayload | null)?.coachId && (
        <CoachProfileModal
          coachId={(payload as CoachProfilePayload).coachId}
          initialTab={(payload as CoachProfilePayload).initialTab}
          onClose={closeModal}
        />
      )}

      {/* 3. Cardio Scanner Modal (CardioTelemetryModal) */}
      {activeModal === 'CARDIO_SCANNER' && (
        <CardioTelemetryModal isOpen={activeModal === 'CARDIO_SCANNER'} onClose={closeModal} />
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
