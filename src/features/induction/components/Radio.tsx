import { Check } from 'lucide-react';

/** The round (single choice) or square (multiple choice) marker at the end of an option row. */
export function Radio({ active, square = false }: { active: boolean; square?: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center transition-colors ${square ? 'rounded-[5px]' : 'rounded-full'} ${active ? 'bg-o1-crimson' : 'ring-1 ring-inset ring-white/25'}`}
    >
      {active ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
    </span>
  );
}
