import React, { useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';
import { DemoAthlete } from '../types';
import { tactileEngine } from '../../../services/tactileEngine';

function promptLine(athlete: DemoAthlete): string {
  const raw = (athlete.bio || '').split('\n').map((line) => line.trim()).filter(Boolean);
  return raw[0] || '';
}

export const BuddyDeckCard: React.FC<{
  athlete: DemoAthlete;
  onOpen: (athlete: DemoAthlete) => void;
  onPass: (athlete: DemoAthlete) => void;
  onAccept: (athlete: DemoAthlete) => void;
}> = ({ athlete, onOpen, onPass, onAccept }) => {
  const photos = [athlete.image_url, athlete.avatar, ...(athlete.photos || [])].filter((src, index, all): src is string => Boolean(src) && all.indexOf(src) === index);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex] || photos[0] || '';
  const gym = athlete.home_gym || athlete.homeGym || '';
  const dist = Number(athlete.distance_km ?? athlete.distanceKm);
  const age = Number(athlete.age) || 0;
  const discipline = athlete.discipline || athlete.training_discipline || '';
  const prompt = promptLine(athlete);

  return (
    <div className="relative mx-auto h-[calc(100dvh-15rem)] w-full overflow-hidden rounded-[28px] bg-[#121214]">
      <button
        type="button"
        onClick={() => {
          if (photos.length > 1) {
            setPhotoIndex((index) => (index + 1) % photos.length);
            return;
          }
          onOpen(athlete);
        }}
        className="absolute inset-0"
      >
        {photo ? <img src={photo} alt={athlete.name} className="h-full w-full object-cover" /> : null}
        <span className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/10" />
      </button>
      {photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-4 top-3 z-10 flex gap-1">
          {photos.map((_, index) => (
            <span key={index} className={`h-1 flex-1 rounded-full ${index === photoIndex ? 'bg-white' : 'bg-white/35'}`} />
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-3 p-4 pb-5">
        {discipline ? <p className="text-[12px] font-semibold text-white/80">{discipline}</p> : null}
        <button type="button" onClick={() => onOpen(athlete)} className="pointer-events-auto block text-left">
          <h2 className="text-[32px] font-semibold leading-none text-white">
            {age >= 18 ? `${athlete.name}, ${age}` : athlete.name}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-neutral-200">
            <MapPin className="h-3.5 w-3.5 text-o1-crimson" />
            {Number.isFinite(dist) ? `${dist} km` : 'Distance unknown'}{gym ? ` · ${gym}` : ''}
          </p>
          {prompt ? <p className="mt-3 max-w-[18rem] text-[15px] leading-snug text-white">{prompt}</p> : null}
        </button>
        <div className="pointer-events-auto flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onPass(athlete);
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.07] bg-[#161616] text-[13px] font-semibold text-white"
          >
            <X className="h-4 w-4" />
            Pass
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.playPRCelebration();
              onAccept(athlete);
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-o1-crimson text-[13px] font-semibold text-white"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
