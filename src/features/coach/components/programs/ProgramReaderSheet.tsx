import React, { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { nextReelCover, reelCover } from '../../../reels/coverPresets';
import { EnrolledProgram } from '../../services/myPrograms';

interface ProgramReaderSheetProps {
  program: EnrolledProgram | null;
  label: string;
  busy: boolean;
  onClose: () => void;
  onOpenCoach: (program: EnrolledProgram) => void;
  onMessageCoach: (program: EnrolledProgram) => void;
  onSetStatus: (program: EnrolledProgram, status: 'active' | 'closed') => void;
}

function shortDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export const ProgramReaderSheet: React.FC<ProgramReaderSheetProps> = ({
  program,
  label,
  busy,
  onClose,
  onOpenCoach,
  onMessageCoach,
  onSetStatus,
}) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setConfirming(false), [program?.id, program?.status]);

  if (!program) return null;

  const facts = [
    ['Length', program.weeks],
    ['Days per week', program.daysPerWeek != null ? String(program.daysPerWeek) : ''],
    ['Level', program.level],
    ['Split', program.split],
    ['Equipment', program.equipment],
  ].filter(([, value]) => value);
  const enrolled = shortDate(program.enrolledAt);
  const closed = program.status === 'closed';

  return (
    <div role="dialog" aria-label={program.title} className="fixed inset-0 z-[60] flex flex-col bg-black text-[#EAE8DF] animate-in fade-in duration-200">
      <div className="flex h-14 shrink-0 items-center gap-1 px-1 pt-safe">
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center" aria-label="Back to my programs">
          <ArrowLeft size={20} />
        </button>
        <span className="truncate text-[14px] font-semibold">{label}</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto w-full max-w-xl">
          <div className="relative aspect-[16/9] w-full bg-[#0E0E0E]">
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
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-x-4 bottom-3">
              {program.discipline ? <p className="text-[12px] font-semibold text-[#EAE8DF]/80">{program.discipline}</p> : null}
              <h2 className="text-[20px] font-semibold leading-tight">{program.title}</h2>
            </div>
          </div>

          <div className="space-y-4 px-4 pt-3">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onOpenCoach(program);
              }}
              className="flex min-h-[44px] w-full items-center gap-3 text-left"
              aria-label={`Open ${program.coach.name}'s profile`}
            >
              {program.coach.avatar ? (
                <img src={program.coach.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F1F1F] text-[13px] font-semibold">
                  {(program.coach.name || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold">{program.coach.name}</span>
                <span className="block truncate text-[12px] text-[#8A887F]">
                  {closed ? `Closed ${shortDate(program.closedAt)}` : enrolled ? `Enrolled ${enrolled}` : 'Enrolled'}
                </span>
              </span>
            </button>

            {facts.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {facts.map(([name, value]) => (
                  <div key={name} className="rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] px-3 py-2">
                    <p className="text-[11px] text-[#8A887F]">{name}</p>
                    <p className="text-[13px] font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {program.description ? <p className="text-[14px] leading-relaxed">{program.description}</p> : null}

            {program.weekOne.length > 0 && (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[#8A887F]">Week 1</p>
                {program.weekOne.map((day, index) => (
                  <div key={`${program.id}-${index}`} className="rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] px-3 py-2.5">
                    <p className="text-[11px] text-[#8A887F]">Day {index + 1}</p>
                    <p className="text-[14px]">{day}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onMessageCoach(program);
              }}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] text-[13px] font-semibold"
            >
              <MessageCircle size={16} />
              Message {program.coach.name.split(' ')[0] || 'coach'}
            </button>

            {closed ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onSetStatus(program, 'active')}
                className="h-[44px] w-full rounded-xl bg-white text-[13px] font-semibold text-neutral-950 disabled:opacity-50"
              >
                Restart program
              </button>
            ) : confirming ? (
              <div className="space-y-2 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-3">
                <p className="text-[13px]">Close this program? It moves to Past programs and you can restart it anytime.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirming(false)} className="h-[44px] flex-1 rounded-xl border border-[#1F1F1F] text-[13px] font-semibold">
                    Keep it
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSetStatus(program, 'closed')}
                    className="h-[44px] flex-1 rounded-xl bg-[#C4121A] text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    Close program
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="h-[44px] w-full rounded-xl text-[13px] font-semibold text-[#8A887F]"
              >
                Close program
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
