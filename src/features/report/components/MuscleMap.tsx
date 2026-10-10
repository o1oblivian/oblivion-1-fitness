import React, { useMemo, useState } from 'react';
import type { MuscleId, MuscleVolume, VolumeStatus } from '../types';

type View = 'front' | 'back';

interface Region {
  muscle: MuscleId;
  d: string;
  /** Regions are authored for the viewer-left half and mirrored across x=100. */
  key: string;
}

const SHOULDER = 'M76 68 c62 68 50 74 46 90 c44 100 46 110 50 118 l64 112 c64 98 68 84 80 76 z';
const UPPER_ARM = 'M50 118 c46 134 46 152 48 166 l62 164 c64 150 64 132 64 112 z';
const FOREARM = 'M48 170 c44 190 42 210 42 228 l54 232 c58 214 60 192 62 168 z';

const FRONT: Region[] = [
  { key: 'f-shoulders', muscle: 'shoulders', d: SHOULDER },
  { key: 'f-chest', muscle: 'chest', d: 'M98 72 l98 118 c90 124 76 122 66 112 c64 98 70 84 80 76 c86 72 92 71 98 72 z' },
  { key: 'f-biceps', muscle: 'biceps', d: UPPER_ARM },
  { key: 'f-forearms', muscle: 'forearms', d: FOREARM },
  { key: 'f-core', muscle: 'core', d: 'M98 122 l98 206 c90 210 80 206 76 198 c74 170 76 140 82 126 c88 123 94 122 98 122 z' },
  { key: 'f-quads', muscle: 'quads', d: 'M98 214 l98 300 c90 316 76 316 70 300 c66 270 68 238 76 220 c84 212 92 212 98 214 z' },
  { key: 'f-calves', muscle: 'calves', d: 'M72 312 c68 340 68 364 72 384 l86 384 c90 364 92 340 92 312 c86 318 78 318 72 312 z' },
];

const BACK: Region[] = [
  { key: 'b-traps', muscle: 'upperBack', d: 'M98 58 c88 62 78 68 72 76 c76 86 86 96 98 104 z' },
  { key: 'b-shoulders', muscle: 'shoulders', d: SHOULDER },
  { key: 'b-upperBack', muscle: 'upperBack', d: 'M98 108 l98 160 c88 168 76 160 70 146 c66 130 66 112 72 98 c80 100 90 104 98 108 z' },
  { key: 'b-triceps', muscle: 'triceps', d: UPPER_ARM },
  { key: 'b-forearms', muscle: 'forearms', d: FOREARM },
  { key: 'b-lowerBack', muscle: 'lowerBack', d: 'M98 164 l98 204 c90 206 80 204 76 196 c74 184 76 172 80 166 c86 166 92 165 98 164 z' },
  { key: 'b-glutes', muscle: 'glutes', d: 'M98 208 l98 262 c88 270 74 266 70 250 c68 232 74 214 84 210 c90 208 94 207 98 208 z' },
  { key: 'b-hamstrings', muscle: 'hamstrings', d: 'M98 268 l98 318 c90 326 76 326 70 314 c66 296 68 280 74 270 c84 268 92 266 98 268 z' },
  { key: 'b-calves', muscle: 'calves', d: 'M72 326 c68 346 68 366 72 384 l88 384 c92 366 92 346 90 328 c84 332 78 332 72 326 z' },
];

const STATUS_FILL: Record<VolumeStatus, { fill: string; opacity: number }> = {
  none: { fill: '#18181b', opacity: 1 },
  under: { fill: '#d97706', opacity: 0.6 },
  optimal: { fill: '#4F8F9A', opacity: 0.8 },
  over: { fill: '#C4121A', opacity: 0.9 },
};

const STATUS_LABEL: Record<VolumeStatus, string> = {
  none: 'Not Trained',
  under: 'UNDER-TRAINED',
  optimal: 'OPTIMAL',
  over: 'OVER-REACHING',
};

const STATUS_TEXT: Record<VolumeStatus, string> = {
  none: 'text-neutral-400 border-white/[0.1]',
  under: 'text-amber-500 border-amber-500/30',
  optimal: 'text-o1-ok border-o1-ok/30',
  over: 'text-red-500 border-red-500/30',
};

interface MuscleMapProps {
  muscles: MuscleVolume[];
}

