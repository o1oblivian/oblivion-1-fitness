import React from 'react';
import FitnessIntelligenceApp from './FitnessIntelligenceApp';

interface AthleteViewProps {
  currentUserEmail?: string;
  sessionVaultRefresh?: number;
}

export const AthleteView: React.FC<AthleteViewProps> = ({
  currentUserEmail = '',
  sessionVaultRefresh = 0,
}) => {
  return (
    <FitnessIntelligenceApp
      initialTab="Client"
      showTopNavTabs={false}
      currentUserEmail={currentUserEmail}
      sessionVaultRefresh={sessionVaultRefresh}
    />
  );
};
