import React from 'react';
import { CoachMarketplaceProgram, CoachProfile, AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { ExploreCoach } from '../../../data/reelsExploreCatalog';
import { COACH_MARKETPLACE_PROGRAMS } from '../data/coachMarketplaceData';
import { ProgramCheckoutModal } from './ProgramCheckoutModal';
import { CoachFullProfileModal } from './CoachFullProfileModal';
import { CoachDirectMessageModal } from '../../reels/components/CoachDirectMessageModal';
import { DailyCheckInProgress } from './DailyCheckInProgress';

interface AthleteCoachPortalModalsProps {
  selectedProgram: CoachMarketplaceProgram | null;
  onCloseProgram: () => void;
  onEnrollSuccess: (prog: CoachMarketplaceProgram) => void;
  onOpenCoachProfileFromCheckout: () => void;
  dossierCoach: CoachProfile | null;
  onCloseDossier: () => void;
  onSelectProgramFromDossier: (prog: CoachMarketplaceProgram) => void;
  onBookCoachingFromDossier: (coach: CoachProfile) => void;
  messageCoach: ExploreCoach | null;
  onCloseMessage: () => void;
  isCheckinModalOpen: boolean;
  onCloseCheckin: () => void;
  onSubmitCheckin: (checkin: Omit<AthleteCheckInSubmission, 'id' | 'coachFeedback'>) => void;
}

export const AthleteCoachPortalModals: React.FC<AthleteCoachPortalModalsProps> = ({
  selectedProgram,
  onCloseProgram,
  onEnrollSuccess,
  onOpenCoachProfileFromCheckout,
  dossierCoach,
  onCloseDossier,
  onSelectProgramFromDossier,
  onBookCoachingFromDossier,
  messageCoach,
  onCloseMessage,
  isCheckinModalOpen,
  onCloseCheckin,
  onSubmitCheckin,
}) => {
  return (
    <>
      <ProgramCheckoutModal
        program={selectedProgram}
        isOpen={!!selectedProgram}
        onClose={onCloseProgram}
        onEnrollSuccess={onEnrollSuccess}
        onOpenCoachProfile={onOpenCoachProfileFromCheckout}
      />

      <CoachFullProfileModal
        coach={dossierCoach}
        isOpen={!!dossierCoach}
        onClose={onCloseDossier}
        programs={COACH_MARKETPLACE_PROGRAMS}
        reviews={[]}
        onSelectProgram={onSelectProgramFromDossier}
        onBookCoaching={onBookCoachingFromDossier}
      />

      <CoachDirectMessageModal coach={messageCoach} onClose={onCloseMessage} />

      {isCheckinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 max-w-sm w-full space-y-4">
            <h3 className="font-mono font-bold text-sm text-neutral-900 dark:text-white uppercase">
              WEEKLY ATHLETE CHECK-IN
            </h3>
            <p className="text-xs text-neutral-500">
              Submit your weekly strain telemetry, recovery notes, and video audit.
            </p>
            <DailyCheckInProgress
              checkins={[]}
              onReplyFeedback={() => {}}
              onSubmitNewCheckin={onSubmitCheckin}
            />
            <button
              type="button"
              onClick={onCloseCheckin}
              className="w-full py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-mono font-bold uppercase cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
};
