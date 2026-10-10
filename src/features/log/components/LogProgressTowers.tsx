import React from 'react';
import { TelemetryCategory } from '../store/useTelemetryHistoryStore';
import { tactileEngine } from '../../../services/tactileEngine';

export interface TowerPoint {
  key: string;
  label: string;
  value: number;
}

const PLATES: Record<TelemetryCategory, string[]> = {
  workout: ['#3F5C38', '#6B8F5E', '#9BB38A', '#D5E2CC'],
  cardio: ['#2C555C', '#4F8F9A', '#8FB8C0', '#D5E6EA'],
  nutrition: ['#3A5164', '#6A8CA8', '#A3BDD0', '#DCE6EE'],
  sleep: ['#56486E', '#8E7CA8', '#B7A9C8', '#E4DDEC'],
  meditation: ['#6E555A', '#C9A3A8', '#DCC0C4', '#F3E8EA'],
};

const TUBE_H = 72;

interface LogProgressTowersProps {
  category: TelemetryCategory;
  points: TowerPoint[];
  unit: string;
  selectedKey?: string;
  onSelect: (key: string) => void;
  formatValue: (value: number) => string;
}

export const LogProgressTowers: React.FC<LogProgressTowersProps> = ({
  category,
  points,
  unit,
  selectedKey,
  onSelect,
  formatValue,
}) => {
  const peak = points.reduce((best, point) => (point.value > best ? point.value : best), 0);
  const logged = points.filter((point) => point.value > 0);
  const average = logged.length > 0 ? logged.reduce((sum, point) => sum + point.value, 0) / logged.length : 0;
  const peakPoint = points.find((point) => point.value > 0 && point.value === peak);
  const plates = PLATES[category];
  const ring = plates[1];

  return (
    <div className="pt-2 space-y-2">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="text-neutral-500">
          {average > 0 ? `Average ${formatValue(average)} ${unit}` : 'No days logged'}
        </span>
        {peakPoint ? (
          <span style={{ color: ring }}>Peak {peakPoint.label} {formatValue(peakPoint.value)}</span>
        ) : null}
      </div>
      <div className="relative flex items-end justify-between gap-1 h-[118px]">
        {average > 0 && peak > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 z-10"
            style={{
              bottom: 22 + 4 + (average / peak) * (TUBE_H - 8),
              height: 1,
              backgroundImage: 'linear-gradient(to right, rgba(163,158,146,0.55) 40%, transparent 40%)',
              backgroundSize: '5px 1px',
            }}
          />
        )}
        {points.map((point) => {
          const selected = point.key === selectedKey;
          const isPeak = point.value > 0 && point.value === peak;
          const fill = peak > 0 && point.value > 0 ? Math.max(8, Math.round(((TUBE_H - 8) * point.value) / peak)) : 0;
          const plateCount = fill > 0 ? Math.max(1, Math.min(plates.length, Math.floor(fill / 8))) : 0;
          return (
            <button
              key={point.key}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelect(point.key);
              }}
              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full bg-transparent border-0 p-0"
            >
              <span className={`text-[9px] tabular-nums mb-1 leading-none ${selected || isPeak ? 'text-white font-semibold' : 'text-neutral-500'}`}>
                {point.value > 0 ? formatValue(point.value) : ''}
              </span>
              <div
                className="w-full max-w-[28px] bg-black border border-white/[0.07] flex flex-col justify-end overflow-hidden"
                style={{
                  height: TUBE_H,
                  borderRadius: 999,
                  padding: 2,
                  outline: isPeak ? `1.5px solid ${ring}` : 'none',
                  outlineOffset: 1,
                }}
              >
                {fill > 0 && (
                  <div className="w-full overflow-hidden flex flex-col-reverse" style={{ height: fill, borderRadius: 999 }}>
                    {plates.slice(0, plateCount).map((color) => (
                      <div key={color} className="w-full flex-1 min-h-0" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
              </div>
              <span className={`mt-1 text-[9px] ${selected ? 'text-white font-semibold' : 'text-neutral-500'}`}>{point.label}</span>
              {selected ? <span className="w-3 h-[2px] bg-white/80 rounded-full mt-px" /> : <span className="h-[2px] mt-px" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
