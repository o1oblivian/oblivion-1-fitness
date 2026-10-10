import React, { useState } from 'react';
import { X, Check, Send } from 'lucide-react';
import { ExploreCoach } from '../reelTypes';
import { tactileEngine } from '../../../services/tactileEngine';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useAuthStore } from '../../../stores/useAuthStore';
import { sendCoachMessage } from '../../coach/services/coachBridge';

interface CoachDirectMessageModalProps {
  coach: ExploreCoach | null;
  onClose: () => void;
}

export const CoachDirectMessageModal: React.FC<CoachDirectMessageModalProps> = ({ coach, onClose }) => {
  const [messageSent, setMessageSent] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const senderName = useAuthStore((s) => s.profile?.name);

  if (!coach) return null;

  const close = () => {
    onClose();
    setMessageSent(false);
    setMessageText('');
    setSendError('');
  };

  return (
    <div
      id="coach-message-modal"
      role="dialog"
      aria-label={`Message ${coach.name}`}
      className="fixed inset-0 z-[60] bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
      onClick={close}
    >
      <div
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 flex flex-col gap-4 shadow-xl text-white overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={coach.avatar}
              alt={coach.name}
              className="w-9 h-9 rounded-full object-cover border border-o1-crimson"
            />
            <div>
              <h3 className="text-xs font-bold text-white font-tactical">Direct Message with {coach.name}</h3>
              <p className="text-[10px] text-neutral-400 font-mono">{coach.handle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-11 h-11 shrink-0 -mr-2 rounded-full flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
            aria-label="Close message"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {messageSent ? (
          <div className="p-4 rounded-xl bg-[#4F8F9A]/10 border border-[#4F8F9A]/30 flex flex-col items-center justify-center text-center gap-1.5 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-[#4F8F9A]/20 flex items-center justify-center text-[#4F8F9A]">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#4F8F9A] font-tactical">Message Delivered</h4>
            <p className="text-[11px] text-neutral-300">
              Sent to {coach.name}. Replies show on your Coach tab.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Send a training or mobility inquiry to ${coach.name}...`}
              rows={3}
              aria-label={`Message to ${coach.name}`}
              className="w-full p-3 bg-black border border-white/[0.07] rounded-xl text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson resize-none"
            />
            {sendError ? <p className="text-[12px] text-[#f0d7a2]">{sendError}</p> : null}
            <button
              type="button"
              disabled={!messageText.trim() || sending}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setSending(true);
                setSendError('');
                void (async () => {
                  const athleteId = await getAuthenticatedUserId();
                  const ok = athleteId
                    ? await sendCoachMessage({ coachId: coach.id, athleteId, senderName: senderName || 'Athlete', message: messageText, from: 'athlete' })
                    : false;
                  setSending(false);
                  if (!ok) {
                    setSendError(athleteId ? 'Message did not send. Try again.' : 'Sign in to message coaches.');
                    return;
                  }
                  setMessageSent(true);
                  setTimeout(close, 2000);
                })();
              }}
              className="w-full min-h-[44px] rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white disabled:opacity-40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-tactical tracking-wider"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending…' : 'Send Message'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
