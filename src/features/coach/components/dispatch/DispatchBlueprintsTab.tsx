import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import {
  synthesizeDailyBlueprint,
  type AthleticVector,
  type FacilityGear,
  type IntensityMode,
  type SessionDuration,
  type SynthesizedBlueprint,
} from '../../data/dispatchBlueprintSynthesizer';
import { VECTOR_PILLS } from './dispatchTypes';

interface DispatchBlueprintsTabProps {
  onLoad: (blueprint: SynthesizedBlueprint) => void;
}

const DURATIONS: SessionDuration[] = ['20m', '30m', '45m', '60m', '75m'];
const GEAR: { value: FacilityGear; label: string }[] = [
  { value: 'Full Gym', label: 'Gym' },
  { value: 'DB & Bench', label: 'Dumbbells' },
  { value: 'Bodyweight', label: 'Bodyweight' },
];
const INTENSITY: { value: IntensityMode; label: string }[] = [
  { value: 'Progressive RPE', label: 'RPE wave' },
  { value: 'Failure Dropset', label: 'Dropset' },
];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <span className="text-o1-label font-semibold text-o1-text block mb-1">{label}</span>
      <div className="flex p-1 rounded-xl bg-white/[0.08] gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onChange(opt.value);
            }}
            className={`flex-1 h-8 rounded-lg text-o1-label font-semibold truncate ${value === opt.value ? 'bg-o1-surface text-o1-text' : 'text-o1-muted'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const DispatchBlueprintsTab: React.FC<DispatchBlueprintsTabProps> = ({ onLoad }) => {
  const [vector, setVector] = useState<AthleticVector>('Push Alpha');
  const [duration, setDuration] = useState<SessionDuration>('45m');
  const [gear, setGear] = useState<FacilityGear>('Full Gym');
  const [intensity, setIntensity] = useState<IntensityMode>('Progressive RPE');

  const blueprint = useMemo(
    () => synthesizeDailyBlueprint(vector, duration, gear, intensity, 0),
    [vector, duration, gear, intensity],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-o1-text">Blueprints</h3>
        <p className="text-xs text-o1-muted">Pick a focus and the session is built for you.</p>
      </div>

      <div>
        <span className="text-xs font-semibold text-o1-text block mb-1.5">Focus</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {VECTOR_PILLS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vector === v}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setVector(v);
              }}
              className={`h-9 px-3 rounded-xl text-xs font-medium whitespace-nowrap ${
                vector === v
                  ? 'bg-o1-crimson text-white font-bold'
                  : 'bg-white/[0.08] text-o1-muted'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <Segmented
          label="Duration"
          options={DURATIONS.map((d) => ({ value: d, label: d }))}
          value={duration}
          onChange={setDuration}
        />
        <Segmented label="Equipment" options={GEAR} value={gear} onChange={setGear} />
        <Segmented
          label="Intensity"
          options={INTENSITY}
          value={intensity}
          onChange={setIntensity}
        />
      </div>

      <div className="p-4 rounded-2xl border border-white/[0.07] bg-o1-surface space-y-3">
        <div>
          <h4 className="text-xs font-bold text-o1-text">{blueprint.title}</h4>
          <p className="text-o1-label text-o1-muted">
            {blueprint.durationMins}m · {blueprint.exercises.length} exercises · {blueprint.tagline}
          </p>
        </div>

        <div className="space-y-1.5">
          {blueprint.exercises.map((ex, i) => (
            <div
              key={`${ex.name}-${i}`}
              className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07] space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-o1-text truncate">{ex.name}</span>
                <span className="font-mono text-o1-muted font-bold shrink-0 ml-2">
                  {ex.sets}x · {ex.reps} @ {ex.targetWeightKg > 0 ? `${ex.targetWeightKg}kg` : 'BW'}
                </span>
              </div>
              <div className="flex items-center justify-between text-o1-label text-o1-muted">
                <span className="truncate">{ex.muscle}</span>
                <span className="font-mono">
                  RPE {ex.rpe} · Tempo {ex.tempo}
                </span>
              </div>
              <p className="text-o1-label text-o1-muted italic truncate">"{ex.cue}"</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onLoad(blueprint)}
          className="w-full h-11 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          Use this workout
        </button>
        <p className="text-o1-label text-o1-muted text-center">
          Consult a physician before beginning any training program.
        </p>
      </div>
    </div>
  );
};
