import React from 'react';
import FitnessIntelligenceApp from './FitnessIntelligenceApp';
import { DailyMeals } from '../types';

interface AthleteViewProps {
  currentUserEmail?: string;
  sessionVaultRefresh?: number;
  dailyMeals?: DailyMeals;
  goalCals?: number;
  goalP?: number;
  goalC?: number;
  goalF?: number;
  onNavigateToFuel?: () => void;
}

export const AthleteView: React.FC<AthleteViewProps> = ({
  currentUserEmail = '',
  sessionVaultRefresh = 0,
  dailyMeals,
  goalCals,
  goalP,
  goalC,
  goalF,
  onNavigateToFuel,
}) => {
  return (
    <FitnessIntelligenceApp
      initialTab="Client"
      showTopNavTabs={false}
      currentUserEmail={currentUserEmail}
      sessionVaultRefresh={sessionVaultRefresh}
      dailyMeals={dailyMeals}
      goalCals={goalCals}
      goalP={goalP}
      goalC={goalC}
      goalF={goalF}
      onNavigateToFuel={onNavigateToFuel}
    />
  );
};
