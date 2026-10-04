import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface LegalSheetProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalSheet: React.FC<LegalSheetProps> = ({ type, onClose }) => {
  if (!type) return null;
  const isPrivacy = type === 'privacy';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="bg-white dark:bg-[#121214] border-t sm:border border-neutral-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 shadow-2xl max-h-[80vh] flex flex-col text-neutral-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C4121A]" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider">
              {isPrivacy ? 'Privacy & Data Protection Policy' : 'Terms of Athletic Membership'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 text-xs text-neutral-600 dark:text-neutral-300 space-y-2.5 font-sans leading-relaxed">
          {isPrivacy ? (
            <>
              <p className="font-semibold text-neutral-900 dark:text-white">1. 100% Local-First &amp; Zero-Cloud Architecture</p>
              <p>Oblivion 1 Fitness Club operates as an on-device personal sanctuary. Your workouts, biometric load, body metrics, and nutrition logs write directly to on-device storage. Telemetry is never transmitted to, harvested by, or hosted on remote corporate cloud databases.</p>
              <p className="font-semibold text-neutral-900 dark:text-white">2. Zero Third-Party Tracking</p>
              <p>In full adherence to Apple ATT and Google Play guidelines, we deploy zero third-party advertising SDKs, tracking pixels, or data brokers. All physiological calculations run locally on your device.</p>
              <p className="font-semibold text-neutral-900 dark:text-white">3. Complete User Data Sovereignty &amp; Erasure</p>
              <p>You can export your complete encrypted vault (.o1fc) at any time. You maintain the unconditional right to permanently purge your profile and all on-device records with a single tap in Settings.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-neutral-900 dark:text-white">1. Athletic Waiver & Health Disclaimer</p>
              <p>Oblivion 1 Fitness Club provides automated biomechanical prescriptions for educational and athletic performance purposes only. This platform does not provide medical diagnosis or physical therapy treatment.</p>
              <p className="font-semibold text-neutral-900 dark:text-white">2. Safe Load Progression</p>
              <p>Always warm up adequately and consult a qualified sports physician before initiating high-RPE barbell, plyometric, or cardiovascular testing.</p>
              <p className="font-semibold text-neutral-900 dark:text-white">3. Fair Athletic Conduct</p>
              <p>Members utilizing the Buddy Radar agree to maintain professional gym etiquette, respect communal facilities, and foster a supportive training environment.</p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Acknowledge &amp; Return
        </button>
      </div>
    </div>
  );
};
