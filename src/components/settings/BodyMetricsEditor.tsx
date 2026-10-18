import React, { useEffect, useId, useState } from 'react';
import {
  cleanMetricDraft,
  metricToDraft,
  readMetricDraft,
  type BodyMetricKind,
  type HeightUnit,
  type WeightUnit,
} from '../../utils/bodyMetrics';

interface MetricFieldProps {
  kind: BodyMetricKind;
  label: string;
  /** Unit the person types in; null for age. */
  unit: HeightUnit | WeightUnit | null;
  unitLabel: string;
  /** The saved value in years, centimetres or kilograms. 0 means not set. */
  stored: number;
  onCommit: (value: number) => void;
  placeholder: string;
  decimal?: boolean;
  enterKeyHint: 'next' | 'done';
}

/** One labelled entry box. Typing saves as soon as the number is valid; a wrong number is explained and never saved. */
const MetricField: React.FC<MetricFieldProps> = ({
  kind,
  label,
  unit,
  unitLabel,
  stored,
  onCommit,
  placeholder,
  decimal = false,
  enterKeyHint,
}) => {
  const id = useId();
  const [draft, setDraft] = useState(() => metricToDraft(kind, stored, unit));
  const [editing, setEditing] = useState(false);
  const reading = readMetricDraft(kind, draft, unit);
  const message = reading.state === 'bad' ? reading.message : null;

  // Follows the saved value (and the unit) whenever the person is not typing.
  useEffect(() => {
    if (!editing) setDraft(metricToDraft(kind, stored, unit));
  }, [kind, stored, unit, editing]);

  const change = (raw: string) => {
    const next = cleanMetricDraft(raw, kind);
    setDraft(next);
    const read = readMetricDraft(kind, next, unit);
    if (read.state === 'ok') onCommit(read.value);
    else if (read.state === 'empty') onCommit(0);
  };

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-o1-label font-tactical text-neutral-400 font-semibold tracking-wide mb-1"
      >
        {label}
      </label>
      <div
        className={`flex items-center h-12 rounded-xl bg-black border px-2.5 transition-colors ${
          message ? 'border-o1-crimson' : 'border-white/[0.07] focus-within:border-o1-crimson'
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          enterKeyHint={enterKeyHint}
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={message ? true : undefined}
          value={draft}
          onFocus={(e) => {
            setEditing(true);
            e.currentTarget.select();
          }}
          onBlur={() => setEditing(false)}
          onChange={(e) => change(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-lg font-mono font-bold text-white placeholder:text-neutral-600 focus:outline-none p-0"
        />
        {unitLabel ? (
          <span className="ml-1.5 shrink-0 text-xs font-mono font-semibold text-neutral-400">
            {unitLabel}
          </span>
        ) : null}
      </div>
      {message ? (
        <p role="alert" className="mt-1 text-o1-label leading-snug text-o1-text">
          {message}
        </p>
      ) : null}
    </div>
  );
};

export interface BodyMetricsEditorProps {
  age: number;
  heightCm: number;
  weightKg: number;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  onUpdateAge: (years: number) => void;
  onUpdateHeight: (cm: number) => void;
  onUpdateWeight: (kg: number) => void;
}

/** Age, height and weight as three large, labelled boxes with the unit shown beside each number. */
export const BodyMetricsEditor: React.FC<BodyMetricsEditorProps> = ({
  age,
  heightCm,
  weightKg,
  heightUnit,
  weightUnit,
  onUpdateAge,
  onUpdateHeight,
  onUpdateWeight,
}) => (
  <div className="space-y-1.5">
    <div className="grid grid-cols-3 gap-2 items-start">
      <MetricField
        kind="age"
        label="Age"
        unit={null}
        unitLabel="yrs"
        stored={age}
        onCommit={onUpdateAge}
        placeholder="25"
        enterKeyHint="next"
      />
      <MetricField
        kind="height"
        label="Height"
        unit={heightUnit}
        unitLabel={heightUnit}
        stored={heightCm}
        onCommit={onUpdateHeight}
        placeholder={heightUnit === 'in' ? '70' : '175'}
        enterKeyHint="next"
      />
      <MetricField
        kind="weight"
        label="Weight"
        unit={weightUnit}
        unitLabel={weightUnit === 'lbs' ? 'lb' : 'kg'}
        stored={weightKg}
        onCommit={onUpdateWeight}
        placeholder={weightUnit === 'lbs' ? '165' : '75'}
        decimal
        enterKeyHint="done"
      />
    </div>
    <p className="text-o1-label text-neutral-500 leading-snug px-0.5">
      Used for your calorie target and training load. Change units in Settings.
    </p>
  </div>
);
