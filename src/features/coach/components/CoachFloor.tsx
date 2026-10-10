import React, { useMemo, useState } from 'react';
import { Inbox, LayoutGrid, Plus, Radio, Users, Wallet } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useModalStore } from '../../../components/modals/useModalStore';
import { useReelsStore } from '../../../stores/useReelsStore';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { Athlete } from '../services/coachService';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { DirectiveItem } from '../types/coachDirectives';
import { uploadedFilms } from '../services/coachFilms';
import { coachPeople } from '../services/floorRoster';
import { reelCover, nextReelCover } from '../../reels/coverPresets';
import { DirectiveSignalsSection } from './DirectiveSignalsSection';
import { CoachInboxView } from './CoachInboxView';
import { CoachEarningsView } from './CoachEarningsView';
import { CoachEarnings } from '../../../types';

const CUES = [
  { title: 'Deload Next Session', summary: 'Next session is a deload. Same lifts, less load.' },
  { title: 'Add 5kg', summary: 'Add 5 kg on the next working sets.' },
  { title: 'Form Approved', summary: 'Form on the last session is approved.' },
];

type CreatorTab = 'films' | 'floor' | 'directives' | 'inbox' | 'earnings';

export interface CoachFloorProps {
  coachId: string;
  athletes: Athlete[];
  checkins: AthleteCheckInSubmission[];
  messageCount: number;
  notes: DirectiveItem[];
  earnings?: CoachEarnings;
  onSendNote: (draft: { tag: DirectiveItem['tag']; title: string; summary: string }) => void;
  onOpenPrograms: () => void;
  onOpenWorkout: () => void;
  onOpenVault: (addClip?: boolean) => void;
  onOpenMessages: () => void;
  onOpenEarnings: () => void;
  onOpenCheckins: () => void;
  onOpenSettings: () => void;
  onShareInvite: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onShowToast?: (msg: string) => void;
}

function kg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '--';
  return `${Math.round(value).toLocaleString()} kg`;
}

const BROKEN_REEL_IDS = new Set(['reel-tut-vitals', 'reel-tut-activelog']);

function inviteCount(): number {
  try {
    const book = JSON.parse(localStorage.getItem('o1_coach_invite_book') || '{}');
    const saved = book && typeof book === 'object' ? Object.keys(book).length : 0;
    if (saved > 0) return saved;
    return localStorage.getItem('o1_invite_code') ? 1 : 0;
  } catch {
    return 0;
  }
}

const REVIEW_KEY = 'o1_floor_reviews';

function FilmTile({ title, thumb, onOpen }: { title: string; thumb: string; onOpen: () => void }) {
  const [src, setSrc] = useState(reelCover(title, thumb));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-[4/5] overflow-hidden bg-[#0E0E0E] active:scale-[0.98]"
      aria-label={title}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setSrc(nextReelCover(src))}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
    </button>
  );
}

