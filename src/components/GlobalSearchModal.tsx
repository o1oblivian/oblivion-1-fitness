import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Dumbbell, UtensilsCrossed, ArrowRight, Clock } from 'lucide-react';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import { INITIAL_FOOD_DB } from '../data/foodDatabase';
import type { FoodItem, AppMode } from '../types';

export interface SearchAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  mode?: AppMode;
  category: 'navigation' | 'quick_action';
  keywords: string[];
  action: () => void;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigate: (mode: AppMode) => void;
  quickActions: SearchAction[];
}

interface UnifiedResult {
  id: string;
  type: 'exercise' | 'food' | 'navigation' | 'quick_action';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  meta?: string;
  action: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  quickActions,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build exercise index once
  const exerciseIndex = useMemo(() => {
    const list: { name: string; category: string }[] = [];
    for (const [category, exercises] of Object.entries(EXERCISE_DATABASE)) {
      for (const ex of exercises) {
        list.push({ name: ex, category });
      }
    }
    return list;
  }, []);

  // Build food index once
  const foodIndex = useMemo(() => {
    const list: { item: FoodItem; category: string }[] = [];
    for (const [category, foods] of Object.entries(INITIAL_FOOD_DB)) {
      for (const food of foods) {
        list.push({ item: food, category });
      }
    }
    return list;
  }, []);

  const navigationActions: SearchAction[] = useMemo(
    () => [
      {
        id: 'nav_home',
        label: 'Home Dashboard',
        description: 'Your daily fitness overview and vitals',
        icon: <Dumbbell className="w-4 h-4" />,
        mode: 'home',
        category: 'navigation',
        keywords: ['home', 'dashboard', 'overview', 'vitals', 'today', 'hero', 'dial'],
        action: () => {},
      },
      {
        id: 'nav_fuel',
        label: 'Fuel & Nutrition',
        description: 'Macro tracking, food logs, hydration, supplements',
        icon: <UtensilsCrossed className="w-4 h-4" />,
        mode: 'fuel',
        category: 'navigation',
        keywords: ['fuel', 'nutrition', 'food', 'macros', 'calories', 'hydration', 'supplements', 'alcohol', 'meals', 'diet'],
        action: () => {},
      },
      {
        id: 'nav_coach',
        label: 'Coach Hub',
        description: 'Intel coaching, programs, marketplace',
        icon: <Dumbbell className="w-4 h-4" />,
        mode: 'coach',
        category: 'navigation',
        keywords: ['coach', 'hub', 'ai', 'programs', 'marketplace', 'training', 'workout', 'dispatch', 'reels'],
        action: () => {},
      },
      {
        id: 'nav_client',
        label: 'Athletes & Clients',
        description: 'Client roster, athlete telemetry, performance',
        icon: <Dumbbell className="w-4 h-4" />,
        mode: 'client',
        category: 'navigation',
        keywords: ['client', 'athletes', 'roster', 'telemetry', 'performance', 'progress', 'share'],
        action: () => {},
      },
    ],
    []
  );

  const allActions = useMemo(() => [...navigationActions, ...quickActions], [navigationActions, quickActions]);

  const results = useMemo<UnifiedResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const matched: UnifiedResult[] = [];

    // Navigation + quick actions
    for (const act of allActions) {
      if (
        act.label.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        act.keywords.some((k) => k.includes(q) || q.includes(k))
      ) {
        matched.push({
          id: act.id,
          type: act.category,
          title: act.label,
          subtitle: act.description,
          icon: act.icon,
          action: act.action,
        });
      }
      if (matched.filter((r) => r.type === 'navigation' || r.type === 'quick_action').length >= 4) break;
    }

    // Exercises
    const exMatches = exerciseIndex
      .filter((e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      .slice(0, 6);
    for (const ex of exMatches) {
      matched.push({
        id: `ex_${ex.name}`,
        type: 'exercise',
        title: ex.name,
        subtitle: ex.category,
        icon: <Dumbbell className="w-4 h-4" />,
        meta: ex.category,
        action: () => {},
      });
    }

    // Foods
    const foodMatches = foodIndex
      .filter(
        (f) =>
          f.item.name.toLowerCase().includes(q) ||
          f.item.brand?.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
    for (const f of foodMatches) {
      matched.push({
        id: `food_${f.item.name}`,
        type: 'food',
        title: f.item.name,
        subtitle: `${f.item.brand || f.category} · P${f.item.p} C${f.item.c} F${f.item.f}`,
        icon: <span className="text-base leading-none">{f.item.icon}</span>,
        meta: `${f.item.p}P ${f.item.c}C ${f.item.f}F`,
        action: () => {},
      });
    }

    return matched;
  }, [query, exerciseIndex, foodIndex, allActions]);

  const recentSearches = useMemo(() => {
    try {
      const saved = localStorage.getItem('global_search_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const saved = localStorage.getItem('global_search_recent');
      const list: string[] = saved ? JSON.parse(saved) : [];
      const updated = [term, ...list.filter((s) => s !== term)].slice(0, 5);
      localStorage.setItem('global_search_recent', JSON.stringify(updated));
    } catch {}
  };

  const handleResultClick = (result: UnifiedResult) => {
    saveRecentSearch(query);
    result.action();
    onClose();
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, UnifiedResult[]> = {};
    for (const r of results) {
      const key = r.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [results]);

  const groupLabels: Record<string, string> = {
    navigation: 'Pages',
    quick_action: 'Quick Actions',
    exercise: 'Exercises',
    food: 'Foods',
  };
  const groupOrder = ['navigation', 'quick_action', 'exercise', 'food'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-start justify-center pt-[env(safe-area-inset-top)] bg-[#0A0A0C]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mt-4 mx-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-700">
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercises, foods, pages..."
                className="flex-1 bg-transparent text-black dark:text-white text-base font-semibold outline-none placeholder:text-neutral-400"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {/* Results area */}
            <div className="max-h-[60dvh] overflow-y-auto">
              {!query.trim() ? (
                /* Empty state - recent searches + suggestions */
                <div className="p-4 space-y-4">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                        <Clock className="w-3 h-3" /> Recent
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => setQuery(term)}
                            className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Popular</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Bench Press', 'Chicken Breast', 'Macros', 'Hydration', 'Pull-up', 'Whey Protein'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Browse</div>
                    <div className="space-y-1">
                      {allActions.filter((a) => a.category === 'navigation').map((act) => (
                        <button
                          key={act.id}
                          onClick={() => {
                            saveRecentSearch(act.label);
                            act.action();
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                        >
                          <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                            {act.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-black dark:text-white truncate">{act.label}</div>
                            <div className="text-[11px] text-neutral-500 truncate">{act.description}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                /* No results */
                <div className="p-4 text-center">
                  <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <div className="text-sm font-bold text-black dark:text-white">No results found</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    No exercises, foods, or pages match "{query}"
                  </div>
                </div>
              ) : (
                /* Grouped results */
                <div className="p-2">
                  {groupOrder.map((group) => {
                    const items = groupedResults[group];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={group} className="mb-1">
                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          {groupLabels[group]}
                        </div>
                        {items.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleResultClick(r)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                          >
                            <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                              {r.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-black dark:text-white truncate">{r.title}</div>
                              <div className="text-[11px] text-neutral-500 truncate">{r.subtitle}</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-neutral-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
