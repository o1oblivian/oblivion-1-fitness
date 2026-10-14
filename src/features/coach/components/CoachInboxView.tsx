import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Inbox } from 'lucide-react';
import { CoachMessage, fetchCoachMessages } from '../services/coachService';
import { sendCoachMessage } from '../services/coachBridge';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { supabase } from '../../../services/supabaseClient';
import { liveChannel } from '../../../services/realtimeChannel';
import { useAuthStore } from '../../../stores/useAuthStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { AthleteAvatar } from './floor/FloorAthleteCard';
import { blockUser, fetchBlockedIds, reportUser } from '../../../services/safetyService';
import { SafetyReportSheet } from '../../../components/common/SafetyReportSheet';

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
}

interface Thread {
  athleteId: string;
  name: string;
  avatar?: string;
  messages: CoachMessage[];
  waiting: boolean;
}

export const CoachInboxView: React.FC<CoachInboxViewProps> = ({ coachId = '', viewer, contacts = {}, coachName = '' }) => {
  const myName = useAuthStore((s) => s.profile?.name || '');
  const [me, setMe] = useState('');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let live = true;
    void fetchBlockedIds().then((ids) => live && setBlocked(ids));
    return () => {
      live = false;
    };
  }, []);

  const applyRows = useCallback((rows: CoachMessage[] | null) => {
    setLoadFailed(rows === null);
    if (rows) setMessages(rows);
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      const uid = (await getAuthenticatedUserId()) || '';
      const owner = viewer === 'coach' ? coachId || uid : coachId;
      const rows = owner && (viewer === 'coach' || uid) ? await fetchCoachMessages(owner, viewer === 'athlete' ? uid : '') : [];
      if (!live) return;
      setMe(uid);
      applyRows(rows);
      setIsLoading(false);
      if (viewer === 'athlete') setOpenId(uid);
    })().catch(() => {
      if (!live) return;
      setLoadFailed(true);
      setIsLoading(false);
    });
    return () => {
      live = false;
    };
  }, [coachId, viewer, applyRows]);

  const owner = viewer === 'coach' ? coachId || me : coachId;

  useEffect(() => {
    if (!owner || (viewer === 'athlete' && !me)) return;
    const athleteId = viewer === 'athlete' ? me : '';
    const channel = liveChannel(`coach-inbox-${owner}-${athleteId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: athleteId ? `athlete_id=eq.${athleteId}` : `coach_id=eq.${owner}`,
        },
        () => {
          void fetchCoachMessages(owner, athleteId).then(applyRows);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [owner, me, viewer, applyRows]);

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
      if (!row.athleteId || (viewer === 'coach' && blocked.includes(row.athleteId))) return;
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
  }, [messages, contacts, fromCoach, viewer, blocked]);

  const open = threads.find((thread) => thread.athleteId === openId) || null;
  const other = viewer === 'coach' ? { id: open?.athleteId || '', name: open?.name || 'Athlete' } : { id: coachId, name: coachName || 'your coach' };
  const otherBlocked = Boolean(other.id) && blocked.includes(other.id);

  const block = async (person: { id: string; name: string }, quiet = false) => {
    if (!person.id) return;
    const ok = await blockUser(person.id);
    if (ok) setBlocked((prev) => (prev.includes(person.id) ? prev : [...prev, person.id]));
    if (!quiet) setNotice(ok ? `Blocked ${person.name}. They can no longer message you.` : 'Block did not save. Check your connection and try again.');
    if (ok && viewer === 'coach') setOpenId(null);
  };

  const safetyActions = other.id ? (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={() => setReportOpen(true)} className="h-9 rounded-full px-3 text-[12px] font-semibold text-o1-muted">
        Report
      </button>
      {otherBlocked ? null : (
        <button type="button" onClick={() => void block(other)} className="h-9 rounded-full px-3 text-[12px] font-semibold text-o1-muted">
          Block
        </button>
      )}
    </div>
  ) : null;

  const reportSheet = (
    <SafetyReportSheet
      open={reportOpen}
      name={other.name}
      onClose={() => setReportOpen(false)}
      onSubmit={(reason, details, alsoBlock) => {
        const person = other;
        void reportUser({ reportedId: person.id, name: person.name, reason, details, context: 'coach' }).then((ok) => {
          setNotice(ok ? 'Report sent. The Oblivion 1 team will review it.' : 'Report did not send. Check your connection and try again.');
        });
        if (alsoBlock) void block(person, true);
      }}
    />
  );

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
    setSendFailed(!ok);
    if (!ok) return;
    setReply('');
    applyRows(await fetchCoachMessages(owner, viewer === 'athlete' ? athleteId : ''));
  };

  const failureNote = loadFailed ? (
    <p role="alert" className="rounded-xl border border-white/[0.07] bg-o1-canvas px-3 py-2 text-[12px] text-o1-text">
      Could not load messages. Check your connection.
    </p>
  ) : sendFailed ? (
    <p role="alert" className="rounded-xl border border-white/[0.07] bg-o1-canvas px-3 py-2 text-[12px] text-o1-text">
      Message not sent. Check your connection and try again.
    </p>
  ) : null;

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
            <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-o1-text">{open.name}</p>
            {safetyActions}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[13px] font-semibold text-o1-text">Messages with {coachName || 'your coach'}</p>
            {safetyActions}
          </div>
        )}
        {notice ? <p role="status" className="rounded-xl border border-white/[0.07] bg-o1-canvas px-3 py-2 text-[12px] text-o1-text">{notice}</p> : null}
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
        {failureNote}
        {otherBlocked ? (
          <p className="text-center text-[12px] text-o1-muted">You blocked {other.name}. Messages are off.</p>
        ) : (
          replyBox
        )}
        {reportSheet}
      </section>
    );
  }

  const waitingCount = threads.filter((thread) => thread.waiting).length;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <div>
          <p className="text-[13px] font-semibold text-o1-text">Inbox</p>
          <p className="text-[12px] text-o1-muted">Messages from your athletes.</p>
        </div>
        {waitingCount > 0 ? <span className="text-[12px] font-semibold tabular-nums text-o1-text">{waitingCount} to reply</span> : null}
      </div>

      {failureNote}

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
