import React, { useEffect, useState } from 'react';
import { SleepDayRecord, useTelemetryHistoryStore } from '../../store/useTelemetryHistoryStore';
import { sanitizeNumericInput } from '../../../../utils/numberInputUtils';
import { readNum, type DayLogContext, type SaveOutcome } from './shared';

/** Sleep day: hours, recovery, deep and REM sleep, resting heart rate. */
export function useSleepLogForm({ isOpen, dayMeta, category, mode, onSaved }: DayLogContext) {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  const [sleepHours, setSleepHours] = useState('');
  const [sleepRecovery, setSleepRecovery] = useState('');
  const [sleepDeep, setSleepDeep] = useState('');
  const [sleepRem, setSleepRem] = useState('');
  const [sleepHeartRate, setSleepHeartRate] = useState('');

  useEffect(() => {
    if (!isOpen || !dayMeta) return;
    if (category !== 'sleep') return;
    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];
    const rec = dayRecord as SleepDayRecord | undefined;
    if (rec?.hasData) {
      setSleepHours(rec.durationHours > 0 ? String(rec.durationHours) : '');
      setSleepRecovery(rec.recoveryPercent > 0 ? String(rec.recoveryPercent) : '');
      setSleepDeep(rec.deepSleepMinutes > 0 ? String(rec.deepSleepMinutes) : '');
      setSleepRem(rec.remSleepMinutes > 0 ? String(rec.remSleepMinutes) : '');
      setSleepHeartRate(rec.restingHeartRate > 0 ? String(rec.restingHeartRate) : '');
    } else {
      setSleepHours('');
      setSleepRecovery('');
      setSleepDeep('');
      setSleepRem('');
      setSleepHeartRate('');
    }
  }, [isOpen, dayMeta, category, historyByDate]);

  const save = (): SaveOutcome => {
    if (!dayMeta) return 'stay';
    const hoursNum = readNum(sleepHours);
    const recNum = readNum(sleepRecovery);
    const deepNum = readNum(sleepDeep);
    const remNum = readNum(sleepRem);
    const rhrNum = readNum(sleepHeartRate);
    if (hoursNum == null && recNum == null && deepNum == null && remNum == null && rhrNum == null) {
      onSaved?.('Add a number first');
      return 'stay';
    }
    const record = {
      hasData: true,
      durationHours: hoursNum ?? 0,
      durationMinutes: hoursNum != null ? Math.round(hoursNum * 60) : 0,
      recoveryPercent: recNum ?? 0,
      deepSleepMinutes: deepNum ?? 0,
      remSleepMinutes: remNum ?? 0,
      sleepEfficiencyPercent: 0,
      restingHeartRate: rhrNum ?? 0,
      bedtime: '',
      wakeTime: '',
    };
    updateDayRecord(dayMeta.dateKey, 'sleep', record);
    onSaved?.(mode === 'edit' ? 'Sleep updated' : 'Sleep logged');
    return 'done';
  };

  return {
    sleepHours,
    setSleepHours,
    sleepRecovery,
    setSleepRecovery,
    sleepDeep,
    setSleepDeep,
    sleepRem,
    setSleepRem,
    sleepHeartRate,
    setSleepHeartRate,
    save,
  };
}

export type SleepLogForm = ReturnType<typeof useSleepLogForm>;

export function SleepLogFields({ form }: { form: SleepLogForm }) {
  const {
    sleepHours,
    setSleepHours,
    sleepRecovery,
    setSleepRecovery,
    sleepDeep,
    setSleepDeep,
    sleepRem,
    setSleepRem,
    sleepHeartRate,
    setSleepHeartRate,
  } = form;
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-o1-label text-o1-muted font-bold block mb-1">
            Sleep Duration (HOURS)
          </label>
          <input
            type="number"
            step="0.1"
            value={sleepHours}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSleepHours(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-o1-teal font-bold focus:border-o1-teal focus:outline-none text-sm"
            placeholder="7.8"
          />
        </div>
        <div>
          <label className="text-o1-label text-o1-muted font-bold block mb-1">
            Recovery Score (%)
          </label>
          <input
            type="number"
            value={sleepRecovery}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSleepRecovery(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-teal focus:outline-none text-sm"
            placeholder="92"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-o1-label text-o1-muted font-bold block mb-1">Deep (MIN)</label>
          <input
            type="number"
            value={sleepDeep}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSleepDeep(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold text-xs"
            placeholder="95"
          />
        </div>
        <div>
          <label className="text-o1-label text-o1-muted font-bold block mb-1">Rem (Min)</label>
          <input
            type="number"
            value={sleepRem}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSleepRem(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold text-xs"
            placeholder="110"
          />
        </div>
        <div>
          <label className="text-o1-label text-o1-muted font-bold block mb-1">RHR (BPM)</label>
          <input
            type="number"
            value={sleepHeartRate}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSleepHeartRate(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold text-xs"
            placeholder="52"
          />
        </div>
      </div>
    </div>
  );
}
