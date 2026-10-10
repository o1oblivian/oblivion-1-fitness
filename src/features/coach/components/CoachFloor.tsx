import React, { useMemo, useState } from 'react';
import { Dumbbell, Inbox, LayoutGrid, MessageSquare, Plus, Radio, User, Users, Wallet } from 'lucide-react';
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
import { sendCoachMessage } from '../services/coachBridge';
import { reelCover, nextReelCover } from '../../reels/coverPresets';
import { DirectiveSignalsSection } from './DirectiveSignalsSection';
import { CoachInboxView } from './CoachInboxView';
import { CoachEarningsView } from './CoachEarningsView';
import { FloorAthleteCard, type FloorCardAction } from './floor/FloorAthleteCard';
import { CoachFeedbackSheet } from './floor/CoachFeedbackSheet';
import { CoachEarnings } from '../../../types';

type CreatorTab = 'films' | 'floor' | 'directives' | 'inbox' | 'earnings';

export interface CoachFloorProps {
  coachId: string;
  athletes: Athlete[];
  checkins: AthleteCheckInSubmission[];
  notes: DirectiveItem[];
  earnings?: CoachEarnings;
  onSendNote: (draft: { tag: DirectiveItem['tag']; title: string; summary: string }) => void;
  onReplyCheckin: (checkinId: string, reply: string) => void;
  onOpenPrograms: () => void;
  onOpenWorkout: () => void;
  onDispatchAthlete: (athlete: Athlete) => void;
  onOpenVault: (addClip?: boolean) => void;
  onShareInvite: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onShowToast?: (msg: string) => void;
}

interface FeedbackTarget {
  key: string;
  name: string;
  avatar?: string;
  athlete?: Athlete;
  workoutId?: string;
  checkinId?: string;
}

