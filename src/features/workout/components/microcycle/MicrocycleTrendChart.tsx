import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DayStrainDetail } from './microcycleTypes';
import { tactileEngine } from '../../../../services/tactileEngine';

interface MicrocycleTrendChartProps {
  activeDays: DayStrainDetail[];
  onSelectDay: (idx: number) => void;
}

export const MicrocycleTrendChart: React.FC<MicrocycleTrendChartProps> = ({
  activeDays,
  onSelectDay,
}) => {
  const chartData = activeDays.map((d) => ({
    day: d.day,
    volume: d.volume,
    volumeK: Number((d.volume / 1000).toFixed(1)),
    targetVolK: Number((d.targetVol / 1000).toFixed(1)),
    strainScore: d.strainScore,
    sets: d.sets,
  }));

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-1">
        <span>Recharts Weekly Telemetry Load</span>
        <span className="text-[#C4121A] font-semibold">Overload Threshold: 6.5k kg</span>
      </div>

      <div className="h-44 w-full bg-neutral-50 dark:bg-[#18181b] rounded-2xl p-2 border border-neutral-200 dark:border-neutral-800">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(e: any) => {
              if (e && e.activeTooltipIndex !== undefined) {
                tactileEngine.triggerSelectionBuzz();
                onSelectDay(e.activeTooltipIndex);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
            <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-neutral-900 border border-neutral-700 p-2 rounded-xl text-[10px] font-mono text-white shadow-xl">
                    <span className="font-bold text-[#C4121A] block">{d.day} Load</span>
                    <span>Volume: {d.volumeK}k kg</span>
                  </div>
                );
              }}
            />
            <Bar dataKey="volumeK" fill="#C4121A" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Line type="monotone" dataKey="targetVolK" stroke="#71717a" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
