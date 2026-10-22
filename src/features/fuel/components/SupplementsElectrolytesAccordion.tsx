import React, { useState } from 'react';
import { Pill, ChevronDown } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useFuelStore, Electrolytes } from '../store/useFuelStore';
import { SupplementTodayPane } from './supplements/SupplementTodayPane';
import { SupplementStackPane } from './supplements/SupplementStackPane';
import { COLOR } from '../../../theme/colors';

const ELECTROLYTE_TARGETS: Array<{
  key: keyof Electrolytes;
  name: string;
  target: number;
  step: number;
  color: string;
}> = [
  { key: 'sodium', name: 'Sodium', target: 3000, step: 250, color: COLOR.sky },
  { key: 'potassium', name: 'Potassium', target: 3500, step: 250, color: COLOR.emeraldDeep },
  { key: 'magnesium', name: 'Magnesium', target: 400, step: 50, color: COLOR.yellow },
];

type Pane = 'today' | 'stack' | 'salts';

const PANES: Array<{ id: Pane; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'stack', label: 'Stack' },
  { id: 'salts', label: 'Electrolytes' },
];

interface SupplementsElectrolytesAccordionProps {
  onShowToast?: (msg: string) => void;
  weightKg: number | null;
}

export const SupplementsElectrolytesAccordion: React.FC<SupplementsElectrolytesAccordionProps> = ({
  onShowToast,
  weightKg,
}) => {
  const stack = useFuelStore((s) => s.supplementStack);
  const takenIds = useFuelStore((s) => s.supplementsTaken);
  const salts = useFuelStore((s) => s.electrolytes);
  const { setElectrolytes } = useFuelStore.getState();

  const [isOpen, setIsOpen] = useState(false);
  const [pane, setPane] = useState<Pane>('today');

  const taken = new Set(takenIds);
  const takenCount = stack.filter((s) => taken.has(s.id)).length;

  const dueToday = stack.filter((s) => !taken.has(s.id));
  const takeSupplement = (id: string, name: string, dosage: string) => {
    useFuelStore.getState().toggleSupplementTaken(id);
    onShowToast?.(`Took ${name} · ${dosage}`);
  };

  const selectPane = (next: Pane) => {
    tactileEngine.triggerSelectionBuzz();
    setPane(next);
  };

  return (
    <div id="supplements-electrolytes-accordion" className="px-3.5 py-2 space-y-2.5 select-none">
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center text-o1-crimson shrink-0">
            <Pill className="w-6 h-6 stroke-[1.75] -rotate-45" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-o1-control text-o1-text leading-tight truncate">
              Supplements &amp; Electrolytes
            </h4>
            <p className="text-o1-label text-o1-muted truncate mt-0.5 tabular-nums">
              {stack.length > 0
                ? `${takenCount}/${stack.length} taken today`
                : 'Build your daily stack'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-o1-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {!isOpen && dueToday.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar ml-[52px] pb-1"
          style={{ scrollbarWidth: 'none' }}
          role="group"
          aria-label="Supplements still to take"
        >
          {dueToday.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => takeSupplement(item.id, item.name, item.dosage)}
              aria-label={`Mark ${item.name} taken`}
              className="h-9 shrink-0 rounded-full border border-white/[0.08] px-3.5 text-o1-body font-medium text-o1-text active:bg-o1-surface cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="pt-3 space-y-3.5 border-t border-white/[0.08] animate-in fade-in duration-200">
          <div
            className="grid grid-cols-3 gap-1 p-1 rounded-2xl border border-white/[0.08]"
            role="tablist"
          >
            {PANES.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={pane === tab.id}
                onClick={() => selectPane(tab.id)}
                className={`py-1.5 rounded-xl text-o1-label font-semibold cursor-pointer ${
                  pane === tab.id ? 'bg-o1-text text-black' : 'text-o1-muted hover:text-o1-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {pane === 'today' && (
            <SupplementTodayPane
              onShowToast={onShowToast}
              onOpenStack={() => selectPane('stack')}
            />
          )}
          {pane === 'stack' && (
            <SupplementStackPane weightKg={weightKg} onShowToast={onShowToast} />
          )}
          {pane === 'salts' && (
            <div className="space-y-2">
              <p className="text-o1-label text-o1-muted">
                Log electrolytes from food and drinks. Nothing is estimated.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ELECTROLYTE_TARGETS.map((el) => {
                  const current = salts[el.key];
                  const pct = Math.min(100, Math.round((current / el.target) * 100));
                  return (
                    <div
                      key={el.key}
                      className="border border-white/[0.08] p-2.5 rounded-xl text-center space-y-1.5"
                    >
                      <span className="text-o1-label text-o1-muted block font-semibold">
                        {el.name}
                      </span>
                      <span className="text-xs font-semibold tabular-nums block">{current} mg</span>
                      <div className="w-full bg-white/[0.08] h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: el.color }}
                        />
                      </div>
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          aria-label={`Remove ${el.step} mg ${el.name}`}
                          disabled={current <= 0}
                          onClick={() =>
                            setElectrolytes({ ...salts, [el.key]: Math.max(0, current - el.step) })
                          }
                          className="w-7 h-7 rounded-lg border border-white/[0.08] text-xs font-bold disabled:opacity-30 cursor-pointer"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          aria-label={`Add ${el.step} mg ${el.name}`}
                          onClick={() => setElectrolytes({ ...salts, [el.key]: current + el.step })}
                          className="w-7 h-7 rounded-lg border border-white/[0.08] text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
