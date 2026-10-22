import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, ChevronRight } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

const DISMISS_KEY = 'o1fc_health_disclaimer_dismissed';
const DISMISS_EVENT = 'o1fc:health-disclaimer-dismissed';
let sessionDismissed = false;

interface Props {
  onLearnMore?: () => void;
  compact?: boolean;
}

export const HealthDisclaimerBanner: React.FC<Props> = ({ onLearnMore, compact = false }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const hide = () => setDismissed(true);
    window.addEventListener(DISMISS_EVENT, hide);
    return () => window.removeEventListener(DISMISS_EVENT, hide);
  }, []);

  if (dismissed || sessionDismissed) return null;

  const dismiss = () => {
    tactileEngine.triggerSelectionBuzz();
    sessionDismissed = true;
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // storage unavailable: stays hidden for this session only
    }
    setDismissed(true);
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  return (
    <div className="w-full bg-o1-card border border-o1-yellow/30 rounded-2xl p-3 shadow-sm flex items-start gap-2.5 transition-colors">
      <div className="p-1 rounded-lg bg-o1-yellow/10 border border-o1-yellow/30 shrink-0 mt-0.5">
        <ShieldAlert className="w-3.5 h-3.5 text-o1-yellow" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-o1-label font-num font-black tracking-wider text-o1-yellow">
            Medical &amp; Biomechanical Disclaimer
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="text-o1-muted hover:text-white -m-2 p-2 rounded cursor-pointer"
            aria-label="Dismiss disclaimer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-o1-label font-num text-o1-muted leading-tight">
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
            className="text-o1-label font-num font-bold text-o1-ok hover:underline flex items-center gap-0.5 cursor-pointer pt-0.5"
          >
            <span>Read the full terms</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
