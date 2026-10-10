import React, { useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { nextReelCover, reelCover } from '../../coverPresets';
import { StorefrontProgram } from '../../services/coachStorefront';

interface CoachProgramsTabProps {
  programs: StorefrontProgram[] | null;
  enrolledIds: Set<string>;
  onEnroll: (program: StorefrontProgram) => void;
  onApply: (program: StorefrontProgram) => void;
}

export function priceLabel(cents: number | null): string {
  if (cents == null) return '';
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export const CoachProgramsTab: React.FC<CoachProgramsTabProps> = ({ programs, enrolledIds, onEnroll, onApply }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (programs === null) {
    return <p className="py-10 text-center text-[13px] text-[#8A887F]">Loading programs</p>;
  }
  if (programs.length === 0) {
    return <p className="py-10 text-center text-[13px] text-[#8A887F]">No programs published yet.</p>;
  }

  return (
    <div className="space-y-3 pt-3">
      {programs.map((program) => {
        const open = openId === program.id;
        const meta = [program.discipline, program.weeks, program.daysPerWeek ? `${program.daysPerWeek} days/wk` : '', program.level].filter(Boolean).join(' · ');
        const price = priceLabel(program.priceCents);
        const free = program.priceCents === 0;
        const enrolled = enrolledIds.has(program.id);
        return (
          <div key={program.id} className="overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E]">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setOpenId(open ? null : program.id);
              }}
              className="block w-full text-left active:scale-[0.99]"
            >
              <div className="relative aspect-[16/9] w-full bg-black">
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
                    <p className="truncate text-[15px] font-semibold text-[#EAE8DF]">{program.title}</p>
                    {meta ? <p className="truncate text-[12px] text-[#EAE8DF]/80">{meta}</p> : null}
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
                {program.description ? <p className="text-[13px] leading-relaxed text-[#EAE8DF]">{program.description}</p> : null}
                {program.weekOne.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-[#8A887F]">Week 1</p>
                    {program.weekOne.map((day, index) => (
                      <p key={`${program.id}-${index}`} className="text-[13px] text-[#EAE8DF]">
                        <span className="text-[#8A887F]">Day {index + 1}</span> · {day}
                      </p>
                    ))}
                  </div>
                )}
                {enrolled ? (
                  <p className="flex h-[44px] items-center justify-center rounded-full border border-[#1F1F1F] text-[13px] font-semibold text-[#8A887F]">
                    In My programs on your Coach tab
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerImpactPulse();
                      if (free) onEnroll(program);
                      else onApply(program);
                    }}
                    className="h-[44px] w-full rounded-full bg-[#C4121A] text-[13px] font-semibold text-white active:scale-[0.98]"
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
