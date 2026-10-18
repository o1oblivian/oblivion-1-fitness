import React from 'react';
import { X, Check, Utensils } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { DIET_OPTIONS } from '../data/dietProtocols';

interface DietaryPreferenceModalProps {
  isOpen: boolean;
  selectedDiet: string;
  onSelect: (diet: string) => void;
  onClose: () => void;
  inline?: boolean;
}

export const DietaryPreferenceModal: React.FC<DietaryPreferenceModalProps> = ({
  isOpen,
  selectedDiet,
  onSelect,
  onClose,
  inline = false,
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="o1-sheet-card w-full bg-o1-sheet border border-white/[0.08] p-4 shadow-xl flex flex-col overflow-y-auto select-none">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-o1-surface text-o1-text flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-o1-text">Diet</h3>
            <p className="text-o1-label text-o1-muted">Filters the food catalog and Intel meals</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
          className="w-8 h-8 rounded-full bg-o1-surface flex items-center justify-center text-o1-muted cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto grid grid-cols-2 gap-2 pr-0.5">
        {DIET_OPTIONS.map((d) => {
          const isSelected = selectedDiet.toLowerCase() === d.key.toLowerCase();
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelect(d.key);
                onClose();
              }}
              className={`relative text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? `${d.accentSoft} ${d.accentBorder} shadow-xs`
                  : 'bg-white/[0.03] border-white/[0.08] hover:bg-o1-sheet'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-lg leading-none">{d.icon}</span>
                {isSelected && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-o1-text shrink-0"
                    style={{ backgroundColor: d.accent }}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <span
                className={`mt-1.5 block text-o1-caption font-semibold ${isSelected ? d.accentDark : 'text-o1-text'}`}
              >
                {d.label}
              </span>
              <span className="mt-0.5 block text-o1-label leading-snug text-o1-muted">
                {d.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (inline) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
        />
        <div className="absolute top-full right-0 mt-2 z-50">{content}</div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onClose();
        }}
      />
      <div className="relative z-10 max-w-sm w-full">{content}</div>
    </div>
  );
};
