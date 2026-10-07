import React from 'react';
import { DialComponentProps } from './dialTypes';
import {
  CRIMSON,
  CX,
  CY,
  HAIR,
  HAIR_SOFT,
  SKY,
  VIEW,
  fmtInt,
  fmtKm,
  heroShadow,
  pct,
  progressArc,
} from './luxuryDialShared';

function HairRing({ r, percent, color }: { r: number; percent: number; color: string }) {
  const full = percent >= 99.2;
  const arc = full ? null : progressArc(r, percent);
  return (
    <>
      <circle cx={CX} cy={CY} r={r} stroke={HAIR_SOFT} strokeWidth="1" fill="none" />
      {full && <circle cx={CX} cy={CY} r={r} stroke={color} strokeWidth="1.35" fill="none" />}
      {arc && (
        <path d={arc} stroke={color} strokeWidth="1.35" strokeLinecap="round" fill="none" />
      )}
    </>
  );
}

function CenterStack({
  steps,
  caption,
}: {
  steps: number;
  caption: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
      <span
        className="text-[46px] leading-none font-semibold tracking-tight text-white tabular-nums"
        style={heroShadow}
      >
        {fmtInt(steps)}
      </span>
      <span className="mt-1.5 text-[9px] font-medium tracking-[0.28em] uppercase text-white/55">
        {caption}
      </span>
    </div>
  );
}

function FooterTrio({
  burn,
  intake,
  km,
}: {
  burn: number;
  intake: number;
  km: number;
}) {
  return (
    <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4 text-[9px] font-medium tracking-[0.16em] uppercase">
      <span className="text-white/80">
        <span className="text-o1-crimson">{fmtInt(burn)}</span> kcal
      </span>
      <span className="text-white/25">·</span>
      <span className="text-white/80">
        <span className="text-[#d97706]">{fmtInt(intake)}</span> in
      </span>
      <span className="text-white/25">·</span>
      <span className="text-white/80">
        <span className="text-[#0284c7]">{fmtKm(km)}</span> km
      </span>
    </div>
  );
}

export function LuxuryDialCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[240px] h-[240px] mx-auto select-none pointer-events-none bg-transparent">
      {children}
    </div>
  );
}

export function LuxuryConcentricFace({
  steps,
  stepTarget,
  burnKcal,
  goalMove,
  distKm,
  goalDist,
  intakeKcal,
  caption,
  accent = CRIMSON,
  ticks = 12,
}: DialComponentProps & { caption: string; accent?: string; ticks?: number }) {
  const stepPct = pct(steps, stepTarget);
  const burnPct = pct(burnKcal, goalMove);
  const distPct = pct(distKm, goalDist);
  const tickLen = ticks === 12 ? 7 : 5;

  return (
    <LuxuryDialCanvas>
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none">
        <HairRing r={104} percent={stepPct} color={accent} />
        <HairRing r={92} percent={burnPct} color={CRIMSON} />
        <HairRing r={80} percent={distPct} color={SKY} />
        {Array.from({ length: ticks }).map((_, i) => {
          const deg = (360 / ticks) * i;
          const major = ticks === 12 || i % 5 === 0;
          return (
            <line
              key={i}
              x1={CX}
              y1={CY - 104}
              x2={CX}
              y2={CY - 104 + (major ? tickLen : 3.5)}
              stroke={major ? HAIR : HAIR_SOFT}
              strokeWidth={major ? 1.1 : 0.7}
              transform={`rotate(${deg} ${CX} ${CY})`}
            />
          );
        })}
      </svg>
      <CenterStack steps={steps} caption={caption} />
      <FooterTrio burn={burnKcal} intake={intakeKcal} km={distKm} />
    </LuxuryDialCanvas>
  );
}

export { HairRing, CenterStack, FooterTrio };