function readReviews(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function reviewTone(title: string): string {
  if (title === 'Form Approved') return 'bg-[#16301f] text-[#b7e0c2]';
  if (title === 'Deload Next Session') return 'bg-[#3a2a10] text-[#f0d7a2]';
  return 'bg-[#1c1c1c] text-[#EAE8DF]';
}

function reviewLabel(title: string): string {
  if (title === 'Form Approved') return '✓ Form Approved';
  if (title === 'Deload Next Session') return '⚡ Deload Assigned';
  if (title === 'Add 5kg') return '✓ Add 5kg';
  return title;
}

function profilePhoto(): string {
  try {
    return localStorage.getItem('o1_profile_avatar_url') || '';
  } catch {
    return '';
  }
}

export const CoachFloor: React.FC<CoachFloorProps> = ({
  coachId,
  athletes,
  checkins,
  notes,
  earnings = [],
  onSendNote,
  onOpenPrograms,
  onOpenWorkout,
  onOpenVault,
  onShareInvite,
  onSelectAthlete,
  onShowToast,
}) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const catalog = useReelsStore((s) => s.reels);
  const finishedWorkouts = useCoachStore((s) => s.finishedWorkouts);
  const bio = useBuddyProfileStore((s) => s.partnerBio);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<CreatorTab>('films');
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [photo, setPhoto] = useState(profilePhoto);
  const [reviews, setReviews] = useState<Record<string, string>>(readReviews);

  const { people, sample } = useMemo(() => coachPeople(athletes), [athletes]);
  const films = useMemo(() => {
    const own = uploadedFilms(coachId);
    const seen = new Set(own.map((film) => film.id));
    const library = catalog
      .filter((reel) => reel.thumbnail && !seen.has(reel.id) && !BROKEN_REEL_IDS.has(reel.id))
      .map((reel) => ({ id: reel.id, title: reel.title, thumb: reel.thumbnail }));
    return [...own, ...library].slice(0, 18);
  }, [catalog, coachId]);

  const trained = finishedWorkouts.filter(
    (log) => !String(log.id).startsWith('preview-') && !String(log.athleteId).startsWith('preview-'),
  );
  const pending = checkins.filter((row) => {
    if (String(row.id).startsWith('preview-') || String(row.athleteId).startsWith('preview-')) return false;
    const reply = row.coachFeedback?.feedbackText?.trim();
    return !reply || row.coachFeedback?.status === 'pending';
  });

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const email = profile?.email || user?.email || '';
  const metaName = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : '';
  const name = (profile?.name || metaName || (email.includes('@') ? email.split('@')[0] : '') || 'Coach').trim();
  const rawHandle = typeof meta.handle === 'string' ? meta.handle.trim() : '';
  const handle = email.toLowerCase() === 'o1oblivianfitness@gmail.com'
    ? '@o1oblivianfitness'
    : rawHandle
      ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
      : '';
  const invites = inviteCount();

  const openReel = (reelId?: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (reelId) openFullEliteReels({ initialMode: 'player', initialReelId: reelId });
    else openFullEliteReels('grid');
  };

  const sendCue = (cueItem: (typeof CUES)[number]) => {
    tactileEngine.triggerImpactPulse();
    const key = replyFor || '';
    const next = { ...reviews, ...(key ? { [key]: cueItem.title } : {}) };
    setReviews(next);
    try {
      localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    onSendNote({ tag: 'TRAINING', title: cueItem.title, summary: replyFor ? `${replyFor}: ${cueItem.summary}` : cueItem.summary });
    onShowToast?.(`${cueItem.title} saved`);
    setReplyFor(null);
  };

  const tabs: { id: CreatorTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'films', label: 'Films', icon: LayoutGrid },
    { id: 'floor', label: 'Floor', icon: Users },
    { id: 'directives', label: 'Directives', icon: Radio },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-4 px-1">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenVault(false);
              setPhoto(profilePhoto());
            }}
            className="flex h-[86px] w-[86px] items-center justify-center overflow-hidden rounded-full border border-[#1F1F1F] bg-[#0E0E0E] active:scale-[0.98]"
            aria-label="Profile photo"
          >
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-[#EAE8DF]">{name.slice(0, 1).toUpperCase()}</span>
            )}
          </button>
          <button
            type="button"
            aria-label="Add a clip"
            onClick={(event) => {
              event.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onOpenVault(true);
            }}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-950 active:scale-[0.98]"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold text-[#EAE8DF]">{name}</h2>
          {handle ? <p className="truncate text-[12px] text-[#8A887F]">{handle}</p> : null}
          {bio ? <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#EAE8DF]">{bio}</p> : null}
          <div className="mt-2 grid grid-cols-3 gap-1">
            <button type="button" onClick={() => openReel()} className="min-h-[44px] text-center active:scale-[0.98]">
              <span className="o1-num block text-[15px] text-[#EAE8DF]">{films.length}</span>
              <span className="text-[11px] text-[#8A887F]">Reels</span>
            </button>
            <div className="min-h-[44px] text-center">
              <span className="o1-num block text-[15px] text-[#EAE8DF]">{people.length}</span>
              <span className="text-[11px] text-[#8A887F]">Clients</span>
            </div>
            <button type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); onShareInvite(); }} className="min-h-[44px] text-center active:scale-[0.98]">
              <span className="o1-num block text-[15px] text-[#EAE8DF]">{invites}</span>
              <span className="text-[11px] text-[#8A887F]">Invite</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-1">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenPrograms();
          }}
          className="h-[44px] flex-1 rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] text-[13px] font-semibold text-[#EAE8DF] active:scale-[0.98]"
        >
          Program
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenWorkout();
          }}
          className="h-[44px] flex-1 rounded-xl bg-[#C4121A] text-[13px] font-semibold text-white active:scale-[0.98]"
        >
          Daily Dispatch
        </button>
      </div>

      <div className="flex justify-around border-b border-[#1F1F1F]">
        {tabs.map((item) => {
          const Icon = item.icon;
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setTab(item.id);
              }}
              className={`flex h-11 w-11 items-center justify-center border-b-2 active:scale-[0.98] ${on ? 'border-white text-white' : 'border-transparent text-[#8A887F]'}`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      {tab === 'films' && (
        films.length === 0 ? (
          <p className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-8 text-center text-[13px] text-[#EAE8DF]">
            No films yet. Add a clip.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-0.5">
            {films.map((film) => (
              <FilmTile key={film.id} title={film.title} thumb={film.thumb} onOpen={() => openReel(film.id)} />
            ))}
          </div>
        )
      )}

      {tab === 'floor' && (
        <div className="space-y-3">
          <section className="space-y-2 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
            <h3 className="text-[13px] font-semibold text-[#EAE8DF]">Who trained</h3>
            {sample ? (
              people.slice(0, 1).map((athlete) => (
                <button key={athlete.id} type="button" onClick={() => onSelectAthlete(athlete)} className="w-full text-left active:scale-[0.98]">
                  <p className="text-[15px] font-semibold text-[#EAE8DF]">{athlete.name}</p>
                  {reviews[athlete.name] ? <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${reviewTone(reviews[athlete.name])}`}>{reviewLabel(reviews[athlete.name])}</span> : null}
                  <p className="text-[12px] text-[#8A887F]">Lower strength</p>
                  <p className="o1-num mt-1 text-[13px] text-[#EAE8DF]">{kg(athlete.volume)} · {athlete.sets ?? '--'} sets · {athlete.prs ?? 0} PRs</p>
                </button>
              ))
            ) : trained.length === 0 ? (
              <p className="text-[13px] text-[#8A887F]">No sessions finished</p>
            ) : (
              trained.slice(0, 6).map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => {
                    const known = people.find((athlete) => athlete.id === log.athleteId) || people.find((athlete) => athlete.name === log.athleteName);
                    if (known) onSelectAthlete(known);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 text-left active:scale-[0.98]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[#EAE8DF]">{log.athleteName}</span>
                    <span className="block truncate text-[12px] text-[#8A887F]">{log.title}</span>
                  </span>
                  <span className="o1-num text-[12px] text-[#EAE8DF]">{kg(log.tonnageKg)}</span>
                </button>
              ))
            )}
          </section>

          <section className="space-y-2 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
            <h3 className="text-[13px] font-semibold text-[#EAE8DF]">Check-in</h3>
            {sample && people[1] ? (
              <>
                <p className="text-[15px] font-semibold text-[#EAE8DF]">{people[1].name}</p>
                {reviews[people[1].name] ? <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${reviewTone(reviews[people[1].name])}`}>{reviewLabel(reviews[people[1].name])}</span> : null}
                <p className="o1-num text-[13px] text-[#EAE8DF]">Sleep {people[1].sleepHours ?? '--'} h · {people[1].soreness || '--'} · Fuel {people[1].fuelPct ?? '--'}%</p>
                <button type="button" onClick={() => setReplyFor(people[1].name)} className="h-[44px] w-full rounded-full bg-[#C4121A] text-[13px] font-semibold text-white active:scale-[0.98]">Reply</button>
              </>
            ) : pending[0] ? (
              <>
                <p className="text-[15px] font-semibold text-[#EAE8DF]">{pending[0].athleteName}</p>
                <p className="text-[13px] text-[#8A887F]">{pending[0].notes || 'Check-in'}</p>
                <button type="button" onClick={() => setReplyFor(pending[0].athleteName)} className="h-[44px] w-full rounded-full bg-[#C4121A] text-[13px] font-semibold text-white active:scale-[0.98]">Reply</button>
              </>
            ) : (
              <p className="text-[13px] text-[#8A887F]">No check-in waiting.</p>
            )}
          </section>

        </div>
      )}

      {tab === 'directives' && <DirectiveSignalsSection directives={notes} onSendNote={onSendNote} />}
      {tab === 'inbox' && <CoachInboxView coachId={coachId} />}
      {tab === 'earnings' && (
        <CoachEarningsView transactions={earnings} activeClientsCount={people.length} coachId={coachId} onShowToast={onShowToast ?? (() => undefined)} />
      )}

      {replyFor && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm" onClick={() => setReplyFor(null)}>
          <div className="w-full rounded-t-3xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 pb-8" onClick={(event) => event.stopPropagation()}>
            <p className="text-[15px] font-semibold text-[#EAE8DF]">Feedback for {replyFor}</p>
            <div className="mt-3 space-y-2">
              {CUES.map((cue) => (
                <button key={cue.title} type="button" onClick={() => sendCue(cue)} className="h-[44px] w-full rounded-xl border border-[#1F1F1F] bg-black text-[13px] font-semibold text-[#EAE8DF] active:scale-[0.98]">
                  {cue.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachFloor;
