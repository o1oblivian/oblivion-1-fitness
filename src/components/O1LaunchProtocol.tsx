import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
  Compass,
  Users,
  TrendingUp,
  Heart,
  Check,
  ArrowRight,
  ArrowLeft,
  Zap,
  Target,
  Utensils,
  Camera,
  Radar,
  EyeOff,
  Radio,
  Cpu,
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

const INTENT_OPTIONS: Array<{
  id: OnboardingIntent;
  title: string;
  subtitle: string;
  icon: typeof Dumbbell;
}> = [
  {
    id: 'train',
    title: 'Train Independently',
    subtitle: 'Precision rotary workout tracker, 1RM calculator & set logs',
    icon: Dumbbell,
  },
  {
    id: 'coach',
    title: 'Find a Coach & Guided Plans',
    subtitle: 'Get matched with verified O1 coaches for custom programming',
    icon: Compass,
  },
  {
    id: 'community',
    title: 'Tandem Training & Community',
    subtitle: 'Sync live workouts with partners & discover local athletes',
    icon: Users,
  },
  {
    id: 'business',
    title: 'Build a Coaching Business',
    subtitle: 'Dispatch live workouts, monitor client telemetry & roster',
    icon: TrendingUp,
  },
  {
    id: 'health',
    title: 'Fuel OS & Metabolic Consistency',
    subtitle: 'AI vision meal scans, macro tracking & recovery analytics',
    icon: Heart,
  },
];

const DISCIPLINES = [
  { id: 'hyrox', label: 'HYROX & Racing', desc: 'Sleds, compromised running & station timers' },
  { id: 'strength', label: 'Strength & Barbell', desc: 'Powerlifting, 1RM tracking & heavy compounds' },
  { id: 'functional', label: 'Functional Engine', desc: 'Metcons, cross-training & anaerobic capacity' },
  { id: 'running', label: 'Running & Track', desc: 'Pace zones, cadence & threshold work' },
  { id: 'hypertrophy', label: 'Hypertrophy & Volume', desc: 'Target volume, progressive overload & load matrix' },
  { id: 'longevity', label: 'Longevity & Mobility', desc: 'Zone 2 aerobic base & joint durability' },
];

const GUIDANCE_MODES: Array<{
  id: SupportChoice;
  title: string;
  subtitle: string;
  styleTag: CoachingStyle;
}> = [
  {
    id: 'independent',
    title: 'Self-Programmed & Autonomous',
    subtitle: 'Full autonomous access to Training OS Pro, Fuel OS & custom telemetry logs',
    styleTag: 'performance',
  },
  {
    id: 'match',
    title: 'Verified O1 Coach Match',
    subtitle: 'Custom programming, direct telemetry reviews & structured weekly check-ins',
    styleTag: 'accountability',
  },
  {
    id: 'browse',
    title: 'Elite Competition & Peaking Focus',
    subtitle: 'Periodized loading, competition readiness & 1RM progression analytics',
    styleTag: 'performance',
  },
  {
    id: 'undecided',
    title: 'Holistic & Biomechanical Focus',
    subtitle: 'Movement mechanics, recovery pacing, nutrition and sleep telemetry balance',
    styleTag: 'holistic',
  },
];