export const MuscleMap: React.FC<MuscleMapProps> = ({ muscles }) => {
  const [view, setView] = useState<View>('front');
  const [selected, setSelected] = useState<MuscleId>('chest');
  const byId = useMemo(() => new Map(muscles.map((m) => [m.id, m])), [muscles]);
  const regions = view === 'front' ? FRONT : BACK;
  const current = byId.get(selected) ?? muscles[0];

  const pick = (id: MuscleId) => setSelected(id);

  const renderRegion = (r: Region, mirrored: boolean) => {
    const m = byId.get(r.muscle);
    const status = m?.status ?? 'none';
    const paint = STATUS_FILL[status];
    const isSelected = r.muscle === selected;
    return (
      <path
        key={`${r.key}-${mirrored ? 'r' : 'l'}`}
        d={r.d}
        fill={paint.fill}
        fillOpacity={paint.opacity}
        stroke={isSelected ? '#fafafa' : '#2a2a2e'}
        strokeWidth={isSelected ? 1.6 : 0.8}
        strokeLinejoin="round"
        role="button"
        tabIndex={mirrored ? -1 : 0}
        aria-label={`${m?.label ?? r.muscle}: ${STATUS_LABEL[status].toLowerCase()}`}
        className="cursor-pointer outline-none transition-[fill-opacity,stroke] duration-150"
        onClick={() => pick(r.muscle)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pick(r.muscle);
          }
        }}
      />
    );
  };

  const rangeMax = current ? Math.max(current.max * 1.5, current.sets * 1.1, 1) : 1;
  const pct = (v: number) => `${Math.min(100, (v / rangeMax) * 100)}%`;
  const weeklyPeak = current ? Math.max(...current.weekly, current.max, 1) : 1;

  return (
    <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-mono font-bold tracking-[0.18em] text-neutral-400">Muscle Map</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">Hard sets, last 7 days</p>
        </div>
        <div className="flex p-0.5 rounded-full bg-[#161618] border border-white/[0.07]" role="tablist" aria-label="Body view">
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`h-8 px-4 rounded-full text-[10px] font-mono font-bold tracking-wider transition-colors ${
                view === v ? 'bg-white text-black' : 'text-neutral-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 200 400" className="w-full max-h-[340px] mx-auto select-none" aria-label={`${view} muscle map`}>
        <circle cx="100" cy="27" r="16" fill="#0c0c0e" stroke="#2a2a2e" strokeWidth="0.8" />
        <path d="M92 42 l92 60 l108 60 l108 42 z" fill="#0c0c0e" stroke="#2a2a2e" strokeWidth="0.8" />
        <ellipse cx="44" cy="244" rx="7" ry="11" fill="#0c0c0e" stroke="#2a2a2e" strokeWidth="0.8" />
        <ellipse cx="156" cy="244" rx="7" ry="11" fill="#0c0c0e" stroke="#2a2a2e" strokeWidth="0.8" />
        <ellipse cx="80" cy="392" rx="12" ry="5" fill="#0c0c0e" stroke="#2a2a2e" strokeWidth="0.8" />
        <ellipse cx="120" cy="392" rx="12" ry="5" fill="#0c0c0e" stroke="#2a2a2e" strokeWidth="0.8" />
        <g>{regions.map((r) => renderRegion(r, false))}</g>
        <g transform="translate(200 0) scale(-1 1)">{regions.map((r) => renderRegion(r, true))}</g>
      </svg>

      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-neutral-400">
        {(['none', 'under', 'optimal', 'over'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm border border-white/10"
              style={{ background: STATUS_FILL[s].fill, opacity: s === 'none' ? 1 : STATUS_FILL[s].opacity }}
            />
            {s === 'none' ? 'Rest' : s === 'under' ? 'Under' : s === 'optimal' ? 'Optimal' : 'Over'}
          </span>
        ))}
      </div>

      {current && (
        <div className="rounded-xl bg-[#111113] border border-white/[0.07] p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">{current.label}</div>
              <div className="text-[11px] text-neutral-500 font-mono">
                {current.lastTrainedDaysAgo === null
                  ? 'No sets in 28 days'
                  : current.lastTrainedDaysAgo === 0
                    ? 'Trained today'
                    : `Last trained ${current.lastTrainedDaysAgo}d ago`}
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold tracking-wider ${STATUS_TEXT[current.status]}`}>
              {STATUS_LABEL[current.status]}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xl font-black text-white">{current.sets}</span>
              <span className="text-[10px] text-neutral-500">
                target {current.min}–{current.max} sets / wk
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="absolute inset-y-0 bg-o1-ok/25"
                style={{ left: pct(current.min), width: `calc(${pct(current.max)} - ${pct(current.min)})` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: pct(current.sets), background: STATUS_FILL[current.status].fill === '#18181b' ? '#3f3f46' : STATUS_FILL[current.status].fill }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono tracking-wider text-neutral-500">4-week trend</span>
            <div className="flex items-end gap-1.5 h-10">
              {current.weekly.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <div
                    className={`w-full rounded-sm ${i === current.weekly.length - 1 ? 'bg-white' : 'bg-white/20'}`}
                    style={{ height: `${Math.max(v > 0 ? 8 : 2, (v / weeklyPeak) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 text-[9px] font-mono text-neutral-500">
              {current.weekly.map((v, i) => (
                <span key={i} className="flex-1 text-center">
                  {v}
                </span>
              ))}
            </div>
          </div>

          {current.topExercises.length > 0 && (
            <ul className="space-y-1 pt-0.5">
              {current.topExercises.map((ex) => (
                <li key={ex.name} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 truncate pr-3">{ex.name}</span>
                  <span className="font-mono text-neutral-500 shrink-0">{ex.sets} sets</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default MuscleMap;
