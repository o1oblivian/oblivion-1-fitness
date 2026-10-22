import React, { useState } from 'react';
import { X, MessageSquare, Star, Send } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { openSupportEmail } from '../../services/supportMail';

interface SendFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Workout Logging', 'Fuel OS', 'App Speed', 'Other'];

export const SendFeedbackModal: React.FC<SendFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Workout Logging');
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = feedback.trim();
    if (!text) return;
    tactileEngine.triggerSelectionBuzz();
    openSupportEmail(`Feedback: ${category} (${rating}/5)`, text);
    setFeedback('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150"
    >
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl flex flex-col overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-o1-olive/10 border border-o1-olive/30">
              <MessageSquare className="w-4 h-4 text-o1-olive" />
            </div>
            <div>
              <h2
                id="send-feedback-title"
                className="text-sm font-bold tracking-wider font-tactical"
              >
                Athlete Feedback Desk
              </h2>
              <p className="text-o1-label font-num text-o1-faint">
                Shape the Next Oblivion 1 Release
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-o1-muted hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="py-4 space-y-3 flex-1 overflow-y-auto no-scrollbar"
        >
          <div className="space-y-1 text-center">
            <label className="text-o1-label font-tactical font-bold text-o1-faint">
              Rate Athlete Experience
            </label>
            <div className="flex justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setRating(s);
                  }}
                  aria-label={`${s} of 5`}
                  aria-pressed={s <= rating}
                  className="w-11 h-11 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${s <= rating ? 'text-o1-yellow fill-o1-yellow' : 'text-o1-edge'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-o1-label font-tactical font-bold text-o1-faint">
              Feature Focus
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setCategory(cat);
                  }}
                  aria-pressed={category === cat}
                  className={`px-3 min-h-[44px] rounded-xl text-o1-label font-num transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-o1-crimson text-white font-bold'
                      : 'bg-o1-well border border-white/[0.07] text-o1-stone'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="feedback-text"
              className="text-o1-label font-tactical font-bold text-o1-faint"
            >
              Feedback or Feature Request
            </label>
            <textarea
              id="feedback-text"
              required
              rows={4}
              maxLength={2000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you love or what we can engineer better..."
              className="w-full p-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-num focus:outline-hidden focus:border-o1-crimson resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!feedback.trim()}
            className="w-full min-h-[44px] rounded-xl bg-o1-olive hover:bg-o1-olive-strong text-white text-xs font-tactical font-semibold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Write email</span>
          </button>
          <p className="text-o1-label font-sans text-o1-faint text-center">
            Opens your mail app with this feedback. Nothing is sent until you press send there.
          </p>
        </form>
      </div>
    </div>
  );
};
