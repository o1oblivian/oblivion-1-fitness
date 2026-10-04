import React, { useState, useEffect } from 'react';
import {
  Pill,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Zap,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface SupplementProtocolItem {
  id: string;
  name: string;
  dosage: string;
  timing: 'Morning' | 'Pre-Workout' | 'Post-Workout' | 'Evening' | 'Anytime';
  category: string;
  taken: boolean;
  benefits?: string;
  synergy?: string;
}

const DEFAULT_STACK: SupplementProtocolItem[] = [
  {
    id: 'supp-1',
    name: 'Creatine Monohydrate (Creapure)',
    dosage: '5g',
    timing: 'Post-Workout',
    category: 'ATP / Strength',
    taken: true,
    benefits: 'Cellular phosphocreatine resynthesis & muscular hydration',
    synergy: 'Stack with post-workout carbohydrates for superior uptake',
  },
  {
    id: 'supp-2',
    name: 'Omega-3 Fish Oil (High EPA/DHA)',
    dosage: '2,000mg',
    timing: 'Morning',
    category: 'Recovery / Cellular',
    taken: true,
    benefits: 'Cardiovascular support & systemic inflammation reduction',
    synergy: 'Take with a fat-soluble meal alongside Vitamin D3',
  },
  {
    id: 'supp-3',
    name: 'Liquid Vitamin D3 + K2 (MK-7)',
    dosage: '5,000 IU',
    timing: 'Morning',
    category: 'Endocrine / Bone',
    taken: false,
    benefits: 'Endocrine axis support & calcium bone deposition',
    synergy: 'Pairs with dietary fats & zinc picolinate',
  },
  {
    id: 'supp-4',
    name: 'Magnesium Bisglycinate',
    dosage: '400mg',
    timing: 'Evening',
    category: 'Sleep / CNS',
    taken: false,
    benefits: 'GABA activation, slow-wave sleep & muscle relaxation',
    synergy: 'Take 45 mins prior to sleep for deep sleep architecture',
  },
  {
    id: 'supp-5',
    name: 'L-Citrulline Malate 2:1',
    dosage: '8,000mg',
    timing: 'Pre-Workout',
    category: 'Nitric Oxide / Pump',
    taken: false,
    benefits: 'Vascular dilation, blood flow & ammonia buffering',
    synergy: 'Stack with Himalayan pink salt & beta-alanine pre-training',
  },
];

const ELECTROLYTES = [
  { name: 'Sodium', current: 2450, target: 3000, unit: 'mg', color: '#0284c7' },
  { name: 'Potassium', current: 2900, target: 3500, unit: 'mg', color: '#38bdf8' },
  { name: 'Magnesium', current: 360, target: 400, unit: 'mg', color: '#f59e0b' },
];

interface SupplementsElectrolytesAccordionProps {
  onShowToast?: (msg: string) => void;
}

export const SupplementsElectrolytesAccordion: React.FC<SupplementsElectrolytesAccordionProps> = ({
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [stack, setStack] = useState<SupplementProtocolItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('o1_supplements_stack_v2');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_STACK;
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'taken'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Custom add state
  const [customName, setCustomName] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [customTiming, setCustomTiming] = useState<SupplementProtocolItem['timing']>('Morning');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('o1_supplements_stack_v2', JSON.stringify(stack));
    } catch (e) {
      // ignore
    }
  }, [stack]);

  // Live online supplement search
  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/fuel/supplement-search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.supplements || []);
        }
      } catch (err) {
        console.warn('Online supplement search fallback:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen]);

  const toggleSupplement = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextTaken = !s.taken;
        onShowToast?.(nextTaken ? `Logged ${s.name} (${s.dosage}).` : `Unchecked ${s.name}.`);
        return { ...s, taken: nextTaken };
      })
    );
  };

  const addSupplementToStack = (item: {
    name: string;
    dosage?: string;
    timing?: string;
    category?: string;
    benefits?: string;
    synergy?: string;
  }) => {
    tactileEngine.playPRCelebration();
    const newItem: SupplementProtocolItem = {
      id: `supp-${Date.now()}`,
      name: item.name,
      dosage: item.dosage || 'Standard Serving',
      timing: (item.timing as any) || 'Morning',
      category: item.category || 'Athletic Optimization',
      taken: false,
      benefits: item.benefits,
      synergy: item.synergy,
    };
    setStack((prev) => [...prev, newItem]);
    onShowToast?.(`Added ${newItem.name} to Daily Stack.`);
  };

  const removeSupplement = (id: string, name: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) => prev.filter((s) => s.id !== id));
    onShowToast?.(`Removed ${name} from stack.`);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    addSupplementToStack({
      name: customName.trim(),
      dosage: customDosage.trim() || '1 serving',
      timing: customTiming,
      category: 'Custom Stack Entry',
    });
    setCustomName('');
    setCustomDosage('');
  };

  const takenCount = stack.filter((s) => s.taken).length;
  const adherencePercent = stack.length > 0 ? Math.round((takenCount / stack.length) * 100) : 0;

  const filteredStack = stack.filter((s) => {
    if (filter === 'pending') return !s.taken;
    if (filter === 'taken') return s.taken;
    return true;
  });

  return (
    <div
      id="supplements-electrolytes-accordion"
      className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-3.5 select-none transition-all duration-200"
    >
      {/* Header Accordion Trigger Matching Screenshot */}
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500 shrink-0">
            <Pill className="w-4 h-4 -rotate-45 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-tight truncate">
              Supplements &amp; Electrolytes
            </h4>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              Tap to expand intake log &amp; electrolyte levels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="pt-2 space-y-3.5 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in duration-200">
          {/* Electrolyte Balance Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold">
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <Zap className="w-3 h-3 text-sky-500 fill-sky-500" />
                <span>Daily Electrolyte Saturation</span>
              </span>
              <span>Plasma Hydration Index</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ELECTROLYTES.map((el) => {
                const pct = Math.min(100, Math.round((el.current / el.target) * 100));
                return (
                  <div
                    key={el.name}
                    className="bg-neutral-50 dark:bg-[#18181b] p-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-center space-y-1"
                  >
                    <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-bold">
                      {el.name}
                    </span>
                    <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100 font-bold block">
                      {el.current}{el.unit}
                    </span>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: el.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Pills & Stack Action Controls */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center bg-neutral-100 dark:bg-[#18181b] p-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono font-bold">
              {(['all', 'pending', 'taken'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-full uppercase transition-all ${
                    filter === f ? 'bg-white dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>{isSearchOpen ? 'Close Search' : '+ Search Stack'}</span>
            </button>
          </div>

          {/* Online Supplement Search Drawer */}
          {isSearchOpen && (
            <div className="bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 space-y-3 animate-in fade-in duration-150">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search supplements, nootropics, adaptogens..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Live Search Results */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {isSearching ? (
                  <div className="text-center py-3 text-[11px] font-mono text-neutral-400">
                    Querying scientific pharmacopeia...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-1 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{item.name}</h5>
                            <span className="text-[9px] font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.2 rounded font-bold border border-violet-200/40 dark:border-violet-800/40">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-0.5">
                            Clinical Dose: {item.clinicalDosage} • {item.timing}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addSupplementToStack({
                              name: item.name,
                              dosage: item.clinicalDosage,
                              timing: item.timing?.includes('Pre')
                                ? 'Pre-Workout'
                                : item.timing?.includes('Evening')
                                ? 'Evening'
                                : 'Morning',
                              category: item.category,
                              benefits: item.primaryBenefits,
                              synergy: item.synergyStack,
                            })
                          }
                          className="px-2.5 py-1 bg-[#C4121A] hover:opacity-90 text-white rounded-lg font-mono text-[10px] font-bold uppercase shrink-0 active:scale-95 transition-all"
                        >
                          + Add
                        </button>
                      </div>

                      {item.primaryBenefits && (
                        <p className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
                          {item.primaryBenefits}
                        </p>
                      )}
                      {item.synergyStack && (
                        <p className="text-[9px] font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 p-1 rounded border border-sky-200 dark:border-sky-800/40">
                          ⚡ Synergy: {item.synergyStack}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-[10px] font-mono text-neutral-400">
                    Type a supplement to search online database
                  </div>
                )}
              </div>

              {/* Quick Custom Input Form */}
              <form onSubmit={handleAddCustom} className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 block">
                  Or Add Custom Compound:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Name (e.g. Cordyceps)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="col-span-1 h-8 px-2 rounded-lg bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-neutral-900 dark:text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Dose (e.g. 1000mg)"
                    value={customDosage}
                    onChange={(e) => setCustomDosage(e.target.value)}
                    className="col-span-1 h-8 px-2 rounded-lg bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="submit"
                    className="col-span-1 h-8 bg-neutral-900 dark:bg-neutral-800 hover:bg-black dark:hover:bg-neutral-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-colors"
                  >
                    Commit
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Supplement Checklist */}
          <div className="space-y-1.5 pt-0.5">
            {filteredStack.map((supp) => (
              <div
                key={supp.id}
                className="bg-neutral-50 dark:bg-[#18181b] p-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 flex items-center justify-between gap-2.5 transition-all group"
              >
                <div
                  onClick={() => toggleSupplement(supp.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      supp.taken
                        ? 'bg-[#C4121A] border-[#C4121A] text-white'
                        : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121214]'
                    }`}
                  >
                    {supp.taken && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-mono font-bold truncate ${
                          supp.taken ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {supp.name}
                      </span>
                      <span className="text-[9px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800">
                        {supp.timing}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-0.5">
                      {supp.dosage} {supp.category && `• ${supp.category}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeSupplement(supp.id, supp.name)}
                  className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Remove from stack"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {filteredStack.length === 0 && (
              <div className="text-center py-4 text-xs font-mono text-neutral-400">
                No items in "{filter}" view
              </div>
            )}
          </div>

          {/* Synergy Insight Banner */}
          <div className="p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 rounded-2xl flex items-start gap-2 text-violet-900 dark:text-violet-200">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono leading-tight">
              <strong>Synergy Note:</strong> Combine Creatine with your post-workout meal for peak insulin-mediated muscle creatine loading. Take Magnesium before sleep to enhance parasympathetic recovery.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplementsElectrolytesAccordion;
