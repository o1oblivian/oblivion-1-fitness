import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { LEGAL_URLS, openLegalUrl } from '../../../services/apiBase';

interface Props {
  userType: 'athletes' | 'coaches';
  selectedProductId?: string;
  onOpenHealth?: () => void;
  onOpenDisclaimer?: () => void;
  onShowToast?: (msg: string) => void;
}

export const MembershipPlanFeatures: React.FC<Props> = ({
  userType,
  selectedProductId,
  onOpenHealth,
  onOpenDisclaimer,
  onShowToast,
}) => {
  const [showExt, setShowExt] = useState(false);
  const isFreeAthlete = selectedProductId === 'o1fc_core_free';
  const isFreeCoach = selectedProductId === 'o1fc_coach_free';

  const athleteFeatures = [
    { label: 'Likes / Connections', value: isFreeAthlete ? '5 / day' : 'Unlimited' },
    { label: 'Direct Messages', value: isFreeAthlete ? '3 / day' : 'Unlimited' },
    { label: 'Radar Radius', value: isFreeAthlete ? '25 km' : '250 km' },
    { label: 'Travel Pass', value: selectedProductId === 'o1fc_pro_travel_monthly' ? '✓' : isFreeAthlete ? '—' : 'Add-on' },
    { label: 'HD Form Reels', value: '✓' },
    { label: 'Workout Logger', value: 'All exercises' },
    { label: 'Fuel Tracker', value: isFreeAthlete ? 'Basic' : 'Full + Intel Scan' },
    { label: 'Hydration Tracker', value: '✓' },
    { label: 'Supplement Tracker', value: '✓' },
    { label: 'Alcohol Impact Tracker', value: '✓' },
    { label: 'Weekly Progress Charts', value: '✓' },
    { label: 'Share Progress Cards', value: '✓' },
    { label: 'Coach Marketplace', value: isFreeAthlete ? 'Browse + message' : 'Priority Access' },
    { label: 'Wallpapers', value: isFreeAthlete ? '3 presets' : 'All unlocked' },
    { label: 'Watch Dial Faces', value: isFreeAthlete ? '1 default' : 'All unlocked' },
    { label: 'Telemetry / Body Metrics', value: isFreeAthlete ? 'View only' : 'Deep Analytics' },
    { label: 'Progress Photo Vault', value: isFreeAthlete ? '5 photos' : 'Unlimited' },
    { label: 'Data Export', value: isFreeAthlete ? '—' : '✓' },
  ];

  const athleteExtFeatures = [
    { label: '5-Axis Athlete Polygon', value: isFreeAthlete ? '—' : '✓' },
    { label: 'ACWR Load Balance Sweet-Spot', value: isFreeAthlete ? '—' : '✓' },
    { label: 'Metabolic Locomotion Audits', value: isFreeAthlete ? '—' : '✓' },
    { label: 'Intracellular Hydration Model', value: isFreeAthlete ? '—' : '✓' },
  ];

  const coachFeatures = [
    { label: 'Client Roster', value: isFreeCoach ? 'Up to 5 athletes' : 'Unlimited' },
    { label: 'Program Sales Fee', value: isFreeCoach ? '15%' : '10%' },
    { label: 'Workout Dispatch', value: '✓' },
    { label: 'Client Detail View', value: '✓' },
    { label: 'Form Check Video Review', value: '✓' },
    { label: 'Client Consent Sharing', value: '✓' },
    { label: 'Transformation Studio', value: '✓' },
    { label: 'Client Progress Export', value: '✓' },
    { label: 'Earnings Dashboard', value: '✓' },
  ];

  const coachExtFeatures = [
    { label: 'Automated Periodization', value: isFreeCoach ? '—' : '✓' },
    { label: 'Team Kinetic Rollups', value: isFreeCoach ? '—' : '✓' },
    { label: 'Soft-Tissue Injury Predictor', value: isFreeCoach ? '—' : '✓' },
    { label: 'Priority Support Concierge', value: isFreeCoach ? '—' : '✓' },
  ];

  const base = userType === 'athletes' ? athleteFeatures : coachFeatures;
  const ext = userType === 'athletes' ? athleteExtFeatures : coachExtFeatures;
  const displayList = showExt ? [...base, ...ext] : base.slice(0, 8);

  const headingText =
    userType === 'athletes'
      ? isFreeAthlete
        ? 'Included in core free'
        : 'included in premium pro'
      : isFreeCoach
      ? 'INCLUDED IN COACH STARTER (UP TO 5 ATHLETES)'
      : 'Included in coach pro';

  return (
    <div className="space-y-3 pt-2 text-neutral-200">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <span className="text-[11px] font-bold font-mono tracking-wider text-white">
          {headingText}
        </span>
        <span className="text-[10px] font-mono text-neutral-400">Compare Plans</span>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {displayList.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span>{item.label}</span>
              <Info className="w-3 h-3 text-neutral-500" />
            </div>
            <span className="font-mono font-bold text-white text-[11px]">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setShowExt(!showExt);
        }}
        className="w-full flex items-center justify-center gap-1 text-xs text-neutral-400 hover:text-white py-1 transition cursor-pointer font-mono"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExt ? 'rotate-180' : ''}`} />
        <span>{showExt ? 'Show less' : `Show all ${base.length + ext.length} features`}</span>
      </button>

      {/* O1FC Intelligence Insights Pill */}
      <div className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">O1FC Intelligence Insights</p>
          <p className="text-[10px] text-neutral-400">Smart recovery, nutrition &amp; volume periodization</p>
        </div>
        <span className="text-[11px] font-sans font-semibold text-neutral-400">
          Included with Pro
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-400 underline pt-1">
        <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" className="hover:text-white">Terms of Use (EULA)</a>
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
        <button type="button" onClick={() => { if (onOpenHealth) onOpenHealth(); else if (onOpenDisclaimer) onOpenDisclaimer(); else onShowToast?.('Health Disclaimer'); }} className="hover:text-white cursor-pointer">Health Disclaimer</button>
      </div>
    </div>
  );
};
export default MembershipPlanFeatures;
