import React from 'react';
import { Heart, MessageSquare, X, CheckCircle2 } from 'lucide-react';
import { Athlete } from '../types';
import { TacticalPlaceBeaconIcon } from './RadarIcons';
import { tactileEngine } from '../../../services/tactileEngine';

interface AthleteGridCardProps {
  athlete: Athlete;
  isLiked?: boolean;
  onOpenProfile: (athlete: Athlete) => void;
  onOpenMessage?: (athlete: Athlete) => void;
  onSave?: (athlete: Athlete) => void;
  onDismiss?: (idOrAthlete: any) => void;
  onLikeToggle?: (athlete: Athlete, isLiked: boolean) => void;
}

export const AthleteGridCard: React.FC<AthleteGridCardProps> = ({
  athlete,
  isLiked = true,
  onOpenProfile,
  onOpenMessage,
  onDismiss,
  onLikeToggle,
}) => {
  const photo = athlete.image_url || athlete.avatar || athlete.photos?.[0] || '';
  const matchPct = athlete.match_score ?? athlete.matchPercentage ?? 85;
  const gym = athlete.home_gym || athlete.homeGym || 'Local Gym';
  const dist = athlete.distance_km ?? athlete.distanceKm ?? 2.4;
  const isOnline = athlete.is_online ?? true;
  const discipline = athlete.discipline || athlete.training_discipline || 'ATHLETE';
  const isVerified = Boolean(athlete.is_verified);

  return (
    <div
      onClick={() => onOpenProfile(athlete)}
      className="group relative aspect-[3/4.25] w-full rounded-2xl overflow-hidden bg-black cursor-pointer select-none border border-white/[0.07] hover:border-o1-crimson/50 transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      <img
        src={photo}
        alt={athlete.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      <div className="absolute top-2 left-2 z-20 flex items-center pointer-events-none">
        <span className={`font-mono tracking-tight select-none ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>
          <span className="text-[9.5px] font-semibold">{matchPct}</span>
          <span className="text-[7.5px] font-normal opacity-85 ml-px">%</span>
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          tactileEngine.triggerSelectionBuzz();
          onDismiss?.(athlete.id || athlete);
        }}
        className="absolute top-2 right-2 z-20 p-1 text-white/70 hover:text-white transition-all active:scale-75 cursor-pointer"
        aria-label="Dismiss athlete"
      >
        <X className="w-3 h-3 stroke-[2]" />
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 space-y-1">
        {isVerified && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-950/90 border border-sky-400/60 text-sky-300 font-mono text-[8.5px] font-bold ">
              <CheckCircle2 className="w-2.5 h-2.5 text-sky-300 stroke-[2.5]" />
              <span>VERIFIED ATHLETE</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <span className="text-[8.5px] font-mono font-bold tracking-wider text-neutral-300 uppercase truncate max-w-[120px]">
            {discipline}
          </span>
        </div>

        <div className="flex items-end justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold tracking-tight text-white leading-tight truncate">
              {athlete.name}{athlete.age ? `, ${athlete.age}` : ''}
            </h3>
            <div className="flex items-center gap-1 text-[9.5px] font-normal text-neutral-300 truncate mt-0.5">
              <TacticalPlaceBeaconIcon className="w-2.5 h-2.5 text-o1-crimson shrink-0" />
              <span className="truncate">{gym}</span>
              <span className="text-white/40">·</span>
              <span className="font-mono text-[9px] text-neutral-400 shrink-0">{dist} km</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenMessage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tactileEngine.triggerSelectionBuzz();
                  onOpenMessage(athlete);
                }}
                className="p-1 text-white/80 hover:text-white transition active:scale-85 cursor-pointer"
                aria-label="Direct message athlete"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tactileEngine.triggerSelectionBuzz();
                onLikeToggle?.(athlete, !isLiked);
              }}
              className="p-1 text-white/80 hover:text-white transition active:scale-85 cursor-pointer"
              aria-label={isLiked ? 'Unlike athlete' : 'Like athlete'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  isLiked ? 'text-o1-crimson fill-o1-crimson' : 'text-white/80 hover:text-white'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteGridCard;
