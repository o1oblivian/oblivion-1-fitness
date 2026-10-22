import React, { useMemo, useState } from 'react';
import type { MuscleId, MuscleVolume, VolumeStatus } from '../types';

type View = 'front' | 'back';

interface Region {
  key: string;
  muscle: MuscleId;
  /** Absolute coordinates for the viewer-left half; mirrored across x=100. */
  d: string;
}

const SILHOUETTE =
  'M100 56 L93 56 Q84 60 70 65 Q56 70 53 86 Q51 104 50 120 Q47 134 46 142 Q40 166 37 192 L35 212 Q32 224 34 234 Q40 240 44 234 L46 214 Q50 192 55 172 Q58 156 59 144 Q62 124 66 106 Q68 124 69 142 Q71 164 72 182 Q70 196 68 208 Q64 232 66 256 Q68 280 72 300 Q68 318 68 334 Q70 360 77 388 Q72 398 74 404 L92 404 Q93 396 90 388 Q93 360 93 334 Q93 316 92 300 Q95 276 96 252 Q98 236 100 222 Z';

const SHOULDER = 'M72 65 Q58 68 54 82 Q52 94 56 104 Q62 94 70 87 Q77 78 81 68 Z';
const FOREARM = 'M50 146 Q43 168 40 196 L46 208 Q51 186 56 170 Q59 156 58 145 Z';

const FRONT: Region[] = [
  { key: 'f-traps', muscle: 'upperBack', d: 'M93 54 Q85 60 74 64 L88 65 Q93 61 95 56 Z' },
  { key: 'f-delts', muscle: 'shoulders', d: SHOULDER },
  {
    key: 'f-chest',
    muscle: 'chest',
    d: 'M98 68 L83 68 Q73 76 69 90 Q71 104 82 108 Q92 110 98 106 Z',
  },
  {
    key: 'f-biceps',
    muscle: 'biceps',
    d: 'M57 106 Q53 118 53 132 Q54 140 58 141 Q64 128 66 111 Q63 103 57 106 Z',
  },
  { key: 'f-forearms', muscle: 'forearms', d: FOREARM },
  { key: 'f-abs', muscle: 'core', d: 'M98 112 L87 113 Q85 140 87 168 Q90 192 98 198 Z' },
  {
    key: 'f-obliques',
    muscle: 'core',
    d: 'M85 113 Q74 117 71 136 Q72 162 77 184 Q83 190 88 193 Q83 168 83 140 Z',
  },
  {
    key: 'f-quads',
    muscle: 'quads',
    d: 'M96 214 Q82 210 74 220 Q68 248 70 278 Q74 296 84 300 Q92 294 94 276 Q97 244 96 214 Z',
  },
  {
    key: 'f-shin',
    muscle: 'calves',
    d: 'M74 312 Q70 336 74 364 Q78 382 82 386 Q82 356 84 330 Q82 315 74 312 Z',
  },
  { key: 'f-calf', muscle: 'calves', d: 'M86 313 Q92 330 90 358 Q88 378 84 386 Q84 350 86 313 Z' },
];

const BACK: Region[] = [
  {
    key: 'b-traps',
    muscle: 'upperBack',
    d: 'M100 50 L94 52 Q86 60 73 64 Q84 72 91 88 Q97 98 100 104 Z',
  },
  { key: 'b-delts', muscle: 'shoulders', d: SHOULDER },
  {
    key: 'b-lats',
    muscle: 'upperBack',
    d: 'M88 93 Q78 87 69 93 Q67 118 72 146 Q84 162 98 170 L98 118 Q92 108 88 93 Z',
  },
  {
    key: 'b-triceps',
    muscle: 'triceps',
    d: 'M56 104 Q50 117 50 134 Q52 142 58 143 Q66 127 68 109 Q64 100 56 104 Z',
  },
  { key: 'b-forearms', muscle: 'forearms', d: FOREARM },
  { key: 'b-lowerBack', muscle: 'lowerBack', d: 'M98 174 Q86 168 78 177 Q78 192 84 202 L98 204 Z' },
  {
    key: 'b-glutes',
    muscle: 'glutes',
    d: 'M98 207 Q82 203 72 213 Q66 231 74 246 Q86 254 98 248 Z',
  },
  {
    key: 'b-hamstrings',
    muscle: 'hamstrings',
    d: 'M96 255 Q82 254 74 259 Q68 279 72 300 Q80 308 88 304 Q94 284 96 255 Z',
  },
  {
    key: 'b-calf-outer',
    muscle: 'calves',
    d: 'M75 312 Q67 330 70 352 Q76 364 83 360 Q85 336 83 314 Z',
  },
  {
    key: 'b-calf-inner',
    muscle: 'calves',
    d: 'M86 314 Q94 330 92 352 Q88 364 84 360 Q86 336 86 314 Z',
  },
];

