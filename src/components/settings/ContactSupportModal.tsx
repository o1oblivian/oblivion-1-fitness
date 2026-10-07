import React, { useState } from 'react';
import { X, Headphones, Mail, Copy, Check, Send } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [topic, setTopic] = useState('technical');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    tactileEngine.triggerSelectionBuzz();
    navigator.clipboard?.writeText('support@oblivionfitness.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('Support email copied to clipboard.');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);
    tactileEngine.playPRCelebration();
    setTimeout(() => {
      setIsSending(false);
      onShowToast?.('Priority support inquiry dispatched to Club HQ.');
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl flex flex-col overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0284c7]/10 border border-[#0284c7]/30">
              <Headphones className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-tactical">Contact Support &amp; Club HQ</h2>
              <p className="text-[10px] font-mono text-neutral-500">24/7 Tactical Concierge Desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-o1-well border border-white/[0.07] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="py-4 space-y-3 flex-1 overflow-y-auto no-scrollbar">
          <div className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-xs font-mono truncate text-neutral-300">support@oblivionfitness.com</span>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-2 py-1 rounded-xl bg-white/[0.08] text-[11px] font-mono flex items-center gap-1 hover:text-white cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-tactical uppercase font-bold text-neutral-500">Inquiry Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono focus:outline-hidden focus:border-o1-crimson"
            >
              <option value="technical">Technical Bug &amp; Telemetry Issue</option>
              <option value="billing">Club Pass &amp; Membership Billing</option>
              <option value="radar">Buddy Radar &amp; Proximity Matching</option>
              <option value="other">General Club Inquiry</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-tactical uppercase font-bold text-neutral-500">Message</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or inquiry with your athlete ID or email..."
              className="w-full p-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono focus:outline-hidden focus:border-o1-crimson resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0284C7] text-white text-xs font-tactical font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Transmitting...' : 'Dispatch Ticket'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
