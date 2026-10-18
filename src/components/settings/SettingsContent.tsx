import React from 'react';
import { useProductionSettings } from '../../hooks/useAthleteSettings';
import { SettingsProfileSection } from './SettingsProfileSection';
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
  onOpenTutorial: () => void;
  onOpenHelpCenter: () => void;
  onOpenContactSupport: () => void;
  onSendFeedback: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenCitations: () => void;
  onOpenMembership: () => void;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  s,
  onShowToast,
  onLogout,
  onClose: _onClose,
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

      {/* 2. Training Discipline & Schedule */}
      <SettingsTrainingSection
        autoDispatch={s.autoDispatch}
        restRecoveryMode={s.restRecoveryMode}
        onToggleAutoDispatch={s.setAutoDispatch}
        onToggleRestMode={s.setRestRecoveryMode}
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

      {/* 6. Reminders, Audio FX & Tactile Haptics */}
      <SettingsAlertsFeedbackSection
        osPushEnabled={s.osPushEnabled}
        preWorkoutReminder={s.preWorkoutReminder}
        coachUpdates={s.coachUpdates}
        hapticVibration={s.hapticVibration}
        soundEffects={s.soundEffects}
        crashReports={s.crashReports}
        onSetRemindersEnabled={s.setOsPushEnabled}
        onTogglePreWorkout={s.setPreWorkoutReminder}
        onToggleCoachUpdates={s.setCoachUpdates}
        onToggleHaptic={s.setHapticVibration}
        onToggleSound={s.setSoundEffects}
        onToggleCrashReports={s.setCrashReports}
        onShowToast={onShowToast}
      />

      {/* 7. Bluetooth HRV Sensors & Phone Step Counter */}
      <SettingsHardwareSection onShowToast={onShowToast} />

      {/* 8. Membership Tier & 90-Day Window */}
      <SettingsMembershipSection onManage={onOpenMembership} onShowToast={onShowToast} />

      {/* 9. Help, Guidance & Legal Specifications */}
      <SettingsHelpSupportSection
        onOpenTutorial={onOpenTutorial}
        onOpenHelpCenter={onOpenHelpCenter}
        onOpenContactSupport={onOpenContactSupport}
        onSendFeedback={onSendFeedback}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
        onOpenCitations={onOpenCitations}
      />

      {/* 10. Session Security, GDPR Vault & Account Deletion */}
      <SettingsFooterSection
        onLogout={() => {
          void s.handleLogout(onLogout);
        }}
        onDeleteAccount={() => s.setShowDeleteConfirm(true)}
        onExportData={s.handleExportVault}
      />
    </>
  );
};
