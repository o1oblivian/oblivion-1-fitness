import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Share2, Sparkles, X, MoreVertical, Search, Compass } from 'lucide-react';
import { AppMode } from '../types';
import { FirstTimeOnboardingGuide } from './FirstTimeOnboardingGuide';

interface HeaderActionsProps {
  onOpenProfile?: () => void;
  onOpenVault?: () => void;
  profileImage?: string;
  userName?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenGymNetwork?: () => void;
  onOpenCommunityHub?: () => void;
  onOpenShareGoalCard?: () => void;
  onOpenExportHelp?: () => void;
  onOpenSearch?: () => void;
  onLogout?: () => void;
  syncStatus?: { isOnline: boolean; pendingCount: number };
  onSyncPendingLogs?: () => void;
  showTrigger?: boolean;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  onOpenProfile,
  onOpenVault,
  profileImage,
  userName = "Athlete",
  showToast,
  currentMode,
  onModeChange,
  onOpenCommunityHub,
  onOpenShareGoalCard,
  onOpenSearch,
  showTrigger = true,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [menuOpen]);

  const handleAction = (fn?: () => void) => {
    setMenuOpen(false);
    if (fn) fn();
  };

  return (
    <>

      {showTrigger && <div
        ref={menuRef}
        className="fixed z-[110]"
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)', left: '1rem' }}
      >
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="Profile & Settings"
            className="relative w-10 h-10 rounded-full bg-black/40 ring-2 ring-white/25 shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono font-black text-[11px] text-white uppercase" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {userName.slice(0, 2)}
              </span>
            )}
          </button>

          {/* Compact dropdown menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-11 left-0 w-44 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden"
              >
                {onOpenProfile && (
                  <MenuRow
                    icon={<MoreVertical className="w-4 h-4 text-[#4285F4]" />}
                    label="Profile & Settings"
                    onClick={() => handleAction(onOpenProfile)}
                  />
                )}
                {onOpenCommunityHub && (
                  <MenuRow
                    icon={<Users className="w-4 h-4 text-[#EA4335]" />}
                    label="Community"
                    onClick={() => handleAction(onOpenCommunityHub)}
                  />
                )}
                {onOpenShareGoalCard && (
                  <MenuRow
                    icon={<Share2 className="w-4 h-4 text-[#FBBC05]" />}
                    label="Share"
                    onClick={() => handleAction(onOpenShareGoalCard)}
                  />
                )}
                {onOpenSearch && (
                  <MenuRow
                    icon={<Search className="w-4 h-4 text-[#34A853]" />}
                    label="Search"
                    onClick={() => handleAction(onOpenSearch)}
                  />
                )}
                <MenuRow
                  icon={<Sparkles className="w-4 h-4 text-[#4285F4]" />}
                  label="Intel Insights"
                  onClick={() => handleAction(() => setShowAiModal(true))}
                />
                <MenuRow
                  icon={<Compass className="w-4 h-4 text-[#EA4335]" />}
                  label="System Tutorial"
                  onClick={() => handleAction(() => setShowGuideModal(true))}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>}

      {/* SYSTEM TUTORIAL GUIDE MODAL */}
      {showGuideModal && (
        <FirstTimeOnboardingGuide
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          forceShow={true}
        />
      )}

      {/* AI INTELLIGENCE MODAL */}
      {createPortal(
        <AnimatePresence>
          {showAiModal && (
            <div
              className="fixed inset-0 z-[200] flex items-start justify-center pt-8 sm:pt-14 pb-28 p-4 bg-black/50 overflow-y-auto modal-backdrop-smooth"
              onClick={() => setShowAiModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-neutral-200 rounded-3xl p-3.5 max-w-sm w-full shadow-2xl space-y-2.5 relative overflow-hidden my-0 max-h-[80dvh] overflow-y-auto text-black"
              >
              <button
                onClick={() => setShowAiModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>

              <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center mx-auto shadow-sm"
                style={{ backgroundColor: 'var(--accent-color, #3B624E)' }}>
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-black tracking-tight">
                  Intelligence Co-Pilot
                </h3>
                <p className="text-[11px] text-neutral-500 font-sans mt-1 leading-relaxed">
                  Real-time workout optimization, automated macro tuning, and biometric form feedback powered by Oblivion 1 Intelligence Engine.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-2.5 border border-neutral-200 text-left text-[11px] space-y-2">
                <div className="flex items-center gap-2 text-black">
                  <span className="text-red-500"><Sparkles className="w-3.5 h-3.5 inline" /></span>
                  <span className="font-semibold text-xs">Auto-Adaptive Volume Periodization</span>
                </div>
                <div className="flex items-center gap-2 text-black">
                  <span className="text-red-500"><Sparkles className="w-3.5 h-3.5 inline" /></span>
                  <span className="font-semibold text-xs">Real-Time Fatigue & RPE Adjuster</span>
                </div>
                <div className="flex items-center gap-2 text-black">
                  <span className="text-red-500"><Sparkles className="w-3.5 h-3.5 inline" /></span>
                  <span className="font-semibold text-xs">Metabolic Macro Scanner</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAiModal(false);
                  showToast('Intel insights ready! Use the Food Scan button on the Fuel tab to analyze meals.', 'success');
                }}
                className="w-full py-2 text-white font-extrabold text-xs rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--accent-color, #3B624E)' }}
              >
                Activate Intel Insights
              </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

const MenuRow: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-neutral-200/60 dark:border-neutral-800 last:border-0"
  >
    <span className="text-neutral-500 dark:text-neutral-400 shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);
