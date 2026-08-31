import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Shield, Check } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { LegalAgreementsModal } from './LegalAgreementsModal';

interface OAuthConsentGateProps {
  userId: string;
  userEmail: string;
  onAccepted: () => void;
}

const CONSENT_CHECKS = [
  { id: 'liability', label: 'I accept the Liability Waiver and understand the risks of physical exercise.' },
  { id: 'privacy', label: 'I have read and agree to the Privacy Policy.' },
  { id: 'terms', label: 'I agree to the Terms of Service.' },
  { id: 'medical', label: 'I confirm I am physically fit and cleared for exercise.' },
];

export const OAuthConsentGate: React.FC<OAuthConsentGateProps> = ({
  userId,
  onAccepted,
}) => {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    liability: false,
    privacy: false,
    terms: false,
    medical: false,
  });
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const allAccepted = CONSENT_CHECKS.every((c) => consents[c.id]);

  const handleAccept = async () => {
    if (!allAccepted || loading) return;
    setLoading(true);

    try {
      if (supabase && userId) {
        await supabase.from('profiles').update({
          legal_consented_at: new Date().toISOString(),
          medical_cleared: true,
          terms_version: '2026-03-OFC',
        }).eq('id', userId);
      }
      localStorage.setItem('o1fc_legal_consented', 'true');
      onAccepted();
    } catch {
      localStorage.setItem('o1fc_legal_consented', 'true');
      onAccepted();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[600] bg-white dark:bg-[#09090B] text-zinc-900 dark:text-white flex flex-col items-center justify-center p-6 font-sans antialiased select-none">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Shield className="w-6 h-6 text-zinc-800 dark:text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Almost There</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[280px]">
            Before you continue, please review and accept the required agreements.
          </p>
        </div>

        <div className="space-y-3">
          {CONSENT_CHECKS.map((check) => (
            <label key={check.id} className="flex items-start gap-3 cursor-pointer select-none group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consents[check.id]}
                  onChange={(e) => setConsents((prev) => ({ ...prev, [check.id]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border border-zinc-300 dark:border-zinc-700 peer-checked:bg-[#EA4335] peer-checked:border-[#EA4335] transition-all flex items-center justify-center">
                  {consents[check.id] && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  )}
                </div>
              </div>
              <span className="text-xs leading-snug text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                {check.label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => setShowLegal(true)}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Read Full Agreements
          </button>

          <button
            type="button"
            onClick={handleAccept}
            disabled={!allAccepted || loading}
            className={`w-full py-3 rounded-full bg-[#EA4335] text-white hover:bg-red-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98 ${
              !allAccepted ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Accept & Continue</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      <LegalAgreementsModal isOpen={showLegal} onClose={() => setShowLegal(false)} />
    </div>,
    document.body
  );
};
