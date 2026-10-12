import React from 'react';
import { Activity, Clock, TrendingUp, Flame, Heart, Footprints } from 'lucide-react';
import { parseCleanInt, parseCleanNumber } from '../../../../utils/numberInputUtils';

/** Unread metrics stay null and render as '--'. */
export interface ExtractedCardioData {
  activityType: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  burnedKcal: number | null;
  avgHeartRateBpm: number | null;
  steps: number | null;
  fieldsRead: number;
  rawReadings?: string;
  aliveAiNote?: string;
}

interface CardioScanMetricFieldsProps {
  data: ExtractedCardioData;
  onChange: (updated: ExtractedCardioData) => void;
}

type MetricKey = 'steps' | 'durationMinutes' | 'distanceKm' | 'burnedKcal' | 'avgHeartRateBpm';

const METRICS: { key: MetricKey; label: string; icon: typeof Clock; tone: string; decimal?: boolean }[] = [
  { key: 'steps', label: 'Steps', icon: Footprints, tone: 'text-emerald-500' },
  { key: 'durationMinutes', label: 'Duration (Min)', icon: Clock, tone: 'text-sky-500' },
  { key: 'distanceKm', label: 'Distance (km)', icon: TrendingUp, tone: 'text-sky-500', decimal: true },
  { key: 'burnedKcal', label: 'Burn (kcal)', icon: Flame, tone: 'text-amber-500' },
  { key: 'avgHeartRateBpm', label: 'Avg Heart Rate', icon: Heart, tone: 'text-red-500' },
];

export const CardioScanMetricFields: React.FC<CardioScanMetricFieldsProps> = ({ data, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="p-2.5 rounded-2xl bg-o1-well border border-white/[0.07] space-y-1">
        <span className="text-[9px] text-neutral-500 flex items-center gap-1 font-bold">
          <Activity className="w-3 h-3 text-sky-500" /> Equipment / Watch
        </span>
        <input
          type="text"
          value={data.activityType}
          onChange={(e) => onChange({ ...data, activityType: e.target.value })}
          className="w-full bg-transparent font-bold text-white focus:outline-none"
        />
      </div>

      {METRICS.map(({ key, label, icon: Icon, tone, decimal }) => {
        const value = data[key];
        return (
          <div key={key} className="p-2.5 rounded-2xl bg-o1-well border border-white/[0.07] space-y-1">
            <span className="text-[9px] text-neutral-500 flex items-center gap-1 font-bold">
              <Icon className={`w-3 h-3 ${tone}`} /> {label}
            </span>
            <input
              type="number"
              inputMode={decimal ? 'decimal' : 'numeric'}
              step={decimal ? '0.01' : '1'}
              placeholder="--"
              value={value == null ? '' : value}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const parsed = raw === '' ? null : Math.max(0, decimal ? parseCleanNumber(raw) : parseCleanInt(raw));
                onChange({ ...data, [key]: parsed });
              }}
              className={`w-full bg-transparent font-bold focus:outline-none placeholder:text-neutral-500 ${key === 'steps' ? 'text-emerald-400' : 'text-white'}`}
            />
          </div>
        );
      })}
    </div>
  );
};
