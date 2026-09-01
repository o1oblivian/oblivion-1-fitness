import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HeartPulse,
  Dumbbell,
  Shield,
  Lock,
  FileCheck,
} from 'lucide-react';
import { LEGAL_SECTIONS } from '../utils/legalContent';

interface LegalAgreementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Dumbbell,
  Shield,
  Lock,
};

export const LegalAgreementsModal: React.FC<LegalAgreementsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[700] bg-black/70 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="bg-white/95 dark:bg-[#121418]/95 backdrop-blur-2xl text-zinc-900 dark:text-white w-full max-w-xl max-h-[90vh] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] border border-white/80 dark:border-white/10 flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <Shield className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                    Legal Agreements & Disclaimers
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">O1FC Official Protocol • Health & Security</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-transparent">
              {LEGAL_SECTIONS.map((section, idx) => {
                const Icon = iconMap[section.icon] || Shield;
                return (
                  <div
                    key={section.id}
                    className="p-4.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2"
                  >
                    <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2.5 text-zinc-900 dark:text-white">
                      <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                      </span>
                      <span>{idx + 1}. {section.title}</span>
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium pl-8.5">
                      {section.body}
                    </p>
                  </div>
                );
              })}

              <div className="p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/30 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-bold">
                  <FileCheck className="w-4 h-4 stroke-[2.2]" />
                  <span>Oblivion 1 Fitness Club Official Protocol</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Last updated: 12 August 2026 • Encrypted end-to-end telemetry
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
              <button
                onClick={onClose}
                className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs uppercase tracking-[0.18em] rounded-2xl shadow-md active:scale-[0.99] cursor-pointer transition-all flex items-center justify-center"
              >
                Close & Return
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
