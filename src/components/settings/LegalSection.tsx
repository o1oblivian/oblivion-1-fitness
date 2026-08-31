import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { SectionHeader, SettingsGroup, SettingsRow } from './SettingsShared';

export function LegalSection() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div>
      <SectionHeader title="Legal & Agreements" />
      <SettingsGroup>
        <SettingsRow
          label="Terms & Privacy Policy"
          sublabel="Usage terms, data protection rights & athletic disclaimer"
          onClick={() => setShowTerms(true)}
        />
      </SettingsGroup>

      {showTerms && (
        <div className="fixed inset-0 z-[400] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150" onClick={() => setShowTerms(false)}>
          <div 
            className="w-full max-w-lg max-h-[85vh] bg-zinc-50 dark:bg-zinc-950 rounded-t-[1.5rem] sm:rounded-2xl overflow-hidden flex flex-col border-t sm:border border-zinc-200/80 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 pb-2 px-4 flex flex-col items-center border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mb-1.5 sm:hidden" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Terms & Privacy Policy</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-7 h-7 rounded-full bg-zinc-200/70 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-3.5">
              <section className="bg-white dark:bg-zinc-900/90 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">1. Acceptance of Terms</h3>
                <p>By accessing Oblivion 1 Fitness Club (O1FC Official), you agree to these terms of service and our biometric data privacy policy.</p>
              </section>
              <section className="bg-white dark:bg-zinc-900/90 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">2. Health & Performance Disclaimer</h3>
                <p>Oblivion 1 Fitness Club provides automated strain, workout, and nutrition telemetry. Consult a physician before beginning high-intensity resistance training.</p>
              </section>
              <section className="bg-white dark:bg-zinc-900/90 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">3. Privacy & Data Rights</h3>
                <p>Your biometric telemetry and workout logs are strictly confidential. We never sell your personal data to third parties.</p>
              </section>
            </div>

            <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="w-full py-2 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
