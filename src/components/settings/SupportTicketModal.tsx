import React, { useState } from 'react';
import { X, Loader2, CheckCircle, Monitor } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { useModalBackHandler } from '@/utils/modalHistory';

const CATEGORIES = [
  'Bug Report',
  'Account & Billing',
  'Workout & Hardware Sync',
  'Feature Request',
  'General Support',
] as const;

type Category = (typeof CATEGORIES)[number];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

export function SupportTicketModal({ isOpen, onClose, triggerToast }: Props) {
  const [category, setCategory] = useState<Category>('General Support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const resetForm = () => {
    setCategory('General Support');
    setSubject('');
    setMessage('');
    setIncludeDiagnostics(true);
    setSubmitting(false);
    setSuccess(false);
    setTicketId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useModalBackHandler(isOpen, handleClose, 'support_ticket_modal');

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);

    try {
      if (!isSupabaseConfigured()) throw new Error('Database not configured');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'anonymous',
        category,
        subject: subject.trim(),
        message: message.trim(),
        device_info: includeDiagnostics ? {
          userAgent: navigator.userAgent,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
          platform: navigator.platform,
          appVersion: '1.0.0',
          timestamp: new Date().toISOString(),
        } : null,
        status: 'open',
      }).select('id').maybeSingle();

      if (error) throw error;

      const shortId = data?.id ? data.id.slice(0, 8).toUpperCase() : Math.random().toString(36).slice(2, 10).toUpperCase();
      setTicketId(`#TK-${shortId}`);
      setSuccess(true);

      setTimeout(() => {
        handleClose();
        triggerToast('Support ticket submitted successfully');
      }, 2500);
    } catch {
      triggerToast('Failed to submit ticket. Please try again.');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[400] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] bg-zinc-50 dark:bg-zinc-950 sm:rounded-2xl rounded-t-[1.5rem] overflow-hidden flex flex-col border-t sm:border border-zinc-200/80 dark:border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-2 pb-2 px-4 flex flex-col items-center border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shrink-0">
          <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mb-1.5 sm:hidden" />
          <div className="w-full flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              {success ? 'Ticket Submitted' : 'Contact Support'}
            </h2>
            <button
              onClick={handleClose}
              className="btn-nude-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                Ticket Submitted Successfully!
              </p>
              <p className="text-xs font-mono text-red-600 dark:text-red-400 mt-1">
                Ticket ID: {ticketId}
              </p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[260px]">
              Our support team has received your request and will review it shortly.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Category chips */}
              <div>
                <label className="text-[10px] font-bold tracking-wider text-stone-400 dark:text-zinc-500 uppercase mb-1.5 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        category === cat
                          ? 'bg-stone-900 dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-stone-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] font-bold tracking-wider text-stone-400 dark:text-zinc-500 uppercase mb-1 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 outline-none focus:border-stone-400 dark:focus:border-zinc-500 transition-colors"
                  maxLength={120}
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-bold tracking-wider text-stone-400 dark:text-zinc-500 uppercase mb-1 block">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 outline-none focus:border-stone-400 dark:focus:border-zinc-500 transition-colors resize-none leading-relaxed"
                  maxLength={2000}
                />
              </div>

              {/* Diagnostics toggle */}
              <button
                type="button"
                onClick={() => setIncludeDiagnostics(!includeDiagnostics)}
                className="flex items-center gap-2.5 cursor-pointer w-full text-left bg-white dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    includeDiagnostics
                      ? 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {includeDiagnostics && (
                    <svg className="w-2.5 h-2.5 text-white dark:text-black" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                    Include device & app version diagnostics
                  </span>
                </div>
              </button>
            </div>

            {/* Submit */}
            <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shrink-0">
              <button
                onClick={handleSubmit}
                disabled={submitting || !subject.trim() || !message.trim()}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
