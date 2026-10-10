import React from 'react';
import { Athlete } from '../services/coachService';
import { SquadAthlete } from '../../../types';
import { CoachProgramsHubModal } from './CoachProgramsHubModal';
import { WorkoutDispatchStudio } from './WorkoutDispatchStudio';
import { CoachVaultModal } from './CoachVaultModal';
import { CoachReelUploadModal } from '../../reels/components/CoachReelUploadModal';
import { AthleteDossierModal } from './AthleteDossierModal';
import { BiomechanicsAuditModal } from './BiomechanicsAuditModal';
import { AssignProtocolModal } from './AssignProtocolModal';
import { CoachPayoutSettingsModal } from './CoachPayoutSettingsModal';

export interface CoachModalFlags {
  programs: boolean;
  workout: boolean;
  vault: boolean;
  vaultAdd: boolean;
  reelUpload: boolean;
  payoutSettings: boolean;
}

export interface CoachCommandCenterModalsProps {
  modals: CoachModalFlags;
  setModals: React.Dispatch<React.SetStateAction<CoachModalFlags>>;
  athletes?: Athlete[];
  squad?: SquadAthlete[];
  dossierAthlete: Athlete | null;
  setDossierAthlete: (ath: Athlete | null) => void;
  auditAthlete: SquadAthlete | null;
  setAuditAthlete: (ath: SquadAthlete | null) => void;
  assignAthlete: SquadAthlete | null;
  setAssignAthlete: (ath: SquadAthlete | null) => void;
  showToast: (msg: string) => void;
  dispatchAthlete?: Athlete | null;
  setDispatchAthlete?: (athlete: Athlete | null) => void;
  floorRoster?: Athlete[];
}

export const CoachCommandCenterModals: React.FC<CoachCommandCenterModalsProps> = ({
  modals,
  setModals,
  dossierAthlete,
  setDossierAthlete,
  auditAthlete,
  setAuditAthlete,
  assignAthlete,
  setAssignAthlete,
  showToast,
  dispatchAthlete = null,
  setDispatchAthlete,
  floorRoster = [],
}) => {
  return (
    <>
      <CoachProgramsHubModal
        isOpen={modals.programs}
        onClose={() => setModals((m) => ({ ...m, programs: false }))}
        onPublished={(p) => showToast(`Published: ${p?.title || 'Protocol'}`)}
      />
      {modals.workout && (
        <WorkoutDispatchStudio
          isOpen
          onClose={() => {
            setModals((m) => ({ ...m, workout: false }));
            setDispatchAthlete?.(null);
          }}
          athleteId={dispatchAthlete?.id}
          targetAthlete={dispatchAthlete}
          roster={floorRoster}
          onDispatched={(t, n) => showToast(`Dispatched "${t}" to ${n}`)}
        />
      )}
      <CoachVaultModal
        isOpen={modals.vault}
        initialOpenAdd={modals.vaultAdd}
        onClose={() => setModals((m) => ({ ...m, vault: false, vaultAdd: false }))}
      />
      <CoachReelUploadModal
        isOpen={modals.reelUpload}
        onClose={() => setModals((m) => ({ ...m, reelUpload: false }))}
        onReelPublished={(t, cat) => showToast(`⚡ Published "${t}" to Train Ring (${cat})!`)}
      />
      <AthleteDossierModal
        athlete={dossierAthlete}
        isOpen={!!dossierAthlete}
        onClose={() => setDossierAthlete(null)}
        onOpenDispatchStudio={(athlete) => {
          setDispatchAthlete?.(athlete);
          setModals((m) => ({ ...m, workout: true }));
        }}
      />
      <BiomechanicsAuditModal
        athlete={auditAthlete}
        isOpen={!!auditAthlete}
        onClose={() => setAuditAthlete(null)}
        onCompleteAudit={(_, v) => {
          setAuditAthlete(null);
          showToast(`Audit: ${v}`);
        }}
      />
      <AssignProtocolModal
        athlete={assignAthlete}
        isOpen={!!assignAthlete}
        onClose={() => setAssignAthlete(null)}
        onConfirmAssign={(_, p) => {
          setAssignAthlete(null);
          showToast(`Assigned: ${p}`);
        }}
      />
      <CoachPayoutSettingsModal
        isOpen={Boolean(modals.payoutSettings)}
        onClose={() => setModals((m) => ({ ...m, payoutSettings: false }))}
      />
    </>
  );
};

export default CoachCommandCenterModals;
