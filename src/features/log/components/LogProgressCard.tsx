import React from 'react';
import { ChevronDown } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import type { TelemetryCategory } from '../store/useTelemetryHistoryStore';
import { LogProgressTowers } from './LogProgressTowers';
import { formatTowerValue, type ChartSpan, type TowerSeries } from './logTowerSeries';

const SPANS: ReadonlyArray<{ id: ChartSpan; label: string }> = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

interface LogProgressCardProps {
  open: boolean;
  onToggle: () => void;
  channels: ReadonlyArray<{ id: TelemetryCategory; title: string }>;
  channel: TelemetryCategory;
  onChannelChange: (channel: TelemetryCategory) => void;
  span: ChartSpan;
  onSpanChange: (span: ChartSpan) => void;
  series: TowerSeries;
  onSelectKey: (key: string) => void;
}

/** Collapsible bar chart of one channel over a week, four weeks or a year. */
export const LogProgressCard: React.FC<LogProgressCardProps> = ({
  open,
  onToggle,
  channels,
  channel,
  onChannelChange,
  span,
  onSpanChange,
  series,
  onSelectKey,
}) => (
  <>
    <button
      type="button"
      aria-expanded={open}
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onToggle();
      }}
      className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left bg-transparent border-0 cursor-pointer"
    >
      <span className="text-[14px] font-semibold text-o1-text">Progress</span>
      <span className="flex items-center gap-2 text-[11px] text-o1-muted">
        {channels.find((entry) => entry.id === channel)?.title} ·{' '}
        {SPANS.find((entry) => entry.id === span)?.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </span>
    </button>
    {open && (
      <div className="px-3 pb-3">
        <div
          className="grid grid-cols-5 gap-1"
          role="group"
          aria-label="Channel shown in the chart"
        >
          {channels.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={channel === entry.id}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onChannelChange(entry.id);
              }}
              className={`px-0.5 py-1.5 rounded-full border text-[12px] font-semibold text-center truncate ${
                channel === entry.id
                  ? 'bg-o1-text text-o1-surface border-o1-text'
                  : 'bg-o1-well border-white/[0.07] text-neutral-200'
              }`}
            >
              {entry.title}
            </button>
          ))}
        </div>
        <div className="flex justify-center pt-3">
          <div className="inline-flex bg-o1-well border border-white/[0.07] p-0.5 rounded-full">
            {SPANS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={span === entry.id}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onSpanChange(entry.id);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold ${span === entry.id ? 'bg-o1-crimson text-white' : 'text-neutral-400'}`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
        <LogProgressTowers
          category={channel}
          points={series.points}
          unit={series.unit}
          selectedKey={series.selectedKey}
          formatValue={(value) => formatTowerValue(channel, value)}
          onSelect={onSelectKey}
        />
      </div>
    )}
  </>
);
