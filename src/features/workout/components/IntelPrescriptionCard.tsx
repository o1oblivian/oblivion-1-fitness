import React from 'react';
import { ExerciseItem } from '../../../types';

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
  return (
    <div className="border-t border-white/[0.05] pt-3 space-y-2.5 animate-in fade-in duration-200">
      {/* 1. PRESCRIPTION CONTAINER & HEADER */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-neutral-400 tracking-wider">
          PRESCRIPTION — {prescription.length} MOVEMENTS
        </span>
        <span className="text-xs font-mono font-semibold text-red-400">
          🔥 ~{estCalories} kcal
        </span>
      </div>

      {/* 2. MOVEMENT LIST ITEMS */}
      <div className="space-y-1">
        {prescription.map((drill, idx) => {
          const setsCount = drill.sets?.length || 4;
          const firstSetWeight = drill.sets?.[0]?.weightKg;
          const weightLabel =
            firstSetWeight && firstSetWeight > 0 ? ` @ ${firstSetWeight}kg` : '';
          const targetMuscle = drill.targetMuscle || 'Compound';
          const repsLabel = drill.sets?.[0]?.reps ? `${drill.sets[0].reps}` : '8–10';

          return (
            <div
              key={drill.id || idx}
              className="bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] rounded-2xl p-3.5 flex items-center justify-between mb-2 transition-all"
            >
              {/* Left section */}
              <div className="flex items-center min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white/10 text-neutral-300 font-mono font-semibold text-xs flex items-center justify-center mr-3 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h5 className="text-xs font-semibold text-white truncate">
                    {drill.name}
                  </h5>
                  <div className="text-[11px] text-neutral-400 font-normal mt-0.5">
                    {targetMuscle} · {setsCount} sets{weightLabel}
                  </div>
                </div>
              </div>

              {/* Right section */}
              <div className="text-xs font-mono text-neutral-400 font-medium shrink-0 ml-2">
                {setsCount} × {repsLabel} • RPE 8
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ACTION CTA BUTTON */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <button
          type="button"
          onClick={onLoadPrescription}
          className="bg-white hover:bg-neutral-100 text-neutral-950 active:scale-95 text-xs font-bold px-7 py-3 rounded-full shadow-lg flex items-center gap-2 tracking-wide transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          Load into active log
        </button>
        {/* Standard Exercise Disclaimer */}
        <p className="text-[10px] font-mono text-neutral-500 text-center tracking-tight">
          Consult a physician before beginning any training program.
        </p>
      </div>
    </div>
  );
};

export default IntelPrescriptionCard;
