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
  Dumbbell,
  MapPin,
  Camera,
  Mic,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import {
  OnboardingIntent,
  SupportChoice,
  CoachingStyle,
  O1LaunchProtocolData,
  persistLaunchProtocol,
} from '@/utils/onboardingStore';

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

  // Hardware Permissions States
  const [locationGranted, setLocationGranted] = useState<boolean>(() => {
    return localStorage.getItem('o1fc_perm_location') === 'granted';
  });
  const [cameraGranted, setCameraGranted] = useState<boolean>(() => {
    return localStorage.getItem('o1fc_perm_camera') === 'granted';
  });
  const [micGranted, setMicGranted] = useState<boolean>(() => {
    return localStorage.getItem('o1fc_perm_mic') === 'granted';
  });
  const [notifGranted, setNotifGranted] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });
  const [requestingPerms, setRequestingPerms] = useState(false);

  if (!isOpen) return null;

  const requestLocationPerm = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          localStorage.setItem('o1fc_perm_location', 'granted');
        },
        () => {
          setLocationGranted(false);
          localStorage.setItem('o1fc_perm_location', 'denied');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  const requestMediaPerm = async (type: 'camera' | 'mic') => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          type === 'camera' ? { video: true } : { audio: true }
        );
        stream.getTracks().forEach((t) => t.stop());
        if (type === 'camera') {
          setCameraGranted(true);
          localStorage.setItem('o1fc_perm_camera', 'granted');
        } else {
          setMicGranted(true);
          localStorage.setItem('o1fc_perm_mic', 'granted');
        }
      } catch {
        if (type === 'camera') {
          setCameraGranted(false);
          localStorage.setItem('o1fc_perm_camera', 'denied');
        } else {
          setMicGranted(false);
          localStorage.setItem('o1fc_perm_mic', 'denied');
        }
      }
    }
  };

  const requestNotifPerm = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const res = await Notification.requestPermission();
        setNotifGranted(res === 'granted');
      } catch {
        // ignore
      }
    }
  };

  const handleConnectAllHardware = async () => {
    setRequestingPerms(true);
    requestLocationPerm();
    await requestMediaPerm('camera');
    await requestMediaPerm('mic');
    await requestNotifPerm();
    setRequestingPerms(false);
  };

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

  const allHardwareConnected = locationGranted && cameraGranted && micGranted && notifGranted;

  return (
    <AnimatePresence>
      <div 
        id="o1-launch-protocol-overlay"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
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
          className="relative w-full max-w-lg bg-white dark:bg-[#121214] text-gray-900 dark:text-white rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88dvh]"
        >
          {/* Top Bar / Header */}
          <div className="relative z-10 pt-5 px-6 pb-3 border-b border-black/5 dark:border-white/10 text-center shrink-0">
            <div className="mx-auto w-11 h-11 rounded-2xl bg-[#C4121A] text-white flex items-center justify-center shadow-lg shadow-red-900/30 mb-2">
              <Flame className="w-5 h-5 fill-white stroke-none" />
            </div>

            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#C4121A] uppercase">
              Oblivion 1 Fitness Club
            </p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white mt-0.5">
              Athlete Launch Protocol
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 max-w-sm mx-auto leading-relaxed">
              Your unified operating system for high-performance training, fuel intelligence, and live telemetry.
            </p>
          </div>

          {/* Scrollable Content Body */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* The 3 Core Pro Pillars */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCw className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                    Training OS Pro & Rotary Dial
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Calibrate daily targets with rotary dial gestures, log high-precision sets, and track 1RM curves.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                    Fuel OS & Computer Vision
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Deconstruct meals with live computer vision and verified USDA macro breakdowns in seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                    Coach Hub & Tandem Sync
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Sync live sets with gym partners in real time and access professional roster telemetry.
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware & Device Permissions Section */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C4121A]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-800 dark:text-zinc-200 font-bold">
                    Connected Hardware Permissions
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleConnectAllHardware}
                  disabled={requestingPerms || allHardwareConnected}
                  className="text-[10px] font-mono text-[#C4121A] hover:underline font-bold disabled:opacity-50 cursor-pointer"
                >
                  {allHardwareConnected ? 'All Connected' : requestingPerms ? 'Connecting...' : 'Connect All'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Location */}
                <button
                  type="button"
                  onClick={requestLocationPerm}
                  className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-black/5 dark:border-white/5 flex items-center justify-between text-left cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold block text-gray-900 dark:text-white leading-tight">Live Location</span>
                      <span className="text-[9px] text-gray-500 dark:text-zinc-400 leading-none">Gym & Radar</span>
                    </div>
                  </div>
                  {locationGranted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-mono text-[#C4121A] font-bold uppercase">Grant</span>
                  )}
                </button>

                {/* Camera */}
                <button
                  type="button"
                  onClick={() => requestMediaPerm('camera')}
                  className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-black/5 dark:border-white/5 flex items-center justify-between text-left cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold block text-gray-900 dark:text-white leading-tight">Camera</span>
                      <span className="text-[9px] text-gray-500 dark:text-zinc-400 leading-none">Meal Vision</span>
                    </div>
                  </div>
                  {cameraGranted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-mono text-[#C4121A] font-bold uppercase">Grant</span>
                  )}
                </button>

                {/* Microphone */}
                <button
                  type="button"
                  onClick={() => requestMediaPerm('mic')}
                  className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-black/5 dark:border-white/5 flex items-center justify-between text-left cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold block text-gray-900 dark:text-white leading-tight">Microphone</span>
                      <span className="text-[9px] text-gray-500 dark:text-zinc-400 leading-none">Voice Fuel Log</span>
                    </div>
                  </div>
                  {micGranted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-mono text-[#C4121A] font-bold uppercase">Grant</span>
                  )}
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  onClick={requestNotifPerm}
                  className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-black/5 dark:border-white/5 flex items-center justify-between text-left cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold block text-gray-900 dark:text-white leading-tight">Notifications</span>
                      <span className="text-[9px] text-gray-500 dark:text-zinc-400 leading-none">Reminders & Sync</span>
                    </div>
                  </div>
                  {notifGranted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-mono text-[#C4121A] font-bold uppercase">Grant</span>
                  )}
                </button>
              </div>
            </div>

            {/* 1-Tap Athlete Customization Capsule */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-800 dark:text-zinc-200 font-bold">
                  Primary Athletic Focus
                </span>
                <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">1-Tap Select</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRIMARY_FOCUS_OPTIONS.map((opt) => {
                  const isSelected = primaryFocus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPrimaryFocus(opt.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#C4121A] text-white shadow-md'
                          : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 active:scale-95'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div 
            className="relative z-10 px-5 sm:px-6 pt-3 pb-4 border-t border-black/5 dark:border-white/10 bg-white dark:bg-[#121214] shrink-0"
            style={{
              paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom) + 10px))'
            }}
          >
            <button
              id="onboarding-continue-button"
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#C4121A] hover:bg-[#D91F28] active:scale-[0.99] text-white text-sm sm:text-base font-bold tracking-wide rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Calibrating System...' : 'Enter Training OS Pro'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Apple Privacy Notice */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
              <span>Biometric telemetry is encrypted on device.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default O1LaunchProtocol;
