import React from 'react';
import { Athlete } from '../services/coachService';
import { CoachProgramsHubModal } from './CoachProgramsHubModal';
import { WorkoutDispatchStudio } from './WorkoutDispatchStudio';
import { CoachVaultModal } from './CoachVaultModal';
import { AthleteDossierModal } from './AthleteDossierModal';

export interface CoachModalFlags {
  programs: boolean;
  workout: boolean;
  vault: boolean;
  vaultAdd: boolean;
}

export interface CoachCommandCenterModalsProps {
  modals: CoachModalFlags;
  setModals: React.Dispatch<React.SetStateAction<CoachModalFlags>>;
  dossierAthlete: Athlete | null;
  setDossierAthlete: (ath: Athlete | null) => void;
  showToast: (msg: string) => void;
  dispatchAthlete: Athlete | null;
  setDispatchAthlete: (athlete: Athlete | null) => void;
  floorRoster: Athlete[];
}

export const CoachCommandCenterModals: React.FC<CoachCommandCenterModalsProps> = ({
  modals,
  setModals,
  dossierAthlete,
  setDossierAthlete,
  showToast,
  dispatchAthlete,
  setDispatchAthlete,
  floorRoster,
}) => (
  <>
    <CoachProgramsHubModal
      isOpen={modals.programs}
      onClose={() => setModals((m) => ({ ...m, programs: false }))}
      onPublished={(p) => showToast(`Published ${p?.title || 'program'}`)}
    />
    {modals.workout && (
      <WorkoutDispatchStudio
        isOpen
        onClose={() => {
          setModals((m) => ({ ...m, workout: false }));
          setDispatchAthlete(null);
        }}
        athleteId={dispatchAthlete?.id}
        targetAthlete={dispatchAthlete}
        roster={floorRoster}
        onDispatched={(title, count) => showToast(`Sent "${title}" to ${count}`)}
      />
    )}
    <CoachVaultModal
      isOpen={modals.vault}
      initialOpenAdd={modals.vaultAdd}
      onClose={() => setModals((m) => ({ ...m, vault: false, vaultAdd: false }))}
    />
    <AthleteDossierModal
      athlete={dossierAthlete}
      isOpen={!!dossierAthlete}
      onClose={() => setDossierAthlete(null)}
      onOpenDispatchStudio={(athlete) => {
        setDispatchAthlete(athlete);
        setModals((m) => ({ ...m, workout: true }));
      }}
    />
  </>
);

export default CoachCommandCenterModals;
