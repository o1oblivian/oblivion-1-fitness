import React, { useState, useEffect } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import {
  getFeedbackPreferences,
  saveFeedbackPreferences,
  FeedbackPreferences,
} from '@/utils/feedbackPreferences';
import { triggerHaptic } from '@/utils/haptics';
import {
  playDigitalCrownClick,
  playRealBellSound,
  playPRBreakthroughChime,
  playSoftTickSound,
} from '@/utils/audio';

export function FeedbackSection() {
  const [prefs, setPrefs] = useState<FeedbackPreferences>(getFeedbackPreferences);

  useEffect(() => {
    const handleChanged = (e: Event) => {
      const customEvent = e as CustomEvent<FeedbackPreferences>;
      if (customEvent.detail) {
        setPrefs(customEvent.detail);
      }
    };
    window.addEventListener('ofc_feedback_prefs_changed', handleChanged);
    return () => {
      window.removeEventListener('ofc_feedback_prefs_changed', handleChanged);
    };
  }, []);

  const update = (key: keyof FeedbackPreferences, val: boolean) => {
    const updated = saveFeedbackPreferences({ [key]: val });
    setPrefs(updated);
    if (key === 'hapticsEnabled' && val) {
      triggerHaptic('medium');
    } else if (key === 'audioEnabled' && val) {
      playSoftTickSound(1.2);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Audio & Tactile Feedback"
        subtitle="Micro-haptics, sound effects and workout acoustic cues"
      />
      <SettingsGroup>
        {/* Master Haptics Switch */}
        <SettingsRow
          label="Haptic Vibration"
          sublabel="Tactile pulse on workout dials, checks, PRs and timer alerts"
          rightElement={
            <ToggleSwitch
              checked={prefs.hapticsEnabled}
              onChange={(val) => update('hapticsEnabled', val)}
            />
          }
        />

        {/* Master Sound Switch */}
        <SettingsRow
          label="Sound Effects"
          sublabel="Acoustic tones during reps, dials, timer countdowns and logs"
          rightElement={
            <ToggleSwitch
              checked={prefs.audioEnabled}
              onChange={(val) => update('audioEnabled', val)}
            />
          }
        />

        {/* Detailed Toggles (accessible when audio is enabled) */}
        {prefs.audioEnabled && (
          <>
            <SettingsRow
              label="Dial Clicks & Ticks"
              sublabel="Mechanical acoustic clicks while scrolling rotary dials"
              rightElement={
                <ToggleSwitch
                  checked={prefs.dialTicks}
                  onChange={(val) => {
                    update('dialTicks', val);
                    if (val) playDigitalCrownClick(1.0);
                  }}
                />
              }
            />

            <SettingsRow
              label="Rest Timer Chime"
              sublabel="Harmonic bell alarm when rest interval concludes"
              rightElement={
                <ToggleSwitch
                  checked={prefs.restTimerAlarm}
                  onChange={(val) => {
                    update('restTimerAlarm', val);
                    if (val) playRealBellSound();
                  }}
                />
              }
            />

            <SettingsRow
              label="Personal Record (PR) Chime"
              sublabel="Triumphant acoustic fanfare when achieving a new 1RM/PR"
              rightElement={
                <ToggleSwitch
                  checked={prefs.prChime}
                  onChange={(val) => {
                    update('prChime', val);
                    if (val) playPRBreakthroughChime();
                  }}
                />
              }
            />
          </>
        )}
      </SettingsGroup>
    </div>
  );
}