const STATUS_FILL: Record<VolumeStatus, string> = {
  none: '#1f1f23',
  under: '#f7c600',
  optimal: '#10b981',
  over: '#C4121A',
};

const STATUS_LABEL: Record<VolumeStatus, string> = {
  none: 'Not trained',
  under: 'Under-trained',
  optimal: 'Optimal',
  over: 'Over-reaching',
};

const LEGEND_LABEL: Record<VolumeStatus, string> = {
  none: 'Rest',
  under: 'Under',
  optimal: 'Optimal',
  over: 'Over',
};

const STATUS_TEXT: Record<VolumeStatus, string> = {
  none: 'text-o1-muted border-white/[0.1]',
  under: 'text-o1-amber border-o1-amber-deep/40',
  optimal: 'text-o1-emerald border-o1-emerald/40',
  over: 'text-[#e5484d] border-o1-crimson/50',
};

const fmtSets = (v: number) => (v > 0 ? String(Math.round(v * 10) / 10) : '—');

interface MuscleMapProps {
  muscles: MuscleVolume[];
}

export const MuscleMap: React.FC<MuscleMapProps> = ({ muscles }) => {
  const [view, setView] = useState<View>('front');
  const [selected, setSelected] = useState<MuscleId>('chest');
  const byId = useMemo(() => new Map(muscles.map((m) => [m.id, m])), [muscles]);
  const regions = view === 'front' ? FRONT : BACK;
  const current = byId.get(selected) ?? muscles[0];

  const renderRegion = (r: Region, mirrored: boolean) => {
    const m = byId.get(r.muscle);
    const status = m?.status ?? 'none';
    const isSelected = r.muscle === selected;
    return (
      <path
        key={`${r.key}-${mirrored ? 'r' : 'l'}`}
        d={r.d}
        fill={STATUS_FILL[status]}
        fillOpacity={status === 'none' ? 1 : isSelected ? 0.95 : 0.72}
        stroke={isSelected ? '#EAE8DF' : 'rgba(255,255,255,0.1)'}
        strokeWidth={isSelected ? 1.4 : 0.6}
        strokeLinejoin="round"
        role="button"
        tabIndex={mirrored ? -1 : 0}
        aria-label={`${m?.label ?? r.muscle}: ${STATUS_LABEL[status].toLowerCase()}`}
        className="cursor-pointer outline-none transition-[fill-opacity,stroke] duration-150"
        onClick={() => setSelected(r.muscle)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelected(r.muscle);
          }
        }}
      />
    );
  };

  const rangeMax = current ? Math.max(current.max * 1.5, current.sets * 1.1, 1) : 1;
  const pct = (v: number) => `${Math.min(100, (v / rangeMax) * 100)}%`;
  const weeklyPeak = current ? Math.max(...current.weekly, current.max, 1) : 1;

  return (
    <section className="w-full rounded-2xl bg-o1-canvas border border-white/[0.07] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-o1-body font-bold text-o1-text">Muscle Map</h3>
          <p className="text-o1-label text-o1-muted mt-0.5">Hard sets, last 7 days</p>
        </div>
        <div
          className="flex p-0.5 rounded-full bg-o1-sheet border border-white/[0.07]"
          role="tablist"
          aria-label="Body view"
        >
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`h-10 px-4 rounded-full text-o1-caption font-semibold capitalize transition-colors ${
                view === v
                  ? 'bg-white/[0.1] text-o1-text border border-white/[0.12]'
                  : 'text-o1-muted border border-transparent'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox="0 0 200 410"
        className="w-full max-h-[360px] mx-auto select-none"
        aria-label={`${view} muscle map`}
      >
        <ellipse
          cx="100"
          cy="30"
          rx="14"
          ry="17"
          fill="#111113"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.8"
        />
        <path d="M93 44 L107 44 L108 58 L92 58 Z" fill="#111113" />
        {[false, true].map((mirrored) => (
          <g
            key={mirrored ? 'r' : 'l'}
            transform={mirrored ? 'translate(200 0) scale(-1 1)' : undefined}
          >
            <path d={SILHOUETTE} fill="#111113" stroke="none" />
            <path
              d={SILHOUETTE.replace(/\s*Z$/, '')}
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            {regions.map((r) => renderRegion(r, mirrored))}
            {view === 'front' &&
              [134, 154, 174].map((y) => (
                <line
                  key={y}
                  x1="88"
                  y1={y}
                  x2="98"
                  y2={y}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="1"
                  pointerEvents="none"
                />
              ))}
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-between text-o1-label text-o1-muted">
        {(['none', 'under', 'optimal', 'over'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm border border-white/10"
              style={{ background: STATUS_FILL[s] }}
            />
            {LEGEND_LABEL[s]}
          </span>
        ))}
      </div>

      {current && (
        <div className="rounded-xl bg-o1-surface border border-white/[0.07] p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-o1-text">{current.label}</div>
              <div className="text-o1-label text-o1-muted">
                {current.lastTrainedDaysAgo === null
                  ? 'No sets in 28 days'
                  : current.lastTrainedDaysAgo === 0
                    ? 'Trained today'
                    : `Last trained ${current.lastTrainedDaysAgo}d ago`}
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full border text-o1-label font-semibold ${STATUS_TEXT[current.status]}`}
            >
              {STATUS_LABEL[current.status]}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-black text-o1-text">
                {fmtSets(current.sets)}
                <span className="ml-1 text-o1-label font-sans font-medium text-o1-muted">
                  sets this week
                </span>
              </span>
              <span className="text-o1-label text-o1-muted">
                target {current.min}–{current.max} / wk
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="absolute inset-y-0 bg-o1-emerald/20"
                style={{
                  left: pct(current.min),
                  width: `calc(${pct(current.max)} - ${pct(current.min)})`,
                }}
              />
              {current.sets > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: pct(current.sets), background: STATUS_FILL[current.status] }}
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-o1-label text-o1-muted">4-week trend</span>
            <div className="flex items-end gap-1.5 h-10">
              {current.weekly.map((v, i) => (
                <div key={i} className="flex-1 flex items-end h-full">
                  <div
                    className={`w-full rounded-sm ${i === current.weekly.length - 1 ? 'bg-o1-text' : 'bg-white/25'}`}
                    style={{
                      height: v > 0 ? `${Math.max(8, (v / weeklyPeak) * 100)}%` : '2px',
                      opacity: v > 0 ? 1 : 0.4,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 text-o1-label font-mono text-o1-muted">
              {current.weekly.map((v, i) => (
                <span key={i} className="flex-1 text-center">
                  {fmtSets(v)}
                </span>
              ))}
            </div>
          </div>

          {current.topExercises.length > 0 && (
            <ul className="space-y-1 pt-0.5">
              {current.topExercises.map((ex) => (
                <li key={ex.name} className="flex items-center justify-between text-xs">
                  <span className="text-o1-text/85 truncate pr-3">{ex.name}</span>
                  <span className="font-mono text-o1-muted shrink-0">{ex.sets} sets</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
