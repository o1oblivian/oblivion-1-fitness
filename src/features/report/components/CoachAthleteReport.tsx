import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { fetchSharedReport, type CoachReportResult } from '../reportShareService';
import { OblivionReportView } from './OblivionReportView';
import type { ReportAction } from '../types';

interface CoachAthleteReportProps {
  /** The athlete's auth user id (roster `client_id`). */
  athleteId?: string;
  athleteName: string;
  /** Opens the existing 1-on-1 dispatch studio for this athlete. */
  onDispatch: (action?: ReportAction) => void;
}

type State = { phase: 'loading' } | { phase: 'done'; result: CoachReportResult };

const EMPTY_COPY: Record<'not_shared' | 'unlinked' | 'error', { title: string; body: string }> = {
  not_shared: {
    title: 'Report not shared',
    body: 'This athlete has not switched on "Share with my coach" yet. Ask them to open The Oblivion Report from their Log tab.',
  },
  unlinked: {
    title: 'Onboarding // Day 0',
    body: 'Awaiting first logged session.',
  },
  error: {
    title: 'Could not load report',
    body: 'Check your connection and reopen this dossier.',
  },
};

export const CoachAthleteReport: React.FC<CoachAthleteReportProps> = ({ athleteId, athleteName, onDispatch }) => {
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ phase: 'loading' });
    fetchSharedReport(athleteId).then((result) => {
      if (alive) setState({ phase: 'done', result });
    });
    return () => {
      alive = false;
    };
  }, [athleteId]);

  if (state.phase === 'loading') {
    return (
      <div className="rounded-2xl bg-black border border-white/[0.07] p-4 text-[11px] font-mono text-neutral-500 text-center">
        Loading {athleteName}&apos;s report…
      </div>
    );
  }

  if (state.result.status !== 'ok') {
    const copy = EMPTY_COPY[state.result.status];
    return (
      <div className="rounded-2xl bg-black border border-white/[0.07] p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 mt-0.5 text-neutral-500 shrink-0" />
        <div className="space-y-1">
          <div className="text-sm font-bold text-white">{copy.title}</div>
          <p className="text-[11px] leading-relaxed text-neutral-500">{copy.body}</p>
        </div>
      </div>
    );
  }

  return (
    <OblivionReportView report={state.result.report} mode="coach" onAction={(action) => onDispatch(action)} />
  );
};

export default CoachAthleteReport;
