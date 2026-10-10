import React from 'react';
import { useProductionSettings } from '../../hooks/useAthleteSettings';
import { SettingsProfileSection } from './SettingsProfileSection';
import { SettingsBuddyDatingSection } from './SettingsBuddyDatingSection';
import { SettingsTrainingSection } from './SettingsTrainingSection';
import { SettingsUnitsDefaultsSection } from './SettingsUnitsDefaultsSection';
import { SettingsMembershipSection } from './SettingsMembershipSection';
import { SettingsAppearanceSection } from './SettingsAppearanceSection';
import { SettingsAlertsFeedbackSection } from './SettingsAlertsFeedbackSection';
import { SettingsHardwareSection } from './SettingsHardwareSection';
import { SettingsHelpSupportSection } from './SettingsHelpSupportSection';
import { SettingsFooterSection } from './SettingsFooterSection';

export interface SettingsContentProps {
  s: ReturnType<typeof useProductionSettings>;
  onShowToast?: (msg: string) => void;
  onLogout?: () => void;
  onClose: () => void;
  onOpenTutorial?: () => void;
  onOpenHelpCenter?: () => void;
  onOpenContactSupport?: () => void;
  onSendFeedback?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenCitations?: () => void;
  onOpenMembership?: () => void;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  s,
  onShowToast,
  onLogout,
  onClose,
  onOpenTutorial,
  onOpenHelpCenter,
  onOpenContactSupport,
  onSendFeedback,
  onOpenTerms,
  onOpenPrivacy,
  onOpenCitations,
  onOpenMembership,
}) => {
  return (
    <>
      {/* 1. Athlete Profile & Biometrics */}
      <SettingsProfileSection
        name={s.name}
        handle={s.handle}
        age={s.age}
        heightCm={s.heightCm}
        weightKg={s.weightKg}
        bio={s.bio}
        eliteReelsPresence={s.eliteReelsPresence}
        weightUnit={s.weightUnit}
        heightUnit={s.heightUnit}
        onUpdateBio={s.setBio}
        onToggleReels={s.setEliteReelsPresence}
        onUpdateName={s.setName}
        onUpdateHandle={s.setHandle}
        onUpdateAge={s.setAge}
        onUpdateHeight={s.setHeightCm}
        onUpdateWeight={s.setWeightKg}
      />

      {/* 2. Workout Partner & Buddy Dating (Dual Purpose / Solo Mode) */}
      <SettingsBuddyDatingSection />

      {/* 3. Training Discipline, Schedule & Facility Location */}
      <SettingsTrainingSection
        discipline={s.discipline}
        autoDispatch={s.autoDispatch}
        activeDays={s.activeDays}
        restRecoveryMode={s.restRecoveryMode}
        homeGym={s.homeGym}
        autoLocation={s.autoLocation}
        onSetDiscipline={s.setDiscipline}
        onToggleAutoDispatch={s.setAutoDispatch}
        onToggleDay={s.toggleDay}
        onToggleRestMode={s.setRestRecoveryMode}
        onSelectHomeGym={(gym) => {
          s.setHomeGym(gym);
          onShowToast?.(`Home Base updated: ${gym}`);
        }}
        onToggleAutoLocation={s.setAutoLocation}
      />

      {/* 4. Daily Step Target & Units Defaults */}
      <SettingsUnitsDefaultsSection
        weightUnit={s.weightUnit}
        heightUnit={s.heightUnit}
        distanceUnit={s.distanceUnit}
        defaultRestSeconds={s.defaultRestSeconds}
        defaultBarbellKg={s.defaultBarbellKg}
        stepTarget={s.stepTarget}
        onSetWeightUnit={s.setWeightUnit}
        onSetHeightUnit={s.setHeightUnit}
        onSetDistanceUnit={s.setDistanceUnit}
        onSetDefaultRest={s.setDefaultRestSeconds}
        onSetDefaultBarbell={s.setDefaultBarbellKg}
        onSetStepTarget={s.setStepTarget}
      />

      {/* 5. Atmosphere & Input Style Controls */}
      <SettingsAppearanceSection
        inputStyle={s.inputStyle}
        onSetInputStyle={s.setInputStyle}
        onShowToast={onShowToast}
      />

      {/* 6. Alerts, Audio FX & Tactile Haptics */}
      <SettingsAlertsFeedbackSection
        osPushEnabled={s.osPushEnabled}
        preWorkoutReminder={s.preWorkoutReminder}
        coachUpdates={s.coachUpdates}
        hapticVibration={s.hapticVibration}
        soundEffects={s.soundEffects}
        crashReports={s.crashReports}
        onAllowPush={() => {
          s.setOsPushEnabled(true);
          onShowToast?.('Lock-screen notifications activated.');
        }}
        onOpenScheduledReminders={() => onShowToast?.('Scheduled alerts configured.')}
        onTogglePreWorkout={s.setPreWorkoutReminder}
        onToggleCoachUpdates={s.setCoachUpdates}
        onToggleHaptic={s.setHapticVibration}
        onToggleSound={s.setSoundEffects}
        onToggleCrashReports={s.setCrashReports}
      />

      {/* 7. Connected Devices & Hardware Sensors */}
      <SettingsHardwareSection onShowToast={onShowToast} />

      {/* 8. Membership Tier & 90-Day Window */}
      <SettingsMembershipSection
        onManage={() => {
          if (onOpenMembership) {
            onOpenMembership();
          } else {
            onShowToast?.('Coach Pro Subscription is Active & Unlocked.');
          }
        }}
        onShowToast={onShowToast}
      />

      {/* 10. Help, Guidance & Legal Specifications */}
      <SettingsHelpSupportSection
        onOpenTutorial={() => {
          if (onOpenTutorial) onOpenTutorial();
          else {
            onClose();
            window.dispatchEvent(new CustomEvent('o1fc_relaunch_onboarding'));
          }
        }}
        onOpenHelpCenter={() => {
          if (onOpenHelpCenter) onOpenHelpCenter();
          else onShowToast?.('Oblivion 1 Help Centre opened.');
        }}
        onOpenContactSupport={() => {
          if (onOpenContactSupport) onOpenContactSupport();
          else onShowToast?.('Support team: support@oblivionfitness.com');
        }}
        onSendFeedback={() => {
          if (onSendFeedback) onSendFeedback();
          else onShowToast?.('Feedback form initialized.');
        }}
        onOpenTerms={() => {
          if (onOpenTerms) onOpenTerms();
          else onShowToast?.('Terms of Service loaded.');
        }}
        onOpenPrivacy={() => {
          if (onOpenPrivacy) onOpenPrivacy();
          else onShowToast?.('Privacy Policy loaded.');
        }}
        onOpenCitations={() => {
          if (onOpenCitations) onOpenCitations();
          else onShowToast?.('Medical citations & scientific sources loaded.');
        }}
      />

      {/* 10. Session Security, GDPR Vault & Account Deletion */}
      <SettingsFooterSection
        onLogout={() => {
          onClose();
          s.handleLogout(onLogout);
        }}
        onDeleteAccount={() => s.setShowDeleteConfirm(true)}
        onExportData={s.handleExportVault}
      />
    </>
  );
};
