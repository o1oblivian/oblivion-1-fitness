import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dumbbell, Inbox, Layers, LayoutGrid, MessageSquare, Radio, User, UserPlus, Users, Wallet } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { liveChannel } from '../../../services/realtimeChannel';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useModalStore } from '../../../components/modals/useModalStore';
import { useReelsStore } from '../../../stores/useReelsStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { Athlete, fetchLatestCoachFeedback } from '../services/coachService';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { DirectiveItem } from '../types/coachDirectives';
import { fetchCoachFilms, ProfileFilm } from '../services/coachFilms';
import { liveClients } from '../services/floorRoster';
import { saveCheckinReplyRemote, saveWorkoutFeedback, sendCoachMessage } from '../services/coachBridge';
import { CoachCard, formatHandle, toExploreCoach } from '../services/coachDirectory';
import { isSampleId } from '../services/sampleIds';
import { CoachFloorTab, useCoachViewStore } from '../store/useCoachViewStore';
import { reelCover, nextReelCover } from '../../reels/coverPresets';
import { DirectiveSignalsSection, type NoteDraft } from './DirectiveSignalsSection';
import { CoachInboxView, type InboxContact } from './CoachInboxView';
import { CoachEarningsDeck } from './CoachEarningsDeck';
import { FloorAthleteCard, type FloorCardAction } from './floor/FloorAthleteCard';
import { CoachFeedbackSheet } from './floor/CoachFeedbackSheet';
import { CoachingRequestCard, useCoachingRequests } from './CoachingRequests';
import { CoachProfileHeader, ProfileActionButton, compactCount, ratingLabel } from './profile/CoachProfileHeader';
import { CoachProfileEditSheet } from './profile/CoachProfileEditSheet';
import { CoachProgramsTab } from '../../reels/components/profile/CoachProgramsTab';
import {
  EMPTY_STATS,
  StorefrontProgram,
  StorefrontStats,
  fetchStorefrontPrograms,
  fetchStorefrontStats,
} from '../../reels/services/coachStorefront';

export interface CoachFloorProps {
  coachId: string;
  /** The coach's public card from `coach_profiles`; null until loaded or before the first save. */
  card: CoachCard | null;
  onCardChange: (card: CoachCard) => void;
  /** Null while the roster loads. */
  athletes: Athlete[] | null;
  rosterFailed: boolean;
  onRetryRoster: () => void;
  rosterHasMore: boolean;
  onLoadMoreRoster: () => void;
  checkins: AthleteCheckInSubmission[] | null;
  onCheckinsChange: (updater: (prev: AthleteCheckInSubmission[] | null) => AthleteCheckInSubmission[] | null) => void;
  notes: DirectiveItem[] | null;
  notesFailed: boolean;
  onRetryNotes: () => void;
  onSendNote: (draft: NoteDraft) => Promise<boolean>;
  onEditNote: (id: string, draft: NoteDraft) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
  /** Bumped after a program is published so the Programs tab reloads. */
  programsRevision?: number;
  onCreateProgram: () => void;
  onOpenWorkout: () => void;
  onDispatchAthlete: (athlete: Athlete) => void;
  onOpenVault: () => void;
  onShareInvite: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onShowToast?: (msg: string) => void;
  /** Called after a coaching request is accepted so the roster reloads. */
  onRosterChanged?: () => void;
}

interface FeedbackTarget {
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

function kg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '--';
  return `${Math.round(value).toLocaleString()} kg`;
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

function FilmTile({ film, onOpen }: { film: ProfileFilm; onOpen: () => void }) {
  const [src, setSrc] = useState(reelCover(film.id, film.thumb));
  return (
    <button type="button" onClick={onOpen} className="relative aspect-[4/5] overflow-hidden bg-o1-surface active:scale-[0.98]" aria-label={film.title}>
      <img src={src} alt="" className="h-full w-full object-cover" onError={() => setSrc(nextReelCover(src))} />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
    </button>
  );
}

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-6 text-center text-[13px] text-o1-muted">{children}</p>
);

const RetryAlert: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex items-center justify-between gap-2 rounded-xl border border-o1-crimson/30 bg-o1-crimson/10 px-3 py-2">
    <p className="text-[12px] text-o1-text">{message}</p>
    <button type="button" onClick={onRetry} className="min-h-[36px] px-2 text-[12px] font-semibold text-o1-text">
      Retry
    </button>
  </div>
);

