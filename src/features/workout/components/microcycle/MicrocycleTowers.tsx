import React from 'react';
import { DayStrainDetail } from './microcycleTypes';
import { SegmentedTowers, SegmentedTower } from '../../../../components/ui/SegmentedTowers';

interface MicrocycleTowersProps {
  activeDays: DayStrainDetail[];
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
  baselineVolume?: number;
}

/** Bottom → top slab colours and the matching frame accent, one hue family per day. */
const DAY_THEME: Record<string, { slabs: string[]; accent: string }> = {
  Mon: { slabs: ['#C4121A', '#F2A20C', '#D97B12', '#C4121A', '#F5A50E'], accent: '#D97B12' },
  Tue: { slabs: ['#D9860F', '#A5531A', '#F5A00F'], accent: '#D9860F' },
  Wed: { slabs: ['#C4121A', '#8E1B1B', '#F47A7A', '#FBB0AC'], accent: '#C4121A' },
  Thu: { slabs: ['#0284C7', '#1F6FA6'], accent: '#0284C7' },
  Fri: { slabs: ['#E85D04', '#F97316', '#FB923C', '#EA580C'], accent: '#EA580C' },
  Sat: { slabs: ['#1E7A3E', '#22C55E', '#2E7D46', '#16A34A'], accent: '#16A34A' },
  Sun: { slabs: ['#0284C7', '#1F6FA6'], accent: '#0284C7' },
};

export const MicrocycleTowers: React.FC<MicrocycleTowersProps> = ({
  activeDays,
  selectedDayIdx,
  onSelectDay,
  baselineVolume = 0,
}) => {
  const peak = activeDays.reduce((m, d) => Math.max(m, d.volume), 0);
  const peakDay = peak > 0 ? activeDays.find((d) => d.volume === peak) : undefined;

  const towers: SegmentedTower[] = activeDays.map((d) => {
    const theme = DAY_THEME[d.day] ?? DAY_THEME.Mon;
    return {
      key: d.day,
      label: d.day.toUpperCase(),
      value: d.volume > 0 ? d.volume : null,
      slabs: theme.slabs,
      accent: theme.accent,
      valueLabel: d.volume > 0 ? `${(d.volume / 1000).toFixed(1)}k` : '--',
      ariaValue: d.volume > 0 ? `${d.volume.toLocaleString()} kg` : 'no load',
    };
  });

  return (
    <SegmentedTowers
      towers={towers}
      tubeHeightPx={104}
      maxTubeWidthPx={20}
      reference={baselineVolume > 0 ? { value: baselineVolume, label: `BASELINE ${(baselineVolume / 1000).toFixed(1)}k kg` } : null}
      activeKey={activeDays[selectedDayIdx]?.day ?? null}
      peakKey={peakDay?.day ?? null}
      showValues
      onSelect={(key) => onSelectDay(activeDays.findIndex((d) => d.day === key))}
      ariaLabel="Training tonnage by day this week"
    />
  );
};

export default MicrocycleTowers;
