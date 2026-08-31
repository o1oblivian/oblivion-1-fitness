import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HeartPulse,
  Dumbbell,
  Shield,
  Lock,
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
          className="fixed inset-0 z-[300] bg-white dark:bg-[#121414] overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="bg-white dark:bg-[#121414] text-[#000000] dark:text-[#FFFFFF] w-full h-full min-h-screen shadow-2xl border border-[rgba(0,0,0,0.08)] dark:border-[#2A2E2D] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)] dark:border-[#2A2E2D] shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                <h2 className="text-sm font-display font-black tracking-tight">
                  Full Legal Agreements
                </h2>
              </div>
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-28">
              {LEGAL_SECTIONS.map((section, idx) => {
                const Icon = iconMap[section.icon] || Shield;
                return (
                  <div
                    key={section.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <h3 className="font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 text-[#000000] dark:text-white">
                      <Icon className="w-4 h-4 text-red-600" />
                      {idx + 1}. {section.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {section.body}
                    </p>
                  </div>
                );
              })}

              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-2 font-mono">
                Last updated: 12 August 2026 • O1FC Fitness Technologies
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[rgba(0,0,0,0.08)] dark:border-[#2A2E2D] shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