export const O1LaunchProtocol: React.FC<O1LaunchProtocolProps> = ({
  isOpen,
  userEmail = '',
  initialName = '',
  onComplete,
  onNavigateTo,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedIntents, setSelectedIntents] = useState<OnboardingIntent[]>([
    'train',
    'coach',
    'community',
    'business',
    'health',
  ]);
  const [intent, setIntent] = useState<OnboardingIntent>('train');
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');
  const [displayName, setDisplayName] = useState(initialName || (userEmail ? userEmail.split('@')[0] : 'Athlete'));
  const [handle, setHandle] = useState(
    userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : 'athlete'
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('178');
  const [weight, setWeight] = useState('75');
  const [age, setAge] = useState('26');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([
    'hyrox',
    'strength',
    'functional',
  ]);
  const [frequency, setFrequency] = useState('4-5 days');
  const [supportChoice, setSupportChoice] = useState<SupportChoice>('independent');
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>('performance');
  const [radarEnabled, setRadarEnabled] = useState(true);
  const [broadcastActive, setBroadcastActive] = useState(true);
  const [stealthMode, setStealthMode] = useState(false);

  if (!isOpen) return null;

  const allIntentIds: OnboardingIntent[] = ['train', 'coach', 'community', 'business', 'health'];
  const isAllIntentsSelected = allIntentIds.every((id) => selectedIntents.includes(id));

  const handleToggleIntent = (optId: OnboardingIntent) => {
    setSelectedIntents((prev) => {
      let updated: OnboardingIntent[];
      if (prev.includes(optId)) {
        updated = prev.length > 1 ? prev.filter((id) => id !== optId) : prev;
      } else {
        updated = [...prev, optId];
      }
      setIntent(updated[0] || 'train');
      if (updated.includes('business')) {
        setRole('coach');
      }
      return updated;
    });
  };

  const handleToggleSelectAllIntents = () => {
    if (isAllIntentsSelected) {
      setSelectedIntents(['train']);
      setIntent('train');
    } else {
      setSelectedIntents([...allIntentIds]);
      setIntent('train');
    }
  };

  const allDisciplineIds = DISCIPLINES.map((d) => d.id);
  const isAllDisciplinesSelected = allDisciplineIds.every((id) => selectedDisciplines.includes(id));

  const handleToggleDiscipline = (discId: string) => {
    setSelectedDisciplines((prev) => {
      if (prev.includes(discId)) {
        return prev.length > 1 ? prev.filter((id) => id !== discId) : prev;
      }
      return [...prev, discId];
    });
  };

  const handleToggleSelectAllDisciplines = () => {
    if (isAllDisciplinesSelected) {
      setSelectedDisciplines(['hyrox']);
    } else {
      setSelectedDisciplines([...allDisciplineIds]);
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleFinish = async (directDestination?: 'workout' | 'fuel' | 'community' | 'goal') => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const protocolData: O1LaunchProtocolData = {
      intent,
      role: selectedIntents.includes('business') ? 'coach' : role,
      displayName: displayName.trim() || 'Athlete',
      handle: handle.trim().replace(/^@/, '').toLowerCase() || 'athlete',
      bio: bio.trim(),
      height: height || '178',
      weight: weight || '75',
      age: age || '26',
      avatarUrl,
      disciplines: selectedDisciplines,
      trainingFrequency: frequency,
      supportChoice,
      coachingStyle,
      radarEnabled,
      broadcastActive,
      stealthMode,
    };

    await persistLaunchProtocol(userEmail, protocolData);

    onComplete({
      displayName: protocolData.displayName,
      handle: protocolData.handle,
      profileImage: protocolData.avatarUrl,
      workoutFocus: selectedDisciplines.join(', '),
      role: protocolData.role,
      intent: protocolData.intent,
    });

    if (directDestination && onNavigateTo) {
      switch (directDestination) {
        case 'workout':
          onNavigateTo('tracker');
          break;
        case 'fuel':
          onNavigateTo('fuel');
          break;
        case 'community':
          onNavigateTo('community');
          break;
        case 'goal':
          onNavigateTo('goal');
          break;
      }
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto text-black dark:text-white">
            {/* Header Badge */}
            <div className="mb-2">
              <div className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-white/10 flex items-center justify-center text-red-600 shadow-sm">
                <Cpu size={18} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black mb-1">
              OBLIVION 1 FITNESS CLUB
            </div>
            <h1 className="text-base sm:text-lg font-black text-black dark:text-white text-center uppercase tracking-tight leading-snug">
              WHAT WOULD MAKE O1FC MEANINGFUL TO YOU?
            </h1>

            {/* Intro Card - Minimalist Info Box */}
            <div className="w-full mt-2.5 mb-2.5 p-3.5 rounded-2xl bg-white/85 dark:bg-zinc-900/80 shadow-sm text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-red-600">
                  Engineered For High Performance
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                <strong className="text-black dark:text-white font-extrabold">O1FC</strong> is the all-in-one athletic operating system built for <strong className="text-black dark:text-white font-bold">rotary workout tracking</strong>, <strong className="text-black dark:text-white font-bold">AI vision macro nutrition</strong>, <strong className="text-black dark:text-white font-bold">live tandem synchronization</strong>, and <strong className="text-black dark:text-white font-bold">coach telemetry intelligence</strong>.
              </p>
            </div>

            {/* Select All Action Bar */}
            <div className="w-full flex items-center justify-between mb-2 px-0.5">
              <span className="text-[10px] font-mono font-black text-black dark:text-white uppercase tracking-widest">
                SELECT ALL THAT APPLY ({selectedIntents.length}/5)
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAllIntents}
                className={`px-3 py-1 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAllIntentsSelected
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white/85 dark:bg-white/10 text-black dark:text-white hover:bg-white dark:hover:bg-white/20 shadow-xs'
                }`}
              >
                <Check size={12} className={isAllIntentsSelected ? 'text-white stroke-[3]' : 'text-black dark:text-white'} />
                <span>{isAllIntentsSelected ? 'ALL SELECTED' : 'SELECT ALL'}</span>
              </button>
            </div>

            {/* Path Options - Minimalist Cards */}
            <div className="w-full space-y-2">
              {INTENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedIntents.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    id={`intent-option-${opt.id}`}
                    type="button"
                    onClick={() => handleToggleIntent(opt.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 group relative cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-800 shadow-md'
                        : 'bg-white/70 dark:bg-zinc-900/50 hover:bg-white/95 dark:hover:bg-zinc-900/90 shadow-xs'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 group-hover:text-red-600'
                      }`}
                    >
                      <Icon size={16} className="stroke-[2.5]" />
                    </div>

                    <div className="flex-1 min-w-0 pr-1.5">
                      <div className="text-xs sm:text-[13px] font-black text-black dark:text-white tracking-wide truncate">
                        {opt.title}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 tracking-normal mt-0.5 leading-snug font-medium">
                        {opt.subtitle}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/10'
                      }`}
                    >
                      {isSelected && <Check size={11} className="stroke-[3] text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto text-black dark:text-white">
            {/* Step Subheader */}
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black mb-1">
              ATHLETE PASSPORT
            </div>
            <h1 className="text-base sm:text-lg font-black text-black dark:text-white text-center uppercase tracking-tight">
              ESTABLISH YOUR IDENTITY
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center mt-0.5 mb-3.5 font-medium">
              Set up your public persona and baseline biometric metrics.
            </p>

            <div className="w-full space-y-3">
              {/* Avatar Preview & Upload - Minimalist Info Box */}
              <div className="flex items-center gap-3.5 p-3.5 bg-white/85 dark:bg-zinc-900/80 rounded-2xl shadow-sm">
                <label htmlFor="avatar-upload-input" className="relative group shrink-0 cursor-pointer block">
                  <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-black dark:text-white font-black text-lg overflow-hidden transition-all">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{displayName.slice(0, 2).toUpperCase() || 'AT'}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 rounded-xl text-white shadow-sm transition-colors">
                    <Camera size={11} className="stroke-[2.5]" />
                  </div>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') setAvatarUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Athlete ID</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 text-[9px] font-mono font-black">
                        VERIFIED
                      </span>
                    </div>
                    <label
                      htmlFor="avatar-upload-input"
                      className="text-[10px] font-mono uppercase tracking-wider font-black text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      {avatarUrl ? 'Change' : 'Upload'}
                    </label>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-tight font-medium">
                    Set your athlete profile badge image.
                  </p>
                </div>
              </div>

              {/* Name & Handle Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono font-black text-red-600 uppercase tracking-widest block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full px-3.5 py-2.5 bg-white/85 dark:bg-zinc-900/80 rounded-xl text-black dark:text-white text-xs sm:text-sm font-bold shadow-xs focus:outline-none focus:bg-white dark:focus:bg-zinc-900 placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-black text-red-600 uppercase tracking-widest block mb-1">
                    Handle
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-red-600 text-xs font-black">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="handle"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-white/85 dark:bg-zinc-900/80 rounded-xl text-black dark:text-white text-xs sm:text-sm font-bold font-mono shadow-xs focus:outline-none focus:bg-white dark:focus:bg-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bio / Mission */}
              <div>
                <label className="text-[10px] font-mono font-black text-red-600 uppercase tracking-widest block mb-1">
                  Athlete Bio & Focus
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. HYROX competitor, morning lifter targeting sub-60min simulation"
                  className="w-full px-3.5 py-2 bg-white/85 dark:bg-zinc-900/80 rounded-xl text-black dark:text-white text-xs font-medium shadow-xs focus:outline-none focus:bg-white dark:focus:bg-zinc-900 resize-none placeholder:text-zinc-400"
                />
              </div>

              {/* Baselines - Minimalist Info Boxes */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div className="p-3 bg-white/85 dark:bg-zinc-900/80 rounded-2xl text-center shadow-xs">
                  <span className="text-[9px] font-mono text-red-600 uppercase block font-black">Height</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-12 bg-transparent text-center text-black dark:text-white font-black text-sm focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-500 font-bold">cm</span>
                  </div>
                </div>

                <div className="p-3 bg-white/85 dark:bg-zinc-900/80 rounded-2xl text-center shadow-xs">
                  <span className="text-[9px] font-mono text-red-600 uppercase block font-black">Weight</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-12 bg-transparent text-center text-black dark:text-white font-black text-sm focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-500 font-bold">kg</span>
                  </div>
                </div>

                <div className="p-3 bg-white/85 dark:bg-zinc-900/80 rounded-2xl text-center shadow-xs">
                  <span className="text-[9px] font-mono text-red-600 uppercase block font-black">Age</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-12 bg-transparent text-center text-black dark:text-white font-black text-sm focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-500 font-bold">yrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto text-black dark:text-white">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black mb-1">
              DISCIPLINE & CADENCE
            </div>
            <h1 className="text-base sm:text-lg font-black text-black dark:text-white text-center uppercase tracking-tight">
              SELECT YOUR DISCIPLINES
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center mt-0.5 mb-2.5 font-medium">
              Choose your primary training modalities and weekly target cadence.
            </p>

            {/* Select All Disciplines Toggle */}
            <div className="w-full flex items-center justify-between mb-2 px-0.5">
              <span className="text-[10px] font-mono font-black text-black dark:text-white uppercase tracking-widest">
                DISCIPLINES ({selectedDisciplines.length}/6)
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAllDisciplines}
                className={`px-3 py-1 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAllDisciplinesSelected
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white/85 dark:bg-white/10 text-black dark:text-white hover:bg-white dark:hover:bg-white/20 shadow-xs'
                }`}
              >
                <Check size={11} className={isAllDisciplinesSelected ? 'text-white stroke-[3]' : 'text-black dark:text-white'} />
                <span>{isAllDisciplinesSelected ? 'ALL SELECTED' : 'SELECT ALL'}</span>
              </button>
            </div>

            {/* Discipline Grid - Minimalist Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
              {DISCIPLINES.map((disc) => {
                const isSelected = selectedDisciplines.includes(disc.id);
                return (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => handleToggleDiscipline(disc.id)}
                    className={`p-3 text-left rounded-2xl transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-800 shadow-md'
                        : 'bg-white/70 dark:bg-zinc-900/50 hover:bg-white/95 dark:hover:bg-zinc-900/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-black dark:text-white tracking-wide">{disc.label}</span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/10" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-tight font-medium">{disc.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Frequency Selector - Minimalist Pill Buttons */}
            <div className="w-full">
              <label className="text-[10px] font-mono font-black text-red-600 uppercase tracking-widest block mb-1.5">
                Target Training Cadence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['2-3 days', '4-5 days', '6+ days'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-2.5 rounded-xl text-xs font-black font-mono transition-all cursor-pointer ${
                      frequency === freq
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-white/85 dark:bg-zinc-900/80 text-black dark:text-white hover:bg-white dark:hover:bg-zinc-900 shadow-xs'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto text-black dark:text-white">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black mb-1">
              PROGRAMMING ARCHITECTURE
            </div>
            <h1 className="text-base sm:text-lg font-black text-black dark:text-white text-center uppercase tracking-tight">
              HOW WOULD YOU LIKE TO OPERATE?
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center mt-0.5 mb-3.5 font-medium">
              Configure your guidance mode across the Oblivion 1 ecosystem.
            </p>

            {/* Guidance Options - Minimalist Cards */}
            <div className="w-full space-y-2">
              {GUIDANCE_MODES.map((opt) => {
                const isSelected = supportChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`support-opt-${opt.id}`}
                    type="button"
                    onClick={() => {
                      setSupportChoice(opt.id);
                      setCoachingStyle(opt.styleTag);
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-800 shadow-md'
                        : 'bg-white/70 dark:bg-zinc-900/50 hover:bg-white/95 dark:hover:bg-zinc-900/90 shadow-xs'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs sm:text-[13px] font-black text-black dark:text-white tracking-wide">{opt.title}</div>
                      <div className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug font-medium">{opt.subtitle}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/10'
                      }`}
                    >
                      {isSelected && <Check size={11} className="stroke-[3] text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto text-black dark:text-white">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black mb-1">
              CONNECTIVITY & TELEMETRY
            </div>
            <h1 className="text-base sm:text-lg font-black text-black dark:text-white text-center uppercase tracking-tight">
              RADAR & PRIVACY PREFERENCES
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center mt-0.5 mb-3.5 font-medium">
              Configure proximity discovery, gym telemetry, and community presence.
            </p>

            <div className="w-full space-y-2.5">
              {/* Proximity Radar - Minimalist Info Box */}
              <div className="p-3.5 bg-white/85 dark:bg-zinc-900/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Radar size={17} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-black dark:text-white">Proximity Radar</div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                      Discover athletes & coaches within 5km radius
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRadarEnabled(!radarEnabled)}
                  className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    radarEnabled ? 'bg-red-600 justify-end' : 'bg-zinc-200 dark:bg-zinc-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Broadcast Session - Minimalist Info Box */}
              <div className="p-3.5 bg-white/85 dark:bg-zinc-900/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Radio size={17} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-black dark:text-white">Broadcast Gym Presence</div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                      Signal when you are actively logging sets
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBroadcastActive(!broadcastActive)}
                  className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    broadcastActive ? 'bg-red-600 justify-end' : 'bg-zinc-200 dark:bg-zinc-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Stealth Mode - Minimalist Info Box */}
              <div className="p-3.5 bg-white/85 dark:bg-zinc-900/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <EyeOff size={17} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-black dark:text-white">Stealth Privacy Mode</div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                      Hide exact location while keeping telemetry active
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStealthMode(!stealthMode)}
                  className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    stealthMode ? 'bg-red-600 justify-end' : 'bg-zinc-200 dark:bg-zinc-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto text-black dark:text-white">
            {/* Top Passport Card - Minimalist Info Box */}
            <div className="w-full p-4 bg-white/85 dark:bg-zinc-900/80 rounded-2xl mb-3 relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-black dark:text-white font-black text-base overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName.slice(0, 2).toUpperCase() || 'AT'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-black dark:text-white truncate">{displayName || 'Athlete'}</span>
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
                      <Zap size={10} className="fill-red-600 text-red-600" />
                    </span>
                  </div>
                  <div className="text-xs text-red-600 font-mono font-bold">@{handle || 'handle'}</div>
                  <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-red-600 rounded-md text-[9px] font-mono font-black text-white uppercase tracking-wider shadow-xs">
                    {role === 'coach' || selectedIntents.includes('business') ? 'PRO COACH' : 'O1 ATHLETE'}
                  </div>
                </div>
              </div>

              {/* Metric stats summary - Minimalist Flow */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl text-center pb-2">
                <div>
                  <span className="text-[9px] font-mono text-red-600 block font-black">AGE</span>
                  <span className="text-xs font-black text-black dark:text-white">{age || '26'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-red-600 block font-black">HEIGHT</span>
                  <span className="text-xs font-black text-black dark:text-white">{height || '178'}cm</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-red-600 block font-black">WEIGHT</span>
                  <span className="text-xs font-black text-black dark:text-white">{weight || '75'}kg</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-red-600 block font-black">FOCUS</span>
                  <span className="text-xs font-black text-black dark:text-white capitalize truncate block">
                    {selectedDisciplines[0] || 'General'}
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Heading */}
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black mb-1">
              O1FC PASSPORT ACTIVE
            </div>
            <h1 className="text-base sm:text-lg font-black text-black dark:text-white text-center uppercase tracking-tight">
              WELCOME TO OBLIVION 1
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center mt-0.5 mb-3 font-medium">
              Your performance suite is calibrated. Choose where you want to start:
            </p>

            {/* Action Cards - Minimalist Cards */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => handleFinish('workout')}
                className="w-full p-3 bg-white/85 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Dumbbell size={16} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-black text-black dark:text-white group-hover:text-red-600 transition-colors">
                      Training OS Pro & Rotary Dial
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">Launch workout tracker, log sets and record PRs</div>
                  </div>
                </div>
                <ArrowRight size={15} className="text-black dark:text-white group-hover:text-red-600 transition-colors stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish('fuel')}
                className="w-full p-3 bg-white/85 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Utensils size={16} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-black text-black dark:text-white group-hover:text-red-600 transition-colors">
                      Fuel OS & AI Macro Scanner
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">Log meals with vision analysis & barcode scanning</div>
                  </div>
                </div>
                <ArrowRight size={15} className="text-black dark:text-white group-hover:text-red-600 transition-colors stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish('community')}
                className="w-full p-3 bg-white/85 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Users size={16} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-black text-black dark:text-white group-hover:text-red-600 transition-colors">
                      Tandem Mode & Live Radar
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">Sync sets with training partners in real time</div>
                  </div>
                </div>
                <ArrowRight size={15} className="text-black dark:text-white group-hover:text-red-600 transition-colors stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish('goal')}
                className="w-full p-3 bg-white/85 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl flex items-center justify-between group transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Target size={16} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-black text-black dark:text-white group-hover:text-red-600 transition-colors">
                      Coach Hub & Direct Dispatch
                    </div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">Connect with coaches and review training plans</div>
                  </div>
                </div>
                <ArrowRight size={15} className="text-black dark:text-white group-hover:text-red-600 transition-colors stroke-[2.5]" />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[650] bg-slate-900/30 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto overscroll-contain selection:bg-red-600/20 text-black dark:text-white font-sans relative">
      {/* Light Liquid Silk Ambient Dynamic Simulation */}
      <LiquidSilkBackground theme="light" intensity={1.15} speed={1.0} />

      <div className="w-full max-w-lg max-h-[94vh] sm:max-h-[90vh] bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] border border-white/80 dark:border-white/10 overflow-hidden my-auto flex flex-col relative z-10">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-black/10 dark:bg-white/10 shrink-0">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Main Content Stage - Scrollable inside */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col justify-start bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="w-full my-auto"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div
          className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shrink-0 rounded-b-3xl"
        >
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                id="onboarding-back-button"
                type="button"
                onClick={handleBack}
                className="p-3 rounded-2xl bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-black dark:text-white transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                aria-label="Back"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
            )}

            <div className="text-xs font-mono font-black text-black dark:text-white px-3 py-2.5 rounded-2xl bg-white/90 dark:bg-white/10 shrink-0 shadow-sm">
              <span className="text-red-600">{step}</span> / 6
            </div>

            {step < 6 ? (
              <button
                id="onboarding-continue-button"
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.18em] rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>CONTINUE</span>
                <ArrowRight size={14} className="stroke-[3]" />
              </button>
            ) : (
              <button
                id="onboarding-enter-o1-button"
                type="button"
                onClick={() => handleFinish()}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.18em] rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>ENTER O1FC</span>
                <ArrowRight size={14} className="stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default O1LaunchProtocol;
