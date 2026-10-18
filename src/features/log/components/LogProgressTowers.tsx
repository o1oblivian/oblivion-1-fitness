import React from 'react';
import { TelemetryCategory } from '../store/useTelemetryHistoryStore';
import { SegmentedTowers, SegmentedTower } from '../../../components/ui/SegmentedTowers';
import { dayTowerTheme } from '../../../components/ui/towerThemes';

export interface TowerPoint {
  key: string;
  label: string;
  value: number;
}

const ARIA_NAME: Record<TelemetryCategory, string> = {
  workout: 'Total weight lifted',
  cardio: 'Cardio',
  nutrition: 'Calories eaten',
  sleep: 'Sleep',
  meditation: 'Mindful minutes',
};

/** Seven capsules for a week; twelve months need slimmer ones to fit. */
const WIDE_TOWER_PX = 26;
const SLIM_TOWER_PX = 17;
const TOWER_HEIGHT_PX = 128;
const DAYS_IN_WEEK = 7;

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
  const average =
    logged.length > 0 ? logged.reduce((sum, point) => sum + point.value, 0) / logged.length : 0;
  const peakIndex = points.findIndex((point) => point.value > 0 && point.value === peak);
  const peakPoint = peakIndex >= 0 ? points[peakIndex] : undefined;
  const isWeek = points.length === DAYS_IN_WEEK;
  const peakAccent = peakPoint ? dayTowerTheme(peakPoint.label, peakIndex).ramp[1] : undefined;

  const towers: SegmentedTower[] = points.map((point, index) => {
    const theme = dayTowerTheme(point.label, index);
    const has = point.value > 0;
    return {
      key: point.key,
      label: point.label.toUpperCase(),
      value: has ? point.value : null,
      slabs: theme.slabs,
      accent: theme.ramp[1],
      ramp: theme.ramp,
      valueLabel: has ? formatValue(point.value) : '--',
      ariaValue: has ? `${formatValue(point.value)} ${unit}` : 'nothing logged',
    };
  });

  return (
    <div className="pt-3 space-y-2">
      <div className="flex items-center justify-between gap-2 px-1 text-o1-label">
        <span className="text-o1-muted">
          {average > 0 ? `Average ${formatValue(average)} ${unit}` : 'No days logged'}
        </span>
        {peakPoint ? (
          <span className="font-semibold" style={{ color: peakAccent }}>
            {/* The medal already marks the peak day in a week, so only the month and year views name it. */}
            Peak {isWeek ? '' : `${peakPoint.label} `}
            {formatValue(peakPoint.value)}
          </span>
        ) : null}
      </div>
      <SegmentedTowers
        bold
        towers={towers}
        tubeHeightPx={TOWER_HEIGHT_PX}
        maxTubeWidthPx={points.length > DAYS_IN_WEEK ? SLIM_TOWER_PX : WIDE_TOWER_PX}
        reference={average > 0 && logged.length > 1 ? { value: average, label: 'AVERAGE' } : null}
        activeKey={selectedKey ?? null}
        peakKey={peakPoint?.key ?? null}
        showValues
        onSelect={onSelect}
        ariaLabel={`${ARIA_NAME[category]} by ${points.length === 12 ? 'month' : isWeek ? 'day' : 'week'}`}
      />
    </div>
  );
};
