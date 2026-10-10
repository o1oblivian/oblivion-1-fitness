import React, { useState, useEffect } from 'react';
import { MessageSquare, Inbox } from 'lucide-react';
import { fetchCoachMessages } from '../services/coachService';
import { sendCoachMessage } from '../services/coachBridge';
import { useAuthStore } from '../../../stores/useAuthStore';
import { CoachingApplication, decideApplication, fetchCoachApplications } from '../../reels/services/coachStorefront';

export const CoachInboxView: React.FC<{ coachId?: string }> = ({ coachId }) => {
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; time: string; message: string; athleteId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [applications, setApplications] = useState<CoachingApplication[]>([]);
  const profileName = useAuthStore((s) => s.profile?.name);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { getAuthenticatedUserId } = await import('../../../services/authUser');
        const me = (await getAuthenticatedUserId()) || '';
        const resolved = coachId || me;
        const [data, pending] = await Promise.all([
          fetchCoachMessages(resolved),
          resolved && resolved === me ? fetchCoachApplications(resolved) : Promise.resolve([]),
        ]);
        if (isMounted) {
          setMessages(data);
          setApplications(pending);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setMessages([]);
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [coachId]);

  return (
    <div className="bg-o1-card border border-white/[0.07] text-neutral-100 rounded-2xl p-3 shadow-sm space-y-2.5 transition-colors duration-200 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.07] flex items-center justify-center text-sky-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">
              Inbox
            </h4>
            <p className="text-[10px] text-neutral-500">
              Messages from athletes
            </p>
          </div>
        </div>
        {messages.length > 0 ? (
          <span className="text-[10px] font-mono font-bold text-neutral-400 bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/[0.07]">
            {messages.length}
          </span>
        ) : null}
      </div>

      {applications.map((application) => (
        <div key={application.id} className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-well p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-white">{application.athleteName || 'Athlete'}</span>
            <span className="shrink-0 text-[11px] text-neutral-400">Consultation</span>
          </div>
          <p className="text-[13px] text-neutral-200">{application.goal}</p>
          {Object.keys(application.intake).length > 0 ? (
            <p className="text-[11px] text-neutral-400">{Object.values(application.intake).join(' · ')}</p>
          ) : null}
          <div className="flex gap-2">
            {([false, true] as const).map((accept) => (
              <button
                key={String(accept)}
                type="button"
                onClick={() => {
                  void decideApplication(application, accept).then((ok) => {
                    if (ok) setApplications((prev) => prev.filter((row) => row.id !== application.id));
                  });
                }}
                className={`h-[44px] flex-1 rounded-xl text-[13px] font-semibold ${accept ? 'bg-white text-neutral-950' : 'border border-white/[0.07] text-neutral-200'}`}
              >
                {accept ? 'Accept' : 'Decline'}
              </button>
            ))}
          </div>
        </div>
      ))}

      {isLoading ? (
        <div className="p-8 text-center text-xs font-mono text-neutral-400">
          Syncing inbox messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="p-8 rounded-2xl bg-o1-well border border-dashed border-white/[0.07] text-center space-y-2">
          <Inbox className="w-6 h-6 text-neutral-500 mx-auto" />
          <h5 className="text-xs font-bold text-neutral-300 font-tactical tracking-wider">
            No messages yet
          </h5>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto leading-relaxed">
            Athlete messages appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {!coachId ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const text = reply.trim();
                const athleteId = messages.find((row) => row.athleteId)?.athleteId || '';
                if (!text || !athleteId) return;
                void (async () => {
                  const { getAuthenticatedUserId } = await import('../../../services/authUser');
                  const id = await getAuthenticatedUserId();
                  if (!id) return;
                  const ok = await sendCoachMessage({
                    coachId: id,
                    athleteId,
                    senderName: profileName || 'Coach',
                    message: text,
                  });
                  if (!ok) return;
                  setReply('');
                  const data = await fetchCoachMessages(id);
                  setMessages(data);
                })();
              }}
            >
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Reply"
                className="h-[44px] min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-[#161616] px-3 text-[13px] text-white outline-none"
              />
              <button type="submit" className="h-[44px] rounded-xl bg-white px-4 text-[13px] font-semibold text-neutral-950">
                Send
              </button>
            </form>
          ) : null}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="text-left bg-o1-well p-3 rounded-2xl border border-white/[0.07] space-y-1"
            >
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-sky-400 font-bold">{msg.sender}</span>
                <span className="text-neutral-400">{msg.time}</span>
              </div>
              <p className="text-xs text-neutral-200">
                &ldquo;{msg.message}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
