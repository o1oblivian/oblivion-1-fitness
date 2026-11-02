import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { LEGAL_URLS, openLegalUrl } from '../../../services/apiBase';

interface Props {
  userType: 'athletes' | 'coaches';
  onOpenHealth?: () => void;
  onOpenDisclaimer?: () => void;
  onShowToast?: (msg: string) => void;
}

const ATHLETE_FEATURES = [
  { label: 'Workout Logger', value: 'All exercises' },
  { label: 'Fuel Tracker', value: 'Full + Intel Scan' },
  { label: 'Hydration Tracker', value: '✓' },
  { label: 'Supplement Tracker', value: '✓' },
  { label: 'Alcohol Impact Tracker', value: '✓' },
  { label: 'Weekly Progress Charts', value: '✓' },
  { label: 'Share Progress Cards', value: '✓' },
  { label: 'Coach Marketplace', value: 'Browse + message' },
  { label: 'Wallpapers', value: 'All unlocked' },
  { label: 'Watch Dial Faces', value: 'All unlocked' },
  { label: 'Body stats', value: 'Deep Analytics' },
  { label: 'Progress Photo Vault', value: 'Unlimited' },
  { label: 'Data Export', value: '✓' },
  { label: '5-Axis Athlete Polygon', value: '✓' },
  { label: 'Training load balance', value: '✓' },
];

const COACH_FEATURES = [
  { label: 'Client Roster', value: 'Unlimited' },
  { label: 'Program Sales Fee', value: '10%' },
  { label: 'Workout Dispatch', value: '✓' },
  { label: 'Client Detail View', value: '✓' },
  { label: 'Form Check Video Review', value: '✓' },
  { label: 'Client Consent Sharing', value: '✓' },
  { label: 'Transformation Studio', value: '✓' },
  { label: 'Client Progress Export', value: '✓' },
  { label: 'Earnings Dashboard', value: '✓' },
  { label: 'Club Pass Pro features', value: '✓' },
];

const COLLAPSED_ROWS = 8;

export const MembershipPlanFeatures: React.FC<Props> = ({
  userType,
  onOpenHealth,
  onOpenDisclaimer,
  onShowToast,
}) => {
  const [showExt, setShowExt] = useState(false);
  const base = userType === 'athletes' ? ATHLETE_FEATURES : COACH_FEATURES;
  const displayList = showExt ? base : base.slice(0, COLLAPSED_ROWS);
  const headingText = userType === 'athletes' ? 'Included in premium pro' : 'Included in coach pro';

  return (
    <div className="space-y-3 pt-2 text-o1-ink-soft">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <span className="text-o1-label font-bold font-num tracking-wider text-white">
          {headingText}
        </span>
        <span className="text-o1-label font-num text-o1-muted">Compare Plans</span>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {displayList.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 text-xs">
            <div className="flex items-center gap-1.5 text-o1-stone">
              <span>{item.label}</span>
              <Info className="w-3 h-3 text-o1-faint" />
            </div>
            <span className="font-num font-bold text-white text-o1-label">{item.value}</span>
          </div>
        ))}
      </div>

      {base.length > COLLAPSED_ROWS && (
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setShowExt(!showExt);
          }}
          className="w-full flex items-center justify-center gap-1 text-xs text-o1-muted hover:text-white py-1 transition cursor-pointer font-num"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showExt ? 'rotate-180' : ''}`}
          />
          <span>{showExt ? 'Show less' : `Show all ${base.length} features`}</span>
        </button>
      )}

      {/* O1FC Intel Insights Pill */}
      <div className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">Progress insights</p>
          <p className="text-o1-label text-o1-muted">
            Smart recovery, nutrition &amp; volume periodization
          </p>
        </div>
        <span className="text-o1-label font-sans font-semibold text-o1-muted">
          Included with Pro
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 text-o1-label text-o1-muted underline pt-1">
        <a
          href={LEGAL_URLS.appleEula}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();
            void openLegalUrl('eula');
          }}
          className="hover:text-white"
        >
          Terms of Use (EULA)
        </a>
        <span>•</span>
        <a
          href={LEGAL_URLS.privacy}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();
            void openLegalUrl('privacy');
          }}
          className="hover:text-white"
        >
          Privacy Policy
        </a>
        <span>•</span>
        <a
          href={LEGAL_URLS.terms}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();
            void openLegalUrl('terms');
          }}
          className="hover:text-white"
        >
          Terms
        </a>
        <span>•</span>
        <button
          type="button"
          onClick={() => {
            if (onOpenHealth) onOpenHealth();
            else if (onOpenDisclaimer) onOpenDisclaimer();
            else onShowToast?.('Health Disclaimer');
          }}
          className="hover:text-white cursor-pointer"
        >
          Health Disclaimer
        </button>
      </div>
    </div>
  );
};
