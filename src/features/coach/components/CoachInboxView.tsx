import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Inbox } from 'lucide-react';
import { CoachMessage, fetchCoachMessages } from '../services/coachService';
import { sendCoachMessage } from '../services/coachBridge';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useAuthStore } from '../../../stores/useAuthStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachingApplication, decideApplication, fetchCoachApplications } from '../../reels/services/coachStorefront';
import { AthleteAvatar } from './floor/FloorAthleteCard';

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
  const [applications, setApplications] = useState<CoachingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const uid = (await getAuthenticatedUserId()) || '';
      const owner = viewer === 'coach' ? coachId || uid : coachId;
      const [rows, pending] = await Promise.all([
        owner ? fetchCoachMessages(owner, viewer === 'athlete' ? uid : '') : Promise.resolve([]),
        viewer === 'coach' && owner ? fetchCoachApplications(owner) : Promise.resolve([]),
      ]);
      if (!live) return;
      setMe(uid);
      setMessages(viewer === 'athlete' && !uid ? [] : rows);
      setApplications(pending);
      setIsLoading(false);
      if (viewer === 'athlete') setOpenId(uid);
    })().catch(() => live && setIsLoading(false));
    return () => {
      live = false;
    };
  }, [coachId, viewer]);

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
    const owner = viewer === 'coach' ? coachId || me : coachId;
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
        className="h-[44px] min-w-0 flex-1 rounded-xl border border-[#1F1F1F] bg-black px-3 text-[13px] text-[#EAE8DF] outline-none focus:border-[#C4121A]"
      />
      <button
        type="submit"
        disabled={!reply.trim() || sending}
        className="h-[44px] rounded-xl bg-[#C4121A] px-4 text-[13px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );

  if (open || viewer === 'athlete') {
    const rows = open?.messages || [];
    return (
      <section className="space-y-3 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-3">
        {viewer === 'coach' && open ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOpenId(null)} aria-label="Back to inbox" className="flex h-11 w-11 items-center justify-center text-[#8A887F]">
              <ChevronLeft size={20} />
            </button>
            <AthleteAvatar name={open.name} avatar={open.avatar} size={36} />
            <p className="truncate text-[15px] font-semibold text-[#EAE8DF]">{open.name}</p>
          </div>
        ) : (
          <p className="text-[13px] font-semibold text-[#EAE8DF]">Messages with {coachName || 'your coach'}</p>
        )}
        {isLoading ? (
          <p className="py-6 text-center text-[13px] text-[#8A887F]">Loading messages…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[#8A887F]">No messages yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const mine = fromCoach(row) === (viewer === 'coach');
              return (
                <li key={row.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-[#C4121A] text-white' : 'bg-black text-[#EAE8DF] border border-[#1F1F1F]'}`}>
                    <p className="whitespace-pre-wrap text-[13px]">{row.message}</p>
                    {row.time ? <p className={`mt-0.5 text-[10px] tabular-nums ${mine ? 'text-white/70' : 'text-[#8A887F]'}`}>{row.time}</p> : null}
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
          <p className="text-[13px] font-semibold text-[#EAE8DF]">Inbox</p>
          <p className="text-[12px] text-[#8A887F]">Messages and coaching requests from athletes.</p>
        </div>
        {waitingCount > 0 ? <span className="text-[12px] font-semibold tabular-nums text-[#EAE8DF]">{waitingCount} to reply</span> : null}
      </div>

      {applications.map((application) => (
        <article key={application.id} className="space-y-2 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[14px] font-semibold text-[#EAE8DF]">{application.athleteName || 'Athlete'}</span>
            <span className="shrink-0 text-[11px] text-[#8A887F]">Wants coaching</span>
          </div>
          <p className="text-[13px] text-[#EAE8DF]">{application.goal}</p>
          {Object.keys(application.intake).length > 0 ? (
            <p className="text-[12px] text-[#8A887F]">{Object.values(application.intake).join(' · ')}</p>
          ) : null}
          <div className="flex gap-2">
            {([false, true] as const).map((accept) => (
              <button
                key={String(accept)}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  void decideApplication(application, accept).then((ok) => {
                    if (ok) setApplications((prev) => prev.filter((row) => row.id !== application.id));
                  });
                }}
                className={`h-[44px] flex-1 rounded-xl text-[13px] font-semibold active:scale-[0.98] ${accept ? 'bg-[#C4121A] text-white' : 'border border-[#1F1F1F] bg-black text-[#EAE8DF]'}`}
              >
                {accept ? 'Accept' : 'Decline'}
              </button>
            ))}
          </div>
        </article>
      ))}

      {isLoading ? (
        <p className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-6 text-center text-[13px] text-[#8A887F]">Loading messages…</p>
      ) : threads.length === 0 ? (
        <div className="space-y-1 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-6 text-center">
          <Inbox className="mx-auto h-6 w-6 text-[#8A887F]" />
          <p className="text-[13px] font-semibold text-[#EAE8DF]">No messages yet</p>
          <p className="text-[12px] text-[#8A887F]">When an athlete messages you, it shows up here.</p>
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
              className="flex w-full items-center gap-3 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-3 text-left active:scale-[0.99]"
            >
              <AthleteAvatar name={thread.name} avatar={thread.avatar} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[14px] font-semibold text-[#EAE8DF]">{thread.name}</span>
                  {last.time ? <span className="shrink-0 text-[11px] tabular-nums text-[#8A887F]">{last.time}</span> : null}
                </span>
                <span className="block truncate text-[12px] text-[#8A887F]">
                  {fromCoach(last) ? 'You: ' : ''}
                  {last.message}
                </span>
              </span>
              {thread.waiting ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C4121A]" aria-label="Needs a reply" /> : null}
            </button>
          );
        })
      )}
    </section>
  );
};
