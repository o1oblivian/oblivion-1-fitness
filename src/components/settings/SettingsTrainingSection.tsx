import React, { useState } from 'react';
import { MapPin, Check, ChevronRight, X } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { DisciplineType } from '../../hooks/useAthleteSettings';
import { tactileEngine } from '../../services/tactileEngine';

interface TrainingSectionProps {
  discipline: DisciplineType;
  autoDispatch: boolean;
  activeDays: string[];
  restRecoveryMode: boolean;
  homeGym: string;
  autoLocation: boolean;
  onSetDiscipline: (d: DisciplineType) => void;
  onToggleAutoDispatch: (val: boolean) => void;
  onToggleDay: (day: string) => void;
  onToggleRestMode: (val: boolean) => void;
  onSelectHomeGym: (gym: string) => void;
  onToggleAutoLocation: (val: boolean) => void;
}

const DISCIPLINES: DisciplineType[] = [
  'Hypertrophy',
  'Powerlifting',
  'Hyrox / Hybrid',
  'CrossFit',
  'Calisthenics',
  'Endurance',
  'Strength & Conditioning',
];

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const PRESET_GYMS = [
  'Melbourne, AU (Live GPS)',
  "Gold's Gym, Venice CA",
  'Metroflex Gym, Arlington TX',
  'Equinox Sports Club, New York',
  'Third Space, London Soho',
  'AlphaFit Elite Facility',
];

export const SettingsTrainingSection: React.FC<TrainingSectionProps> = ({
  discipline,
  autoDispatch,
  activeDays,
  restRecoveryMode,
  homeGym,
  autoLocation,
  onSetDiscipline,
  onToggleAutoDispatch,
  onToggleDay,
  onToggleRestMode,
  onSelectHomeGym,
  onToggleAutoLocation,
}) => {
  const [isGymModalOpen, setIsGymModalOpen] = useState(false);
  const [customGym, setCustomGym] = useState('');

  const handleSelectGym = (gym: string) => {
    tactileEngine.triggerSelectionBuzz();
    onSelectHomeGym(gym);
    setIsGymModalOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGym.trim()) return;
    tactileEngine.triggerSelectionBuzz();
    onSelectHomeGym(customGym.trim());
    setCustomGym('');
    setIsGymModalOpen(false);
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-600 dark:text-neutral-400 font-bold uppercase px-1">
        Training, Schedule &amp; Facility
      </h3>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 space-y-4 text-neutral-900 dark:text-white transition-colors">
        {/* Primary Discipline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100">
              Primary Discipline
            </span>
            <span className="text-[10px] font-tactical font-bold text-[#C4121A] uppercase bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/40">
              {discipline}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onSetDiscipline(d);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-tactical transition-all cursor-pointer ${
                  discipline === d
                    ? 'bg-[#C4121A] text-white font-bold shadow-xs'
                    : 'bg-neutral-100 dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Active Schedule Days */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100">
              Active Training Days
            </span>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              {activeDays.length} days / week
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((day) => {
              const active = activeDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    onToggleDay(day);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-tactical font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#C4121A] text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Home Base Facility & GPS */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <div
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsGymModalOpen(true);
            }}
            className="flex items-center justify-between gap-3 cursor-pointer group hover:text-[#C4121A] transition-colors"
          >
            <div className="min-w-0">
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#C4121A] block">
                Home Gym Base Facility
              </span>
              <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block truncate">
                {homeGym || 'Select primary training facility'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#C4121A]" />
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-200 block">
                Auto-Location GPS
              </span>
              <span className="text-[10px] font-sans text-neutral-500 dark:text-neutral-400 block">
                Sync live training facility proximity
              </span>
            </div>
            <CrimsonSwitch
              checked={autoLocation}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleAutoLocation(val);
                if (val && 'geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(() => {}, () => {});
                }
              }}
            />
          </div>
        </div>

        {/* Program Automation & Recovery Mode */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-200 block">
                Auto-Dispatch Coach Program
              </span>
              <span className="text-[10px] font-sans text-neutral-500 dark:text-neutral-400 block">
                Load next microcycle session automatically
              </span>
            </div>
            <CrimsonSwitch
              checked={autoDispatch}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleAutoDispatch(val);
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-200 block">
                Rest &amp; Recovery Mode
              </span>
              <span className="text-[10px] font-sans text-neutral-500 dark:text-neutral-400 block">
                Adjust RPE targets for fatigue deload
              </span>
            </div>
            <CrimsonSwitch
              checked={restRecoveryMode}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleRestMode(val);
              }}
            />
          </div>
        </div>
      </div>

      {/* Gym Selector Modal */}
      {isGymModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGymModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 rounded-t-[32px] sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto text-neutral-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-[#C4121A]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-tactical font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                    Select Home Gym Base
                  </h3>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block">
                    Telemetry &amp; Radar Alignment
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGymModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {PRESET_GYMS.map((gym) => {
                const isSelected = homeGym === gym;
                return (
                  <button
                    key={gym}
                    type="button"
                    onClick={() => handleSelectGym(gym)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[#C4121A] bg-red-50 dark:bg-red-950/20 text-neutral-900 dark:text-white font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-tactical">{gym}</span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#C4121A] flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="text-[10px] font-tactical uppercase font-bold text-neutral-600 dark:text-neutral-400 block tracking-wider">
                Or Enter Custom Location
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customGym}
                  onChange={(e) => setCustomGym(e.target.value)}
                  placeholder="e.g. Iron Vault Fitness, Austin TX"
                  className="flex-1 bg-neutral-100 dark:bg-black border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-sans text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#C4121A]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#C4121A] text-white text-xs font-tactical font-bold uppercase cursor-pointer active:scale-95"
                >
                  Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
