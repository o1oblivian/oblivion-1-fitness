import React, { useState } from 'react';
import { ChevronLeft, MoreVertical, MapPin, X, Check, MessageCircle, Calendar } from 'lucide-react';
import { Athlete } from '../types';
import { tactileEngine } from '../../../services/tactileEngine';

interface AthleteProfileModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  onPass: (athlete: Athlete) => void;
  onAccept: (athlete: Athlete) => void;
  onMessage: (athlete: Athlete) => void;
  onBook: (athlete: Athlete) => void;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({
  athlete,
  onClose,
  onPass,
  onAccept,
  onMessage,
  onBook,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  if (!athlete) return null;

  const photo = athlete.image_url || athlete.avatar || athlete.photos?.[0] || '';
  const matchPct = Number(athlete.match_score ?? athlete.matchPercentage) || 0;
  const gym = athlete.home_gym || athlete.homeGym || '';
  const dist = Number(athlete.distance_km ?? athlete.distanceKm);
  const discipline = athlete.discipline || athlete.training_discipline || '';
  const level = athlete.experience_level || '';
  const timeSlot = athlete.preferred_time || '';
  const age = Number(athlete.age) || 0;
  const rows = [
    discipline ? { label: 'Trains', value: discipline } : null,
    athlete.current_split ? { label: 'Session', value: athlete.current_split } : null,
    timeSlot ? { label: 'When', value: timeSlot } : null,
    level ? { label: 'Level', value: level } : null,
    gym ? { label: 'Gym', value: gym } : null,
    athlete.looking_for ? { label: 'Looking for', value: athlete.looking_for } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  const menu = [
    { label: 'Message', icon: MessageCircle, run: () => onMessage(athlete) },
    { label: 'Book a session', icon: Calendar, run: () => onBook(athlete) },
    { label: 'Pass', icon: X, run: () => onPass(athlete) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex o1-sheet-scrim o1-page-scrim animate-in fade-in duration-200 select-none">
      <div className="o1-sheet-card o1-page relative bg-black flex flex-col overflow-hidden text-white">
        <div className="flex items-center justify-between px-4 py-3 bg-black text-white shrink-0 border-b border-white/[0.05]">
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

          <span className="text-xs font-semibold text-neutral-200">Athlete Profile</span>

          <button
            type="button"
            aria-label="Profile actions"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setMenuOpen((open) => !open);
            }}
            className="text-neutral-300 hover:text-white p-1 cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-3 top-14 z-20 w-48 rounded-2xl border border-white/[0.07] bg-[#121214] p-1 shadow-xl">
            {menu.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setMenuOpen(false);
                  item.run();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-white hover:bg-white/[0.06]"
              >
                <item.icon className="h-4 w-4 text-neutral-300" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 px-4 pt-3">
          <div className="relative h-full overflow-hidden rounded-2xl bg-[#161616]">
            {photo ? <img src={photo} alt={athlete.name} className="h-full w-full object-cover" /> : null}
            {matchPct > 0 && (athlete.match_reasons || []).length > 0 ? (
              <div className="absolute top-4 left-4 z-10">
                <span className="text-[11px] font-semibold text-white">{matchPct}% match</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="max-h-[46%] shrink-0 space-y-3 overflow-y-auto px-4 pt-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">
              {age >= 18 ? `${athlete.name}, ${age}` : athlete.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-o1-crimson" />
              <span>{Number.isFinite(dist) ? `${dist} km` : 'Distance unknown'}{gym ? ` · ${gym}` : ''}</span>
            </div>
            {(athlete.match_reasons || []).length > 0 && (
              <p className="text-[13px] text-white">{athlete.match_reasons?.join(' · ')}</p>
            )}
          </div>
          {athlete.bio ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#121214] p-3">
              <p className="text-[11px] text-neutral-500">About training</p>
              <p className="mt-1 text-[14px] leading-relaxed text-white">{athlete.bio}</p>
            </div>
          ) : null}
          {rows.length > 0 && (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121214]">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-[12px] text-neutral-400">{row.label}</span>
                  <span className="text-right text-[13px] font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/[0.05] bg-black px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onPass(athlete);
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-[#161616] text-white border border-white/[0.07] text-xs font-bold tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Pass</span>
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.playPRCelebration();
              onAccept(athlete);
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-bold tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
