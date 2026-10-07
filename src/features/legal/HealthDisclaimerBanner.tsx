import React, { useState } from 'react';
import { ShieldAlert, X, ChevronRight } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface Props {
  onLearnMore?: () => void;
  compact?: boolean;
}

export const HealthDisclaimerBanner: React.FC<Props> = ({ onLearnMore, compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-o1-card border border-amber-500/30 rounded-2xl p-3 shadow-sm flex items-start gap-2.5 transition-colors">
      <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0 mt-0.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400">
            Medical &amp; Biomechanical Disclaimer
          </span>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setDismissed(true);
            }}
            className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
            aria-label="Dismiss disclaimer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <p className="text-[10px] font-mono text-neutral-400 leading-tight">
          {compact
            ? 'Optical meal estimates & coach directives do not constitute certified medical advice. Consult a physician before heavy load training.'
            : 'Optical meal scans, cardio OCR telemetry, and coach training directives are engineered solely for athletic conditioning reference and do not substitute professional medical diagnosis, cardiology clearance, or dietary prescription.'}
        </p>

        {onLearnMore && (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onLearnMore();
            }}
            className="text-[9px] font-mono font-bold text-[#0EA5E9] hover:underline flex items-center gap-0.5 cursor-pointer pt-0.5"
          >
            <span>Review Full Protocol Terms</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
export default HealthDisclaimerBanner;
