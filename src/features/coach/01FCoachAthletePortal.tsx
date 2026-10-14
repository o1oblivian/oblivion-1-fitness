import React, { useCallback, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { liveChannel } from '../../services/realtimeChannel';
import { CheckinDraft, DailyCheckInProgress } from './components/DailyCheckInProgress';
import { AthleteProgramsPanel } from './components/programs/AthleteProgramsPanel';
import { CoachInboxView } from './components/CoachInboxView';
import { AthleteCheckInSubmission } from './types/coachPlatformTypes';
import { CoachFinishedWorkoutLog } from '../../stores/coachTypes';
import { fetchCoachMessages } from './services/coachService';
import { fetchCoachFilms, figureCount, ProfileFilm } from './services/coachFilms';
import { LinkedCoach, readLinkedCoach } from './services/coachLink';
import { CoachCard, fetchCoachCards, formatHandle } from './services/coachDirectory';
import { fetchMyCoachCard } from './services/coachPublicProfile';
import { adoptAcceptedCoach, fetchStorefrontPrograms } from '../reels/services/coachStorefront';
import {
  acceptCoachInvite,
  fetchAthleteCheckins,
  fetchCoachNotes,
  fetchMyFinishedWorkouts,
  fetchMyLinkedCoach,
  sendCoachMessage,
  submitCheckin,
} from './services/coachBridge';
import { mapAssignedRow, resolveTodaySession, startTodaySession } from '../log/todaySession';
import { useCoachStore } from '../../stores/useCoachStore';
import { tactileEngine } from '../../services/tactileEngine';
import { useModalStore } from '../../components/modals/useModalStore';
import { useAuthStore } from '../../stores/useAuthStore';

type AthletePanel = 'home' | 'checkin' | 'inbox';
type Note = { id: string; title: string; summary: string; createdAt: string };

const DAY_MS = 86_400_000;

function isToday(iso: string): boolean {
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
}

function endOfToday(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function cardToCoach(card: CoachCard): LinkedCoach {
  return { id: card.id, name: card.name, handle: card.handle, avatar: card.avatar };
}

export const O1FCoachAthletePortal: React.FC<{ isCoach?: boolean }> = ({ isCoach = false }) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const profileName = useAuthStore((s) => s.profile?.name);
  const authUser = useAuthStore((s) => s.user);
  const me = authUser?.id || '';

  const [panel, setPanel] = useState<AthletePanel>('home');
  const [coach, setCoach] = useState<LinkedCoach | null>(() => (isCoach ? null : readLinkedCoach()));
  const [directory, setDirectory] = useState<CoachCard[]>([]);
  const [programCount, setProgramCount] = useState<number | null>(null);
  const [films, setFilms] = useState<ProfileFilm[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [checkins, setCheckins] = useState<AthleteCheckInSubmission[] | null>(null);
  const [workouts, setWorkouts] = useState<CoachFinishedWorkoutLog[] | null>(null);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [latestMessage, setLatestMessage] = useState<{ text: string; at: string } | null>(null);
  const [sentTitle, setSentTitle] = useState('');
  const [message, setMessage] = useState('');
  const [messageState, setMessageState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isCoach) {
        const card = await fetchMyCoachCard();
        if (!cancelled && card) setCoach(cardToCoach(card));
        return;
      }
      await acceptCoachInvite();
      let linked = await fetchMyLinkedCoach();
      if (linked && !linked.coach && (await adoptAcceptedCoach())) linked = await fetchMyLinkedCoach();
      if (!cancelled && linked) setCoach(linked.coach);
    })();
    return () => {
      cancelled = true;
    };
  }, [isCoach, me]);

  useEffect(() => {
    if (coach) return;
    let cancelled = false;
    void fetchCoachCards().then((cards) => {
      if (!cancelled) setDirectory(cards.filter((card) => card.accepting).slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
  }, [coach]);

  const loadCoachSide = useCallback(async (coachId: string) => {
    const [programs, filmRows, noteRows] = await Promise.all([
      fetchStorefrontPrograms(coachId),
      fetchCoachFilms(coachId),
      fetchCoachNotes(coachId),
    ]);
    setProgramCount(programs.length);
    setFilms(filmRows ?? []);
    if (noteRows) setNotes(noteRows);
  }, []);

  const loadMine = useCallback(async (coachId: string) => {
    if (!me) return;
    const [checkinRows, workoutRows, messages, assigned] = await Promise.all([
      fetchAthleteCheckins(me),
      fetchMyFinishedWorkouts(me),
      fetchCoachMessages(coachId, me),
      supabase
        .from('assigned_workouts')
        .select('*')
        .eq('coach_id', coachId)
        .or(`client_id.eq.${me},athlete_id.eq.${me}`)
        .in('status', ['pending', 'active'])
        .lte('assigned_date', endOfToday())
        .order('assigned_date', { ascending: false })
        .limit(1),
    ]);
    setHistoryFailed(checkinRows === null || workoutRows === null);
    if (checkinRows) setCheckins(checkinRows);
    if (workoutRows) setWorkouts(workoutRows);
    const reply = (messages ?? []).find((row) => row.from === 'coach');
    setLatestMessage(reply ? { text: reply.message, at: reply.createdAt } : null);
    const row = Array.isArray(assigned.data) ? assigned.data[0] : null;
    if (row) useCoachStore.getState().ingestAssigned(mapAssignedRow(row));
    setSentTitle(row ? String(row.title || 'Workout') : '');
  }, [me]);

  useEffect(() => {
    if (!coach?.id) {
      setProgramCount(null);
      setFilms(null);
      setNotes([]);
      setSentTitle('');
      return;
    }
    void loadCoachSide(coach.id);
    if (!isCoach) void loadMine(coach.id);
  }, [coach?.id, isCoach, loadCoachSide, loadMine]);

  useEffect(() => {
    if (!coach?.id || isCoach || !me) return;
    const coachId = coach.id;
    const refreshMine = () => void loadMine(coachId);
    const channel = liveChannel(`athlete-coach-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'athlete_checkins', filter: `athlete_id=eq.${me}` }, refreshMine)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_completions', filter: `athlete_id=eq.${me}` }, refreshMine)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coach_messages', filter: `athlete_id=eq.${me}` }, refreshMine)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_directives', filter: `coach_id=eq.${coachId}` }, () => {
        void fetchCoachNotes(coachId).then((rows) => rows && setNotes(rows));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coach?.id, isCoach, me, loadMine]);

  const handleCheckin = async (draft: CheckinDraft): Promise<boolean> => {
    if (!coach || !me) return false;
    const row = await submitCheckin({
      athleteId: me,
      athleteName: profileName || 'Athlete',
      coachId: coach.id,
      ...draft,
    });
    if (!row) return false;
    setCheckins((prev) => [row, ...(prev ?? []).filter((c) => c.id !== row.id)]);
    return true;
  };

  const openFilm = (reelId?: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (reelId) openFullEliteReels({ initialMode: 'player', initialReelId: reelId });
    else if (coach) openFullEliteReels({ initialMode: 'grid', initialCoachId: coach.id });
    else openFullEliteReels('grid');
  };

  const firstName = coach?.name.split(' ')[0] || 'your coach';

  if (panel !== 'home') {
    return (
      <div id="o1fcoach-athlete-portal" className="w-full space-y-3 select-none pt-1">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPanel('home')}
            className="o1-pill border border-white/[0.07] bg-o1-sheet text-[11px] font-semibold text-o1-text"
          >
            Coach
          </button>
        </div>
        {panel === 'checkin' && (
          <DailyCheckInProgress
            coachName={firstName}
            checkins={checkins}
            workouts={workouts}
            loadFailed={historyFailed}
            onRetry={() => coach && void loadMine(coach.id)}
            onSubmit={handleCheckin}
          />
        )}
        {panel === 'inbox' && <CoachInboxView viewer="athlete" coachId={coach?.id} coachName={coach?.name} />}
      </div>
    );
  }

  if (!coach) {
    return (
      <div id="o1fcoach-athlete-portal" className="w-full space-y-3 select-none pt-1">
        <AthleteProgramsPanel />
        {directory.length > 0 && <p className="px-1 pt-2 text-[13px] font-semibold text-o1-text">Coaches taking athletes</p>}
        {directory.map((card) => (
          <div key={card.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
            {card.avatar ? (
              <img
                src={card.avatar}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover"
                onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-o1-sheet text-[16px] font-semibold text-o1-text">
                {card.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-o1-text">{card.name}</p>
              <p className="truncate text-[12px] text-o1-muted">{card.specialties.slice(0, 2).join(' · ') || formatHandle(card.handle) || 'Coach'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                openFullEliteReels({ initialMode: 'grid', initialCoachId: card.id });
              }}
              className="h-[44px] shrink-0 rounded-full border border-white/[0.07] bg-o1-sheet px-4 text-[13px] font-semibold text-o1-text active:scale-[0.98]"
            >
              View
            </button>
          </div>
        ))}
      </div>
    );
  }

  const handle = formatHandle(coach.handle);
  const checkedInToday = (checkins ?? []).some((row) => isToday(row.createdAt || ''));
  const checkinReply = (checkins ?? []).map((row) => row.coachFeedback?.feedbackText || '').find(Boolean) || '';
  const recentMessage = latestMessage && Date.now() - new Date(latestMessage.at).getTime() < 14 * DAY_MS ? latestMessage : null;
  const reply = recentMessage?.text || checkinReply;
  const filmList = films ?? [];

  return (
    <div id="o1fcoach-athlete-portal" className="w-full space-y-3 select-none pt-1">
      <AthleteProgramsPanel />
      <p className="px-1 pt-2 text-[13px] font-semibold text-o1-text">{isCoach ? 'How athletes see you' : 'My coach'}</p>
      <div className="flex items-center gap-4">
        <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.07] bg-o1-sheet">
          {coach.avatar ? (
            <img src={coach.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-o1-text">{coach.name.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold text-o1-text">{coach.name}</h2>
          {handle ? <p className="truncate text-[12px] text-o1-muted">{handle}</p> : null}
          <div className="mt-2 grid grid-cols-2">
            <div className="text-center">
              <span className="tabular-nums block text-[15px] text-o1-text">{films === null ? '--' : figureCount(filmList.length)}</span>
              <span className="text-[11px] text-o1-muted">Films</span>
            </div>
            <div className="text-center">
              <span className="tabular-nums block text-[15px] text-o1-text">{programCount === null ? '--' : figureCount(programCount)}</span>
              <span className="text-[11px] text-o1-muted">Programs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openFilm()}
          className="h-[44px] flex-1 rounded-xl border border-white/[0.07] bg-o1-sheet text-[13px] font-semibold text-o1-text"
        >
          Profile
        </button>
        {!isCoach && (
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setPanel('checkin'); }}
            className="h-[44px] flex-1 rounded-xl border border-white/[0.07] bg-o1-sheet text-[13px] font-semibold text-o1-text"
          >
            Check-in
          </button>
        )}
      </div>

      {sentTitle && !isCoach ? (
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            const session = resolveTodaySession();
            if (session.origin !== 'coach') return;
            startTodaySession(session);
            window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
          }}
          className="flex min-h-[44px] w-full items-center justify-between rounded-2xl bg-o1-crimson px-3 text-left"
        >
          <span>
            <span className="block text-[11px] text-white/80">Workout from {firstName}</span>
            <span className="block text-[13px] font-semibold text-white">{sentTitle}</span>
          </span>
          <span className="text-[13px] font-semibold text-white">Start</span>
        </button>
      ) : null}

      {films === null ? (
        <p className="py-8 text-center text-xs text-o1-muted">Loading films…</p>
      ) : filmList.length === 0 ? (
        <p className="py-8 text-center text-xs text-o1-muted">No films yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {filmList.slice(0, 18).map((film) => (
            <button
              key={film.id}
              type="button"
              onClick={() => openFilm(film.id)}
              className="relative aspect-square overflow-hidden bg-o1-sheet"
              aria-label={film.title}
            >
              <img src={film.thumb} alt="" className="h-full w-full object-cover" />
              <Play className="absolute right-1.5 top-1.5 h-3 w-3 fill-white text-o1-text" />
            </button>
          ))}
        </div>
      )}

      {!isCoach && checkins !== null && !checkedInToday && (
        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setPanel('checkin'); }}
          className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-o1-surface px-3"
        >
          <span className="text-[13px] font-semibold text-o1-text">Log today's check-in</span>
        </button>
      )}

      {reply && !isCoach ? (
        <div className="rounded-2xl border border-white/[0.07] bg-o1-surface px-3 py-3">
          <p className="text-[11px] text-o1-muted">Latest from {firstName}</p>
          <p className="text-[13px] text-o1-text">{reply}</p>
        </div>
      ) : null}

      {notes.map((note) => (
        <div key={note.id} className="rounded-2xl border border-white/[0.07] bg-o1-surface px-3 py-3">
          <p className="text-[13px] font-semibold text-o1-text">{note.title}</p>
          {note.summary ? <p className="mt-1 text-[12px] text-o1-muted">{note.summary}</p> : null}
        </div>
      ))}

      {!isCoach && (
        <>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = message.trim();
              if (!text || !me || messageState === 'sending') return;
              setMessageState('sending');
              void sendCoachMessage({
                coachId: coach.id,
                athleteId: me,
                senderName: profileName || 'Athlete',
                message: text,
                from: 'athlete',
              }).then((ok) => {
                setMessageState(ok ? 'sent' : 'failed');
                if (ok) setMessage('');
              });
            }}
          >
            <input
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (messageState !== 'sending') setMessageState('idle');
              }}
              placeholder={`Message ${firstName}`}
              className="h-[44px] min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-o1-sheet px-3 text-[13px] text-o1-text outline-none"
            />
            <button
              type="submit"
              disabled={messageState === 'sending'}
              className="h-[44px] rounded-xl border border-white/[0.07] bg-o1-sheet px-4 text-[13px] font-semibold text-o1-text disabled:opacity-60"
            >
              {messageState === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </form>
          {messageState === 'sent' ? <p role="status" className="text-[12px] text-o1-muted">Sent to {firstName}</p> : null}
          {messageState === 'failed' ? <p role="alert" className="text-[12px] text-o1-text">Could not send. Try again.</p> : null}

          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setPanel('inbox'); }}
            className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-o1-surface px-3"
          >
            <span className="text-[13px] font-semibold text-o1-text">Inbox</span>
          </button>
        </>
      )}
    </div>
  );
};

export default O1FCoachAthletePortal;
