import React, { useState } from 'react';
import { X, Check, Send } from 'lucide-react';
import { ExploreCoach } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

interface CoachDirectMessageModalProps {
  coach: ExploreCoach | null;
  onClose: () => void;
}

export const CoachDirectMessageModal: React.FC<CoachDirectMessageModalProps> = ({ coach, onClose }) => {
  const [messageSent, setMessageSent] = useState(false);
  const [messageText, setMessageText] = useState('');

  if (!coach) return null;

  return (
    <div
      id="coach-message-modal"
      className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={() => {
        onClose();
        setMessageSent(false);
        setMessageText('');
      }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#121214] border border-neutral-800 p-5 flex flex-col gap-4 shadow-2xl text-white animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={coach.avatar}
              alt={coach.name}
              className="w-9 h-9 rounded-full object-cover border border-[#C4121A]"
            />
            <div>
              <h3 className="text-xs font-bold text-white font-tactical">Direct Message with {coach.name}</h3>
              <p className="text-[10px] text-neutral-400 font-mono">{coach.handle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              setMessageSent(false);
              setMessageText('');
            }}
            className="w-8 h-8 rounded-full bg-[#18181b] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {messageSent ? (
          <div className="p-4 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex flex-col items-center justify-center text-center gap-1.5 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4]">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#06b6d4] font-tactical uppercase">Message Delivered</h4>
            <p className="text-[11px] text-neutral-300">
              {coach.name} has been notified and will reply via your notification inbox.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Send a training or mobility inquiry to ${coach.name}...`}
              rows={3}
              className="w-full p-3 bg-[#09090b] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A] resize-none"
            />
            <button
              type="button"
              disabled={!messageText.trim()}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setMessageSent(true);
                setTimeout(() => {
                  onClose();
                  setMessageSent(false);
                  setMessageText('');
                }, 2000);
              }}
              className="w-full py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#a50e15] text-white disabled:opacity-40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-tactical uppercase tracking-wider"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
