import React from 'react';
import { Trophy } from 'lucide-react';
import type { LiftProgress, LiftTrend, PersonalBest } from '../types';

interface StrengthPanelProps {
  lifts: LiftProgress[];
  personalBests: PersonalBest[];
}

const TREND_STYLE: Record<LiftTrend, { label: string; cls: string; stroke: string }> = {
  rising: { label: 'RISING', cls: 'text-o1-ok border-o1-ok/30', stroke: '#4F8F9A' },
  steady: { label: 'STEADY', cls: 'text-neutral-300 border-white/[0.12]', stroke: '#a3a3a3' },
  plateau: { label: 'PLATEAU', cls: 'text-amber-500 border-amber-500/30', stroke: '#d97706' },
  declining: { label: 'DECLINING', cls: 'text-red-500 border-red-500/30', stroke: '#C4121A' },
};

const Sparkline: React.FC<{ series: LiftProgress['series']; stroke: string }> = ({ series, stroke }) => {
  const W = 84;
  const H = 28;
  if (series.length < 2) return <svg width={W} height={H} aria-hidden="true" />;
  const values = series.map((p) => p.e1rm);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * (W - 6) + 3;
    const y = H - 4 - ((p.e1rm - lo) / span) * (H - 8);
    return [x, y] as const;
  });
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polyline
        points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={stroke} />
    </svg>
  );
};

const shortDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const StrengthPanel: React.FC<StrengthPanelProps> = ({ lifts, personalBests }) => (
  <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-4">
    <div>
      <h3 className="text-[10px] font-mono font-bold tracking-[0.18em] text-neutral-400">
        Strength &amp; Progression
      </h3>
      <p className="text-[11px] text-neutral-500 mt-0.5">Estimated 1RM (Epley), best set per session</p>
    </div>

    {lifts.length === 0 ? (
      <p className="text-xs text-neutral-500 leading-relaxed py-2">
        Log at least two sessions of a lift (1–12 reps with load) and its estimated 1RM curve, PBs and plateau
        detection appear here.
      </p>
    ) : (
      <ul className="divide-y divide-white/[0.05]">
        {lifts.map((lift) => {
          const style = TREND_STYLE[lift.trend];
          return (
            <li key={lift.name} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3 min-h-[56px]">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{lift.name}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold tracking-wider ${style.cls}`}>
                    {style.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
                  <span>
                    e1RM <span className="text-neutral-200 font-bold">{lift.currentE1rm}</span> kg
                  </span>
                  <span>
                    vs prior 4w{' '}
                    <span
                      className={
                        lift.changePct === null
                          ? 'text-neutral-500'
                          : lift.changePct >= 0
                            ? 'text-o1-ok'
                            : 'text-red-500'
                      }
                    >
                      {lift.changePct === null ? '--' : `${lift.changePct > 0 ? '+' : ''}${lift.changePct}%`}
                    </span>
                  </span>
                </div>
                <div className="text-[10px] font-mono text-neutral-600">
                  Best {lift.bestE1rm} kg · {shortDay(lift.bestDay)} · {lift.sessions} sessions
                </div>
              </div>
              <Sparkline series={lift.series} stroke={style.stroke} />
            </li>
          );
        })}
      </ul>
    )}

    <div className="space-y-2 pt-1 border-t border-white/[0.05]">
      <h4 className="pt-3 text-[10px] font-mono font-bold tracking-[0.18em] text-neutral-400 flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5 text-o1-crimson" />
        Personal bests · 60 days
      </h4>
      {personalBests.length === 0 ? (
        <p className="text-xs text-neutral-500">No new PBs yet. Beat a previous best e1RM and it lands here.</p>
      ) : (
        <ul className="space-y-1.5">
          {personalBests.map((pb) => (
            <li key={`${pb.exercise}-${pb.day}`} className="flex items-center justify-between gap-3 min-h-[36px] text-xs">
              <div className="min-w-0">
                <div className="text-neutral-200 font-semibold truncate">{pb.exercise}</div>
                <div className="text-[10px] font-mono text-neutral-500">
                  {pb.weightKg} kg × {pb.reps} · {shortDay(pb.day)}
                </div>
              </div>
              <span className="font-mono font-black text-white shrink-0">{pb.e1rm} kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

export default StrengthPanel;
