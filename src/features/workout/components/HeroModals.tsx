import React from 'react';
import { HydrationIntelligenceModal } from './HydrationIntelligenceModal';
import { BioSyncIntelligenceModal } from './BioSyncIntelligenceModal';
import { SupplementTimingModal } from './SupplementTimingModal';
import { SleepLogModal } from './SleepLogModal';
import { ReadinessTelemetryModal } from './ReadinessTelemetryModal';

export interface HeroModalsProps {
  activeModal: 'hydration' | 'biosync' | 'supplements' | 'sleep' | null;
  onCloseModal: () => void;
  isReadinessOpen: boolean;
  onCloseReadiness: () => void;
  hydrationCurrentL: number;
  recoveryEnergyScore: number;
  onAddHydration: (liters: number) => void;
  onResetHydration: () => void;
  onShowToast?: (msg: string) => void;
}

export const HeroModals: React.FC<HeroModalsProps> = ({
  activeModal,
  onCloseModal,
  isReadinessOpen,
  onCloseReadiness,
  hydrationCurrentL,
  recoveryEnergyScore,
  onAddHydration,
  onResetHydration,
  onShowToast,
}) => {
  return (
    <>
      <HydrationIntelligenceModal
        isOpen={activeModal === 'hydration'}
        onClose={onCloseModal}
        currentLiters={hydrationCurrentL}
        onAddLiters={onAddHydration}
        onResetLiters={onResetHydration}
        onShowToast={onShowToast}
      />
      <BioSyncIntelligenceModal
        isOpen={activeModal === 'biosync'}
        onClose={onCloseModal}
        onAutoRegulate={() => onShowToast?.('RPE auto-regulated for peak follicular window.')}
        onShowToast={onShowToast}
      />
      <SupplementTimingModal
        isOpen={activeModal === 'supplements'}
        onClose={onCloseModal}
        onShowToast={onShowToast}
      />
      <SleepLogModal
        isOpen={activeModal === 'sleep'}
        onClose={onCloseModal}
        onShowToast={onShowToast}
      />
      <ReadinessTelemetryModal
        isOpen={isReadinessOpen}
        onClose={onCloseReadiness}
        score={recoveryEnergyScore}
      />
    </>
  );
};

export default HeroModals;
