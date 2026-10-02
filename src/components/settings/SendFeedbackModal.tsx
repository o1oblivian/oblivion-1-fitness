import React, { useState } from 'react';
import { X, MessageSquare, Star, Send } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface SendFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const CATEGORIES = ['Workout Logging', 'Fuel OS', 'Radar & Spotters', 'App Speed', 'Other'];

export const SendFeedbackModal: React.FC<SendFeedbackModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Workout Logging');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    tactileEngine.playPRCelebration();
    setTimeout(() => {
      setIsSubmitting(false);
      onShowToast?.('Athlete feedback received. Thank you for building Oblivion 1.');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-neutral-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
              <MessageSquare className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-tactical">Athlete Feedback Desk</h2>
              <p className="text-[10px] font-mono text-neutral-500">Shape the Next Oblivion 1 Release</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3 flex-1 overflow-y-auto no-scrollbar">
          <div className="space-y-1 text-center">
            <label className="text-[10px] font-tactical uppercase font-bold text-neutral-500">Rate Athlete Experience</label>
            <div className="flex justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { tactileEngine.triggerSelectionBuzz(); setRating(s); }}
                  className="p-1.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Star className={`w-6 h-6 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 dark:text-neutral-700'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-tactical uppercase font-bold text-neutral-500">Feature Focus</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { tactileEngine.triggerSelectionBuzz(); setCategory(cat); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-[#C4121A] text-white font-bold'
                      : 'bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-tactical uppercase font-bold text-neutral-500">Feedback or Feature Request</label>
            <textarea
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you love or what we can engineer better..."
              className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-hidden focus:border-[#C4121A] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-tactical font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
