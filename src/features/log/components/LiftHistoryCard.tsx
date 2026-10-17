import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';
import { useOblivionReport } from '../../report/useOblivionReport';
import { analyseAllLifts } from '../../report/reportEngine';
import type { LiftProgress, LiftTrend } from '../../report/types';

type View = 'lifts' | 'bests' | 'stuck';

const TREND: Record<LiftTrend, { simple: string; pro: string; cls: string; stroke: string }> = {
  rising: { simple: 'Going up', pro: 'Rising', cls: 'text-emerald-500 border-emerald-500/30', stroke: '#10b981' },
  steady: { simple: 'Holding', pro: 'Steady', cls: 'text-o1-muted border-white/[0.12]', stroke: '#8A887F' },
  plateau: { simple: 'Stuck', pro: 'Plateau', cls: 'text-amber-500 border-amber-500/30', stroke: '#d97706' },
  declining: { simple: 'Dropping', pro: 'Declining', cls: 'text-[#C4121A] border-[#C4121A]/40', stroke: '#C4121A' },
};

const PILL_OFF = 'bg-[#000000] text-[#FFFFFF] border border-white/[0.14]';
const PILL_ON = 'bg-[#FFFFFF] text-[#111113] border border-[#FFFFFF]';

function dayOf(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function shortDay(key: string): string {
  return dayOf(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function weeksSince(key: string): number {
  return Math.max(1, Math.floor((Date.now() - dayOf(key).getTime()) / (7 * 86_400_000)));
}

const kg = (n: number) => `${Math.round(n * 10) / 10} kg`;

function stuckAdvice(lift: LiftProgress, simple: boolean): { headline: string; tip: string } {
  if (lift.trend === 'declining') {
    const pct = lift.changePct === null ? '' : ` ${Math.abs(lift.changePct)}%`;
    return {
      headline: simple ? `Down${pct} on last month.` : `Down${pct} vs the prior 4 weeks.`,
      tip: 'Check sleep and food first. If both are fine, take one lighter week and build back up.',
    };
  }
  const weeks = weeksSince(lift.bestDay);
  return {
    headline: `No new best in ${weeks} week${weeks === 1 ? '' : 's'} (since ${shortDay(lift.bestDay)}).`,
    tip: lift.lastReps <= 6
      ? 'Try sets of 8–10 for three weeks, then come back to heavy sets.'
      : 'Try heavier sets of 4–6 for three weeks, or drop the weight 10% for one week and build back up.',
  };
}

const ProgressChart: React.FC<{ lift: LiftProgress; stroke: string }> = ({ lift, stroke }) => {
  const W = 300;
  const H = 80;
  const values = lift.series.map((p) => p.e1rm);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = lift.series.map((p, i) => {
    const x = lift.series.length === 1 ? W / 2 : (i / (lift.series.length - 1)) * (W - 12) + 6;
    const y = H - 6 - ((p.e1rm - lo) / span) * (H - 12);
    return [x, y] as const;
  });
  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between text-[10px] text-o1-muted text-right shrink-0">
        <span>{kg(hi)}</span>
        {hi !== lo && <span>{kg(lo)}</span>}
      </div>
      <div className="relative flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none" aria-hidden="true">
          {pts.length > 1 && (
            <polyline
              points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {pts.map(([x, y], i) => (
          <span
            key={lift.series[i].day}
            className="absolute w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, backgroundColor: stroke }}
          />
        ))}
      </div>
    </div>
  );
};

export const LiftHistoryCard: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const simple = useSimpleMode();
  const { sets, loading } = useOblivionReport(true);
  const lifts = useMemo(() => analyseAllLifts(sets, Date.now()), [sets]);
  const stuck = useMemo(() => lifts.filter((l) => l.trend === 'plateau' || l.trend === 'declining'), [lifts]);
  const bests = useMemo(() => [...lifts].sort((a, b) => dayOf(b.bestDay).getTime() - dayOf(a.bestDay).getTime()), [lifts]);
  const [view, setView] = useState<View>('lifts');
  const [openLift, setOpenLift] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const estLabel = simple ? 'Strength score' : 'Est. 1RM';

  const tabs: Array<{ id: View; label: string }> = [
    { id: 'lifts', label: 'Lifts' },
    { id: 'bests', label: 'Bests' },
    { id: 'stuck', label: stuck.length > 0 ? `Stuck · ${stuck.length}` : 'Stuck' },
  ];

  const empty = (text: string) => <p className="py-2 text-[11px] text-o1-muted leading-relaxed">{text}</p>;

  return (
    <div className={embedded ? 'pt-2.5 border-t border-white/[0.05] space-y-2' : 'rounded-2xl bg-o1-card border border-white/[0.07] p-3 space-y-2.5'}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setExpanded((open) => !open);
        }}
        className="w-full min-h-[44px] flex items-center gap-2 text-left bg-transparent border-0 p-0"
      >
        {!embedded && (
          <span className="o1-mark text-o1-gold">
            <Trophy />
          </span>
        )}
        <span className={embedded ? 'text-[12px] font-semibold text-o1-muted' : 'text-sm font-semibold text-white'}>
          {embedded ? 'All-time lift history' : 'Lift history'}
        </span>
        {loading && <span className="text-[10px] text-o1-muted">Loading…</span>}
        <span className="ml-auto text-o1-muted shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setView(tab.id);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold ${view === tab.id ? PILL_ON : PILL_OFF}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {expanded && view === 'lifts' && (
        lifts.length === 0
          ? empty('No lifts logged yet')
          : (
            <ul className="divide-y divide-white/[0.05]">
              {lifts.map((lift) => {
                const trend = TREND[lift.trend];
                const open = openLift === lift.name;
                return (
                  <li key={lift.name}>
                    <button
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setOpenLift(open ? null : lift.name);
                      }}
                      className="w-full min-h-[44px] py-2 flex items-center gap-2 text-left bg-transparent border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white truncate">{lift.name}</div>
                        <div className="text-[11px] text-o1-muted truncate">
                          Last {kg(lift.lastWeightKg)} × {lift.lastReps} · {shortDay(lift.lastDay)}
                        </div>
                      </div>
                      {lift.sessions >= 2 && (
                        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${trend.cls}`}>
                          {simple ? trend.simple : trend.pro}
                        </span>
                      )}
                      {open ? <ChevronUp className="w-4 h-4 text-o1-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-o1-muted shrink-0" />}
                    </button>
                    {open && (
                      <div className="pb-3 space-y-2">
                        {lift.series.length > 1 && <ProgressChart lift={lift} stroke={trend.stroke} />}
                        <p className="text-[11px] text-o1-muted">
                          {estLabel} {kg(lift.currentE1rm)} now · best {kg(lift.bestE1rm)} · {lift.sessions} session{lift.sessions === 1 ? '' : 's'}
                        </p>
                        <ul className="space-y-1">
                          {[...lift.series].reverse().slice(0, 6).map((s) => (
                            <li key={s.day} className="flex items-center justify-between text-[12px]">
                              <span className="text-o1-muted">{shortDay(s.day)}</span>
                              <span className="text-o1-text">
                                {kg(s.weightKg)} × {s.reps}
                                {!simple && <span className="text-o1-muted"> · {kg(s.e1rm)}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )
      )}

      {expanded && view === 'bests' && (
        bests.length === 0
          ? empty('Your best set on every lift shows here once you log one.')
          : (
            <ul className="divide-y divide-white/[0.05]">
              {bests.map((lift) => (
                <li key={lift.name} className="min-h-[44px] py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white truncate">{lift.name}</div>
                    <div className="text-[11px] text-o1-muted">{shortDay(lift.bestDay)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-semibold text-white">{kg(lift.bestWeightKg)} × {lift.bestReps}</div>
                    {!simple && <div className="text-[10px] text-o1-muted">{estLabel} {kg(lift.bestE1rm)}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )
      )}

      {expanded && view === 'stuck' && (
        stuck.length === 0
          ? empty(
              lifts.some((l) => l.sessions >= 3)
                ? 'Nothing stuck. Every lift is going up or holding.'
                : 'We need 3 sessions of a lift within 6 weeks before we can tell if it is stuck.',
            )
          : (
            <ul className="space-y-2">
              {stuck.map((lift) => {
                const advice = stuckAdvice(lift, simple);
                return (
                  <li key={lift.name} className="rounded-xl bg-o1-well border border-white/[0.07] px-3 py-2 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-white truncate">{lift.name}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${TREND[lift.trend].cls}`}>
                        {simple ? TREND[lift.trend].simple : TREND[lift.trend].pro}
                      </span>
                    </div>
                    <p className="text-[12px] text-o1-text">{advice.headline}</p>
                    <p className="text-[11px] text-o1-muted leading-relaxed">{advice.tip}</p>
                  </li>
                );
              })}
            </ul>
          )
      )}
    </div>
  );
};

export default LiftHistoryCard;
