import React, { useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { nextReelCover, reelCover } from '../../coverPresets';
import { StorefrontProgram } from '../../services/coachStorefront';

interface CoachProgramsTabProps {
  programs: StorefrontProgram[] | null;
  enrolledIds?: ReadonlySet<string>;
  onEnroll?: (program: StorefrontProgram) => void;
  onApply?: (program: StorefrontProgram) => void;
  /** The coach viewing their own catalog: no enroll or apply actions. */
  isOwn?: boolean;
  onCreate?: () => void;
}

export function priceLabel(cents: number | null): string {
  if (cents == null) return '';
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

const NONE: ReadonlySet<string> = new Set();

export const CoachProgramsTab: React.FC<CoachProgramsTabProps> = ({ programs, enrolledIds = NONE, onEnroll, onApply, isOwn = false, onCreate }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const createButton = onCreate ? (
    <button
      type="button"
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onCreate();
      }}
      className="h-[44px] w-full rounded-xl border border-white/[0.07] bg-o1-surface text-[13px] font-semibold text-o1-text active:scale-[0.98]"
    >
      Create a program
    </button>
  ) : null;

  if (programs === null) {
    return <p className="py-10 text-center text-[13px] text-o1-muted">Loading programs</p>;
  }
  if (programs.length === 0) {
    return (
      <div className="space-y-3 py-6">
        <p className="text-center text-[13px] text-o1-muted">{isOwn ? 'You have not published a program yet.' : 'No programs published yet.'}</p>
        {createButton}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      {createButton}
      {programs.map((program) => {
        const open = openId === program.id;
        const meta = [program.discipline, program.weeks, program.daysPerWeek ? `${program.daysPerWeek} days/wk` : '', program.level].filter(Boolean).join(' · ');
        const price = priceLabel(program.priceCents);
        const free = program.priceCents === 0;
        const enrolled = enrolledIds.has(program.id);
        return (
          <div key={program.id} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-o1-surface">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setOpenId(open ? null : program.id);
              }}
              className="block w-full text-left active:scale-[0.99]"
            >
              <div className="relative aspect-[16/9] w-full bg-o1-canvas">
                <img
                  src={reelCover(program.id, program.coverUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.cover === '1') return;
                    img.dataset.cover = '1';
                    img.src = nextReelCover(img.src);
                  }}
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-o1-text">{program.title}</p>
                    {meta ? <p className="truncate text-[12px] text-white/80">{meta}</p> : null}
                  </div>
                  {enrolled ? (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-950">Enrolled</span>
                  ) : price ? (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-950">{price}</span>
                  ) : null}
                </div>
              </div>
            </button>
            {open && (
              <div className="space-y-3 p-3">
                {program.description ? <p className="text-[13px] leading-relaxed text-o1-text">{program.description}</p> : null}
                {program.weekOne.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-o1-muted">Week 1</p>
                    {program.weekOne.map((day, index) => (
                      <p key={`${program.id}-${index}`} className="text-[13px] text-o1-text">
                        <span className="text-o1-muted">Day {index + 1}</span> · {day}
                      </p>
                    ))}
                  </div>
                )}
                {isOwn ? (
                  <p className="text-center text-[12px] text-o1-muted">Athletes see this on your profile.</p>
                ) : enrolled ? (
                  <p className="flex h-[44px] items-center justify-center rounded-full border border-white/[0.07] text-[13px] font-semibold text-o1-muted">
                    In My programs on your Coach tab
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerImpactPulse();
                      if (free) onEnroll?.(program);
                      else onApply?.(program);
                    }}
                    className="h-[44px] w-full rounded-full bg-o1-crimson text-[13px] font-semibold text-white active:scale-[0.98]"
                  >
                    {free ? 'Enroll' : 'Apply for this program'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
