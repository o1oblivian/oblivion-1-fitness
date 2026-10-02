import React from 'react';
import { DemoAthlete } from '../types';
import { AthleteProfileModal } from './AthleteProfileModal';
import { AthleteMessageModal } from './AthleteMessageModal';
import { ScheduleTrainingModal } from './ScheduleTrainingModal';
import { PrivacyStealthModal } from './PrivacyStealthModal';
import { TravelHubModal } from './TravelHubModal';
import { RadarProfileStudioModal } from './RadarProfileStudioModal';

interface Props {
  profileTarget: DemoAthlete | null;
  onCloseProfile: () => void;
  onPassProfile: (ath: DemoAthlete) => void;
  onAcceptProfile: (ath: DemoAthlete) => void;

  messageTarget: DemoAthlete | null;
  onCloseMessage: () => void;
  onSendInvite?: (invite: { gym: string; dateTime: string; parity: string }) => void;

  scheduleTarget: DemoAthlete | null;
  onCloseSchedule: () => void;
  onInviteSent: (details: { gym: string; dateTime: string }) => void;

  isPrivacyOpen: boolean;
  onClosePrivacy: () => void;
  onPrivacySaved: () => void;

  isFiltersOpen?: boolean;
  onCloseFilters?: () => void;
  onApplyFilters?: (filters: any) => void;

  isTravelHubOpen: boolean;
  onCloseTravelHub: () => void;
  onSelectDestination: (city: string, radiusKm?: number, originCity?: string) => void;

  isSetupOpen?: boolean;
  onCloseSetup?: () => void;
  onSetupActivated?: (profile: any) => void;

  isStudioOpen?: boolean;
  studioInitialTab?: 'PROFILE' | 'FILTERS' | 'PREVIEW';
  onCloseStudio?: () => void;

  destinationCity?: string;
  travelRadiusKm?: number;
}

export const RadarModalsContainer: React.FC<Props> = ({
  profileTarget,
  onCloseProfile,
  onPassProfile,
  onAcceptProfile,
  messageTarget,
  onCloseMessage,
  onSendInvite,
  scheduleTarget,
  onCloseSchedule,
  onInviteSent,
  isPrivacyOpen,
  onClosePrivacy,
  onPrivacySaved,
  isFiltersOpen = false,
  onCloseFilters,
  onApplyFilters,
  isTravelHubOpen,
  onCloseTravelHub,
  onSelectDestination,
  isSetupOpen = false,
  onCloseSetup,
  onSetupActivated,
  isStudioOpen = false,
  studioInitialTab = 'PROFILE',
  onCloseStudio,
}) => {
  const showStudio = isStudioOpen || isFiltersOpen || isSetupOpen;

  const handleCloseStudio = () => {
    onCloseStudio?.();
    onCloseFilters?.();
    onCloseSetup?.();
  };

  const handleApplyStudio = () => {
    onApplyFilters?.({});
    onSetupActivated?.({});
  };

  return (
    <>
      <AthleteProfileModal
        athlete={profileTarget}
        onClose={onCloseProfile}
        onPass={onPassProfile}
        onAccept={onAcceptProfile}
      />

      <AthleteMessageModal
        isOpen={Boolean(messageTarget)}
        onClose={onCloseMessage}
        athlete={messageTarget}
        onSendInvite={onSendInvite}
      />

      <ScheduleTrainingModal
        isOpen={Boolean(scheduleTarget)}
        onClose={onCloseSchedule}
        athlete={scheduleTarget}
        onInviteSent={onInviteSent}
      />

      <PrivacyStealthModal
        isOpen={isPrivacyOpen}
        onClose={onClosePrivacy}
        onSaved={onPrivacySaved}
      />

      <TravelHubModal
        isOpen={isTravelHubOpen}
        onClose={onCloseTravelHub}
        onSelectDestination={onSelectDestination}
      />

      {/* Unified Athlete Radar Profile & Discovery Studio */}
      <RadarProfileStudioModal
        isOpen={showStudio}
        onClose={handleCloseStudio}
        onApplyAndScan={handleApplyStudio}
        initialTab={isFiltersOpen ? 'FILTERS' : studioInitialTab}
      />
    </>
  );
};

export default RadarModalsContainer;
