import React from 'react';
import { ExerciseItem } from '../../../types';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { formatLoad, loadUnitLabel } from '../../../utils/weightUnits';

interface IntelPrescriptionCardProps {
  prescription: ExerciseItem[];
  estCalories: number;
  onLoadPrescription: () => void;
}

export const IntelPrescriptionCard: React.FC<IntelPrescriptionCardProps> = ({
  prescription,
  estCalories,
  onLoadPrescription,
}) => {
  const unit = readAthleteSettingsSnapshot().weightUnit;
  const unitLower = loadUnitLabel(unit).toLowerCase();

  return (
    <div className="border-t border-white/[0.07] pt-3 space-y-2.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] uppercase tracking-[0.12em] text-o1-muted">
          Prescription · {prescription.length} movements
        </span>
        {estCalories > 0 && <span className="text-[12px] font-mono font-light text-o1-text">~{estCalories} kcal</span>}
      </div>

      <div className="space-y-1.5">
        {prescription.map((drill, idx) => {
          const sets = drill.sets || [];
          const first = sets[0];
          const load = Number(first?.weightKg) || 0;
          const reps = Number(first?.reps) || 0;
          const rpe = Number(first?.rpe) || 0;
          const target = [
            `${sets.length || 3} × ${reps || '8–10'}`,
            load > 0 ? `${formatLoad(load, unit)} ${unitLower}` : null,
            rpe > 0 ? `RPE ${rpe}` : null,
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <div
              key={drill.id || idx}
              className="bg-o1-well border border-white/[0.07] rounded-2xl px-3 py-3 flex items-center gap-3"
            >
              <span className="w-6 h-6 rounded-lg border border-white/[0.14] text-o1-muted font-mono text-[11px] flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h5 className="text-[13px] text-o1-text truncate">{drill.name}</h5>
                <p className="text-[11px] text-o1-muted mt-0.5 truncate">{drill.targetMuscle || 'Compound'}</p>
              </div>
              <span className="text-[11px] font-mono font-light text-o1-text shrink-0 text-right">{target}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onLoadPrescription}
          className="w-full min-h-[48px] rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.98] text-white font-medium text-[13px] transition-all cursor-pointer"
        >
          Load into active log
        </button>
        <p className="text-[10px] text-o1-muted text-center">Consult a physician before beginning any training program.</p>
      </div>
    </div>
  );
};

export default IntelPrescriptionCard;
