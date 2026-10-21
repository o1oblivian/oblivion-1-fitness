import { Delete } from 'lucide-react';
import { Unit, formatServings, snap } from './portionMath';

interface PortionKeypadProps {
  unit: Unit;
  max: number;
  /** The typed amount, or null while it is empty or just a ".". */
  padValue: number | null;
  onKey: (key: string) => void;
  onCancel: () => void;
  onApply: () => void;
}

/** Number pad for typing an exact amount. The decimal point only shows for servings. */
export function PortionKeypad({
  unit,
  max,
  padValue,
  onKey,
  onCancel,
  onApply,
}: PortionKeypadProps) {
  const keys = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    unit === 'serv' ? '.' : '',
    '0',
    'back',
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k, i) =>
        k === '' ? (
          <span key={i} />
        ) : (
          <button
            key={k}
            type="button"
            onClick={() => onKey(k)}
            className="h-12 rounded-2xl bg-o1-surface border border-white/[0.05] text-xl font-semibold tabular-nums text-o1-text flex items-center justify-center active:bg-white/[0.1] active:scale-[0.97] transition-transform cursor-pointer"
            aria-label={k === 'back' ? 'Delete digit' : k}
          >
            {k === 'back' ? <Delete className="w-5 h-5 text-o1-muted" /> : k}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={onCancel}
        className="h-11 rounded-2xl text-xs font-bold text-o1-muted hover:text-o1-text cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onApply}
        className="col-span-2 h-11 rounded-2xl bg-o1-text text-black text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
      >
        Set{' '}
        {padValue != null
          ? unit === 'g'
            ? `${Math.min(max, padValue)} g`
            : `${formatServings(snap(Math.min(max, padValue), 'serv'))}×`
          : ''}
      </button>
    </div>
  );
}
