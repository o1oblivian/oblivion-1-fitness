import React, { useState } from 'react';
import { MapPin, Check, ChevronRight, X } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { tactileEngine } from '../../services/tactileEngine';
import { useConsultationStore } from '../../features/induction/useConsultationStore';
import { optionsIn, useClubTaxonomy } from '../../features/induction/useClubTaxonomyStore';
import { WEEK, suggestedDays, type Discipline, type Facility, type TrainingDay } from '../../features/induction/consultationTypes';
import { bumpDayRoutines } from '../../features/workout/services/dayRoutineService';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';
import { requestDeviceLocation } from '../../services/deviceLocation';

interface TrainingSectionProps {
  autoDispatch: boolean;
  restRecoveryMode: boolean;
  onToggleAutoDispatch: (val: boolean) => void;
  onToggleRestMode: (val: boolean) => void;
  onShowToast?: (msg: string) => void;
}

/** Discipline and days live in the consultation profile, which is what builds the weekly plan. */
function DisciplineAndDays() {
  const disciplines = optionsIn(useClubTaxonomy(), 'discipline');
  const primaryDiscipline = useConsultationStore((state) => state.primaryDiscipline);
  const trainingDays = useConsultationStore((state) => state.trainingDays);
  const trainingAge = useConsultationStore((state) => state.trainingAge);
  const ageBand = useConsultationStore((state) => state.ageBand);
  const update = useConsultationStore((state) => state.update);
  const shownDays = trainingDays.length > 0 ? trainingDays : suggestedDays(trainingAge, ageBand);

  const toggleDay = (day: TrainingDay) => {
    const next = shownDays.includes(day) ? shownDays.filter((d) => d !== day) : [...shownDays, day];
    if (next.length === 0) return;
    tactileEngine.triggerSelectionBuzz();
    const ordered = WEEK.filter((d) => next.includes(d));
    void update({ trainingDays: ordered, frequencyDays: ordered.length });
  };

  return (
    <>
      <div>
        <div className="mb-2">
          <span className="text-xs font-sans font-semibold text-neutral-100">Primary Discipline</span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Primary discipline">
          {disciplines.map((option) => {
            const active = primaryDiscipline === option.optionKey;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  void update({ primaryDiscipline: option.optionKey as Discipline });
                }}
                className={`o1-pill text-[11px] font-normal cursor-pointer ${
                  active
                    ? 'bg-o1-crimson border border-o1-crimson text-white'
                    : 'bg-o1-surface border border-white/[0.07] text-o1-muted hover:text-o1-text'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-white/[0.05]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-tactical font-semibold text-neutral-100">Active Training Days</span>
          <span className="text-[11px] font-mono text-neutral-400">
            {trainingDays.length === 0 ? 'Suggested · ' : ''}
            {shownDays.length} days / week
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Training days">
          {WEEK.map((day) => {
            const active = shownDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                aria-label={day}
                onClick={() => toggleDay(day)}
                className={`flex h-8 w-full items-center justify-center rounded-full border text-[11px] font-normal transition-colors cursor-pointer ${
                  active
                    ? 'border-o1-crimson bg-o1-crimson text-white'
                    : 'border-white/[0.07] bg-o1-surface text-o1-muted'
                }`}
              >
                {day.slice(0, 2)}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function TrainingPlaces() {
  const options = optionsIn(useClubTaxonomy(), 'facility');
  const facilities = useConsultationStore((state) => state.facilities);
  const update = useConsultationStore((state) => state.update);

  const toggle = (key: Facility) => {
    tactileEngine.triggerSelectionBuzz();
    void update({ facilities: facilities.includes(key) ? facilities.filter((value) => value !== key) : [...facilities, key] });
  };

  return (
    <div className="pt-3 border-t border-white/[0.05]">
      <div className="mb-2">
        <span className="text-xs font-sans font-semibold text-neutral-100 block">Where you train</span>
        <span className="text-[10px] font-sans text-neutral-400 block">
          {facilities.length === 0 ? 'Not set. Workouts can use any equipment.' : 'Suggested workouts only use equipment you have.'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = facilities.includes(option.optionKey as Facility);
          return (
            <button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(option.optionKey as Facility)}
              className={`o1-pill text-[11px] font-normal cursor-pointer ${
                active
                  ? 'bg-o1-crimson border border-o1-crimson text-white'
                  : 'bg-o1-surface border border-white/[0.07] text-o1-muted hover:text-o1-text'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SettingsTrainingSection: React.FC<TrainingSectionProps> = ({
  autoDispatch,
  restRecoveryMode,
  onToggleAutoDispatch,
  onToggleRestMode,
  onShowToast,
}) => {
  const homeGym = useBuddyProfileStore((s) => s.homeGym);
  const setHomeGym = useBuddyProfileStore((s) => s.setHomeGym);
  const locationOn = useBuddyProfileStore((s) => s.radarConsent);
  const setRadarConsent = useBuddyProfileStore((s) => s.setRadarConsent);
  const [isGymModalOpen, setIsGymModalOpen] = useState(false);
  const [customGym, setCustomGym] = useState('');
  const [locating, setLocating] = useState(false);

  const openGymModal = () => {
    tactileEngine.triggerSelectionBuzz();
    setCustomGym(homeGym);
    setIsGymModalOpen(true);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gym = customGym.trim();
    tactileEngine.triggerSelectionBuzz();
    setHomeGym(gym);
    setIsGymModalOpen(false);
    onShowToast?.(gym ? `Home gym: ${gym}` : 'Home gym cleared.');
  };

  const handleLocation = async (on: boolean) => {
    if (!on) {
      setRadarConsent(false);
      return;
    }
    setLocating(true);
    const result = await requestDeviceLocation();
    setLocating(false);
    if (result.status === 'granted') {
      setRadarConsent(true);
    } else {
      onShowToast?.(
        result.status === 'unavailable'
          ? "This device can't share its location."
          : "Location is blocked for this app. Turn it on in your phone's settings."
      );
    }
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Training, Schedule &amp; Facility
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5 text-white transition-colors">
        <DisciplineAndDays />

        <TrainingPlaces />

        {/* Home Base Facility & GPS */}
        <div className="pt-3 border-t border-white/[0.05] space-y-3">
          <button
            type="button"
            onClick={openGymModal}
            className="w-full min-h-[44px] flex items-center justify-between gap-3 cursor-pointer group text-left transition-colors"
          >
            <div className="min-w-0">
              <span className="text-xs font-tactical font-semibold text-neutral-100 group-hover:text-o1-crimson block">
                Home Gym
              </span>
              <span className="text-[11px] font-sans text-neutral-400 block truncate">
                {homeGym || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-white shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#4F8F9A]" />
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </button>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs font-tactical font-semibold text-neutral-200 block">
                Use my location
              </span>
              <span className="text-[11px] font-sans text-neutral-400 block">
                {locating ? 'Asking for location…' : 'Find training buddies near you on Buddy'}
              </span>
            </div>
            <CrimsonSwitch
              label="Use my location"
              checked={locationOn}
              disabled={locating}
              onChange={(val) => void handleLocation(val)}
            />
          </div>
        </div>

        {/* Program Automation & Recovery Mode */}
        <div className="pt-3 border-t border-white/[0.05] space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-tactical font-semibold text-neutral-200 block">
                Auto plan
              </span>
              <span className="text-[10px] font-sans text-neutral-400 block">
                Off means you design your own workouts
              </span>
            </div>
            <CrimsonSwitch
              label="Auto plan"
              checked={autoDispatch}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleAutoDispatch(val);
                bumpDayRoutines();
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs font-tactical font-semibold text-neutral-200 block">
                Recovery mode
              </span>
              <span className="text-[10px] font-sans text-neutral-400 block">
                Open Workout on recovery sessions
              </span>
            </div>
            <CrimsonSwitch
              label="Recovery mode"
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
          className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGymModalOpen(false);
          }}
        >
          <div className="o1-sheet-card bg-black border border-white/[0.07] w-full p-5 shadow-xl relative space-y-4 overflow-y-auto text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-[#4F8F9A]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-tactical font-bold text-sm text-neutral-100 tracking-wider">
                    Home Gym
                  </h3>
                  <span className="text-[11px] text-neutral-400 block">
                    Shown on your Buddy card
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsGymModalOpen(false)}
                className="w-11 h-11 -mr-2 rounded-full text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <label htmlFor="home-gym-input" className="text-[11px] font-tactical font-bold text-neutral-400 block tracking-wider">
                Gym name and suburb
              </label>
              <div className="flex gap-2">
                <input
                  id="home-gym-input"
                  type="text"
                  value={customGym}
                  maxLength={80}
                  onChange={(e) => setCustomGym(e.target.value)}
                  placeholder="e.g. Iron Vault Fitness, Richmond"
                  className="flex-1 min-h-[44px] bg-black border border-white/[0.07] rounded-xl px-3 text-xs font-sans text-white placeholder:text-neutral-500 focus:outline-none focus:border-o1-crimson"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 rounded-xl bg-o1-crimson text-white text-xs font-tactical font-bold cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
