import React from 'react';
import { Activity, Clock, TrendingUp, Flame, Heart, Footprints } from 'lucide-react';
import { parseCleanInt, parseCleanNumber } from '../../../../utils/numberInputUtils';

export interface ExtractedCardioData {
  activityType: string;
  distanceKm: number;
  durationMinutes: number;
  burnedKcal: number;
  avgHeartRateBpm: number;
  zone2Minutes: number;
  steps: number;
  confidenceScore: number;
  rawReadings?: string;
  aliveAiNote?: string;
}

interface CardioScanMetricFieldsProps {
  data: ExtractedCardioData;
  onChange: (updated: ExtractedCardioData) => void;
}

export const CardioScanMetricFields: React.FC<CardioScanMetricFieldsProps> = ({ data, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1">
        <span className="text-[9px] uppercase text-neutral-500 flex items-center gap-1 font-bold">
          <Activity className="w-3 h-3 text-cyan-500" /> Equipment / Watch
        </span>
        <input
          type="text"
          value={data.activityType}
          onChange={(e) => onChange({ ...data, activityType: e.target.value })}
          className="w-full bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>

      <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1">
        <span className="text-[9px] uppercase text-neutral-500 flex items-center gap-1 font-bold">
          <Footprints className="w-3 h-3 text-emerald-500" /> Steps
        </span>
        <input
          type="number"
          placeholder="0"
          value={data.steps === 0 ? '' : data.steps}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ ...data, steps: Math.max(0, parseCleanInt(e.target.value)) })}
          className="w-full bg-transparent font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
        />
      </div>

      <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1">
        <span className="text-[9px] uppercase text-neutral-500 flex items-center gap-1 font-bold">
          <Clock className="w-3 h-3 text-cyan-500" /> Duration (Min)
        </span>
        <input
          type="number"
          placeholder="0"
          value={data.durationMinutes === 0 ? '' : data.durationMinutes}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ ...data, durationMinutes: Math.max(0, parseCleanInt(e.target.value)) })}
          className="w-full bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>

      <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1">
        <span className="text-[9px] uppercase text-neutral-500 flex items-center gap-1 font-bold">
          <TrendingUp className="w-3 h-3 text-cyan-500" /> Distance (km)
        </span>
        <input
          type="number"
          step="0.01"
          placeholder="0"
          value={data.distanceKm === 0 ? '' : data.distanceKm}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ ...data, distanceKm: Math.max(0, parseCleanNumber(e.target.value)) })}
          className="w-full bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>

      <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1">
        <span className="text-[9px] uppercase text-neutral-500 flex items-center gap-1 font-bold">
          <Flame className="w-3 h-3 text-amber-500" /> Burn (kcal)
        </span>
        <input
          type="number"
          placeholder="0"
          value={data.burnedKcal === 0 ? '' : data.burnedKcal}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ ...data, burnedKcal: Math.max(0, parseCleanInt(e.target.value)) })}
          className="w-full bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>

      <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1">
        <span className="text-[9px] uppercase text-neutral-500 flex items-center gap-1 font-bold">
          <Heart className="w-3 h-3 text-rose-500" /> Avg Heart Rate
        </span>
        <input
          type="number"
          placeholder="0"
          value={data.avgHeartRateBpm === 0 ? '' : data.avgHeartRateBpm}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ ...data, avgHeartRateBpm: Math.max(0, parseCleanInt(e.target.value)) })}
          className="w-full bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>
    </div>
  );
};
