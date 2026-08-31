import React, { useState } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { useAuthStorage } from '../../hooks/useAuthStorage';

const FOCUS_OPTIONS = ['Hypertrophy', 'Strength', 'Endurance', 'Recomp', 'Mobility'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function TrainingSection() {
  const { profile, updateProfile } = useAuthStorage();

  const primaryFocus = profile.primary_focus || 'Hypertrophy';
  const autoDispatch = profile.auto_dispatch !== false;
  const preWorkoutNotif = profile.pre_workout_notif !== false;
  const selectedDays = profile.training_days || ['Mo', 'Tu', 'Th', 'Fr', 'Sa'];
  const buddyMatch = profile.buddy_match_enabled !== false;
  const restRecovery = profile.rest_mode === true;
  const privateTraining = profile.private_training === true;

  const selectFocus = (f: string) => {
    updateProfile({ primary_focus: f });
  };

  const toggleDay = (day: string) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    updateProfile({ training_days: updated });
  };

  return (
    <div>
      <SectionHeader title="Training & Schedule" />
      <SettingsGroup>
        {/* Primary Focus selector */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Primary Focus</span>
            <span className="text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A]">{primaryFocus}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => selectFocus(f)}
                className={`h-[26px] px-2.5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  primaryFocus === f
                    ? 'bg-[#FF3B30] dark:bg-[#FF453A] text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Dispatch */}
        <SettingsRow
          label="Auto-Dispatch"
          sublabel="Workouts arrive automatically each training day"
          rightElement={
            <ToggleSwitch
              checked={autoDispatch}
              onChange={(v) => updateProfile({ auto_dispatch: v })}
            />
          }
        />

        {/* Training Days */}
        <div className="p-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 block mb-0.5">
            Training Days
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-2">
            Select scheduled active training days
          </span>
          <div className="flex items-center justify-between gap-1.5">
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-[26px] h-[26px] min-w-[26px] min-h-[26px] max-w-[26px] max-h-[26px] shrink-0 aspect-square rounded-full text-[10.5px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FF3B30] dark:bg-[#FF453A] text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pre-workout notification */}
        <SettingsRow
          label="Pre-Workout Notification"
          sublabel="Get notified 1 hour before scheduled session"
          rightElement={
            <ToggleSwitch
              checked={preWorkoutNotif}
              onChange={(v) => updateProfile({ pre_workout_notif: v })}
            />
          }
        />

        {/* Buddy Match */}
        <SettingsRow
          label="Buddy Match"
          sublabel="Allow matching with nearby athletes during shared training times"
          rightElement={
            <ToggleSwitch
              checked={buddyMatch}
              onChange={(v) => updateProfile({ buddy_match_enabled: v })}
            />
          }
        />

        {/* Rest Recovery */}
        <SettingsRow
          label="Rest & Recovery Mode"
          sublabel="Pause active workout reminders and dial targets"
          rightElement={
            <ToggleSwitch
              checked={restRecovery}
              onChange={(v) => updateProfile({ rest_mode: v })}
            />
          }
        />

        {/* Private training */}
        <SettingsRow
          label="Private Training"
          sublabel="Hide session telemetry from public athlete leaderboards"
          rightElement={
            <ToggleSwitch
              checked={privateTraining}
              onChange={(v) => updateProfile({ private_training: v })}
            />
          }
        />
      </SettingsGroup>
    </div>
  );
}
