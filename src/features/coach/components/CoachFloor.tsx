import React, { useEffect, useMemo, useState } from 'react';
import { Dumbbell, Inbox, Layers, LayoutGrid, MessageSquare, Radio, User, UserPlus, Users, Wallet } from 'lucide-react';
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
import { isSampleId } from '../services/sampleIds';
import { reelCover, nextReelCover } from '../../reels/coverPresets';
import { DirectiveSignalsSection } from './DirectiveSignalsSection';
import { CoachInboxView, type InboxContact } from './CoachInboxView';
import { CoachEarningsDeck } from './CoachEarningsDeck';
import { FloorAthleteCard, type FloorCardAction } from './floor/FloorAthleteCard';
import { CoachFeedbackSheet } from './floor/CoachFeedbackSheet';
import { CoachingRequestCard, useCoachingRequests } from './CoachingRequests';
import { CoachProfileHeader, ProfileActionButton, compactCount, ratingLabel } from './profile/CoachProfileHeader';
import { StorefrontEditor } from './profile/StorefrontEditor';
import { CoachProgramsTab } from '../../reels/components/profile/CoachProgramsTab';
import {
  EMPTY_STATS,
  StorefrontProgram,
  StorefrontStats,
  fetchStorefrontPrograms,
  fetchStorefrontStats,
} from '../../reels/services/coachStorefront';

type CreatorTab = 'films' | 'programs' | 'floor' | 'directives' | 'inbox' | 'earnings';

export interface CoachFloorProps {
  coachId: string;
  athletes: Athlete[];
  checkins: AthleteCheckInSubmission[];
  notes: DirectiveItem[];
  onSendNote: (draft: { tag: DirectiveItem['tag']; title: string; summary: string }) => void;
  onReplyCheckin: (checkinId: string, reply: string) => void;
  onOpenPrograms: () => void;
  onOpenWorkout: () => void;
  onDispatchAthlete: (athlete: Athlete) => void;
  onOpenVault: (addClip?: boolean) => void;
  onShareInvite: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onShowToast?: (msg: string) => void;
  /** Called after a coaching request is accepted so the roster reloads. */
  onRosterChanged?: () => void;
}

interface FeedbackTarget {
  key: string;
  athleteId: string;
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

function rosterId(athlete: Athlete): string {
  return athlete.client_id || athlete.id;
}

/** Roster row for the target, or a minimal one so athletes outside the roster can still get a workout. */
function dispatchTarget(target: FeedbackTarget): Athlete {
  return target.athlete ?? {
    id: target.athleteId,
    client_id: target.athleteId,
    name: target.name,
    handle: '',
    avatar: target.avatar,
    status: 'Active',
    readiness: null,
    volume: null,
  };
}

function kg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '--';
  return `${Math.round(value).toLocaleString()} kg`;
}

const BROKEN_REEL_IDS = new Set(['reel-tut-vitals', 'reel-tut-activelog']);

const REVIEW_KEY = 'o1_floor_reviews';

