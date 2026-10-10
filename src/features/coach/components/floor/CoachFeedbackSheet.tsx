import React, { useEffect, useState } from 'react';
import { Dumbbell, User, X } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { AthleteAvatar } from './FloorAthleteCard';

const QUICK_REPLIES = [
  'Great session',
  'Form approved',
  'Add 5 kg next time',
  'Deload next session',
  'Slow down the reps',
  'Rest day tomorrow',
  'Eat more protein',
  'Get more sleep',
] as const;

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
        className="w-full rounded-t-3xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 pb-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <AthleteAvatar name={target.name} avatar={target.avatar} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#EAE8DF]">{target.name}</p>
            <p className="text-[12px] text-[#8A887F]">Only {target.name.split(' ')[0]} sees this.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center text-[#8A887F]">
            <X size={20} />
          </button>
        </div>

        <p className="mt-4 text-[12px] font-semibold text-[#8A887F]">Quick reply</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => send(reply)}
              className="o1-pill border border-[#1F1F1F] bg-black text-[12px] font-semibold text-[#EAE8DF] active:scale-[0.98]"
            >
              {reply}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-semibold text-[#8A887F]">Leave a note</p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={`Write something for ${target.name.split(' ')[0]}`}
          className="mt-2 w-full resize-none rounded-xl border border-[#1F1F1F] bg-black px-3 py-2 text-[13px] text-[#EAE8DF] outline-none focus:border-[#C4121A]"
        />
        <button
          type="button"
          disabled={!note.trim()}
          onClick={() => send(note)}
          className="mt-2 h-[44px] w-full rounded-xl bg-[#C4121A] text-[13px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
        >
          Send note
        </button>

        {onSendWorkout || onViewProfile ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {onSendWorkout ? (
              <button
                type="button"
                onClick={onSendWorkout}
                className="flex h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#1F1F1F] bg-black text-[13px] font-semibold text-[#EAE8DF] active:scale-[0.98]"
              >
                <Dumbbell size={15} />
                Send a workout
              </button>
            ) : null}
            {onViewProfile ? (
              <button
                type="button"
                onClick={onViewProfile}
                className="flex h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#1F1F1F] bg-black text-[13px] font-semibold text-[#EAE8DF] active:scale-[0.98]"
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
