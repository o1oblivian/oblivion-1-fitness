import React from 'react';
import { ChevronLeft, MoreVertical, Dumbbell, Star, Clock, Ruler, Scale, MapPin, X, Check } from 'lucide-react';
import { Athlete } from '../types';
import { tactileEngine } from '../../../services/tactileEngine';

interface AthleteProfileModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  onPass: (athlete: Athlete) => void;
  onAccept: (athlete: Athlete) => void;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({
  athlete,
  onClose,
  onPass,
  onAccept,
}) => {
  if (!athlete) return null;

  const photo = athlete.image_url || athlete.avatar || athlete.photos?.[0] || '';
  const matchPct = athlete.match_score ?? athlete.matchPercentage ?? 65;
  const gym = athlete.home_gym || athlete.homeGym || 'Iron Works';
  const dist = athlete.distance_km ?? athlete.distanceKm ?? 239.1;
  const discipline = athlete.discipline || athlete.training_discipline || 'Hypertrophy';
  const level = athlete.experience_level || 'Elite';
  const timeSlot = athlete.preferred_time || 'Afternoon';
  const height = (athlete as any).height || '185 cm';
  const weight = (athlete as any).weight || '90 kg';
  const age = athlete.age || 33;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-3 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md h-full sm:h-[94vh] sm:rounded-3xl bg-[#09090b] flex flex-col overflow-hidden text-neutral-900 dark:text-white shadow-2xl">
        
        {/* Top App Bar Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#09090b] text-white shrink-0 border-b border-white/5">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition active:scale-90 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="text-xs font-semibold">Back</span>
          </button>

          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
            ATHLETE PROFILE
          </span>

          <button
            type="button"
            onClick={() => tactileEngine.triggerSelectionBuzz()}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 space-y-4">
          {/* Edge-to-Edge Hero Image Card */}
          <div className="relative aspect-[3/3.8] w-full rounded-3xl overflow-hidden bg-[#121214] shadow-md border border-white/5">
            <img
              src={photo}
              alt={athlete.name}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlays for smooth text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

            {/* Top-Left: Match Pill (Zero Background, Nude Minimalist) */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center text-[11px] font-mono font-bold ${
                  (athlete.is_online ?? true) ? 'text-emerald-500' : 'text-amber-400'
                }`}
              >
                {matchPct}% Match
              </span>
            </div>

            {/* Bottom Overlay: Name, Age, Distance, Home Gym */}
            <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight drop-shadow-md">
                  {athlete.name}, {age}
                </h2>
                {Boolean(athlete.is_verified) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono text-[9px] font-bold">
                    <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                    <span>VERIFIED ATHLETE</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-300 drop-shadow-sm font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#C4121A] shrink-0" />
                <span>{dist} km away · {gym}</span>
              </div>
            </div>
          </div>

          {/* 6-Grid Telemetry Metric Matrix */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Discipline */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center shadow-xs">
              <Dumbbell className="w-4 h-4 text-[#C4121A] mb-1 stroke-[2]" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                {discipline}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Discipline
              </div>
            </div>

            {/* 2. Level */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center shadow-xs">
              <Star className="w-4 h-4 text-[#C4121A] mb-1 stroke-[2]" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                {level}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Level
              </div>
            </div>

            {/* 3. Time */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center shadow-xs">
              <Clock className="w-4 h-4 text-[#C4121A] mb-1 stroke-[2]" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                {timeSlot}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Time
              </div>
            </div>

            {/* 4. Height */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center shadow-xs">
              <Ruler className="w-4 h-4 text-[#C4121A] mb-1 stroke-[2]" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                {height}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Height
              </div>
            </div>

            {/* 5. Weight */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center shadow-xs">
              <Scale className="w-4 h-4 text-[#C4121A] mb-1 stroke-[2]" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                {weight}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Weight
              </div>
            </div>

            {/* 6. Gym */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center shadow-xs">
              <MapPin className="w-4 h-4 text-[#C4121A] mb-1 stroke-[2]" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight truncate max-w-[90px]">
                {gym}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Gym
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Dual Pill Actions: Pass & Accept */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent flex items-center gap-3">
          {/* Pass Pill Button */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onPass(athlete);
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-[#18181b] hover:bg-[#222226] text-white border border-neutral-700/80 text-xs font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Pass</span>
          </button>

          {/* Accept / Like Pill Button */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.playPRCelebration();
              onAccept(athlete);
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-[#C4121A] hover:bg-[#a50f16] text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfileModal;
