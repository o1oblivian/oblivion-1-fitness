import React, { useState } from 'react';
import { X, Headphones, Mail, Copy, Check, Send } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { SUPPORT_EMAIL, openSupportEmail } from '../../services/supportMail';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const TOPICS: { value: string; label: string }[] = [
  { value: 'technical', label: "Something isn't working" },
  { value: 'billing', label: 'Club Pass & billing' },
  { value: 'other', label: 'Something else' },
];

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [topic, setTopic] = useState('technical');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    tactileEngine.triggerSelectionBuzz();
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast?.(`Couldn't copy. The address is ${SUPPORT_EMAIL}`);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    tactileEngine.triggerSelectionBuzz();
    const label = TOPICS.find((t) => t.value === topic)?.label ?? 'Support';
    openSupportEmail(`Support: ${label}`, text);
    setMessage('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-support-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150"
    >
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl flex flex-col overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-o1-teal/10 border border-o1-teal/30">
              <Headphones className="w-4 h-4 text-o1-teal" />
            </div>
            <div>
              <h2
                id="contact-support-title"
                className="text-sm font-bold tracking-wider font-tactical"
              >
                Contact support
              </h2>
              <p className="text-o1-label font-mono text-neutral-500">We reply by email</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-neutral-400 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="py-4 space-y-3 flex-1 overflow-y-auto no-scrollbar">
          <div className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-xs font-mono truncate text-neutral-300 select-text">
                {SUPPORT_EMAIL}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyEmail()}
              className="min-h-[44px] px-3 rounded-xl bg-white/[0.08] text-o1-label font-mono flex items-center gap-1 hover:text-white cursor-pointer shrink-0"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="support-topic"
              className="text-o1-label font-tactical font-bold text-neutral-500"
            >
              Topic
            </label>
            <select
              id="support-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono focus:outline-hidden focus:border-o1-crimson"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="support-message"
              className="text-o1-label font-tactical font-bold text-neutral-500"
            >
              Message
            </label>
            <textarea
              id="support-message"
              required
              rows={4}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened, and what were you trying to do?"
              className="w-full p-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono focus:outline-hidden focus:border-o1-crimson resize-none select-text"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="w-full min-h-[44px] rounded-xl bg-o1-teal text-white text-xs font-tactical font-semibold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Write email</span>
          </button>
          <p className="text-o1-label font-sans text-neutral-500 text-center">
            Opens your mail app with this message. Nothing is sent until you press send there.
          </p>
        </form>
      </div>
    </div>
  );
};
