import React from 'react';
import { DemoAthlete } from '../types';
import { AthleteProfileModal } from './AthleteProfileModal';
import { AthleteMessageModal } from './AthleteMessageModal';
import { PrivacyStealthModal } from './PrivacyStealthModal';
import { TravelHubModal } from './TravelHubModal';
import { RadarProfileStudioModal } from './RadarProfileStudioModal';

interface Props {
  profileTarget: DemoAthlete | null;
  onCloseProfile: () => void;
  onPassProfile: (ath: DemoAthlete) => void;
  onAcceptProfile: (ath: DemoAthlete) => void;
  onMessageProfile: (ath: DemoAthlete) => void;
  onBookProfile: (ath: DemoAthlete) => void;

  messageTarget: DemoAthlete | null;
  sessionUserId?: string;
  onCloseMessage: () => void;
  onSendInvite?: (invite: { gym: string; dateTime: string; parity: string }) => void;
  allowCompose?: boolean;
  scheduleOpen?: boolean;
  onUnmatch?: () => void;
  onBlock?: (ath: DemoAthlete) => void;
  onReport?: (ath: DemoAthlete, reason: string, details: string, alsoBlock: boolean) => void;
  onLine?: (text: string) => void;

  isPrivacyOpen: boolean;
  onClosePrivacy: () => void;
  onPrivacySaved: (settings: Record<string, boolean>) => void;

  isFiltersOpen?: boolean;
  onCloseFilters?: () => void;
  onApplyFilters?: (filters: { radiusKm?: number }) => void;

  isTravelHubOpen: boolean;
  onCloseTravelHub: () => void;
  onSelectDestination: (city: string, radiusKm?: number, originCity?: string) => void;

  isSetupOpen?: boolean;
  onCloseSetup?: () => void;
  onSetupActivated?: (pass: { name?: string }) => void;

  isStudioOpen?: boolean;
  onCloseStudio?: () => void;

  destinationCity?: string;
  travelRadiusKm?: number;
}

export const RadarModalsContainer: React.FC<Props> = ({
  profileTarget,
  onCloseProfile,
  onPassProfile,
  onAcceptProfile,
  onMessageProfile,
  onBookProfile,
  messageTarget,
  sessionUserId = '',
  onCloseMessage,
  onSendInvite,
  allowCompose = false,
  scheduleOpen = false,
  onUnmatch,
  onBlock,
  onReport,
  onLine,
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
        onMessage={onMessageProfile}
        onBook={onBookProfile}
        onBlock={onBlock}
        onReport={onReport}
      />

      <AthleteMessageModal
        isOpen={Boolean(messageTarget)}
        onClose={onCloseMessage}
        athlete={messageTarget}
        sessionUserId={sessionUserId}
        onSendInvite={onSendInvite}
        allowCompose={allowCompose}
        scheduleOpen={scheduleOpen}
        onUnmatch={onUnmatch}
        onBlock={messageTarget && onBlock ? () => onBlock(messageTarget) : undefined}
        onReport={
          messageTarget && onReport
            ? (reason, details, alsoBlock) => onReport(messageTarget, reason, details, alsoBlock)
            : undefined
        }
        onLine={onLine}
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
      />
    </>
  );
};