function ago(iso: string | undefined): string {
  const at = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(at)) return '';
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function stat(value: number | null | undefined, unit = ''): string {
  return value == null || !Number.isFinite(value) || value <= 0 ? '--' : `${Math.round(value).toLocaleString()}${unit}`;
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
  onReplyCheckin,
  onOpenPrograms,
  onOpenWorkout,
  onDispatchAthlete,
  onOpenVault,
  onShareInvite,
  onSelectAthlete,
  onShowToast,
}) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const catalog = useReelsStore((s) => s.reels);
  const finishedWorkouts = useCoachStore((s) => s.finishedWorkouts);
  const submitCoachFeedback = useCoachStore((s) => s.submitCoachFeedback);
  const bio = useBuddyProfileStore((s) => s.partnerBio);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<CreatorTab>('films');
  const [feedbackFor, setFeedbackFor] = useState<FeedbackTarget | null>(null);
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

  const findAthlete = (id: string, athleteName: string) =>
    people.find((athlete) => athlete.id === id || athlete.client_id === id) || people.find((athlete) => athlete.name === athleteName);

  const deliverFeedback = (message: string) => {
    const target = feedbackFor;
    if (!target) return;
    const next = { ...reviews, [target.key]: message };
    setReviews(next);
    try {
      localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    if (target.workoutId) submitCoachFeedback(target.workoutId, message);
    if (target.checkinId) onReplyCheckin(target.checkinId, message);
    const athleteId = target.athlete?.client_id || target.athlete?.id || '';
    void sendCoachMessage({ coachId, athleteId, senderName: name, message }).then((sent) => {
      onShowToast?.(sent ? `Sent to ${target.name}` : `Saved for ${target.name} on this phone`);
    });
    setFeedbackFor(null);
  };

  const feedbackAthlete = feedbackFor?.athlete;

  const athleteActions = (target: FeedbackTarget, feedbackLabel = 'Note'): FloorCardAction[] => {
    const actions: FloorCardAction[] = [
      {
        label: feedbackLabel,
        icon: MessageSquare,
        primary: true,
        onClick: () => {
          tactileEngine.triggerSelectionBuzz();
          setFeedbackFor(target);
        },
      },
    ];
    const { athlete } = target;
    if (athlete) {
      actions.push(
        { label: 'Workout', icon: Dumbbell, onClick: () => { tactileEngine.triggerSelectionBuzz(); onDispatchAthlete(athlete); } },
        { label: 'Profile', icon: User, onClick: () => { tactileEngine.triggerSelectionBuzz(); onSelectAthlete(athlete); } },
      );
    }
    return actions;
  };

  const tabs: { id: CreatorTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'films', label: 'Films', icon: LayoutGrid },
    { id: 'floor', label: 'Clients', icon: Users },
    { id: 'directives', label: 'Notes', icon: Radio },
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
              <span className="tabular-nums block text-[15px] text-[#EAE8DF]">{films.length}</span>
              <span className="text-[11px] text-[#8A887F]">Reels</span>
            </button>
            <div className="min-h-[44px] text-center">
              <span className="tabular-nums block text-[15px] text-[#EAE8DF]">{people.length}</span>
              <span className="text-[11px] text-[#8A887F]">Clients</span>
            </div>
            <button type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); onShareInvite(); }} className="min-h-[44px] text-center active:scale-[0.98]">
              <span className="tabular-nums block text-[15px] text-[#EAE8DF]">{invites}</span>
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
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-[#EAE8DF]">Who trained</h3>
            {sample ? (
              people.slice(0, 1).map((athlete) => (
                <FloorAthleteCard
                  key={athlete.id}
                  name={athlete.name}
                  avatar={athlete.avatar}
                  subtitle={athlete.handle}
                  meta={athlete.lastActive}
                  stats={[
                    { label: 'Volume', value: kg(athlete.volume) },
                    { label: 'Sets', value: stat(athlete.sets) },
                    { label: 'PRs', value: athlete.prs == null ? '--' : String(athlete.prs) },
                  ]}
                  lastFeedback={reviews[athlete.id]}
                  onOpenProfile={() => onSelectAthlete(athlete)}
                  actions={athleteActions({ key: athlete.id, name: athlete.name, avatar: athlete.avatar, athlete })}
                />
              ))
            ) : trained.length === 0 ? (
              <p className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-6 text-center text-[13px] text-[#8A887F]">No sessions finished yet.</p>
            ) : (
              trained.slice(0, 6).map((log) => {
                const athlete = findAthlete(log.athleteId, log.athleteName);
                const avatar = log.athleteAvatar || athlete?.avatar;
                return (
                  <FloorAthleteCard
                    key={log.id}
                    name={log.athleteName}
                    avatar={avatar}
                    subtitle={log.title}
                    meta={ago(log.completedAt)}
                    stats={[
                      { label: 'Volume', value: kg(log.tonnageKg) },
                      { label: 'Sets', value: stat(log.totalSets) },
                      { label: 'Minutes', value: stat(log.durationMinutes) },
                    ]}
                    lastFeedback={log.feedback || reviews[log.id]}
                    onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
                    actions={athleteActions({ key: log.id, name: log.athleteName, avatar, athlete, workoutId: log.id })}
                  />
                );
              })
            )}
          </section>

          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-[#EAE8DF]">Check-ins waiting</h3>
            {sample && people[1] ? (
              <FloorAthleteCard
                name={people[1].name}
                avatar={people[1].avatar}
                subtitle={people[1].handle}
                stats={[
                  { label: 'Sleep', value: stat(people[1].sleepHours, ' h') },
                  { label: 'Soreness', value: people[1].soreness || '--' },
                  { label: 'Food', value: stat(people[1].fuelPct, '%') },
                ]}
                lastFeedback={reviews[people[1].id]}
                onOpenProfile={() => onSelectAthlete(people[1])}
                actions={athleteActions({ key: people[1].id, name: people[1].name, avatar: people[1].avatar, athlete: people[1] })}
              />
            ) : pending.length === 0 ? (
              <p className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-6 text-center text-[13px] text-[#8A887F]">No check-ins waiting.</p>
            ) : (
              pending.slice(0, 6).map((row) => {
                const athlete = findAthlete(row.athleteId, row.athleteName);
                return (
                  <FloorAthleteCard
                    key={row.id}
                    name={row.athleteName}
                    avatar={athlete?.avatar}
                    subtitle={row.notes || undefined}
                    meta={ago(row.date) || row.date}
                    stats={[
                      { label: 'Sleep', value: stat(row.sleepHours, ' h') },
                      { label: 'Soreness', value: stat(row.sorenessRating, '/10') },
                      { label: 'Food', value: stat(row.nutritionAdherence, '%') },
                    ]}
                    lastFeedback={reviews[row.id]}
                    onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
                    actions={athleteActions({ key: row.id, name: row.athleteName, avatar: athlete?.avatar, athlete, checkinId: row.id }, 'Reply')}
                  />
                );
              })
            )}
          </section>
        </div>
      )}

      {tab === 'directives' && <DirectiveSignalsSection directives={notes} onSendNote={onSendNote} />}
      {tab === 'inbox' && <CoachInboxView coachId={coachId} />}
      {tab === 'earnings' && (
        <CoachEarningsView transactions={earnings} activeClientsCount={people.length} coachId={coachId} onShowToast={onShowToast ?? (() => undefined)} />
      )}

      <CoachFeedbackSheet
        target={feedbackFor}
        onClose={() => setFeedbackFor(null)}
        onSend={deliverFeedback}
        onSendWorkout={feedbackAthlete ? () => { setFeedbackFor(null); onDispatchAthlete(feedbackAthlete); } : undefined}
        onViewProfile={feedbackAthlete ? () => { setFeedbackFor(null); onSelectAthlete(feedbackAthlete); } : undefined}
      />
    </div>
  );
};

export default CoachFloor;
