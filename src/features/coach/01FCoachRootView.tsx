import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { O1FCoachCommandCenter } from './01FCoachCommandCenter';
import { O1FCoachAthletePortal } from './01FCoachAthletePortal';

export const O1FCoachRootView: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const isCoach = profile?.role === 'coach';

  // Perspective switcher state only accessible to verified coaches
  const [activePerspective, setActivePerspective] = useState<'coach' | 'athlete'>('coach');

  // Hard RBAC: Athletes & unauthenticated guests can never access Coach Command Center
  if (!isCoach) {
    return <O1FCoachAthletePortal isCoach={false} />;
  }

  return activePerspective === 'coach' ? (
    <O1FCoachCommandCenter
      activePerspective={activePerspective}
      onChangePerspective={setActivePerspective}
      isCoach={true}
    />
  ) : (
    <O1FCoachAthletePortal
      activePerspective={activePerspective}
      onChangePerspective={setActivePerspective}
      isCoach={true}
    />
  );
};

export default O1FCoachRootView;
