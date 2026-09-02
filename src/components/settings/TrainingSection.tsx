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
            <span className="text-xs font-semibold text-[#C4121A] dark:text-[#D91F28]">{primaryFocus}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => selectFocus(f)}
                className={`h-[26px] px-2.5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  primaryFocus === f
                    ? 'bg-[#C4121A] dark:bg-[#D91F28] text-white shadow-xs'
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
        <div className="p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 block">
              Training Days
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {selectedDays.length} of 7 active
            </span>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-3">
            Select scheduled active training days
          </span>
          <div className="grid grid-cols-7 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06]">
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`group relative flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-zinc-200/80 dark:border-white/10'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`text-xs font-semibold tracking-tight transition-colors ${
                    active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {day}
                  </span>
                  <div className="h-1 flex items-center justify-center mt-1">
                    {active ? (
                      <span className="w-2.5 h-0.5 rounded-full bg-red-600 dark:bg-red-500" />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-transparent" />
                    )}
                  </div>
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
