import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wine, Plus, Minus, Flame, Search, X, Globe } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import {
  ALCOHOL_DATABASE,
  type AlcoholItem,
} from '../../data/alcoholDatabase';

interface AlcoholTrackerProps {
  currentUserEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const STORAGE_KEY = (email: string) => `lumina_alcohol_${email}`;
const TODAY_KEY = () => new Date().toISOString().slice(0, 10);

const GRAMS_PER_DRINK = 14;

interface AlcoholRecord {
  date: string;
  drinks: number;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const AlcoholTracker: React.FC<AlcoholTrackerProps> = ({
  currentUserEmail,
  showToast,
}) => {
  const [drinks, setDrinks] = useState(0);
  const [history, setHistory] = useState<AlcoholRecord[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAlcohol = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(currentUserEmail));
      if (raw) {
        const records: AlcoholRecord[] = JSON.parse(raw);
        const today = records.find((r) => r.date === TODAY_KEY());
        if (today) return today.drinks;
      }
    } catch (e) {}
    return 0;
  }, [currentUserEmail]);

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(currentUserEmail));
      if (raw) {
        const records: AlcoholRecord[] = JSON.parse(raw);
        setHistory(records.slice(-14).reverse());
      }
    } catch (e) {}
  }, [currentUserEmail]);

  const syncFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const today = TODAY_KEY();
      const { data } = await supabase
        .from('daily_macros')
        .select('alcohol_drinks, record_date')
        .eq('user_email', currentUserEmail)
        .order('record_date', { ascending: false })
        .limit(14);

      if (data && data.length > 0) {
        const todayRow = data.find((r) => r.record_date === today);
        if (todayRow && todayRow.alcohol_drinks != null) {
          setDrinks(Number(todayRow.alcohol_drinks));
        }
        setHistory(
          data.map((r) => ({ date: r.record_date, drinks: Number(r.alcohol_drinks) || 0 }))
        );
      }
    } catch (e) {}
  }, [currentUserEmail]);

  useEffect(() => {
    setDrinks(loadAlcohol());
    loadHistory();
    syncFromSupabase();
  }, [loadAlcohol, loadHistory, syncFromSupabase]);

  const saveAlcohol = (newDrinks: number) => {
    setDrinks(newDrinks);
    try {
      const raw = localStorage.getItem(STORAGE_KEY(currentUserEmail));
      let records: AlcoholRecord[] = raw ? JSON.parse(raw) : [];
      const todayIdx = records.findIndex((r) => r.date === TODAY_KEY());
      if (todayIdx >= 0) {
        records[todayIdx].drinks = newDrinks;
      } else {
        records.push({ date: TODAY_KEY(), drinks: newDrinks });
      }
      records = records.slice(-30);
      localStorage.setItem(STORAGE_KEY(currentUserEmail), JSON.stringify(records));
      setHistory(records.slice(-14).reverse());
    } catch (e) {}

    if (isSupabaseConfigured()) {
      const alcoholGrams = newDrinks * GRAMS_PER_DRINK;
      supabase
        .from('daily_macros')
        .upsert(
          {
            user_email: currentUserEmail,
            record_date: TODAY_KEY(),
            alcohol_drinks: newDrinks,
            alcohol_grams: alcoholGrams,
          },
          { onConflict: 'user_email,record_date' }
        )
        .then(() => {});
    }
  };

  const addDrink = (delta: number) => {
    const next = Math.max(0, Math.round((drinks + delta) * 10) / 10);
    saveAlcohol(next);
    if (delta > 0) showToast(`${delta} drink logged`, 'success');
  };

  const addSpecificDrink = (item: AlcoholItem) => {
    const delta = item.stdDrinks;
    const next = Math.max(0, Math.round((drinks + delta) * 10) / 10);
    saveAlcohol(next);
    showToast(`+${item.stdDrinks} ${item.name} (${item.country}) · ${item.cals} kcal`, 'success');
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return ALCOHOL_DATABASE.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.subType.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const dailyLimit = 2;

  const avgDrinks = history.length > 0
    ? (history.reduce((s, r) => s + r.drinks, 0) / history.length).toFixed(1)
    : '0.0';

  const sortedHistory = [...history].reverse();
  let cleanStreak = 0;
  for (let i = sortedHistory.length - 1; i >= 0; i--) {
    if (sortedHistory[i].drinks === 0) cleanStreak++;
    else break;
  }

  const last7: AlcoholRecord[] = sortedHistory.slice(-7);
  const maxDrinks = Math.max(dailyLimit, ...last7.map((r) => r.drinks), 1);

  const insight = drinks === 0
    ? `Clean Streak: ${cleanStreak} ${cleanStreak === 1 ? 'Day' : 'Days'} -- REM Sleep Protected`
    : drinks <= dailyLimit
    ? `Moderate Intake -- ${drinks}/${dailyLimit} Daily Limit`
    : `Over Limit -- ${drinks - dailyLimit} Excess -- Recovery Impacted`;

  return (
    <div className="relative bg-white dark:bg-[#0d1117] border border-[rgba(0,0,0,0.08)] dark:border-stone-500/10 rounded-2xl p-3 text-[#1C1C1E] dark:text-white flex flex-col gap-2 h-full min-h-[170px] max-h-[190px] shadow-2xs dark:shadow-none overflow-hidden">
      {/* Ambient glow */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
        drinks === 0 ? 'bg-zinc-500/10 dark:bg-zinc-500/8' : 'bg-red-500/8 dark:bg-red-500/6'
      }`} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-bold text-[#1C1C1E] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
            drinks === 0 ? 'bg-zinc-500/15 dark:bg-zinc-500/20' : 'bg-red-500/15 dark:bg-red-500/20'
          }`}>
            {drinks === 0
              ? <Flame className="w-3 h-3 text-zinc-500 dark:text-stone-400" />
              : <Wine className="w-3 h-3 text-red-500 dark:text-red-400" />
            }
          </div>
          {drinks === 0 ? 'Sobriety' : 'Alcohol'}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            className="p-1 rounded-md bg-zinc-500/10 hover:bg-zinc-500/20 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-stone-300 text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-all"
            title="Search Country Beverages"
          >
            <Globe className="w-2.5 h-2.5" />
            <span>Search</span>
          </button>
          <span className="text-[9px] font-mono text-[#848785] dark:text-neutral-500">
            {drinks === 0 ? `${cleanStreak}d streak` : `Avg ${avgDrinks} dr/day`}
          </span>
        </div>
      </div>

      {/* Streak counter / 7-day timeline */}
      <div className="relative z-10 flex items-stretch gap-2 flex-1 min-h-0">
        {/* Streak badge */}
        <div className={`relative w-10 rounded-xl overflow-hidden border flex-shrink-0 flex flex-col items-center justify-center ${
          drinks === 0
            ? 'border-stone-500/15 dark:border-stone-500/10 bg-red-50 dark:bg-stone-950/20'
            : 'border-red-500/15 dark:border-red-500/10 bg-red-50 dark:bg-red-950/20'
        }`}>
          <span className={`text-lg font-black font-mono leading-none ${
            drinks === 0 ? 'text-zinc-600 dark:text-stone-400' : 'text-red-500 dark:text-red-400'
          }`}>
            {drinks === 0 ? cleanStreak : drinks}
          </span>
          <span className={`text-[6px] font-mono uppercase mt-0.5 ${
            drinks === 0 ? 'text-zinc-500/60' : 'text-red-400/60'
          }`}>
            {drinks === 0 ? 'DAYS' : 'TODAY'}
          </span>
        </div>

        {/* 7-Day bars / dots */}
        <div className="flex items-end gap-1 flex-1">
          {last7.length > 0 ? last7.map((rec, i) => {
            const isToday = rec.date === TODAY_KEY();
            const zero = rec.drinks === 0;
            const over = rec.drinks > dailyLimit;
            const barHeight = Math.max(4, (rec.drinks / maxDrinks) * 100);
            return (
              <div key={rec.date + i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                {zero ? (
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isToday
                      ? 'bg-zinc-500 dark:bg-stone-400 ring-2 ring-stone-400/40 dark:ring-stone-300/40 shadow-[0_0_6px_rgba(168,162,158,0.4)]'
                      : 'bg-zinc-500/40'
                  }`} />
                ) : (
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      isToday
                        ? over
                          ? 'bg-gradient-to-t from-red-500 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                          : 'bg-gradient-to-t from-stone-500 to-stone-400 dark:from-stone-400 dark:to-stone-300 shadow-[0_0_8px_rgba(168,162,158,0.4)]'
                        : over
                        ? 'bg-red-500/40'
                        : 'bg-zinc-500/25 dark:bg-zinc-500/30'
                    }`}
                    style={{ height: `${barHeight}%`, minHeight: '4px' }}
                  />
                )}
                <span className={`text-[6px] font-mono ${isToday ? 'text-zinc-600 dark:text-stone-300 font-bold' : 'text-neutral-400 dark:text-neutral-600'}`}>
                  {DAY_LABELS[(new Date(rec.date).getDay() + 6) % 7]}
                </span>
              </div>
            );
          }) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-[8px] font-mono text-[#848785] dark:text-neutral-600">No data yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-mono text-xl font-black leading-none ${
              drinks === 0
                ? 'text-zinc-500 dark:text-stone-400'
                : drinks <= dailyLimit
                ? 'text-amber-500 dark:text-amber-300'
                : 'text-red-500 dark:text-red-400'
            }`}
          >
            {drinks}
          </span>
          <span className="text-[10px] font-mono text-[#848785] dark:text-neutral-500">drinks</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addDrink(1)}
            className="px-2 py-1 rounded-lg bg-zinc-500/12 dark:bg-zinc-500/15 text-zinc-600 dark:text-stone-300 font-mono text-[10px] font-bold hover:bg-zinc-500/20 dark:hover:bg-zinc-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
          >
            <Plus className="w-2.5 h-2.5" />1
          </button>
          <button
            onClick={() => addDrink(2)}
            className="px-2 py-1 rounded-lg bg-zinc-500/12 dark:bg-zinc-500/15 text-zinc-600 dark:text-stone-300 font-mono text-[10px] font-bold hover:bg-zinc-500/20 dark:hover:bg-zinc-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
          >
            <Plus className="w-2.5 h-2.5" />2
          </button>
          <button
            onClick={() => addDrink(-1)}
            className="w-6 h-6 rounded-lg bg-[#E5E5EA] dark:bg-neutral-800 text-[#848785] dark:text-neutral-400 font-mono text-xs font-bold hover:text-[#1C1C1E] dark:hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Insight */}
      <div className={`relative z-10 text-[8px] font-mono truncate ${
        drinks > dailyLimit ? 'text-red-400/70' : 'text-zinc-500/60 dark:text-stone-400/60'
      }`}>
        {insight}
      </div>

      {/* Country Alcohol Catalog Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#141518] border border-slate-200/90 dark:border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
            {/* Header */}
            <div className="p-3 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Global Alcohol Intelligence
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">
                    60+ Country-Originated Beers, Wines & Spirits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content & Search */}
            <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any beer, wine, spirit, cocktail..."
                  className="w-full bg-slate-50 dark:bg-[#18191c] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Drink List */}
              {searchQuery.trim() ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {filteredCatalog.length > 0 ? (
                    filteredCatalog.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-[#18191c] border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                      >
                        <div className="min-w-0 pr-2 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                              {item.countryCode}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] text-slate-500 dark:text-zinc-400 truncate">
                            <span className="truncate">{item.subType}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{item.abv}% ABV</span>
                            <span>·</span>
                            <span>{item.cals} kcal</span>
                            <span>·</span>
                            <span>{item.servingSize}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addSpecificDrink(item);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[10px] font-bold active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>+{item.stdDrinks}</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                      No matching beverages found.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 dark:text-zinc-500 text-xs">
                  Type a beverage name, style, or brand above to search all types of alcohol.
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-zinc-950 flex items-center justify-between">
              <div>
                <div className="text-[8px] uppercase text-slate-400">Current Intake</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {drinks} {drinks === 1 ? 'drink' : 'drinks'} logged today
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-[10.5px] font-bold cursor-pointer hover:bg-slate-800 dark:hover:bg-zinc-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
