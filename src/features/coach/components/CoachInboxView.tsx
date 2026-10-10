import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Inbox } from 'lucide-react';
import { CoachMessage, fetchCoachMessages } from '../services/coachService';
import { sendCoachMessage } from '../services/coachBridge';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { supabase } from '../../../services/supabaseClient';
import { useAuthStore } from '../../../stores/useAuthStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { AthleteAvatar } from './floor/FloorAthleteCard';
import { CoachingRequestCard, useCoachingRequests } from './CoachingRequests';

export interface InboxContact {
  name: string;
  avatar?: string;
}

interface CoachInboxViewProps {
  coachId?: string;
  viewer: 'coach' | 'athlete';
  /** Roster lookup by athlete id, so threads the athlete never replied to still have a name. */
  contacts?: Record<string, InboxContact>;
  /** The coach's display name; also identifies coach-written rows saved before author markers existed. */
  coachName?: string;
  onRosterChanged?: () => void;
}

interface Thread {
  athleteId: string;
  name: string;
  avatar?: string;
  messages: CoachMessage[];
  waiting: boolean;
}

export const CoachInboxView: React.FC<CoachInboxViewProps> = ({ coachId = '', viewer, contacts = {}, coachName = '', onRosterChanged }) => {
  const myName = useAuthStore((s) => s.profile?.name || '');
  const [me, setMe] = useState('');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const uid = (await getAuthenticatedUserId()) || '';
      const owner = viewer === 'coach' ? coachId || uid : coachId;
      const rows = owner ? await fetchCoachMessages(owner, viewer === 'athlete' ? uid : '') : [];
      if (!live) return;
      setMe(uid);
      setMessages(viewer === 'athlete' && !uid ? [] : rows);
      setIsLoading(false);
      if (viewer === 'athlete') setOpenId(uid);
    })().catch(() => live && setIsLoading(false));
    return () => {
      live = false;
    };
  }, [coachId, viewer]);

  const owner = viewer === 'coach' ? coachId || me : coachId;
  const { requests, decide } = useCoachingRequests(viewer === 'coach' ? owner : '', onRosterChanged);

  useEffect(() => {
    if (!owner || (viewer === 'athlete' && !me)) return;
    const athleteId = viewer === 'athlete' ? me : '';
    const channel = supabase
      .channel(`coach-inbox-${owner}-${athleteId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: athleteId ? `athlete_id=eq.${athleteId}` : `coach_id=eq.${owner}`,
        },
        () => {
          void fetchCoachMessages(owner, athleteId).then(setMessages);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [owner, me, viewer]);

  const fromCoach = useCallback(
    (row: CoachMessage) => {
      if (row.from) return row.from === 'coach';
      return coachName ? row.sender === coachName : viewer === 'athlete' && row.sender !== myName;
    },
    [coachName, myName, viewer],
  );

  const threads = useMemo<Thread[]>(() => {
    const byAthlete = new Map<string, CoachMessage[]>();
    messages.forEach((row) => {
      if (!row.athleteId) return;
      byAthlete.set(row.athleteId, [...(byAthlete.get(row.athleteId) || []), row]);
    });
    return Array.from(byAthlete, ([athleteId, rows]) => {
      const contact = contacts[athleteId];
      const athleteName = rows.find((row) => !fromCoach(row))?.sender;
      return {
        athleteId,
        name: contact?.name || athleteName || 'Athlete',
        avatar: contact?.avatar,
        messages: [...rows].reverse(),
        waiting: !fromCoach(rows[0]),
      };
    });
  }, [messages, contacts, fromCoach]);

  const open = threads.find((thread) => thread.athleteId === openId) || null;

  const send = async () => {
    const text = reply.trim();
    const athleteId = viewer === 'coach' ? openId : me;
    if (!text || !athleteId || !owner || sending) return;
    setSending(true);
    tactileEngine.triggerImpactPulse();
    const ok = await sendCoachMessage({
      coachId: owner,
      athleteId,
      senderName: (viewer === 'coach' ? coachName : myName) || myName || (viewer === 'coach' ? 'Coach' : 'Athlete'),
      message: text,
      from: viewer,
    });
    setSending(false);
    if (!ok) return;
    setReply('');
    setMessages(await fetchCoachMessages(owner, viewer === 'athlete' ? athleteId : ''));
  };

  const replyBox = (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <input
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        placeholder={viewer === 'coach' ? `Reply to ${open?.name.split(' ')[0] || 'athlete'}` : `Message ${coachName || 'your coach'}`}
        maxLength={500}
        className="h-[44px] min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-o1-canvas px-3 text-[13px] text-o1-text outline-none focus:border-o1-crimson"
      />
      <button
        type="submit"
        disabled={!reply.trim() || sending}
        className="h-[44px] rounded-xl bg-o1-crimson px-4 text-[13px] font-semibold text-o1-text active:scale-[0.98] disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );

  if (open || viewer === 'athlete') {
    const rows = open?.messages || [];
    return (
      <section className="space-y-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
        {viewer === 'coach' && open ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOpenId(null)} aria-label="Back to inbox" className="flex h-11 w-11 items-center justify-center text-o1-muted">
              <ChevronLeft size={20} />
            </button>
            <AthleteAvatar name={open.name} avatar={open.avatar} size={36} />
            <p className="truncate text-[15px] font-semibold text-o1-text">{open.name}</p>
          </div>
        ) : (
          <p className="text-[13px] font-semibold text-o1-text">Messages with {coachName || 'your coach'}</p>
        )}
        {isLoading ? (
          <p className="py-6 text-center text-[13px] text-o1-muted">Loading messages…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-o1-muted">No messages yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const mine = fromCoach(row) === (viewer === 'coach');
              return (
                <li key={row.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-o1-crimson text-o1-text' : 'bg-o1-canvas text-o1-text border border-white/[0.07]'}`}>
                    <p className="whitespace-pre-wrap text-[13px]">{row.message}</p>
                    {row.time ? <p className={`mt-0.5 text-[10px] tabular-nums ${mine ? 'text-white/70' : 'text-o1-muted'}`}>{row.time}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {replyBox}
      </section>
    );
  }

  const waitingCount = threads.filter((thread) => thread.waiting).length;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <div>
          <p className="text-[13px] font-semibold text-o1-text">Inbox</p>
          <p className="text-[12px] text-o1-muted">Messages and coaching requests from athletes.</p>
        </div>
        {waitingCount > 0 ? <span className="text-[12px] font-semibold tabular-nums text-o1-text">{waitingCount} to reply</span> : null}
      </div>

      {requests.map((request) => (
        <CoachingRequestCard key={request.id} request={request} onDecide={(row, accept) => void decide(row, accept)} />
      ))}

      {isLoading ? (
        <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-6 text-center text-[13px] text-o1-muted">Loading messages…</p>
      ) : threads.length === 0 ? (
        <div className="space-y-1 rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-6 text-center">
          <Inbox className="mx-auto h-6 w-6 text-o1-muted" />
          <p className="text-[13px] font-semibold text-o1-text">No messages yet</p>
          <p className="text-[12px] text-o1-muted">When an athlete messages you, it shows up here.</p>
        </div>
      ) : (
        threads.map((thread) => {
          const last = thread.messages[thread.messages.length - 1];
          return (
            <button
              key={thread.athleteId}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setOpenId(thread.athleteId);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-3 text-left active:scale-[0.99]"
            >
              <AthleteAvatar name={thread.name} avatar={thread.avatar} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[14px] font-semibold text-o1-text">{thread.name}</span>
                  {last.time ? <span className="shrink-0 text-[11px] tabular-nums text-o1-muted">{last.time}</span> : null}
                </span>
                <span className="block truncate text-[12px] text-o1-muted">
                  {fromCoach(last) ? 'You: ' : ''}
                  {last.message}
                </span>
              </span>
              {thread.waiting ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-o1-crimson" aria-label="Needs a reply" /> : null}
            </button>
          );
        })
      )}
    </section>
  );
};
