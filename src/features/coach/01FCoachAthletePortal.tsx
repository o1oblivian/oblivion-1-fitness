import React, { useEffect, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { DailyCheckInProgress } from './components/DailyCheckInProgress';
import { AthleteProgramsPanel } from './components/programs/AthleteProgramsPanel';
import { CoachInboxView } from './components/CoachInboxView';
import { AthleteCheckInSubmission, CoachMarketplaceProgram } from './types/coachPlatformTypes';
import { readStoredCheckins, saveCheckinRemote, writeStoredCheckins } from './services/coachService';
import { filmsForCoach, figureCount, ProfileFilm } from './services/coachFilms';
import { LinkedCoach, readLinkedCoach, saveLinkedCoach } from './services/coachLink';
import { mockCoaches } from '../../services/devMocks';
import { adoptAcceptedCoach } from '../reels/services/coachStorefront';
import { acceptCoachInvite, fetchAthleteCheckins, fetchCoachNotes, sendCoachMessage } from './services/coachBridge';
import { mapAssignedRow, resolveTodaySession, startTodaySession } from '../log/todaySession';
import { useCoachStore } from '../../stores/useCoachStore';
import { tactileEngine } from '../../services/tactileEngine';
import { useModalStore } from '../../components/modals/useModalStore';
import { useReelsStore } from '../../stores/useReelsStore';
import { getAuthenticatedUserId, peekStoredUserId } from '../../services/authUser';
import { useAuthStore } from '../../stores/useAuthStore';

type AthletePanel = 'home' | 'checkin' | 'inbox';

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const O1FCoachAthletePortal: React.FC<{
  activePerspective?: 'coach' | 'athlete';
  onChangePerspective?: (p: 'coach' | 'athlete') => void;
  isCoach?: boolean;
}> = ({ isCoach = false }) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const reels = useReelsStore((s) => s.reels);
  const [panel, setPanel] = useState<AthletePanel>('home');
  const [coach, setCoach] = useState<LinkedCoach | null>(() => readLinkedCoach());
  const [programs, setPrograms] = useState<CoachMarketplaceProgram[]>([]);
  const [remoteFilms, setRemoteFilms] = useState<ProfileFilm[]>([]);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>(() => readStoredCheckins());
  const [clientCount, setClientCount] = useState<number | null>(null);
  const [notes, setNotes] = useState<Array<{ id: string; title: string; summary: string }>>([]);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [sentTitle, setSentTitle] = useState('');
  const profileName = useAuthStore((s) => s.profile?.name);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (coach || isCoach) return;
    void adoptAcceptedCoach().catch(() => false);
  }, [coach, isCoach]);

  useEffect(() => {
    if (coach || !isCoach || !authUser?.id) return;
    const email = authUser.email || '';
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const name = profileName || (typeof meta.full_name === 'string' ? meta.full_name : '') || (email.includes('@') ? email.split('@')[0] : '');
    if (!name) return;
    let avatar = '';
    try {
      avatar = localStorage.getItem('o1_profile_avatar_url') || '';
    } catch {
      avatar = '';
    }
    setCoach({ id: authUser.id, name, handle: email.includes('@') ? `@${email.split('@')[0]}` : '', avatar });
  }, [coach, isCoach, authUser, profileName]);

  useEffect(() => {
    const sync = () => setCoach(readLinkedCoach());
    window.addEventListener('o1-coach-linked', sync);
    void acceptCoachInvite().then((linked) => {
      if (linked) setCoach(linked);
    });
    return () => window.removeEventListener('o1-coach-linked', sync);
  }, []);

  useEffect(() => {
    if (coach) return;
    let cancelled = false;
    void (async () => {
      const userId = await getAuthenticatedUserId();
      if (!userId || cancelled) return;
      const { data } = await supabase
        .from('coach_clients')
        .select('coach_id')
        .eq('client_id', userId)
        .limit(1);
      const coachId = data?.[0]?.coach_id;
      if (!coachId || cancelled) return;
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('id, display_name, name, handle, avatar_url, avatar')
        .eq('id', coachId)
        .maybeSingle();
      if (cancelled || !profile) return;
      const linked: LinkedCoach = {
        id: String(profile.id || coachId),
        name: profile.display_name || profile.name || 'Coach',
        handle: profile.handle || '',
        avatar: profile.avatar_url || profile.avatar || '',
      };
      setCoach(linked);
    })();
    return () => {
      cancelled = true;
    };
  }, [coach]);

  useEffect(() => {
    if (!coach?.id) {
      setPrograms([]);
      setRemoteFilms([]);
      setClientCount(null);
      setNotes([]);
      setSentTitle('');
      return;
    }
    let cancelled = false;
    void (async () => {
      const [programRes, filmRes, clientRes] = await Promise.all([
        supabase.from('coach_programs').select('id, title, coach_id').eq('coach_id', coach.id),
        supabase.from('reels').select('id, title, thumbnail_url, coach_id').eq('coach_id', coach.id),
        supabase.from('coach_clients').select('id', { count: 'exact', head: true }).eq('coach_id', coach.id),
      ]);
      if (cancelled) return;
      if (Array.isArray(programRes.data) && programRes.data.length) {
        setPrograms(programRes.data.map((row: { id: string; title?: string; coach_id?: string }) => ({
          id: String(row.id),
          coachId: row.coach_id || coach.id,
          coachName: coach.name,
          coachAvatar: coach.avatar,
          coachTitle: 'Coach',
          title: row.title || 'Program',
          tagline: '',
          category: '',
          difficulty: 'Intermediate',
          durationWeeks: 0,
          daysPerWeek: 0,
          priceUsd: 0,
          rating: 0,
          enrolledCount: 0,
          coverImage: '',
          description: '',
          highlights: [],
          sampleWeek: [],
        })));
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem('o1_coach_custom_programs') || '[]');
          if (Array.isArray(stored)) {
            setPrograms(stored.slice(0, 8).map((row: { id?: string; title?: string }) => ({
              id: String(row.id || row.title || 'program'),
              coachId: coach.id,
              coachName: coach.name,
              coachAvatar: coach.avatar,
              coachTitle: 'Coach',
              title: row.title || 'Program',
              tagline: '',
              category: '',
              difficulty: 'Intermediate',
              durationWeeks: 0,
              daysPerWeek: 0,
              priceUsd: 0,
              rating: 0,
              enrolledCount: 0,
              coverImage: '',
              description: '',
              highlights: [],
              sampleWeek: [],
            })));
          }
        } catch {
          setPrograms([]);
        }
      }
      if (Array.isArray(filmRes.data)) {
        setRemoteFilms(
          filmRes.data
            .filter((row: { thumbnail_url?: string }) => row.thumbnail_url && !String(row.thumbnail_url).includes('images.unsplash.com'))
            .map((row: { id: string; title?: string; thumbnail_url?: string }) => ({
              id: String(row.id),
              title: row.title || 'Film',
              thumb: String(row.thumbnail_url),
            })),
        );
      }
      setClientCount(typeof clientRes.count === 'number' ? clientRes.count : null);
      const noteRows = await fetchCoachNotes(coach.id);
      if (!cancelled) setNotes(noteRows);
      const athleteId = (await getAuthenticatedUserId()) || peekStoredUserId() || '';
      let title = '';
      if (athleteId) {
        const sent = await supabase
          .from('assigned_workouts')
          .select('*')
          .eq('coach_id', coach.id)
          .or(`client_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
          .in('status', ['pending', 'active'])
          .order('assigned_date', { ascending: false })
          .limit(1);
        const row = Array.isArray(sent.data) ? sent.data[0] : null;
        if (row) {
          useCoachStore.getState().ingestAssigned(mapAssignedRow(row));
          title = String(row.title || 'Workout');
        }
      }
      if (!title) {
        try {
          const stored = JSON.parse(localStorage.getItem('o1_assigned_local') || 'null');
          if (stored?.title && stored.coachId === coach.id) title = String(stored.title);
        } catch {
          title = '';
        }
      }
      if (!cancelled) setSentTitle(title);
    })();
    return () => {
      cancelled = true;
    };
  }, [coach]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const athleteId = (await getAuthenticatedUserId()) || peekStoredUserId() || '';
      if (!athleteId || cancelled) return;
      const remote = await fetchAthleteCheckins(athleteId);
      if (cancelled || !remote.length) return;
      setCheckinsList((prev) => {
        const byId = new Map(prev.map((row) => [row.id, row]));
        remote.forEach((row) => {
          const local = byId.get(row.id);
          if (!local) byId.set(row.id, row);
          else if (row.coachFeedback?.feedbackText) byId.set(row.id, { ...local, coachFeedback: row.coachFeedback });
        });
        const next = Array.from(byId.values());
        writeStoredCheckins(next);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [coach?.id]);

  const films = useMemo(() => {
    if (!coach) return [];
    const local = filmsForCoach(coach.id, reels);
    const seen = new Set(local.map((film) => film.id));
    return [...local, ...remoteFilms.filter((film) => !seen.has(film.id))].slice(0, 18);
  }, [coach, reels, remoteFilms]);

  const loggedToday = checkinsList.some((row) => row.date === todayLabel());
  const replyText = checkinsList.map((row) => row.coachFeedback?.feedbackText?.trim() || '').find(Boolean) || '';

  const openFilm = (reelId?: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (reelId) openFullEliteReels({ initialMode: 'player', initialReelId: reelId });
    else openFullEliteReels('grid');
  };

  if (panel !== 'home') {
    return (
      <div id="o1fcoach-athlete-portal" className="w-full space-y-3 select-none pt-1">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPanel('home')}
            className="o1-pill border border-white/[0.07] bg-o1-well text-[11px] font-semibold text-neutral-200"
          >
            Coach
          </button>
        </div>
        {panel === 'checkin' && (
          <DailyCheckInProgress
            checkins={checkinsList}
            onReplyFeedback={(id, fb) => {
              setCheckinsList((prev) => {
                const next = prev.map((row) => row.id === id ? { ...row, coachFeedback: { feedbackText: fb, givenAt: 'Just now', status: 'reviewed' as const } } : row);
                writeStoredCheckins(next);
                return next;
              });
            }}
            onSubmitNewCheckin={(draft) => {
              const athleteId = peekStoredUserId() || draft.athleteId;
              const athleteName = profileName || (draft.athleteName === 'You' ? 'Athlete' : draft.athleteName);
              const row: AthleteCheckInSubmission = {
                ...draft,
                id: `chk-${Date.now()}`,
                athleteId,
                athleteName,
                coachId: coach?.id || draft.coachId,
                coachFeedback: { feedbackText: '', givenAt: 'Pending', status: 'pending' },
              };
              void getAuthenticatedUserId().then((uid) => {
                const stored = uid ? { ...row, athleteId: uid } : row;
                setCheckinsList((prev) => {
                  const next = [stored, ...prev];
                  writeStoredCheckins(next);
                  return next;
                });
                void saveCheckinRemote(stored);
              });
              setPanel('home');
            }}
          />
        )}
        {panel === 'inbox' && <CoachInboxView coachId={coach?.id} />}
      </div>
    );
  }

  if (!coach) {
    const showcase = mockCoaches().filter((row) => row.verified && row.avatar && row.id !== 'o1fc_support');
    return (
      <div id="o1fcoach-athlete-portal" className="w-full space-y-3 select-none pt-1">
        <AthleteProgramsPanel />
        {showcase.length > 0 && <p className="px-1 pt-2 text-[13px] font-semibold text-[#EAE8DF]">Verified coaches</p>}
        {showcase.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-3">
            <img
              src={row.avatar}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover"
              onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#EAE8DF]">{row.name}</p>
              <p className="truncate text-[12px] text-[#8A887F]">{row.specialtyTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerImpactPulse();
                saveLinkedCoach({ id: row.id, name: row.name, handle: row.handle, avatar: row.avatar });
              }}
              className="h-[44px] shrink-0 rounded-full bg-[#C4121A] px-4 text-[13px] font-semibold text-white active:scale-[0.98]"
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    );
  }

  const handle = coach.handle ? (coach.handle.startsWith('@') ? coach.handle : `@${coach.handle}`) : '';

  return (
    <div id="o1fcoach-athlete-portal" className="w-full space-y-3 select-none pt-1">
      <AthleteProgramsPanel />
      <p className="px-1 pt-2 text-[13px] font-semibold text-[#EAE8DF]">My coach</p>
      <div className="flex items-center gap-4">
        <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.07] bg-[#161616]">
          {coach.avatar ? (
            <img src={coach.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-white">{coach.name.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold text-white">{coach.name}</h2>
          {handle ? <p className="truncate text-[12px] text-neutral-400">{handle}</p> : null}
          <div className="mt-2 grid grid-cols-3">
            <div className="text-center">
              <span className="o1-num block text-[15px] text-white">{figureCount(films.length)}</span>
              <span className="text-[11px] text-neutral-400">Films</span>
            </div>
            <div className="text-center">
              <span className="o1-num block text-[15px] text-white">{figureCount(clientCount || 0)}</span>
              <span className="text-[11px] text-neutral-400">Clients</span>
            </div>
            <div className="text-center">
              <span className="o1-num block text-[15px] text-white">{figureCount(programs.length)}</span>
              <span className="text-[11px] text-neutral-400">Programs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openFilm()}
          className="h-[44px] flex-1 rounded-xl border border-white/[0.07] bg-[#161616] text-[13px] font-semibold text-white"
        >
          Films
        </button>
        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setPanel('checkin'); }}
          className="h-[44px] flex-1 rounded-xl border border-white/[0.07] bg-[#161616] text-[13px] font-semibold text-white"
        >
          Check-in
        </button>
      </div>

      {sentTitle ? (
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
            <span className="block text-[11px] text-white/80">Today's workout</span>
            <span className="block text-[13px] font-semibold text-white">{sentTitle}</span>
          </span>
          <span className="text-[13px] font-semibold text-white">Start</span>
        </button>
      ) : null}

      {films.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-400">No clips yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {films.map((film) => (
            <button
              key={film.id}
              type="button"
              onClick={() => openFilm(film.id)}
              className="relative aspect-square overflow-hidden bg-[#161616]"
              aria-label={film.title}
            >
              <img src={film.thumb} alt="" className="h-full w-full object-cover" />
              <Play className="absolute right-1.5 top-1.5 h-3 w-3 fill-white text-white" />
            </button>
          ))}
        </div>
      )}

      {!loggedToday && (
        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setPanel('checkin'); }}
          className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-o1-card px-3"
        >
          <span className="text-[13px] font-semibold text-white">Log today's check-in</span>
        </button>
      )}

      {replyText ? (
        <div className="rounded-2xl border border-white/[0.07] bg-o1-card px-3 py-3">
          <p className="text-[11px] text-neutral-400">{coach.name}</p>
          <p className="text-[13px] text-white">{replyText}</p>
        </div>
      ) : null}

      {notes.map((note) => (
        <div key={note.id} className="rounded-2xl border border-white/[0.07] bg-o1-card px-3 py-3">
          <p className="text-[13px] font-semibold text-white">{note.title}</p>
          {note.summary ? <p className="mt-1 text-[12px] text-neutral-400">{note.summary}</p> : null}
        </div>
      ))}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const text = message.trim();
          if (!text || !coach) return;
          void (async () => {
            const athleteId = (await getAuthenticatedUserId()) || peekStoredUserId() || '';
            const ok = await sendCoachMessage({
              coachId: coach.id,
              athleteId,
              senderName: profileName || 'Athlete',
              message: text,
            });
            if (ok) {
              setMessage('');
              setMessageSent(true);
            }
          })();
        }}
      >
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message your coach"
          className="h-[44px] min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-[#161616] px-3 text-[13px] text-white outline-none"
        />
        <button type="submit" className="h-[44px] rounded-xl border border-white/[0.07] bg-[#161616] px-4 text-[13px] font-semibold text-white">
          Send
        </button>
      </form>
      {messageSent ? <p className="text-[12px] text-neutral-400">Sent</p> : null}

      <button
        type="button"
        onClick={() => { tactileEngine.triggerSelectionBuzz(); setPanel('inbox'); }}
        className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-o1-card px-3"
      >
        <span className="text-[13px] font-semibold text-white">Inbox</span>
      </button>
    </div>
  );
};

export default O1FCoachAthletePortal;
