import React from 'react';
import { Check, Coffee } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useFuelStore, SupplementItem } from '../../store/useFuelStore';
import { CAFFEINE_DAILY_LIMIT_MG } from '../../data/supplementLibrary';
import { SUPPLEMENT_TIMINGS } from './SupplementComposer';

interface SupplementTodayPaneProps {
  onShowToast?: (msg: string) => void;
  onOpenStack: () => void;
}

export const SupplementTodayPane: React.FC<SupplementTodayPaneProps> = ({ onShowToast, onOpenStack }) => {
  const stack = useFuelStore((s) => s.supplementStack);
  const takenIds = useFuelStore((s) => s.supplementsTaken);
  const { toggleSupplementTaken, setSupplementsTaken } = useFuelStore.getState();

  if (stack.length === 0) {
    return (
      <div className="py-5 text-center space-y-3">
        <p className="text-xs text-o1-muted">No supplements yet. Build your stack once and tick them off each day.</p>
        <button
          type="button"
          onClick={onOpenStack}
          className="h-9 px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-o1-text text-xs font-semibold cursor-pointer"
        >
          Build my stack
        </button>
      </div>
    );
  }

  const taken = new Set(takenIds);
  const takenCount = stack.filter((s) => taken.has(s.id)).length;
  const caffeineToday = stack.reduce((sum, s) => sum + (taken.has(s.id) ? s.caffeineMg ?? 0 : 0), 0);
  const tracksCaffeine = stack.some((s) => (s.caffeineMg ?? 0) > 0);
  const overCaffeine = caffeineToday > CAFFEINE_DAILY_LIMIT_MG;

  const toggle = (item: SupplementItem) => {
    const willTake = !taken.has(item.id);
    toggleSupplementTaken(item.id);
    onShowToast?.(willTake ? `Took ${item.name} · ${item.dosage}` : `Unchecked ${item.name}`);
  };

  const toggleGroup = (items: SupplementItem[], allTaken: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    const ids = new Set(items.map((i) => i.id));
    setSupplementsTaken(allTaken ? takenIds.filter((id) => !ids.has(id)) : [...takenIds, ...ids]);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-o1-text tabular-nums">
            <span className="font-semibold">{takenCount}</span>
            <span className="text-o1-muted"> / {stack.length} taken</span>
          </span>
          {tracksCaffeine && (
            <span className={`inline-flex items-center gap-1 text-[11px] tabular-nums ${overCaffeine ? 'text-amber-500' : 'text-o1-muted'}`}>
              <Coffee className="w-3 h-3" aria-hidden />
              {caffeineToday} / {CAFFEINE_DAILY_LIMIT_MG} mg caffeine
            </span>
          )}
        </div>
        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
            style={{ width: `${(takenCount / stack.length) * 100}%` }}
          />
        </div>
        {overCaffeine && (
          <p className="text-[10px] text-amber-500">Above the 400 mg daily guidance for healthy adults.</p>
        )}
      </div>

      {SUPPLEMENT_TIMINGS.map((timing) => {
        const items = stack.filter((s) => s.timing === timing);
        if (items.length === 0) return null;
        const groupTaken = items.filter((i) => taken.has(i.id)).length;
        const allTaken = groupTaken === items.length;
        return (
          <section key={timing} aria-label={timing} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-semibold text-o1-muted">
                {timing} <span className="tabular-nums font-normal">· {groupTaken}/{items.length}</span>
              </h5>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => toggleGroup(items, allTaken)}
                  className="text-[11px] font-medium text-o1-text hover:text-o1-crimson cursor-pointer"
                >
                  {allTaken ? 'Undo all' : 'Take all'}
                </button>
              )}
            </div>
            {items.map((item) => {
              const isTaken = taken.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isTaken}
                  onClick={() => toggle(item)}
                  className="w-full p-2.5 rounded-2xl border border-white/[0.08] flex items-center gap-2.5 text-left cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                      isTaken ? 'bg-emerald-600 border-emerald-600 text-o1-text' : 'border-white/[0.14]'
                    }`}
                  >
                    {isTaken && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs font-semibold truncate ${isTaken ? 'text-o1-muted line-through' : 'text-o1-text'}`}>
                      {item.name}
                    </span>
                    <span className="block text-[10px] text-o1-muted mt-0.5 truncate tabular-nums">
                      {item.dosage}
                      {item.caffeineMg ? ` · ${item.caffeineMg} mg caffeine` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
};

export default SupplementTodayPane;
