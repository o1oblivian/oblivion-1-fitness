import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCw,
  Flame,
  Users,
  Target,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Dumbbell
} from 'lucide-react';
import {
  OnboardingIntent,
  SupportChoice,
  CoachingStyle,
  O1LaunchProtocolData,
  persistLaunchProtocol,
} from '@/utils/onboardingStore';
import { LiquidSilkBackground } from '@/components/ui/LiquidSilkBackground';

interface O1LaunchProtocolProps {
  isOpen: boolean;
  userEmail?: string;
  initialName?: string;
  onComplete: (data: {
    displayName: string;
    handle: string;
    profileImage: string | null;
    workoutFocus: string;
    role: 'athlete' | 'coach';
    intent: OnboardingIntent;
  }) => void;
  onNavigateTo?: (mode: 'tracker' | 'fuel' | 'coach' | 'client' | 'community' | 'goal') => void;
}

const PRIMARY_FOCUS_OPTIONS = [
  { id: 'hyrox', label: 'HYROX & Racing' },
  { id: 'strength', label: 'Strength & 1RM' },
  { id: 'hypertrophy', label: 'Hypertrophy & Volume' },
  { id: 'functional', label: 'Functional Metcon' },
  { id: 'longevity', label: 'Longevity & Health' },
];

export const O1LaunchProtocol: React.FC<O1LaunchProtocolProps> = ({
  isOpen,
  userEmail = '',
  initialName = '',
  onComplete,
  onNavigateTo,
}) => {
  const [displayName, setDisplayName] = useState(
    initialName || (userEmail ? userEmail.split('@')[0] : 'Athlete')
  );
  const [handle] = useState(
    userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : 'athlete'
  );
  const [primaryFocus, setPrimaryFocus] = useState<string>('hyrox');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const protocolData: O1LaunchProtocolData = {
      intent: 'train',
      role: 'athlete',
      displayName: displayName.trim() || 'Athlete',
      handle: handle.trim().replace(/^@/, '').toLowerCase() || 'athlete',
      bio: '',
      height: '178',
      weight: '75',
      age: '26',
      avatarUrl: null,
      disciplines: [primaryFocus],
      trainingFrequency: '4-5 days',
      supportChoice: 'independent',
      coachingStyle: 'performance',
      radarEnabled: true,
      broadcastActive: true,
      stealthMode: false,
    };

    try {
      await persistLaunchProtocol(userEmail, protocolData);
    } catch (e) {
      console.warn('Protocol persist warn:', e);
    }

    onComplete({
      displayName: protocolData.displayName,
      handle: protocolData.handle,
      profileImage: null,
      workoutFocus: primaryFocus,
      role: 'athlete',
      intent: 'train',
    });
  };

  return (
    <AnimatePresence>
      <div 
        id="o1-launch-protocol-sheet"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white dark:bg-[#121214] text-zinc-900 dark:text-white rounded-[28px] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
        >
          {/* Subtle Dynamic Ambient Canvas Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <LiquidSilkBackground />
          </div>

          {/* Top Bar / Header */}
          <div className="relative z-10 pt-6 px-6 pb-4 border-b border-black/5 dark:border-white/5 text-center">
            {/* O1FC Apple Pro Badge */}
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-b from-red-500 to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/20 mb-3">
              <Flame className="w-6 h-6 fill-white stroke-none" />
            </div>

            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-red-600 dark:text-red-400 uppercase">
              Oblivion 1 Fitness Club
            </p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-1">
              Welcome to O1FC
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Your unified operating system for high-performance training, AI fuel intelligence, and coach telemetry.
            </p>
          </div>

          {/* Scrollable Content Body */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* The 3 Core Pro Pillars (Apple HIG Standard) */}
            <div className="space-y-3">
              {/* Feature 1: Training OS Pro */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCw className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                    Training OS Pro & Rotary Dial
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Calibrate daily targets with rotary dial gestures, log high-precision sets, and track 1RM curves.
                  </p>
                </div>
              </div>

              {/* Feature 2: Fuel OS */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                    Fuel OS & AI Multimodal Vision
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Deconstruct meals with live computer vision and verified USDA macro breakdowns in seconds.
                  </p>
                </div>
              </div>

              {/* Feature 3: Coach Hub & Tandem */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                    Coach Hub & Tandem Sync
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Sync live sets with gym partners in real time and access professional roster telemetry.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Athlete Customization */}
            <div className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                  Primary Athletic Focus
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">1-Tap Select</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRIMARY_FOCUS_OPTIONS.map((opt) => {
                  const isSelected = primaryFocus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPrimaryFocus(opt.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                          : 'bg-white/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/10 border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Footer (With Hardware Safe-Area Cushion) */}
          <div 
            className="relative z-10 px-5 sm:px-6 pt-3 pb-5 border-t border-black/5 dark:border-white/5 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md"
            style={{
              paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))'
            }}
          >
            <button
              id="onboarding-continue-button"
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full h-12 sm:h-13 bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white text-sm sm:text-base font-bold tracking-wide rounded-2xl shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Calibrating...' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Apple Privacy Notice */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 mt-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Biometric telemetry is encrypted on device.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default O1LaunchProtocol;
