import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useModalStore } from '../../../../components/modals/useModalStore';
import { ExploreCoach } from '../../../reels/reelTypes';
import { nextReelCover, reelCover } from '../../../reels/coverPresets';
import { CoachDirectMessageModal } from '../../../reels/components/CoachDirectMessageModal';
import { priceLabel } from '../../../reels/components/profile/CoachProgramsTab';
import { PROGRAMS_EVENT, ProgramCoach } from '../../../reels/services/coachStorefront';
import { BrowseProgram, EnrolledProgram, fetchBrowsePrograms, fetchMyPrograms, setProgramStatus } from '../../services/myPrograms';
import { ProgramReaderSheet } from './ProgramReaderSheet';

function Cover({ id, url, className }: { id: string; url: string; className: string }) {
  return (
    <img
      src={reelCover(id, url)}
      alt=""
      className={className}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.cover === '1') return;
        img.dataset.cover = '1';
        img.src = nextReelCover(img.src);
      }}
    />
  );
}

function asExploreCoach(coach: ProgramCoach): ExploreCoach {
  return {
    id: coach.id,
    name: coach.name,
    handle: coach.handle,
    avatar: coach.avatar,
    verified: false,
    specialtyTitle: '',
    rating: 0,
    reviewCount: 0,
    certificationPill: '',
    rate: '',
    slotsRemaining: 0,
    bio: '',
    disciplines: [],
  };
}

function meta(program: { weeks: string; daysPerWeek: number | null }): string {
  return [program.weeks, program.daysPerWeek ? `${program.daysPerWeek} days/wk` : ''].filter(Boolean).join(' · ');
}

