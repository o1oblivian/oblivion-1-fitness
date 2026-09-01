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
            className="bg-white text-black w-full h-full min-h-screen shadow-2xl border-2 border-black flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 border-2 border-black flex items-center justify-center text-red-600">
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight uppercase text-black">
                    Legal Agreements & Disclaimers
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">O1FC Official Protocol</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-red-50 text-black hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-28 bg-white">
              {LEGAL_SECTIONS.map((section, idx) => {
                const Icon = iconMap[section.icon] || Shield;
                return (
                  <div
                    key={section.id}
                    className="p-4 rounded-2xl bg-white border-2 border-black space-y-2 shadow-sm"
                  >
                    <h3 className="font-black text-xs uppercase tracking-wider font-mono flex items-center gap-2 text-black">
                      <span className="w-6 h-6 rounded-lg bg-red-50 border border-black flex items-center justify-center text-red-600 shrink-0">
                        <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                      {idx + 1}. {section.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-zinc-700 whitespace-pre-line font-medium pl-8">
                      {section.body}
                    </p>
                  </div>
                );
              })}

              <p className="text-[10px] text-zinc-500 text-center pt-2 font-mono font-bold">
                Last updated: 12 August 2026 • Oblivion 1 Fitness Club
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t-2 border-black bg-white shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs uppercase tracking-[0.18em] rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all"
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