function FilmTile({ title, thumb, onOpen }: { title: string; thumb: string; onOpen: () => void }) {
  const [src, setSrc] = useState(reelCover(title, thumb));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-[4/5] overflow-hidden bg-o1-surface active:scale-[0.98]"
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
  onSendNote,
  onReplyCheckin,
  onOpenPrograms,
  onOpenWorkout,
  onDispatchAthlete,
  onOpenVault,
  onShareInvite,
  onSelectAthlete,
  onShowToast,
  onRosterChanged,
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
  const [storefront, setStorefront] = useState<StorefrontStats>(EMPTY_STATS);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [editing, setEditing] = useState(false);
  const { requests, decide } = useCoachingRequests(coachId, onRosterChanged);

  useEffect(() => {
    if (!coachId) return;
    let live = true;
    void fetchStorefrontStats(coachId).then((next) => live && setStorefront(next)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [coachId]);

  useEffect(() => {
    if (!coachId || tab !== 'programs') return;
    let live = true;
    void fetchStorefrontPrograms(coachId).then((next) => live && setPrograms(next)).catch(() => live && setPrograms([]));
    return () => {
      live = false;
    };
  }, [coachId, tab]);

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

  const openReel = (reelId?: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (reelId) openFullEliteReels({ initialMode: 'player', initialReelId: reelId });
    else openFullEliteReels('grid');
  };

  const contacts = useMemo(() => {
    const book: Record<string, InboxContact> = {};
    people.forEach((athlete) => {
      book[athlete.id] = { name: athlete.name, avatar: athlete.avatar };
      if (athlete.client_id) book[athlete.client_id] = book[athlete.id];
    });
    return book;
  }, [people]);

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
    setFeedbackFor(null);
    if (isSampleId(target.athleteId)) {
      onShowToast?.(`${target.name} is a sample client. Saved on this phone only.`);
      return;
    }
    if (target.workoutId) submitCoachFeedback(target.workoutId, message);
    if (target.checkinId) onReplyCheckin(target.checkinId, message);
    void sendCoachMessage({ coachId, athleteId: target.athleteId, senderName: name, message, from: 'coach' }).then((sent) => {
      onShowToast?.(sent ? `Sent to ${target.name}` : `Saved for ${target.name} on this phone`);
    });
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
    actions.push({ label: 'Workout', icon: Dumbbell, onClick: () => { tactileEngine.triggerSelectionBuzz(); onDispatchAthlete(dispatchTarget(target)); } });
    const { athlete } = target;
    if (athlete) {
      actions.push({ label: 'Profile', icon: User, onClick: () => { tactileEngine.triggerSelectionBuzz(); onSelectAthlete(athlete); } });
    }
    return actions;
  };

  const tabs: { id: CreatorTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'films', label: 'Films', icon: LayoutGrid },
    { id: 'programs', label: 'Programs', icon: Layers },
    { id: 'floor', label: 'Clients', icon: Users },
    { id: 'directives', label: 'Notes', icon: Radio },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="px-1">
        <CoachProfileHeader
          name={name}
          handle={handle}
          avatar={photo}
          bio={bio}
          hasStory={films.length > 0}
          onAvatarPress={() => {
            if (films.length > 0) {
              openReel(films[0].id);
              return;
            }
            onOpenVault(false);
            setPhoto(profilePhoto());
          }}
          onAddClip={() => onOpenVault(true)}
          onEdit={editing ? undefined : () => setEditing(true)}
          stats={[
            { label: 'Followers', value: compactCount(storefront.followers) },
            { label: 'Clients', value: String(people.length), onPress: () => setTab('floor') },
            { label: storefront.reviewCount > 0 ? `${storefront.reviewCount} reviews` : 'Rating', value: ratingLabel(storefront.rating) },
          ]}
          actions={
            <>
              <ProfileActionButton label="Program" onPress={onOpenPrograms} />
              <ProfileActionButton label="Daily Dispatch" primary onPress={onOpenWorkout} />
            </>
          }
        />
        {editing ? (
          <div className="mt-3">
            <StorefrontEditor
              stats={storefront}
              onCancel={() => setEditing(false)}
              onError={(msg) => onShowToast?.(msg)}
              onSaved={(next) => {
                setStorefront((prev) => ({ ...prev, ...next }));
                setEditing(false);
                onShowToast?.('Profile saved');
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex justify-around border-b border-white/[0.07]">
        {tabs.map((item) => {
          const Icon = item.icon;
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setTab(item.id);
              }}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 border-b-2 active:scale-[0.98] ${on ? 'border-white text-o1-text' : 'border-transparent text-o1-muted'}`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'films' && (
        films.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-8 text-center text-[13px] text-o1-text">
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

      {tab === 'programs' && (
        <CoachProgramsTab programs={programs} isOwn onCreate={onOpenPrograms} />
      )}

      {tab === 'floor' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onShareInvite();
            }}
            className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-o1-surface text-[13px] font-semibold text-o1-text active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Invite a client
          </button>
          {requests.length > 0 ? (
            <section className="space-y-2">
              <h3 className="px-1 text-[13px] font-semibold text-o1-text">Coaching requests</h3>
              {requests.map((request) => (
                <CoachingRequestCard key={request.id} request={request} onDecide={(row, accept) => void decide(row, accept)} />
              ))}
            </section>
          ) : null}
          {sample ? (
            <p role="note" className="rounded-2xl border border-o1-gold/40 bg-o1-warn-wash px-3 py-2 text-[12px] font-semibold text-o1-warn-ink">
              Sample clients for testing. Nothing you send to them leaves this phone.
            </p>
          ) : null}
          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-o1-text">Who trained</h3>
            {sample ? (
              people.slice(0, 1).map((athlete) => (
                <FloorAthleteCard
                  key={athlete.id}
                  sample
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
                  actions={athleteActions({ key: athlete.id, athleteId: rosterId(athlete), name: athlete.name, avatar: athlete.avatar, athlete })}
                />
              ))
            ) : trained.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-6 text-center text-[13px] text-o1-muted">No sessions finished yet.</p>
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
                    lastFeedback={reviews[log.id] || log.feedback}
                    onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
                    actions={athleteActions({ key: log.id, athleteId: athlete ? rosterId(athlete) : log.athleteId, name: log.athleteName, avatar, athlete, workoutId: log.id })}
                  />
                );
              })
            )}
          </section>

          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-o1-text">Check-ins waiting</h3>
            {sample && people[1] ? (
              <FloorAthleteCard
                sample
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
                actions={athleteActions({ key: people[1].id, athleteId: rosterId(people[1]), name: people[1].name, avatar: people[1].avatar, athlete: people[1] }, 'Reply')}
              />
            ) : pending.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-6 text-center text-[13px] text-o1-muted">No check-ins waiting.</p>
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
                    actions={athleteActions({ key: row.id, athleteId: athlete ? rosterId(athlete) : row.athleteId, name: row.athleteName, avatar: athlete?.avatar, athlete, checkinId: row.id }, 'Reply')}
                  />
                );
              })
            )}
          </section>
        </div>
      )}

      {tab === 'directives' && <DirectiveSignalsSection directives={notes} onSendNote={onSendNote} />}
      {tab === 'inbox' && <CoachInboxView viewer="coach" coachId={coachId} contacts={contacts} coachName={name} onRosterChanged={onRosterChanged} />}
      {tab === 'earnings' && <CoachEarningsDeck coachId={coachId} onShowToast={(msg) => onShowToast?.(msg)} />}

      <CoachFeedbackSheet
        target={feedbackFor}
        onClose={() => setFeedbackFor(null)}
        onSend={deliverFeedback}
        onSendWorkout={feedbackFor ? () => { setFeedbackFor(null); onDispatchAthlete(dispatchTarget(feedbackFor)); } : undefined}
        onViewProfile={feedbackAthlete ? () => { setFeedbackFor(null); onSelectAthlete(feedbackAthlete); } : undefined}
      />
    </div>
  );
};

export default CoachFloor;
