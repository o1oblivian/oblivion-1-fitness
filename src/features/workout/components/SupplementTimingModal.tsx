import React, { useEffect, useState } from 'react';
import { X, Pill } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { SupplementTodayPane } from '../../fuel/components/supplements/SupplementTodayPane';
import { SupplementStackPane } from '../../fuel/components/supplements/SupplementStackPane';

interface SupplementTimingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const SupplementTimingModal: React.FC<SupplementTimingModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const weightKg = useFuelStore((s) => s.weightKg);
  const [pane, setPane] = useState<'today' | 'stack'>('today');

  useEffect(() => {
    if (!isOpen) return;
    void useFuelStore.getState().hydrate();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectPane = (next: 'today' | 'stack') => {
    tactileEngine.triggerSelectionBuzz();
    setPane(next);
  };

  return (
    <div
      id="supplement-timing-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Supplements"
      className="fixed inset-0 z-[60000] bg-black/85 backdrop-blur-md o1-sheet-scrim flex flex-col justify-end items-center animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
        className="w-full max-w-[480px] max-h-[85dvh] overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl bg-o1-sheet border border-white/[0.08] border-b-0 px-4 pt-2.5 space-y-3.5 animate-in slide-in-from-bottom-8 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full bg-white/[0.14]" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full border border-o1-crimson/40 flex items-center justify-center text-o1-crimson">
              <Pill className="w-4 h-4 -rotate-45" />
            </div>
            <h3 className="text-base font-semibold text-o1-text">Supplements</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl border border-white/[0.08]" role="tablist">
          {(['today', 'stack'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pane === id}
              onClick={() => selectPane(id)}
              className={`py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer ${
                pane === id ? 'bg-o1-crimson text-white' : 'text-o1-muted'
              }`}
            >
              {id === 'today' ? 'Today' : 'Stack'}
            </button>
          ))}
        </div>

        {pane === 'today' ? (
          <SupplementTodayPane onShowToast={onShowToast} onOpenStack={() => selectPane('stack')} />
        ) : (
          <SupplementStackPane weightKg={weightKg} onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
};


