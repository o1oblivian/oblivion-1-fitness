import React, { useEffect, useState } from 'react';
import { Dumbbell, User, X } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { AthleteAvatar } from './FloorAthleteCard';
import { QUICK_REPLIES } from './reviewBadges';

interface CoachFeedbackSheetProps {
  target: { name: string; avatar?: string } | null;
  onClose: () => void;
  onSend: (message: string) => void;
  onSendWorkout?: () => void;
  onViewProfile?: () => void;
}

export const CoachFeedbackSheet: React.FC<CoachFeedbackSheetProps> = ({ target, onClose, onSend, onSendWorkout, onViewProfile }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote('');
  }, [target]);

  if (!target) return null;

  const send = (message: string) => {
    const clean = message.trim();
    if (!clean) return;
    tactileEngine.triggerImpactPulse();
    onSend(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Feedback for ${target.name}`}
        className="w-full rounded-t-3xl border border-white/[0.07] bg-o1-sheet p-4 pb-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <AthleteAvatar name={target.name} avatar={target.avatar} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-o1-text">{target.name}</p>
            <p className="text-[12px] text-o1-muted">Only {target.name.split(' ')[0]} sees this.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center text-o1-muted">
            <X size={20} />
          </button>
        </div>

        <p className="mt-4 text-[12px] font-semibold text-o1-muted">Quick reply</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => send(reply)}
              className="o1-pill border border-white/[0.07] bg-o1-canvas text-[12px] font-semibold text-o1-text active:scale-[0.98]"
            >
              {reply}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-semibold text-o1-muted">Leave a note</p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={`Write something for ${target.name.split(' ')[0]}`}
          className="mt-2 w-full resize-none rounded-xl border border-white/[0.07] bg-o1-canvas px-3 py-2 text-[13px] text-o1-text outline-none focus:border-o1-crimson"
        />
        <button
          type="button"
          disabled={!note.trim()}
          onClick={() => send(note)}
          className="mt-2 h-[44px] w-full rounded-xl bg-o1-crimson text-[13px] font-semibold text-o1-text active:scale-[0.98] disabled:opacity-40"
        >
          Send note
        </button>

        {onSendWorkout || onViewProfile ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {onSendWorkout ? (
              <button
                type="button"
                onClick={onSendWorkout}
                className="flex h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-o1-canvas text-[13px] font-semibold text-o1-text active:scale-[0.98]"
              >
                <Dumbbell size={15} />
                Send a workout
              </button>
            ) : null}
            {onViewProfile ? (
              <button
                type="button"
                onClick={onViewProfile}
                className="flex h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-o1-canvas text-[13px] font-semibold text-o1-text active:scale-[0.98]"
              >
                <User size={15} />
                View profile
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
