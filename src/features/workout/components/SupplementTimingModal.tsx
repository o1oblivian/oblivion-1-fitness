import React, { useState } from 'react';
import { X, Pill, Plus, Check, Sun, Moon, Sparkles, CheckCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface SupplementTimingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

interface SupplementItem {
  id: string;
  name: string;
  dose: string;
  timing: 'Morning' | 'Evening';
  taken: boolean;
}

export const SupplementTimingModal: React.FC<SupplementTimingModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [supplements, setSupplements] = useState<SupplementItem[]>([
    { id: '1', name: 'Creatine Monohydrate', dose: '5g', timing: 'Morning', taken: false },
    { id: '2', name: 'Vitamin D3 + K2', dose: '5000 IU', timing: 'Morning', taken: false },
    { id: '3', name: 'Omega-3 High EPA/DHA', dose: '2000mg', timing: 'Morning', taken: false },
    { id: '4', name: 'Magnesium Bisglycinate', dose: '400mg', timing: 'Evening', taken: false },
    { id: '5', name: 'Zinc Picolinate', dose: '25mg', timing: 'Evening', taken: false },
  ]);

  const [activeTimingFilter, setActiveTimingFilter] = useState<'ALL' | 'Morning' | 'Evening'>('ALL');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [customTiming, setCustomTiming] = useState<'Morning' | 'Evening'>('Morning');

  if (!isOpen) return null;

  const takenCount = supplements.filter((s) => s.taken).length;
  const totalCount = supplements.length;
  const pct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const toggleItem = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, taken: !s.taken } : s))
    );
  };

  const handleBatchToggleTiming = (timing: 'Morning' | 'Evening') => {
    tactileEngine.triggerSelectionBuzz();
    const targeted = supplements.filter((s) => s.timing === timing);
    const allTaken = targeted.every((s) => s.taken);
    setSupplements((prev) =>
      prev.map((s) => (s.timing === timing ? { ...s, taken: !allTaken } : s))
    );
    onShowToast?.(
      allTaken
        ? `Reset ${timing.toLowerCase()} supplements to pending.`
        : `Marked all ${timing.toLowerCase()} supplements as taken.`
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    tactileEngine.triggerSelectionBuzz();
    const newItem: SupplementItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      dose: customDose.trim() || '1 serving',
      timing: customTiming,
      taken: true,
    };
    setSupplements((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomDose('');
    setIsAddingCustom(false);
    onShowToast?.(`Added and logged ${newItem.name}`);
  };

  const filteredSupplements =
    activeTimingFilter === 'ALL'
      ? supplements
      : supplements.filter((s) => s.timing === activeTimingFilter);

  // SVG Gauge calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div
      id="supplement-timing-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60000] bg-black/80 flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#09090b] text-white w-full max-w-md rounded-t-3xl md:rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl p-5 space-y-4 max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tactical font-bold text-sm tracking-wider uppercase text-white">
                  Supplement Chronograph
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-neutral-300">
                  BIO-STACK
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">Precision Daily Stack Adherence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Adherence Gauge Card - Crystal Clear (Zero Dark Fog) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>STACK OPTIMIZATION</span>
            </div>
            <div className="text-2xl font-mono font-black text-white tracking-tight">
              {takenCount} <span className="text-sm font-normal text-neutral-500">/ {totalCount} Taken</span>
            </div>
            <p className="text-[11px] font-sans text-neutral-400">
              {pct === 100
                ? 'All bio-stack nutrients assimilated for peak cellular recovery.'
                : `${totalCount - takenCount} target micro-nutrients pending assimilation.`}
            </p>
          </div>

          {/* Precision Circular Radial Adherence Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="#f59e0b"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute font-mono font-bold text-xs text-white">{pct}%</span>
          </div>
        </div>

        {/* Filter Pills & Quick Batch Actions */}
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
            {(['ALL', 'Morning', 'Evening'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveTimingFilter(filter);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  activeTimingFilter === filter
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Fast Batch Button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleBatchToggleTiming('Morning')}
              title="Batch toggle morning supplements"
              className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>AM Batch</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchToggleTiming('Evening')}
              title="Batch toggle evening supplements"
              className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>PM Batch</span>
            </button>
          </div>
        </div>

        {/* Pill Cartridge Rack List */}
        <div className="space-y-2 overflow-y-auto max-h-[36vh] no-scrollbar pr-0.5">
          {filteredSupplements.map((item) => {
            const isMorning = item.timing === 'Morning';
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.98] ${
                  item.taken
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-white shadow-xs'
                    : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Tactile Push-Latch Status Slot */}
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                      item.taken
                        ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'border-white/20 bg-black/40 text-transparent'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${item.taken ? 'text-black' : 'opacity-0'}`} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-mono font-bold text-white truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-neutral-400">{item.dose}</span>
                      <span className="text-neutral-600">•</span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isMorning ? 'text-amber-400' : 'text-indigo-400'
                        }`}
                      >
                        {isMorning ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
                        {item.timing}
                      </span>
                    </div>
                  </div>
                </div>

                {/* State Tag */}
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    item.taken
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-neutral-400 border-white/10'
                  }`}
                >
                  {item.taken ? 'LOGGED' : 'PENDING'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Inline Add Custom Drawer */}
        {isAddingCustom ? (
          <form
            onSubmit={handleAddCustom}
            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-2.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span>Add Custom Supplement</span>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-neutral-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Name (e.g., Ashwagandha)"
                className="col-span-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <input
                type="text"
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                placeholder="Dose (e.g., 600mg)"
                className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <select
                value={customTiming}
                onChange={(e) => setCustomTiming(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-[#C4121A] hover:bg-[#a30f16] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Add to Stack
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setIsAddingCustom(true);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-bold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>+ ADD CUSTOM / SEARCH</span>
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
                onShowToast?.(`Stack Adherence confirmed: ${takenCount}/${totalCount} taken today.`);
              }}
              className="py-2.5 px-5 rounded-xl bg-[#C4121A] hover:bg-[#a30f16] active:bg-[#800C11] text-white text-xs font-tactical font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              CONFIRM
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplementTimingModal;