export const AthleteProgramsPanel: React.FC = () => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const [mine, setMine] = useState<EnrolledProgram[] | null>(null);
  const [browse, setBrowse] = useState<BrowseProgram[] | null>(null);
  const [discipline, setDiscipline] = useState('All');
  const [readingId, setReadingId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messageCoach, setMessageCoach] = useState<ExploreCoach | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const loadMine = useCallback(() => {
    void fetchMyPrograms().then(setMine).catch(() => setMine(null));
  }, []);

  useEffect(() => {
    loadMine();
    void fetchBrowsePrograms().then(setBrowse).catch(() => setBrowse([]));
    window.addEventListener(PROGRAMS_EVENT, loadMine);
    return () => window.removeEventListener(PROGRAMS_EVENT, loadMine);
  }, [loadMine]);

  const active = useMemo(() => (mine ?? []).filter((p) => p.status === 'active'), [mine]);
  const past = useMemo(() => (mine ?? []).filter((p) => p.status === 'closed'), [mine]);
  const enrolledIds = useMemo(() => new Set(active.map((p) => p.id)), [active]);
  const disciplines = useMemo(
    () => ['All', ...[...new Set((browse ?? []).map((p) => p.discipline).filter(Boolean))].sort()],
    [browse],
  );
  const shown = useMemo(
    () => (browse ?? []).filter((p) => discipline === 'All' || p.discipline === discipline),
    [browse, discipline],
  );

  const reading = (mine ?? []).find((p) => p.id === readingId) || null;
  const readingLabel = reading
    ? reading.status === 'active'
      ? `Program ${active.findIndex((p) => p.id === reading.id) + 1}`
      : 'Past program'
    : '';

  const openCoach = (coachId: string, tab: 'reels' | 'programs') => {
    openFullEliteReels({ initialMode: 'grid', initialCoachId: coachId, initialProfileTab: tab });
  };

  const changeStatus = async (program: EnrolledProgram, status: 'active' | 'closed') => {
    setBusy(true);
    const ok = await setProgramStatus(program.id, status);
    setBusy(false);
    if (!ok) {
      flash('Could not update the program');
      return;
    }
    tactileEngine.triggerSelectionBuzz();
    flash(status === 'closed' ? 'Moved to Past programs' : 'Program restarted');
    if (status === 'closed') setReadingId(null);
  };

  return (
    <section className="space-y-4" aria-label="Programs">
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-semibold text-[#EAE8DF]">My programs</p>
          {active.map((program, index) => (
            <button
              key={program.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setReadingId(program.id);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-2.5 text-left active:scale-[0.99]"
              aria-label={`Open program ${index + 1}, ${program.title}`}
            >
              <Cover id={program.id} url={program.coverUrl} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#8A887F]">Program {index + 1}</span>
                <span className="block truncate text-[14px] font-semibold text-[#EAE8DF]">{program.title}</span>
                <span className="block truncate text-[12px] text-[#8A887F]">
                  {[program.coach.name, meta(program)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#8A887F]" />
            </button>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex min-h-[44px] w-full items-center justify-between px-1 text-[13px] font-semibold text-[#8A887F]"
            aria-expanded={showPast}
          >
            Past programs ({past.length})
            <ChevronDown size={16} className={`transition-transform ${showPast ? 'rotate-180' : ''}`} />
          </button>
          {showPast &&
            past.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => setReadingId(program.id)}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-2.5 text-left opacity-80"
              >
                <Cover id={program.id} url={program.coverUrl} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#EAE8DF]">{program.title}</span>
                  <span className="block truncate text-[12px] text-[#8A887F]">{program.coach.name}</span>
                </span>
              </button>
            ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="px-1 text-[13px] font-semibold text-[#EAE8DF]">Browse programs</p>
        {disciplines.length > 2 && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {disciplines.map((name) => {
              const on = name === discipline;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setDiscipline(name);
                  }}
                  aria-pressed={on}
                  className={`h-[36px] shrink-0 rounded-full border px-3.5 text-[12px] font-semibold ${
                    on ? 'border-white bg-white text-neutral-950' : 'border-[#1F1F1F] bg-[#0E0E0E] text-[#EAE8DF]'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
        {browse === null ? (
          <p className="px-1 py-4 text-[13px] text-[#8A887F]">Loading programs</p>
        ) : shown.length === 0 ? (
          <p className="px-1 py-4 text-[13px] text-[#8A887F]">No programs published yet.</p>
        ) : (
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {shown.map((program) => {
              const owned = enrolledIds.has(program.id);
              const price = priceLabel(program.priceCents);
              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    if (owned) setReadingId(program.id);
                    else openCoach(program.coach.id, 'programs');
                  }}
                  className="w-[168px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] text-left active:scale-[0.98]"
                  aria-label={`${program.title} by ${program.coach.name}`}
                >
                  <span className="relative block aspect-[4/5] w-full bg-black">
                    <Cover id={program.id} url={program.coverUrl} className="h-full w-full object-cover" />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    {owned ? (
                      <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-950">Enrolled</span>
                    ) : price ? (
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{price}</span>
                    ) : null}
                    <span className="absolute inset-x-2 bottom-2">
                      <span className="line-clamp-2 block text-[13px] font-semibold leading-tight text-white">{program.title}</span>
                      <span className="block truncate text-[11px] text-white/75">{program.coach.name}</span>
                    </span>
                  </span>
                  {meta(program) ? <span className="block truncate px-2 py-1.5 text-[11px] text-[#8A887F]">{meta(program)}</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ProgramReaderSheet
        program={reading}
        label={readingLabel}
        busy={busy}
        onClose={() => setReadingId(null)}
        onOpenCoach={(program) => {
          setReadingId(null);
          openCoach(program.coach.id, 'reels');
        }}
        onMessageCoach={(program) => setMessageCoach(asExploreCoach(program.coach))}
        onSetStatus={(program, status) => void changeStatus(program, status)}
      />
      <CoachDirectMessageModal coach={messageCoach} onClose={() => setMessageCoach(null)} />

      {toast && (
        <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-[70] mx-auto w-fit rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-neutral-950 shadow-xl">
          {toast}
        </div>
      )}
    </section>
  );
};
