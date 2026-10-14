import React, { useState } from 'react';
import { X } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

export const REPORT_REASONS = [
  'Harassment or threats',
  'Sexual or inappropriate content',
  'Fake profile or impersonation',
  'Spam or scam',
  'Looks under 18',
  'Something else',
] as const;

interface SafetyReportSheetProps {
  open: boolean;
  name: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string, alsoBlock: boolean) => void;
  title?: string;
  reasons?: readonly string[];
}

export const SafetyReportSheet: React.FC<SafetyReportSheetProps> = ({ open, name, onClose, onSubmit, title, reasons = REPORT_REASONS }) => {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  if (!open) return null;

  const close = () => {
    setReason('');
    setDetails('');
    setAlsoBlock(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 o1-sheet-scrim" onClick={close}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/[0.07] bg-o1-sheet px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-o1-text">{title ?? `Report ${name || 'this person'}`}</p>
            <p className="mt-0.5 text-[12px] text-o1-muted">Only the Oblivion 1 team sees reports. They are not told it was you.</p>
          </div>
          <button type="button" aria-label="Close" onClick={close} className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center text-o1-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-1.5">
          {reasons.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); setReason(item); }}
              className={`w-full rounded-xl border px-3 py-2.5 text-left text-[13px] ${
                reason === item ? 'border-o1-crimson bg-o1-crimson/15 text-o1-text' : 'border-white/[0.07] bg-o1-surface text-o1-text'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value.slice(0, 1000))}
          placeholder="What happened (optional)"
          className="mt-3 h-20 w-full rounded-xl border border-white/[0.07] bg-o1-surface px-3 py-2 text-[13px] text-o1-text outline-none"
        />
        <button
          type="button"
          role="switch"
          aria-checked={alsoBlock}
          onClick={() => setAlsoBlock((on) => !on)}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-o1-surface px-3 py-2.5 text-left"
        >
          <span className="text-[13px] text-o1-text">Also block {name || 'them'}</span>
          <span className={`h-6 w-11 rounded-full p-0.5 ${alsoBlock ? 'bg-o1-crimson' : 'bg-white/[0.08]'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${alsoBlock ? 'translate-x-5' : ''}`} />
          </span>
        </button>
        <button
          type="button"
          disabled={!reason}
          onClick={() => {
            onSubmit(reason, details.trim(), alsoBlock);
            close();
          }}
          className="mt-3 h-12 w-full rounded-full bg-o1-crimson text-[14px] font-semibold text-white active:bg-o1-crimson-press disabled:opacity-40"
        >
          Send report
        </button>
      </div>
    </div>
  );
};

export default SafetyReportSheet;