const TABS: { id: CoachFloorTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'films', label: 'Films', icon: LayoutGrid },
  { id: 'programs', label: 'Programs', icon: Layers },
  { id: 'floor', label: 'Clients', icon: Users },
  { id: 'directives', label: 'Notes', icon: Radio },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
];

export const CoachFloor: React.FC<CoachFloorProps> = ({
  coachId,
  card,
  onCardChange,
  athletes,
  rosterFailed,
  onRetryRoster,
  rosterHasMore,
  onLoadMoreRoster,
  checkins,
  onCheckinsChange,
  notes,
  notesFailed,
  onRetryNotes,
  onSendNote,
  onEditNote,
  onDeleteNote,
  programsRevision = 0,
  onCreateProgram,
  onOpenWorkout,
  onDispatchAthlete,
  onOpenVault,
  onShareInvite,
  onSelectAthlete,
  onShowToast,
  onRosterChanged,
}) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const ownReelCount = useReelsStore((s) => s.reels.filter((reel) => reel.coach?.id === coachId).length);
  const finishedWorkouts = useCoachStore((s) => s.finishedWorkouts);
  const applyWorkoutFeedback = useCoachStore((s) => s.applyWorkoutFeedback);
  const profileName = useAuthStore((s) => s.profile?.name || '');
  const tab = useCoachViewStore((s) => s.floorTab);
  const setTab = useCoachViewStore((s) => s.setFloorTab);
  const [feedbackFor, setFeedbackFor] = useState<FeedbackTarget | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<Record<string, string>>({});
  const [films, setFilms] = useState<ProfileFilm[] | null>(null);
  const [filmsFailed, setFilmsFailed] = useState(false);
  const [storefront, setStorefront] = useState<StorefrontStats>(EMPTY_STATS);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [editing, setEditing] = useState(false);
  const { requests, decide } = useCoachingRequests(coachId, onRosterChanged);

  const loadFilms = useCallback(async () => {
    if (!coachId) return;
    const rows = await fetchCoachFilms(coachId);
    setFilmsFailed(rows === null);
    if (rows) setFilms(rows);
    else setFilms((prev) => prev ?? []);
  }, [coachId]);

  const filmList = films ?? [];
  const showFilms = filmsFailed || filmList.length > 0;
  const visibleTabs = TABS.filter((item) => item.id !== 'films' || showFilms);

  useEffect(() => {
    void loadFilms();
  }, [loadFilms, ownReelCount]);

  useEffect(() => {
    if (tab === 'films' && films !== null && !showFilms) setTab('floor');
  }, [tab, films, showFilms, setTab]);

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
  }, [coachId, tab, programsRevision]);

  useEffect(() => {
    if (!coachId) return;
    const refresh = () => void fetchLatestCoachFeedback(coachId).then(setLatestFeedback);
    refresh();
    const channel = liveChannel(`coach-feedback-${coachId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coach_messages', filter: `coach_id=eq.${coachId}` }, refresh)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coachId]);

  const people = useMemo(() => liveClients(athletes ?? []), [athletes]);
  const pending = (checkins ?? []).filter((row) => !row.coachFeedback?.feedbackText?.trim());

  const name = (card?.name || profileName || 'Coach').trim();
  const handle = formatHandle(card?.handle);
  const explore = card ? toExploreCoach(card) : null;
  const specialtyLine = [card?.specialties.slice(0, 3).join(' · '), explore?.rate].filter(Boolean).join(' · ');

  const openReel = (reelId?: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (reelId) openFullEliteReels({ initialMode: 'player', initialReelId: reelId });
    else openFullEliteReels({ initialMode: 'grid', initialCoachId: coachId });
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

  const deliverFeedback = async (message: string): Promise<boolean> => {
    const target = feedbackFor;
    if (!target) return false;
    if (isSampleId(target.athleteId)) {
      setFeedbackFor(null);
      onShowToast?.(`${target.name} is a sample client. Nothing was sent.`);
      return true;
    }
    const [sent, workoutSaved, checkinSaved] = await Promise.all([
      sendCoachMessage({ coachId, athleteId: target.athleteId, senderName: name, message, from: 'coach' }),
      target.workoutId ? saveWorkoutFeedback(coachId, target.workoutId, message) : Promise.resolve(true),
      target.checkinId ? saveCheckinReplyRemote(target.checkinId, message) : Promise.resolve(true),
    ]);
    const at = new Date().toISOString();
    if (sent) setLatestFeedback((prev) => ({ ...prev, [target.athleteId]: message }));
    if (target.workoutId && workoutSaved) applyWorkoutFeedback(target.workoutId, message, at);
    if (target.checkinId && checkinSaved) {
      const checkinId = target.checkinId;
      onCheckinsChange((prev) =>
        (prev ?? []).map((row) =>
          row.id === checkinId ? { ...row, coachFeedback: { ...row.coachFeedback, feedbackText: message, givenAt: 'Today', status: 'reviewed' } } : row,
        ),
      );
    }
    const ok = sent && workoutSaved && checkinSaved;
    if (ok) {
      setFeedbackFor(null);
      onShowToast?.(`Sent to ${target.name}`);
    }
    return ok;
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
      { label: 'Workout', icon: Dumbbell, onClick: () => { tactileEngine.triggerSelectionBuzz(); onDispatchAthlete(dispatchTarget(target)); } },
    ];
    const { athlete } = target;
    if (athlete) {
      actions.push({ label: 'Profile', icon: User, onClick: () => { tactileEngine.triggerSelectionBuzz(); onSelectAthlete(athlete); } });
    }
    return actions;
  };

  return (
    <div className="w-full space-y-3">
      <div className="px-1">
        <CoachProfileHeader
          name={name}
          handle={handle}
          avatar={card?.avatar}
          specialty={specialtyLine}
          bio={card?.bio}
          verified={card?.verified}
          hasStory={filmList.length > 0}
          onAvatarPress={filmList.length > 0 ? () => openReel(filmList[0].id) : undefined}
          onAddClip={onOpenVault}
          onEdit={() => {
            tactileEngine.triggerSelectionBuzz();
            setEditing(true);
          }}
          stats={[
            { label: 'Followers', value: compactCount(storefront.followers) },
            { label: 'Clients', value: athletes === null ? '--' : String(people.length), onPress: () => setTab('floor') },
            { label: storefront.reviewCount > 0 ? `${storefront.reviewCount} reviews` : 'Rating', value: ratingLabel(storefront.rating) },
          ]}
          actions={
            <>
              <ProfileActionButton label="Program" onPress={onCreateProgram} />
              <ProfileActionButton label="Daily Dispatch" primary onPress={onOpenWorkout} />
            </>
          }
        />
        {!card ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-[12px] font-semibold text-o1-muted"
          >
            Set up your public coach card so athletes can find you
          </button>
        ) : null}
      </div>

      <CoachProfileEditSheet
        open={editing}
        initial={{
          name,
          handle: card?.handle || '',
          bio: card?.bio || '',
          avatar: card?.avatar || '',
          specialties: card?.specialties || [],
          accepting: card?.accepting ?? true,
        }}
        stats={storefront}
        onClose={() => setEditing(false)}
        onError={(msg) => onShowToast?.(msg)}
        onSaved={(next, front) => {
          onCardChange({
            id: coachId,
            hourlyRate: card?.hourlyRate ?? null,
            monthlyRate: front.monthlyPriceCents != null ? front.monthlyPriceCents / 100 : card?.monthlyRate ?? null,
            verified: card?.verified ?? false,
            name: next.name,
            handle: next.handle,
            avatar: next.avatar,
            bio: next.bio,
            specialties: next.specialties,
            accepting: next.accepting,
          });
          setStorefront((prev) => ({ ...prev, ...front }));
          setEditing(false);
          onShowToast?.('Profile saved');
        }}
      />

      <div className="flex justify-around border-b border-white/[0.07]" role="tablist" aria-label="Coach console">
        {visibleTabs.map((item) => {
          const Icon = item.icon;
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setTab(item.id);
              }}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 border-b-2 active:scale-[0.98] ${on ? 'border-o1-crimson text-o1-text' : 'border-transparent text-o1-muted'}`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'films' && (
        <div className="space-y-2">
          {filmsFailed ? <RetryAlert message="Could not load your films." onRetry={() => void loadFilms()} /> : null}
          {films === null ? (
            <Empty>Loading films…</Empty>
          ) : filmList.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-8 text-center text-[13px] text-o1-text">
              No films yet. Tap + on your photo to open your Vault and publish a clip.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {filmList.slice(0, 30).map((film) => (
                <FilmTile key={film.id} film={film} onOpen={() => openReel(film.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'programs' && <CoachProgramsTab programs={programs} isOwn onCreate={onCreateProgram} />}

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
              <h3 className="px-1 text-[13px] font-semibold text-o1-text">Coaching requests ({requests.length})</h3>
              {requests.map((request) => (
                <CoachingRequestCard key={request.id} request={request} onDecide={(row, accept) => void decide(row, accept)} />
              ))}
            </section>
          ) : null}
          {rosterFailed ? <RetryAlert message="Could not load your clients." onRetry={onRetryRoster} /> : null}
          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-o1-text">Clients{athletes === null ? '' : ` (${people.length}${rosterHasMore ? '+' : ''})`}</h3>
            {athletes === null ? (
              <Empty>Loading clients…</Empty>
            ) : people.length === 0 ? (
              <Empty>No active clients yet. Tap 'Invite a client' to send your coach link.</Empty>
            ) : (
              people.map((athlete) => (
                <FloorAthleteCard
                  key={`roster-${athlete.id}`}
                  name={athlete.name}
                  avatar={athlete.avatar}
                  subtitle={athlete.handle || athlete.status}
                  meta={athlete.lastActive}
                  stats={[
                    { label: 'Readiness', value: stat(athlete.readiness, '%') },
                    { label: 'Volume', value: kg(athlete.volume) },
                    { label: 'Status', value: athlete.status },
                  ]}
                  lastFeedback={latestFeedback[rosterId(athlete)]}
                  onOpenProfile={() => onSelectAthlete(athlete)}
                  actions={athleteActions({ athleteId: rosterId(athlete), name: athlete.name, avatar: athlete.avatar, athlete })}
                />
              ))
            )}
            {rosterHasMore ? (
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onLoadMoreRoster();
                }}
                className="flex h-[44px] w-full items-center justify-center rounded-full border border-white/[0.07] bg-o1-surface text-[13px] font-semibold text-o1-text active:scale-[0.99]"
              >
                Show more clients
              </button>
            ) : null}
          </section>
          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-o1-text">Who trained this week</h3>
            {finishedWorkouts.length === 0 ? (
              <Empty>No sessions finished yet.</Empty>
            ) : (
              finishedWorkouts.slice(0, 8).map((log) => {
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
                    lastFeedback={log.feedback}
                    onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
                    actions={athleteActions({ athleteId: log.athleteId, name: log.athleteName, avatar, athlete, workoutId: log.id }, log.feedback ? 'Note' : 'Review')}
                  />
                );
              })
            )}
          </section>

          <section className="space-y-2">
            <h3 className="px-1 text-[13px] font-semibold text-o1-text">Check-ins waiting</h3>
            {checkins === null ? (
              <Empty>Loading check-ins…</Empty>
            ) : pending.length === 0 ? (
              <Empty>No check-ins waiting.</Empty>
            ) : (
              pending.slice(0, 8).map((row) => {
                const athlete = findAthlete(row.athleteId, row.athleteName);
                return (
                  <FloorAthleteCard
                    key={row.id}
                    name={row.athleteName}
                    avatar={athlete?.avatar}
                    subtitle={row.notes || undefined}
                    meta={ago(row.createdAt) || row.date}
                    stats={[
                      { label: 'Weight', value: row.weightKg > 0 ? `${row.weightKg} kg` : '--' },
                      { label: 'Sleep', value: row.sleepHours > 0 ? `${row.sleepHours} h` : '--' },
                      { label: 'Soreness', value: stat(row.sorenessRating, '/10') },
                    ]}
                    onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
                    actions={athleteActions({ athleteId: row.athleteId, name: row.athleteName, avatar: athlete?.avatar, athlete, checkinId: row.id }, 'Reply')}
                  />
                );
              })
            )}
          </section>
        </div>
      )}

      {tab === 'directives' && (
        <DirectiveSignalsSection
          directives={notes}
          loadFailed={notesFailed}
          onRetry={onRetryNotes}
          onSendNote={onSendNote}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      )}
      {tab === 'inbox' && <CoachInboxView viewer="coach" coachId={coachId} contacts={contacts} coachName={name} />}
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


