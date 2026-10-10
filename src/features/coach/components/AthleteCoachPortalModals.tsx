import React from 'react';
import { CoachMarketplaceProgram, CoachProfile, AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { ExploreCoach } from '../../reels/reelTypes';
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
        <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center">
          <div className="o1-sheet-card bg-o1-card border border-white/[0.07] p-5 w-full space-y-4 overflow-y-auto">
            <h3 className="font-mono font-bold text-sm text-white">
              Weekly Athlete CHECK-IN
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
              className="w-full py-2 rounded-xl bg-white/[0.08] text-xs font-mono font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
