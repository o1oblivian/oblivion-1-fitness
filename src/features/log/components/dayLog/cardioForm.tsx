import React, { useEffect, useState } from 'react';
import { CardioDayRecord, useTelemetryHistoryStore } from '../../store/useTelemetryHistoryStore';
import { useFuelStore } from '../../../fuel/store/useFuelStore';
import { sanitizeNumericInput } from '../../../../utils/numberInputUtils';
import { persistCardioLog } from '../../services/cardioLogService';
import { readNum, type DayLogContext, type SaveOutcome } from './shared';

/** Cardio day: distance, time, burn and heart rate. */
export function useCardioLogForm({ isOpen, dayMeta, category, mode, onSaved }: DayLogContext) {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  const [cardioType, setCardioType] = useState('');
  const [cardioDistance, setCardioDistance] = useState('');
  const [cardioDuration, setCardioDuration] = useState('');
  const [cardioBurn, setCardioBurn] = useState('');
  const [cardioHeartRate, setCardioHeartRate] = useState('');

  useEffect(() => {
    if (!isOpen || !dayMeta) return;
    if (category !== 'cardio') return;
    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];
    const rec = dayRecord as CardioDayRecord | undefined;
    if (rec?.hasData) {
      setCardioType(rec.activityType || 'Incline Treadmill');
      setCardioDistance(rec.distanceKm > 0 ? String(rec.distanceKm) : '');
      setCardioDuration(rec.durationMinutes > 0 ? String(rec.durationMinutes) : '');
      setCardioBurn(rec.burnedKcal > 0 ? String(rec.burnedKcal) : '');
      setCardioHeartRate(rec.avgHeartRateBpm > 0 ? String(rec.avgHeartRateBpm) : '');
    } else {
      setCardioType('Incline Treadmill');
      setCardioDistance('');
      setCardioDuration('');
      setCardioBurn('');
      setCardioHeartRate('');
    }
  }, [isOpen, dayMeta, category, historyByDate]);

  const save = (): SaveOutcome => {
    if (!dayMeta) return 'stay';
    const distNum = readNum(cardioDistance);
    const durNum = readNum(cardioDuration);
    const burnNum = readNum(cardioBurn);
    const hrNum = readNum(cardioHeartRate);
    if (distNum == null && durNum == null && burnNum == null && hrNum == null) {
      onSaved?.('Add a number first');
      return 'stay';
    }
    const activity = cardioType.trim() || 'Cardio';
    const cardioRecord = {
      hasData: true,
      distanceKm: distNum ?? 0,
      durationMinutes: durNum ?? 0,
      burnedKcal: burnNum ?? 0,
      avgHeartRateBpm: hrNum ?? 0,
      zone2Minutes: 0,
      activityType: activity,
    };
    updateDayRecord(dayMeta.dateKey, 'cardio', cardioRecord);
    if (mode !== 'edit') {
      if (dayMeta.isToday && burnNum != null && burnNum > 0) {
        useFuelStore.getState().logBurned(burnNum);
      }
      void persistCardioLog({
        activityType: activity,
        distanceKm: distNum ?? 0,
        durationMinutes: durNum ?? 0,
        burnedKcal: burnNum ?? 0,
        avgHeartRateBpm: hrNum ?? undefined,
        dateKey: dayMeta.dateKey,
      });
    }
    onSaved?.(mode === 'edit' ? 'Cardio updated' : 'Cardio logged');
    return 'done';
  };

  return {
    cardioType,
    setCardioType,
    cardioDistance,
    setCardioDistance,
    cardioDuration,
    setCardioDuration,
    cardioBurn,
    setCardioBurn,
    cardioHeartRate,
    setCardioHeartRate,
    save,
  };
}

export type CardioLogForm = ReturnType<typeof useCardioLogForm>;

export function CardioLogFields({ form }: { form: CardioLogForm }) {
  const {
    cardioType,
    setCardioType,
    cardioDistance,
    setCardioDistance,
    cardioDuration,
    setCardioDuration,
    cardioBurn,
    setCardioBurn,
    cardioHeartRate,
    setCardioHeartRate,
  } = form;
  return (
    <div className="space-y-3.5">
      <div>
        <label className="text-[10px] text-neutral-400 font-bold block mb-1">
          Activity Modality
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {['Incline Treadmill', 'Rower HIIT', 'Stairmaster'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setCardioType(m)}
              className={`py-2 px-1 text-[10px] rounded-xl font-bold transition-all ${
                cardioType === m
                  ? 'bg-sky-600 text-white'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
              }`}
            >
              {m.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-neutral-400 font-bold block mb-1">Distance (KM)</label>
          <input
            type="number"
            step="0.1"
            value={cardioDistance}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCardioDistance(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none"
            placeholder="5.0"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 font-bold block mb-1">
            Duration (MIN)
          </label>
          <input
            type="number"
            value={cardioDuration}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCardioDuration(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none"
            placeholder="35"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-neutral-400 font-bold block mb-1">
            Burned Energy (KCAL)
          </label>
          <input
            type="number"
            value={cardioBurn}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCardioBurn(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-amber-400 font-bold focus:border-sky-500 focus:outline-none"
            placeholder="380"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400 font-bold block mb-1">
            Avg Heart Rate (BPM)
          </label>
          <input
            type="number"
            value={cardioHeartRate}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCardioHeartRate(sanitizeNumericInput(e.target.value))}
            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none"
            placeholder="142"
          />
        </div>
      </div>
    </div>
  );
}
