import React, { useEffect, useState } from 'react';
import {
  MeditationDayRecord,
  useTelemetryHistoryStore,
} from '../../store/useTelemetryHistoryStore';
import { sanitizeNumericInput } from '../../../../utils/numberInputUtils';
import { readNum, type DayLogContext, type SaveOutcome } from './shared';

/** Mindful day: minutes, brainwave coherence and breathing protocol. */
export function useMeditationLogForm({ isOpen, dayMeta, category, mode, onSaved }: DayLogContext) {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  const [meditationMinutes, setMeditationMinutes] = useState('');
  const [meditationCoherence, setMeditationCoherence] = useState('');
  const [meditationProtocol, setMeditationProtocol] = useState('');

  useEffect(() => {
    if (!isOpen || !dayMeta) return;
    if (category !== 'meditation') return;
    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];
    const rec = dayRecord as MeditationDayRecord | undefined;
    if (rec?.hasData) {
      setMeditationMinutes(rec.minutes > 0 ? String(rec.minutes) : '');
      setMeditationCoherence(rec.coherence || '');
      setMeditationProtocol(rec.protocol || '');
    } else {
      setMeditationMinutes('');
      setMeditationCoherence('');
      setMeditationProtocol('');
    }
  }, [isOpen, dayMeta, category, historyByDate]);

  const save = (): SaveOutcome => {
    if (!dayMeta) return 'stay';
    const minNum = readNum(meditationMinutes);
    if (minNum == null) {
      onSaved?.('Add the minutes first');
      return 'stay';
    }
    const record = {
      hasData: true,
      minutes: minNum,
      coherence: meditationCoherence,
      protocol: meditationProtocol,
      sessions: 1,
      hrvScore: 0,
    };
    updateDayRecord(dayMeta.dateKey, 'meditation', record);
    onSaved?.(mode === 'edit' ? 'Mindful session updated' : 'Mindful session logged');
    return 'done';
  };

  return {
    meditationMinutes,
    setMeditationMinutes,
    meditationCoherence,
    setMeditationCoherence,
    meditationProtocol,
    setMeditationProtocol,
    save,
  };
}

export type MeditationLogForm = ReturnType<typeof useMeditationLogForm>;

export function MeditationLogFields({ form }: { form: MeditationLogForm }) {
  const {
    meditationMinutes,
    setMeditationMinutes,
    meditationCoherence,
    setMeditationCoherence,
    meditationProtocol,
    setMeditationProtocol,
  } = form;
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-neutral-400 font-bold block mb-1">
            Mindful Time (MIN)
          </label>
          <input
            type="number"
            value={meditationMinutes}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setMeditationMinutes(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-emerald-400 font-bold focus:border-emerald-600 focus:outline-none text-sm"
            placeholder="15"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 font-bold block mb-1">
            Brainwave Coherence
          </label>
          <select
            value={meditationCoherence}
            onChange={(e) => setMeditationCoherence(e.target.value)}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold focus:border-emerald-600 focus:outline-none text-xs"
          >
            <option value="">Optional</option>
            <option value="Alpha Wave">Alpha Wave (Coherence)</option>
            <option value="Theta Wave">Theta Wave (Deep Calm)</option>
            <option value="Gamma Wave">Gamma Wave (Peak Focus)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-neutral-400 font-bold block mb-1">
          Resonance Protocol
        </label>
        <div className="space-y-1.5">
          {[
            'Tactical Box Breathing 4-4-4-4',
            'Zen Breath Waveform 5-5',
            'Vagal Nerve Reset 4-7-8',
          ].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMeditationProtocol(p)}
              className={`w-full py-2 px-3 text-left rounded-xl text-xs font-bold transition-all ${
                meditationProtocol === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
