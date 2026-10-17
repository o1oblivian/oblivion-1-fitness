import React from 'react';
import { createPortal } from 'react-dom';
import { HydrationIntelligenceModal } from './HydrationIntelligenceModal';
import { BioSyncIntelligenceModal } from './BioSyncIntelligenceModal';
import { SupplementTimingModal } from './SupplementTimingModal';
import { SleepLogModal } from './SleepLogModal';
import { ReadinessTelemetryModal } from './ReadinessTelemetryModal';
import { useScrollLock } from '../../../hooks/useScrollLock';

export interface HeroModalsProps {
  activeModal: 'hydration' | 'biosync' | 'supplements' | 'sleep' | null;
  onCloseModal: () => void;
  isReadinessOpen: boolean;
  onCloseReadiness: () => void;
  hydrationCurrentL: number;
  readinessScore: number | null;
  onAddHydration: (liters: number) => void;
  onResetHydration: () => void;
}

export const HeroModals: React.FC<HeroModalsProps> = ({
  activeModal,
  onCloseModal,
  isReadinessOpen,
  onCloseReadiness,
  hydrationCurrentL,
  readinessScore,
  onAddHydration,
  onResetHydration,
}) => {
  const anyOpen = activeModal !== null || isReadinessOpen;
  useScrollLock(anyOpen);

  if (!anyOpen) return null;

  return createPortal(
    <>
      <HydrationIntelligenceModal
        isOpen={activeModal === 'hydration'}
        onClose={onCloseModal}
        currentLiters={hydrationCurrentL}
        onAddLiters={onAddHydration}
        onResetLiters={onResetHydration}
      />
      <BioSyncIntelligenceModal isOpen={activeModal === 'biosync'} onClose={onCloseModal} />
      <SupplementTimingModal isOpen={activeModal === 'supplements'} onClose={onCloseModal} />
      <SleepLogModal isOpen={activeModal === 'sleep'} onClose={onCloseModal} />
      <ReadinessTelemetryModal
        isOpen={isReadinessOpen}
        onClose={onCloseReadiness}
        score={readinessScore ?? undefined}
      />
    </>,
    document.body,
  );
};


