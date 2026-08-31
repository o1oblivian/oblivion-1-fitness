import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Brain, Dumbbell, BarChart3, Zap, ShieldCheck } from 'lucide-react';

interface PremiumShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialDaysLeft: number;
}

const UNLOCKED_FEATURES = [
  {
    icon: Brain,
    title: 'Intel Coach',
    badge: 'AI ENGINE',
    description: 'Personalized training insights powered by machine intelligence',
  },
  {
    icon: Dumbbell,
    title: 'Training Blueprints',
    badge: 'PRO ACCESS',
    description: 'Elite workout programs built for your body type and target adaptation',
  },
  {
    icon: BarChart3,
    title: 'Weekly Report Cards',
    badge: 'TELEMETRY',
    description: 'Deep performance analytics, volumetric progression, and strain tracking',
  },
  {
    icon: Zap,
    title: 'Smart Load Engine',
    badge: 'ADAPTIVE',
    description: 'Auto-adjusting sets, reps, and resistance based on recovery velocity',
  },
];

export const PremiumShowcaseModal: React.FC<PremiumShowcaseModalProps> = ({
  isOpen,
  onClose,
  trialDaysLeft,
}) => {
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setVisibleCards(0);
      return;
    }
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleCards((prev) => {
          if (prev >= UNLOCKED_FEATURES.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 160);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop with ultra-refined Apple blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[390px] rounded-[28px] overflow-hidden bg-[#121214] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-white"
          >
            {/* Top Navigation Bar with Integrated Dismiss */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-mono font-medium tracking-wider text-zinc-300 uppercase">
                <ShieldCheck className="w-3 h-3 text-red-500" />
                <span>O1FC Pro Access</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 pb-5 pt-1">
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center my-3"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 16, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/15 mb-3 shadow-inner"
                >
                  <Sparkles className="w-6 h-6 text-red-500" />
                </motion.div>

                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  Premium Unlocked
                </h2>
                <p className="text-xs text-zinc-400 mt-1 font-normal tracking-normal">
                  {trialDaysLeft} days complimentary tier — no payment method required
                </p>
              </motion.div>

              {/* Grouped Inset Feature List (Apple HIG Standard) */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden my-4">
                {UNLOCKED_FEATURES.map((feature, idx) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={
                      idx < visibleCards
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 8 }
                    }
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                    className="flex items-start gap-3.5 p-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Monochromatic Apple / OFC Vector Glyphs */}
                    <div className="w-8 h-8 rounded-xl bg-zinc-800/90 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-zinc-200 shadow-sm">
                      <feature.icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[13px] font-semibold text-white tracking-tight">
                          {feature.title}
                        </span>
                        <span className="text-[8.5px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/5">
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-zinc-400 leading-relaxed mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Button - High Contrast OFC Pro Styling */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: visibleCards >= UNLOCKED_FEATURES.length ? 1 : 0.4,
                  y: 0,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold tracking-wide uppercase font-mono shadow-lg shadow-red-950/50 transition-all cursor-pointer border border-red-400/30 flex items-center justify-center gap-2"
              >
                <span>Enter Training OS</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
