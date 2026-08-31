import React, { useState } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { useAuthStorage } from '../../hooks/useAuthStorage';

const FOCUS_OPTIONS = ['Hypertrophy', 'Strength', 'Endurance', 'Recomp', 'Mobility'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function TrainingSection() {
  const { getProfile, updateProfile } = useAuthStorage();
  const profile = getProfile() || {};
  
  const [primaryFocus, setPrimaryFocus] = useState(profile.primary_focus || 'Hypertrophy');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [preWorkoutNotif, setPreWorkoutNotif] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mo', 'We', 'Fr']);
  const [buddyMatch, setBuddyMatch] = useState(profile.buddy_match_enabled ?? true);
  const [restRecovery, setRestRecovery] = useState(profile.rest_mode ?? false);
  const [privateTraining, setPrivateTraining] = useState(profile.private_training ?? false);

  const selectFocus = (f: string) => {
    setPrimaryFocus(f);
    updateProfile({ primary_focus: f });
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div>
      <SectionHeader title="Training & Schedule" />
      <SettingsGroup>
        {/* Primary Focus selector */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Primary Focus</span>
            <span className="text-xs font-semibold text-[#DC2626]">{primaryFocus}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => selectFocus(f)}
                className={`h-[26px] px-2.5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer border ${
                  primaryFocus === f
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
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
          rightElement={<ToggleSwitch checked={autoDispatch} onChange={setAutoDispatch} />}
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
                  className={`w-[26px] h-[26px] min-w-[26px] min-h-[26px] max-w-[26px] max-h-[26px] shrink-0 aspect-square rounded-full text-[10.5px] font-semibold flex items-center justify-center transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
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
          rightElement={<ToggleSwitch checked={preWorkoutNotif} onChange={setPreWorkoutNotif} />}
        />

        {/* Buddy Match */}
        <SettingsRow
          label="Buddy Match"
          sublabel="Allow matching with nearby athletes during shared training times"
          rightElement={
            <ToggleSwitch
              checked={buddyMatch}
              onChange={(v) => {
                setBuddyMatch(v);
                updateProfile({ buddy_match_enabled: v });
              }}
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
              onChange={(v) => {
                setRestRecovery(v);
                updateProfile({ rest_mode: v });
              }}
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
              onChange={(v) => {
                setPrivateTraining(v);
                updateProfile({ private_training: v });
              }}
            />
          }
        />
      </SettingsGroup>
    </div>
  );
}
