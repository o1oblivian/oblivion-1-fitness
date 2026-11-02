import React, { Suspense, lazy, useEffect } from 'react';
import { useModalStore } from './useModalStore';

// Modal component imports

import {
  CoachProfilePayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  GenericToastPayload,
} from './types';
import { COACH_LINK_EVENT, consumeCoachLink } from '../../features/coach/services/coachLinks';

// Each sheet is its own chunk and is fetched the first time it opens, so none of them weigh on the first screen.
const SettingsModal = lazy(() =>
  import('../SettingsModal').then((m) => ({ default: m.SettingsModal })),
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
  const { activeModal, payload, closeModal, openCoachProfile } = useModalStore();

  useEffect(() => {
    const openPending = (event?: Event) => {
      const fromEvent = event instanceof CustomEvent ? event.detail : null;
      const coachId = consumeCoachLink() ?? (typeof fromEvent === 'string' ? fromEvent : null);
      if (coachId) openCoachProfile({ coachId });
    };
    openPending();
    window.addEventListener(COACH_LINK_EVENT, openPending);
    const closeOnSignOut = () => closeModal();
    window.addEventListener('o1fc_signed_out', closeOnSignOut);
    return () => {
      window.removeEventListener(COACH_LINK_EVENT, openPending);
      window.removeEventListener('o1fc_signed_out', closeOnSignOut);
    };
  }, [openCoachProfile, closeModal]);

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

      {/* 2. Coach profile (Coach tab cards, program owners, shared coach links) */}
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
