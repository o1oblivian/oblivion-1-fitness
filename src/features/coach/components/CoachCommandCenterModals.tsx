import React from 'react';
import { Athlete } from '../services/coachService';
import { SquadAthlete } from '../../../types';
import { CoachProgramsHubModal } from './CoachProgramsHubModal';
import { DispatchDrawer } from './DispatchDrawer';
import { WorkoutDispatchStudio } from './WorkoutDispatchStudio';
import { CoachVaultModal } from './CoachVaultModal';
import { CoachReelUploadModal } from '../../reels/components/CoachReelUploadModal';
import { AthleteDossierModal } from './AthleteDossierModal';
import { BiomechanicsAuditModal } from './BiomechanicsAuditModal';
import { AssignProtocolModal } from './AssignProtocolModal';
import { CoachPayoutSettingsModal } from './CoachPayoutSettingsModal';

export interface CoachCommandCenterModalsProps {
  modals: {
    programs: boolean;
    dispatch: boolean;
    workout: boolean;
    vault: boolean;
    reelUpload: boolean;
    payoutSettings: boolean;
  };
  setModals: React.Dispatch<React.SetStateAction<{
    programs: boolean;
    dispatch: boolean;
    workout: boolean;
    vault: boolean;
    reelUpload: boolean;
    payoutSettings: boolean;
  }>>;
  athletes?: Athlete[];
  squad?: SquadAthlete[];
  dossierAthlete: Athlete | null;
  setDossierAthlete: (ath: Athlete | null) => void;
  auditAthlete: SquadAthlete | null;
  setAuditAthlete: (ath: SquadAthlete | null) => void;
  assignAthlete: SquadAthlete | null;
  setAssignAthlete: (ath: SquadAthlete | null) => void;
  showToast: (msg: string) => void;
}

export const CoachCommandCenterModals: React.FC<CoachCommandCenterModalsProps> = ({
  modals,
  setModals,
  athletes = [],
  dossierAthlete,
  setDossierAthlete,
  auditAthlete,
  setAuditAthlete,
  assignAthlete,
  setAssignAthlete,
  showToast,
}) => {
  const safeAthletes = athletes ?? [];

  return (
    <>
      <CoachProgramsHubModal
        isOpen={modals.programs}
        onClose={() => setModals((m) => ({ ...m, programs: false }))}
        onPublished={(p) => showToast(`Published: ${p?.title || 'Protocol'}`)}
      />
      <DispatchDrawer
        isOpen={modals.dispatch}
        onClose={() => setModals((m) => ({ ...m, dispatch: false }))}
        athletes={safeAthletes}
        onDispatch={() => showToast('Dispatched to selected athletes!')}
      />
      <WorkoutDispatchStudio
        isOpen={modals.workout}
        onClose={() => setModals((m) => ({ ...m, workout: false }))}
        onDispatched={(t, n) => showToast(`Dispatched "${t}" to ${n}`)}
      />
      <CoachVaultModal
        isOpen={modals.vault}
        onClose={() => setModals((m) => ({ ...m, vault: false }))}
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
        onOpenDispatchStudio={() => {
          setDossierAthlete(null);
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
