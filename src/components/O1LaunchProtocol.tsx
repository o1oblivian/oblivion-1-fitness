import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Header Badge */}
            <div className="mb-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-center text-white shadow-md">
                <Cpu size={16} className="text-red-500" />
              </div>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold mb-0.5">
              OBLIVION 1 FITNESS CLUB
            </div>
            <h1 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight leading-snug">
              WHAT WOULD MAKE O1FC MEANINGFUL TO YOU?
            </h1>

            {/* Obsidian Glass Intro Card */}
            <div className="w-full mt-2 mb-2 p-3 rounded-xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-lg text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                  Engineered For High Performance
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong className="text-white font-semibold">O1FC</strong> is the all-in-one athletic operating system built for <strong className="text-zinc-200">rotary workout tracking</strong>, <strong className="text-zinc-200">AI vision macro nutrition</strong>, <strong className="text-zinc-200">live tandem synchronization</strong>, and <strong className="text-zinc-200">coach telemetry intelligence</strong>.
              </p>
            </div>

            {/* Select All Action Bar */}
            <div className="w-full flex items-center justify-between mb-2 px-0.5">
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                SELECT ALL THAT APPLY ({selectedIntents.length}/5)
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAllIntents}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  isAllIntentsSelected
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-zinc-900/60 text-zinc-300 border border-white/10 hover:border-white/20'
                }`}
              >
                <Check size={11} className={isAllIntentsSelected ? 'text-red-400 stroke-[3]' : 'text-zinc-400'} />
                <span>{isAllIntentsSelected ? 'ALL SELECTED' : 'SELECT ALL'}</span>
              </button>
            </div>

            {/* Path Options */}
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
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-150 flex items-center gap-3 group relative cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/35 border-red-500/80 shadow-md ring-1 ring-red-500/30'
                        : 'bg-zinc-900/50 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-zinc-900/70 shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-red-600 text-white font-bold shadow-sm'
                          : 'bg-zinc-800/80 text-zinc-400 group-hover:text-white border border-white/5'
                      }`}
                    >
                      <Icon size={15} />
                    </div>

                    <div className="flex-1 min-w-0 pr-1.5">
                      <div className="text-xs sm:text-[13px] font-bold text-white tracking-wide truncate">
                        {opt.title}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-zinc-400 tracking-normal mt-0.5 leading-snug">
                        {opt.subtitle}
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'border border-zinc-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Step Subheader */}
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold mb-0.5">
              ATHLETE PASSPORT
            </div>
            <h1 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight">
              ESTABLISH YOUR IDENTITY
            </h1>
            <p className="text-[11px] text-zinc-400 text-center mt-0.5 mb-3.5">
              Set up your public persona and baseline biometric metrics.
            </p>

            <div className="w-full space-y-3">
              {/* Avatar Preview & Upload */}
              <div className="flex items-center gap-3.5 p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl shadow-md">
                <label htmlFor="avatar-upload-input" className="relative group shrink-0 cursor-pointer block">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-700 group-hover:border-zinc-500 flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-inner transition-all">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{displayName.slice(0, 2).toUpperCase() || 'AT'}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-red-600 rounded-full text-white shadow-md transition-colors">
                    <Camera size={10} className="stroke-[2.5]" />
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
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Athlete ID</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-300 text-[8px] font-mono font-bold">
                        VERIFIED
                      </span>
                    </div>
                    <label
                      htmlFor="avatar-upload-input"
                      className="text-[9px] font-mono uppercase tracking-wider font-bold text-red-400 hover:text-red-300 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                    >
                      {avatarUrl ? 'Change' : 'Upload'}
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                    Set your athlete profile badge image.
                  </p>
                </div>
              </div>

              {/* Name & Handle Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Handle
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-zinc-500 text-xs font-semibold">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="handle"
                      className="w-full pl-6 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bio / Mission */}
              <div>
                <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                  Athlete Bio & Focus
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. HYROX competitor, morning lifter targeting sub-60min simulation"
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white text-[11px] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 resize-none"
                />
              </div>

              {/* Baselines */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div className="p-2.5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl text-center shadow-sm">
                  <span className="text-[8px] font-mono text-zinc-400 uppercase block font-semibold">Height</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-10 bg-transparent text-center text-white font-bold text-sm focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-400 font-medium">cm</span>
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl text-center shadow-sm">
                  <span className="text-[8px] font-mono text-zinc-400 uppercase block font-semibold">Weight</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-10 bg-transparent text-center text-white font-bold text-sm focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-400 font-medium">kg</span>
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl text-center shadow-sm">
                  <span className="text-[8px] font-mono text-zinc-400 uppercase block font-semibold">Age</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-10 bg-transparent text-center text-white font-bold text-sm focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-400 font-medium">yrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold mb-0.5">
              DISCIPLINE & CADENCE
            </div>
            <h1 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight">
              SELECT YOUR DISCIPLINES
            </h1>
            <p className="text-[11px] text-zinc-400 text-center mt-0.5 mb-2.5">
              Choose your primary training modalities and weekly target cadence.
            </p>

            {/* Select All Disciplines Toggle */}
            <div className="w-full flex items-center justify-between mb-2 px-0.5">
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                DISCIPLINES ({selectedDisciplines.length}/6)
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAllDisciplines}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  isAllDisciplinesSelected
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-zinc-900/60 text-zinc-300 border border-white/10 hover:border-white/20'
                }`}
              >
                <Check size={10} className={isAllDisciplinesSelected ? 'text-red-400 stroke-[3]' : 'text-zinc-400'} />
                <span>{isAllDisciplinesSelected ? 'ALL SELECTED' : 'SELECT ALL'}</span>
              </button>
            </div>

            {/* Discipline Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
              {DISCIPLINES.map((disc) => {
                const isSelected = selectedDisciplines.includes(disc.id);
                return (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => handleToggleDiscipline(disc.id)}
                    className={`p-2.5 text-left rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/35 border-red-500/80 ring-1 ring-red-500/30 shadow-sm'
                        : 'bg-zinc-900/50 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-zinc-900/70 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-wide">{disc.label}</span>
                      {isSelected ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center">
                          <Check size={9} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 leading-tight">{disc.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Frequency Selector */}
            <div className="w-full">
              <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                Target Training Cadence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['2-3 days', '4-5 days', '6+ days'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      frequency === freq
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-zinc-900/50 backdrop-blur-md border-white/10 text-zinc-300 hover:bg-zinc-800'
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
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold mb-0.5">
              PROGRAMMING ARCHITECTURE
            </div>
            <h1 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight">
              HOW WOULD YOU LIKE TO OPERATE?
            </h1>
            <p className="text-[11px] text-zinc-400 text-center mt-0.5 mb-3.5">
              Configure your guidance mode across the Oblivion 1 ecosystem.
            </p>

            {/* Streamlined Non-Redundant Guidance Options */}
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
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/35 border-red-500/80 shadow-md ring-1 ring-red-500/30'
                        : 'bg-zinc-900/50 backdrop-blur-md border-white/10 hover:border-white/20 shadow-sm'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs sm:text-[13px] font-bold text-white tracking-wide">{opt.title}</div>
                      <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 leading-snug">{opt.subtitle}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'border border-zinc-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold mb-0.5">
              CONNECTIVITY & TELEMETRY
            </div>
            <h1 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight">
              RADAR & PRIVACY PREFERENCES
            </h1>
            <p className="text-[11px] text-zinc-400 text-center mt-0.5 mb-3.5">
              Configure proximity discovery, gym telemetry, and community presence.
            </p>

            <div className="w-full space-y-2.5">
              {/* Proximity Radar */}
              <div className="p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Radar size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Proximity Radar</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Discover athletes & coaches within 5km radius
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRadarEnabled(!radarEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    radarEnabled ? 'bg-red-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Broadcast Session */}
              <div className="p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Radio size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Broadcast Gym Presence</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Signal when you are actively logging sets
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBroadcastActive(!broadcastActive)}
                  className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    broadcastActive ? 'bg-red-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Stealth Mode */}
              <div className="p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <EyeOff size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Stealth Privacy Mode</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Hide exact location while keeping telemetry active
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStealthMode(!stealthMode)}
                  className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    stealthMode ? 'bg-red-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Top Passport Card */}
            <div className="w-full p-4 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl mb-3 relative overflow-hidden shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-white font-black text-base overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName.slice(0, 2).toUpperCase() || 'AT'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white truncate">{displayName || 'Athlete'}</span>
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-white flex items-center justify-center shrink-0 border border-white/10">
                      <Zap size={9} className="fill-red-500 text-red-500" />
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">@{handle || 'handle'}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 bg-red-950/50 border border-red-500/30 rounded text-[9px] font-mono font-bold text-red-400 uppercase tracking-wider">
                    {role === 'coach' || selectedIntents.includes('business') ? 'PRO COACH' : 'O1 ATHLETE'}
                  </div>
                </div>
              </div>

              {/* Metric stats summary */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-white/10 text-center">
                <div>
                  <span className="text-[8px] font-mono text-zinc-400 block font-semibold">AGE</span>
                  <span className="text-xs font-bold text-white">{age || '26'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-zinc-400 block font-semibold">HEIGHT</span>
                  <span className="text-xs font-bold text-white">{height || '178'}cm</span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-zinc-400 block font-semibold">WEIGHT</span>
                  <span className="text-xs font-bold text-white">{weight || '75'}kg</span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-zinc-400 block font-semibold">FOCUS</span>
                  <span className="text-xs font-bold text-white capitalize truncate block">
                    {selectedDisciplines[0] || 'General'}
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Heading */}
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold mb-0.5">
              O1FC PASSPORT ACTIVE
            </div>
            <h1 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight">
              WELCOME TO OBLIVION 1
            </h1>
            <p className="text-[11px] text-zinc-400 text-center mt-0.5 mb-3">
              Your performance suite is calibrated. Choose where you want to start:
            </p>

            {/* Action Cards */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => handleFinish('workout')}
                className="w-full p-2.5 sm:p-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:border-red-500/50 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Dumbbell size={15} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-red-400 transition-colors">
                      Training OS Pro & Rotary Dial
                    </div>
                    <div className="text-[10px] text-zinc-400">Launch workout tracker, log sets and record PRs</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish('fuel')}
                className="w-full p-2.5 sm:p-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:border-red-500/50 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Utensils size={15} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-red-400 transition-colors">
                      Fuel OS & AI Macro Scanner
                    </div>
                    <div className="text-[10px] text-zinc-400">Log meals with vision analysis & barcode scanning</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish('community')}
                className="w-full p-2.5 sm:p-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:border-red-500/50 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Users size={15} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-red-400 transition-colors">
                      Tandem Mode & Live Radar
                    </div>
                    <div className="text-[10px] text-zinc-400">Sync sets with training partners in real time</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleFinish('goal')}
                className="w-full p-2.5 sm:p-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:border-red-500/50 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Target size={15} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-red-400 transition-colors">
                      Coach Hub & Direct Dispatch
                    </div>
                    <div className="text-[10px] text-zinc-400">Connect with coaches and review training plans</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[650] bg-black/50 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto hide-scrollbar selection:bg-red-500/20 text-white font-sans">
      {/* Top Protocol Header Bar */}
      <div
        className="w-full max-w-md mx-auto px-4 flex items-center justify-between border-b border-white/10 pb-2.5 bg-black/30 backdrop-blur-md shrink-0"
        style={{
          paddingTop: 'max(0.875rem, calc(env(safe-area-inset-top, 0px) + 0.625rem))',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-zinc-200 uppercase">
            O1FC LAUNCH PROTOCOL
          </div>
        </div>
        <div className="text-[11px] font-mono font-bold text-zinc-400 tracking-wider">
          <span className="text-white">{step}</span> / 6
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="w-full"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div
        className="w-full max-w-md mx-auto px-3.5 pt-3 border-t border-white/10 bg-black/40 backdrop-blur-md shrink-0"
        style={{
          paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.875rem))',
        }}
      >
        <div className="flex items-center gap-2.5">
          {step > 1 && (
            <button
              id="onboarding-back-button"
              type="button"
              onClick={handleBack}
              className="p-2.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 transition-colors shrink-0 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          {step < 6 ? (
            <button
              id="onboarding-continue-button"
              type="button"
              onClick={handleNext}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>CONTINUE</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          ) : (
            <button
              id="onboarding-enter-o1-button"
              type="button"
              onClick={() => handleFinish()}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>ENTER O1FC</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default O1LaunchProtocol;
