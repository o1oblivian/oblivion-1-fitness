import React from 'react';
import { DayStrainDetail } from './microcycleTypes';
import { SegmentedTowers, SegmentedTower } from '../../../../components/ui/SegmentedTowers';
import { DAY_TOWER_THEME } from '../../../../components/ui/towerThemes';

interface MicrocycleTowersProps {
  activeDays: DayStrainDetail[];
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
  baselineVolume?: number;
}

export const MicrocycleTowers: React.FC<MicrocycleTowersProps> = ({
  activeDays,
  selectedDayIdx,
  onSelectDay,
  baselineVolume = 0,
}) => {
  const peak = activeDays.reduce((m, d) => Math.max(m, d.volume), 0);
  const peakDay = peak > 0 ? activeDays.find((d) => d.volume === peak) : undefined;

  const towers: SegmentedTower[] = activeDays.map((d) => {
    const theme = DAY_TOWER_THEME[d.day] ?? DAY_TOWER_THEME.Mon;
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
      maxTubeWidthPx={28}
      reference={
        baselineVolume > 0
          ? { value: baselineVolume, label: `BASELINE ${(baselineVolume / 1000).toFixed(1)}k kg` }
          : null
      }
      activeKey={activeDays[selectedDayIdx]?.day ?? null}
      peakKey={peakDay?.day ?? null}
      showValues
      onSelect={(key) => onSelectDay(activeDays.findIndex((d) => d.day === key))}
      ariaLabel="Total weight lifted each day this week"
    />
  );
};
