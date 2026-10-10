import React from 'react';
import type { OblivionReport, ReportAction } from '../types';
import { ScoreHero } from './ScoreHero';
import { MuscleMap } from './MuscleMap';
import { StrengthPanel } from './StrengthPanel';
import { ActionList } from './ActionList';

interface OblivionReportViewProps {
  report: OblivionReport;
  mode: 'athlete' | 'coach';
  onAction: (action: ReportAction) => void;
  targetSessions?: number;
  onTargetChange?: (n: number) => void;
}

function relativeTime(ms: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** The report body. Identical for athlete and coach so both read the same dossier. */
export const OblivionReportView: React.FC<OblivionReportViewProps> = ({
  report,
  mode,
  onAction,
  targetSessions,
  onTargetChange,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-0.5">
      <span className="text-[10px] font-mono font-bold tracking-[0.22em] text-neutral-500">
        The Oblivion Report
      </span>
      <span className="text-[10px] font-mono text-neutral-600">Updated {relativeTime(report.generatedAt)}</span>
    </div>

    <ScoreHero
      report={report}
      targetSessions={mode === 'athlete' ? targetSessions : undefined}
      onTargetChange={mode === 'athlete' ? onTargetChange : undefined}
    />

    <ActionList
      title={mode === 'coach' ? 'Coach prompts' : 'Next moves'}
      actions={report.actions}
      ctaLabel={mode === 'coach' ? 'Dispatch' : 'Train'}
      onAction={onAction}
    />

    <MuscleMap muscles={report.muscles} />
    <StrengthPanel lifts={report.lifts} personalBests={report.personalBests} />
  </div>
);

export default OblivionReportView;
