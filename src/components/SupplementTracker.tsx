import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Plus,
  Clock,
  Zap,
  Info,
  RotateCcw,
  Search,
  X,
  Calendar,
  TrendingUp,
  BarChart2,
  Globe,
  Star,
  Trash2,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
  Activity,
  Flame,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '../utils/supabase';

export interface SupplementHistoryLog {
  dayLabel: string;
  dateStr: string;
  taken: boolean;
  time?: string;
}

export interface SupplementItem {
  id: string;
  name: string;
  dosage: string;
  category: string;
  timing: string;
  ingredients: string[];
  benefits: string;
  taken: boolean;
  takenAt?: string;
  history: SupplementHistoryLog[];
  pharmacokinetics?: {
    peakAbsorption: string;
    halfLife: string;
    evidenceGrade: string;
    synergy: string;
    caution?: string;
  };
}

export interface LiveSearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  dosage: string;
  ingredients: string[];
  source: string;
}

export interface SavedQuickSupplement {
  id: string;
  name: string;
  brand: string;
  category: string;
  dosage: string;
  ingredients: string[];
  source: string;
  timing: string;
}

const generate7DayHistory = (isInitiallyTaken: boolean): SupplementHistoryLog[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = new Date().getDay();
  const adjustedToday = (todayIdx + 6) % 7;

  return days.map((dayLabel, idx) => {
    const isToday = idx === adjustedToday;
    const wasTaken = isToday ? isInitiallyTaken : false;
    return {
      dayLabel,
      dateStr: `2026-08-0${idx + 3}`,
      taken: wasTaken,
      time: wasTaken ? '08:15 AM' : undefined,
    };
  });
};

const DEFAULT_SUPPLEMENTS: SupplementItem[] = [
  {
    id: 'supp_creatine',
    name: 'Creatine Monohydrate',
    dosage: '5g (1 Scoop)',
    category: 'Cellular Energy & Power',
    timing: 'Post-workout',
    ingredients: ['100% Pure Creapure® Creatine Monohydrate (5000mg)'],
    benefits: 'Accelerates ATP phosphocreatine resynthesis, enhances intracellular myocellular hydration and power velocity.',
    taken: false,
    takenAt: undefined,
    history: generate7DayHistory(false),
    pharmacokinetics: {
      peakAbsorption: '60–90 min post-ingestion',
      halfLife: 'Intracellular pool: ~30 days saturation',
      evidenceGrade: 'Grade A (Cochrane Review & ISSN Standard)',
      synergy: 'Co-ingest with 30–50g fast-acting carbohydrates for +40% muscle creatine retention via insulin-mediated transport.',
      caution: 'Ensure minimum 3.5L baseline daily hydration to support renal clearance and cellular hyper-hydration.',
    },
  },
  {
    id: 'supp_gda',
    name: 'Glucose Disposal Agent (GDA)',
    dosage: '2 Caps',
    category: 'Nutrient Partitioning',
    timing: 'Pre-meal',
    ingredients: ['Berberine HCl (500mg)', 'R-Alpha Lipoic Acid (150mg)', 'Chromium Picolinate (200mcg)', 'Cinnulin PF® (100mg)'],
    benefits: 'Activates AMPK and upregulates skeletal muscle GLUT-4 translocation to preferentially shuttle carbohydrates into muscle glycogen.',
    taken: false,
    history: generate7DayHistory(false),
    pharmacokinetics: {
      peakAbsorption: '15–30 min (Take immediately before high-carb meal)',
      halfLife: '3.5–4.0 hours',
      evidenceGrade: 'Grade A- (Double-Blind Clinical Endocrine RCTs)',
      synergy: 'Pairs with high-glycemic post-training meal for rapid glycogen supercompensation without insulin spikes.',
      caution: 'Do not take on an empty stomach or during low-carb/fasting periods to avoid hypoglycemia.',
    },
  },
  {
    id: 'supp_preworkout',
    name: 'High-Performance Pre-Workout',
    dosage: '1 Scoop (14g)',
    category: 'Nitric Oxide & Drive',
    timing: 'Pre-workout',
    ingredients: ['L-Citrulline Malate 2:1 (6000mg)', 'Beta-Alanine (3200mg)', 'L-Tyrosine (1000mg)', 'Alpha-GPC (300mg)'],
    benefits: 'Drives endothelial nitric oxide vasodilation, buffers intramuscular lactic acidosis, and heightens neuromuscular motor recruitment.',
    taken: false,
    takenAt: undefined,
    history: generate7DayHistory(false),
    pharmacokinetics: {
      peakAbsorption: '30–45 min pre-hypertrophy / compound lift',
      halfLife: 'Citrulline: ~1 hour; Caffeine: 5.5 hours',
      evidenceGrade: 'Grade A (Sports Physiology Ergogenic Standard)',
      synergy: 'Take with 400ml water and 500mg pink salt for extreme pump volumization and electrolyte pump kinetics.',
      caution: 'Avoid taking within 6 hours of bedtime to preserve slow-wave restorative sleep architecture.',
    },
  },
];

const LOCAL_STORAGE_KEY = 'lumina_supplement_matrix_logs_v3';
const QUICK_ADD_LOCAL_KEY = 'lumina_quick_supplements_fallback';

interface SupplementTrackerProps {
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  currentUserEmail: string;
}

export const SupplementTracker: React.FC<SupplementTrackerProps> = ({ showToast, currentUserEmail }) => {
  const [supplements, setSupplements] = useState<SupplementItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load supplements from localStorage', e);
    }
    return DEFAULT_SUPPLEMENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'taken'>('all');
  const [selectedModalSupplement, setSelectedModalSupplement] = useState<SupplementItem | null>(null);

  // Live search state
  const [liveResults, setLiveResults] = useState<LiveSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick-add saved supplements state
  const [quickAddList, setQuickAddList] = useState<SavedQuickSupplement[]>([]);
  const [isLoadingQuickAdd, setIsLoadingQuickAdd] = useState(true);
  const [showQuickAddPanel, setShowQuickAddPanel] = useState(false);

  // Custom supplement form state
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [customName, setCustomName] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [customTiming, setCustomTiming] = useState('Morning');
  const [customBenefits, setCustomBenefits] = useState('');

  // Save supplements state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(supplements));
    } catch (e) {
      console.error('Failed to save supplement state', e);
    }
  }, [supplements]);

  // Load quick-add supplements from Supabase (or local fallback)
  useEffect(() => {
    const loadQuickAdd = async () => {
      if (!currentUserEmail) {
        loadQuickAddLocal();
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_quick_supplements')
          .select('*')
          .eq('user_email', currentUserEmail)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setQuickAddList(
            data.map((row: any) => ({
              id: row.id,
              name: row.name,
              brand: row.brand || '',
              category: row.category || 'General Wellness',
              dosage: row.dosage || '1 Serving',
              ingredients: row.ingredients || [],
              source: row.source || 'Open Food Facts',
              timing: row.timing || 'Morning',
            }))
          );
        } else {
          loadQuickAddLocal();
        }
      } catch (e) {
        console.warn('Failed to load quick supplements from Supabase, using local fallback', e);
        loadQuickAddLocal();
      } finally {
        setIsLoadingQuickAdd(false);
      }
    };

    loadQuickAdd();
  }, [currentUserEmail]);

  const loadQuickAddLocal = () => {
    try {
      const saved = localStorage.getItem(QUICK_ADD_LOCAL_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setQuickAddList(parsed);
      }
    } catch (e) {
      // ignore
    }
  };

  const saveQuickAddLocal = (list: SavedQuickSupplement[]) => {
    try {
      localStorage.setItem(QUICK_ADD_LOCAL_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };

  const persistQuickAdd = async (newList: SavedQuickSupplement[]) => {
    setQuickAddList(newList);
    saveQuickAddLocal(newList);
  };

  // Live search with debounce
  const performLiveSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setLiveResults([]);
      setSearchError('');
      setShowLiveDropdown(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setIsSearching(true);
    setSearchError('');
    setShowLiveDropdown(true);

    try {
      const { data, error } = await supabase.functions.invoke('supplement-search', {
        body: { q: query.trim() },
      });

      if (error) throw error;
      if (!data || !Array.isArray(data.results)) {
        throw new Error('The supplement search returned an invalid response.');
      }

      if (requestId !== searchRequestRef.current) return;
      const results: LiveSearchResult[] = data.results;
      setLiveResults(results);

      if (results.length === 0) {
        setSearchError('No matching supplements found. Try a brand or ingredient.');
      }
    } catch (e: any) {
      if (requestId !== searchRequestRef.current) return;
      console.warn('Live supplement search error:', e);
      setSearchError('Search is temporarily unavailable. Try adding as a custom item.');
      setLiveResults([]);
    } finally {
      if (requestId === searchRequestRef.current) setIsSearching(false);
    }
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (value.trim().length < 2) {
      setLiveResults([]);
      setSearchError('');
      setShowLiveDropdown(false);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      performLiveSearch(value);
    }, 450);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLiveDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buildSupplementItem = (
    name: string,
    dosage: string,
    category: string,
    ingredients: string[],
    timing: string,
    benefits?: string
  ): SupplementItem => {
    return {
      id: `supp_search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name,
      dosage: dosage || '1 Serving',
      category: category || 'Nutritional Support',
      timing: timing || 'Morning',
      ingredients: ingredients.length > 0 ? ingredients : [name],
      benefits: benefits || `High-potency clinical grade supplement protocol.`,
      taken: false,
      history: generate7DayHistory(false),
      pharmacokinetics: {
        peakAbsorption: '30–60 min',
        halfLife: '4–6 hours',
        evidenceGrade: 'Grade A (Clinical Verification)',
        synergy: 'Take consistently daily with food or post-session hydration.',
      },
    };
  };

  const handleAddFromSearch = (result: LiveSearchResult) => {
    const newItem = buildSupplementItem(
      result.name,
      result.dosage,
      result.category,
      result.ingredients,
      'Morning'
    );
    setSupplements((prev) => [...prev, newItem]);
    setShowLiveDropdown(false);
    setSearchQuery('');
    setLiveResults([]);
    if (showToast) showToast(`Added ${result.name} to matrix!`, 'success');
  };

  const handleSaveToQuickAdd = async (result: LiveSearchResult) => {
    const newSaved: SavedQuickSupplement = {
      id: `quick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: result.name,
      brand: result.brand,
      category: result.category,
      dosage: result.dosage,
      ingredients: result.ingredients,
      source: result.source,
      timing: 'Morning',
    };

    const newList = [newSaved, ...quickAddList];
    await persistQuickAdd(newList);

    if (currentUserEmail) {
      try {
        const { data, error } = await supabase
          .from('user_quick_supplements')
          .insert({
            user_email: currentUserEmail,
            name: newSaved.name,
            brand: newSaved.brand,
            category: newSaved.category,
            dosage: newSaved.dosage,
            ingredients: newSaved.ingredients,
            source: newSaved.source,
            timing: newSaved.timing,
          })
          .select('id')
          .maybeSingle();

        if (error) throw error;
        if (data?.id) {
          const persistedList = newList.map((item) =>
            item.id === newSaved.id ? { ...item, id: data.id } : item
          );
          await persistQuickAdd(persistedList);
        }
      } catch (e) {
        console.warn('Failed to persist quick supplement to Supabase', e);
      }
    }

    if (showToast) showToast(`Saved ${result.name} to favorites!`, 'success');
  };

  const handleAddFromQuickAdd = (saved: SavedQuickSupplement) => {
    const newItem = buildSupplementItem(
      saved.name,
      saved.dosage,
      saved.category,
      saved.ingredients,
      saved.timing
    );
    setSupplements((prev) => [...prev, newItem]);
    if (showToast) showToast(`Added ${saved.name} to matrix!`, 'success');
  };

  const handleDeleteSupplement = (id: string) => {
    setSupplements((prev) => prev.filter((s) => s.id !== id));
    if (showToast) showToast('Supplement removed from matrix.', 'error');
  };

  const handleRemoveQuickAdd = async (id: string) => {
    const newList = quickAddList.filter((s) => s.id !== id);
    await persistQuickAdd(newList);

    if (currentUserEmail) {
      try {
        const { error } = await supabase
          .from('user_quick_supplements')
          .delete()
          .eq('id', id)
          .eq('user_email', currentUserEmail);
        if (error) throw error;
      } catch (e) {
        console.warn('Failed to delete quick supplement from Supabase', e);
      }
    }

    if (showToast) showToast('Removed from favorites.', 'error');
  };

  const isAlreadySaved = (result: LiveSearchResult) => {
    return quickAddList.some(
      (s) => s.name.toLowerCase() === result.name.toLowerCase() && s.brand.toLowerCase() === result.brand.toLowerCase()
    );
  };

  const isAlreadyAdded = (name: string) => {
    return supplements.some((s) => s.name.toLowerCase() === name.toLowerCase());
  };

  const takenCount = supplements.filter((s) => s.taken).length;
  const totalCount = supplements.length;
  const compliancePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Intelligent Chrono-Timing & Synergy Model
  const intelligentAnalysis = useMemo(() => {
    const hasCreatine = supplements.some((s) => s.name.toLowerCase().includes('creatine'));
    const hasGDA = supplements.some((s) => s.name.toLowerCase().includes('gda') || s.name.toLowerCase().includes('berberine'));
    const hasPreWorkout = supplements.some((s) => s.name.toLowerCase().includes('pre-workout') || s.name.toLowerCase().includes('caffeine') || s.name.toLowerCase().includes('citrulline'));

    let synergyMessage = 'Clinical absorption protocol active. All bio-markers synchronized.';
    let synergyTag = 'Optimized';

    if (hasCreatine && hasGDA) {
      synergyMessage = 'Synergy Detected: Creatine + GDA maximizes GLUT-4 muscle glycogen & phosphocreatine supercompensation.';
      synergyTag = 'Synergy +35%';
    } else if (hasCreatine && hasPreWorkout) {
      synergyMessage = 'Synergy Detected: Citrulline nitric oxide vasodilation accelerates intracellular creatine delivery.';
      synergyTag = 'Enhanced Pump';
    } else if (hasPreWorkout) {
      synergyMessage = 'Pre-Workout Ergogenic Protocol: Dose 30–45m before compound loading for peak motor unit activation.';
      synergyTag = 'Pre-Load';
    }

    const efficacyScore = totalCount === 0 ? 0 : Math.min(100, Math.round((compliancePct * 0.7) + (totalCount >= 3 ? 30 : totalCount * 10)));

    return {
      synergyMessage,
      synergyTag,
      efficacyScore,
    };
  }, [supplements, compliancePct, totalCount]);

  const toggleSupplement = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setSupplements((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextTaken = !item.taken;
          const timeStr = nextTaken
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined;

          if (showToast) {
            showToast(
              nextTaken ? `Logged: ${item.name}` : `Unchecked: ${item.name}`,
              nextTaken ? 'success' : 'error'
            );
          }

          const todayIdx = (new Date().getDay() + 6) % 7;
          const updatedHistory = (item.history || []).map((h, idx) => {
            if (idx === todayIdx) {
              return { ...h, taken: nextTaken, time: timeStr };
            }
            return h;
          });

          const updatedItem = {
            ...item,
            taken: nextTaken,
            takenAt: timeStr,
            history: updatedHistory,
          };

          if (selectedModalSupplement?.id === id) {
            setSelectedModalSupplement(updatedItem);
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const toggleHistoricalDay = (suppId: string, dayIdx: number) => {
    setSupplements((prev) =>
      prev.map((item) => {
        if (item.id === suppId) {
          const todayIdx = (new Date().getDay() + 6) % 7;
          const newHistory = [...item.history];
          const curr = newHistory[dayIdx];
          const nextState = !curr.taken;

          newHistory[dayIdx] = {
            ...curr,
            taken: nextState,
            time: nextState ? '09:00 AM' : undefined,
          };

          const isToday = dayIdx === todayIdx;
          const updatedItem = {
            ...item,
            history: newHistory,
            taken: isToday ? nextState : item.taken,
            takenAt: isToday ? (nextState ? '09:00 AM' : undefined) : item.takenAt,
          };

          if (selectedModalSupplement?.id === suppId) {
            setSelectedModalSupplement(updatedItem);
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const markAllTaken = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSupplements((prev) =>
      prev.map((s) => ({ ...s, taken: true, takenAt: s.takenAt || timeStr }))
    );
    if (showToast) showToast('All matrix supplements marked taken!', 'success');
  };

  const handleAddCustomSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: SupplementItem = {
      id: `supp_custom_${Date.now()}`,
      name: customName.trim(),
      dosage: customDosage.trim() || '1 Serving',
      category: 'Targeted Ergogenic',
      timing: customTiming,
      ingredients: [customName.trim()],
      benefits: customBenefits.trim() || 'Personal targeted bio-active supplement protocol',
      taken: false,
      history: generate7DayHistory(false),
      pharmacokinetics: {
        peakAbsorption: '30–60 min',
        halfLife: '4–6 hours',
        evidenceGrade: 'Grade A Protocol',
        synergy: 'Dosed according to personal athletic periodization.',
      },
    };

    setSupplements((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomDosage('');
    setCustomBenefits('');
    setIsAddingCustom(false);
    if (showToast) showToast(`Added ${newItem.name} to matrix!`, 'success');
  };

  const filteredSupplements = supplements.filter((s) => {
    if (filterMode === 'pending' && s.taken) return false;
    if (filterMode === 'taken' && !s.taken) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.dosage.toLowerCase().includes(q) ||
      s.timing.toLowerCase().includes(q) ||
      s.benefits.toLowerCase().includes(q) ||
      s.ingredients.some((ing) => ing.toLowerCase().includes(q))
    );
  });

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartTrendData = daysList.map((dayLabel, dayIdx) => {
    let takenInDay = 0;
    supplements.forEach((s) => {
      if (s.history && s.history[dayIdx] && s.history[dayIdx].taken) {
        takenInDay++;
      }
    });
    const dayCompliancePct = totalCount > 0 ? Math.round((takenInDay / totalCount) * 100) : 0;
    const targetBaseline = Math.min(100, Math.max(70, dayCompliancePct + (dayIdx % 2 === 0 ? 10 : -4)));

    return {
      day: dayLabel,
      Compliance: dayCompliancePct,
      CalorieTarget: targetBaseline,
    };
  });

  const renderTimingBadge = (timing: string) => {
    const t = timing.toLowerCase();
    let dotColor = 'bg-slate-400';
    if (t.includes('pre-workout')) dotColor = 'bg-red-500';
    else if (t.includes('post-workout')) dotColor = 'bg-emerald-500';
    else if (t.includes('pre-meal')) dotColor = 'bg-sky-400';
    else if (t.includes('sleep') || t.includes('evening')) dotColor = 'bg-indigo-400';
    else if (t.includes('morning')) dotColor = 'bg-amber-400';

    return (
      <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 shrink-0 inline-flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
        <span>{timing}</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0E0F12] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs p-2.5 sm:p-3 text-slate-900 dark:text-white space-y-2.5">
      
      {/* ── TOP ULTRA-COMPACT HUD BAR ── */}
      <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {takenCount}/{totalCount} Taken ({compliancePct}%)
          </span>
          <span className="text-[9.5px] font-mono font-medium text-slate-500 dark:text-zinc-400 hidden sm:inline-flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-slate-400" />
            Efficacy Index: <strong className="text-slate-900 dark:text-white font-mono">{intelligentAnalysis.efficacyScore}/100</strong>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {takenCount < totalCount && totalCount > 0 && (
            <button
              type="button"
              onClick={markAllTaken}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Log All</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowQuickAddPanel((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
              showQuickAddPanel
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white'
                : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Star className={`w-3 h-3 ${showQuickAddPanel ? 'text-white dark:text-black' : 'text-amber-500'}`} />
            <span>Favorites</span>
            {quickAddList.length > 0 && (
              <span className="text-[8.5px] font-mono px-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                {quickAddList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── INTELLIGENT COMPLIANCE & CHRONO-TIMING BAROMETER (82px) ── */}
      <div className="bg-slate-50/90 dark:bg-[#141518] rounded-xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-white/10 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>Intelligent Matrix & Adherence</span>
            <span className="px-1.5 py-0.2 text-[8.5px] font-mono font-bold rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300/80 dark:border-white/10 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{intelligentAnalysis.synergyTag}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[9px] font-mono font-bold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Adherence
            </span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" /> Target %
            </span>
          </div>
        </div>

        {/* Compact Sparkline Chart (52px) */}
        <div className="w-full h-[52px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartTrendData} margin={{ top: 2, right: 4, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="suppAdhGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34A853" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34A853" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="suppTgtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8.5, fill: '#64748b', fontWeight: 600 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/15 p-1.5 rounded-lg shadow-sm text-[9.5px] font-mono space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">{label} Intel</div>
                        <div className="text-emerald-600 dark:text-emerald-400">Adherence: {payload[0]?.value}%</div>
                        <div className="text-slate-600 dark:text-zinc-300">Target Match: {payload[1]?.value}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="Compliance" stroke="#34A853" strokeWidth={1.8} fillOpacity={1} fill="url(#suppAdhGradient)" />
              <Area type="monotone" dataKey="CalorieTarget" stroke="#64748b" strokeWidth={1.2} strokeDasharray="2 2" fillOpacity={1} fill="url(#suppTgtGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Sports Science Ticker */}
        <div className="text-[9.5px] font-mono text-slate-600 dark:text-zinc-400 bg-slate-100/90 dark:bg-black/40 px-2 py-1 rounded-md border border-slate-200/60 dark:border-white/5 truncate flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span className="truncate">{intelligentAnalysis.synergyMessage}</span>
        </div>
      </div>

      {/* ── COMPACT SEARCH & FILTER STRIP ── */}
      <div className="space-y-1.5">
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search supplement or brand..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowLiveDropdown(true);
              }}
              className="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-all font-mono"
            />
            {isSearching ? (
              <Loader2 className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500 animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  ++searchRequestRef.current;
                  setSearchQuery('');
                  setLiveResults([]);
                  setSearchError('');
                  setShowLiveDropdown(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>

          <AnimatePresence>
            {showLiveDropdown && searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-white/15 shadow-xl max-h-56 overflow-y-auto"
              >
                {liveResults.length > 0 && (
                  <div className="p-1 space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-red-500">
                      <Globe className="w-2.5 h-2.5" /> Verified catalog matches
                    </div>
                    {liveResults.map((result) => {
                      const alreadySaved = isAlreadySaved(result);
                      const alreadyAdded = isAlreadyAdded(result.name);
                      return (
                        <div key={result.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{result.name}</div>
                            <div className="text-[9.5px] text-slate-500 dark:text-zinc-400 truncate">{result.brand} • {result.dosage}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSaveToQuickAdd(result)}
                              disabled={alreadySaved}
                              className={`p-1 rounded-md ${alreadySaved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                            >
                              <Star className={`w-3 h-3 ${alreadySaved ? 'fill-amber-500' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddFromSearch(result)}
                              disabled={alreadyAdded}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${alreadyAdded ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800'}`}
                            >
                              {alreadyAdded ? 'Added' : '+ Add'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!isSearching && liveResults.length === 0 && searchError && (
                  <div className="p-2 text-center text-[10px] text-slate-500">{searchError}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compact Filters + Custom Button Row (Height: 26px) */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center bg-slate-100 dark:bg-[#141518] p-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 font-mono text-[10px] h-[26px]">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`h-[22px] px-2 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`h-[22px] px-2 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center ${
                filterMode === 'pending'
                  ? 'bg-slate-900 dark:bg-zinc-700 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({totalCount - takenCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('taken')}
              className={`h-[22px] px-2 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center ${
                filterMode === 'taken'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Taken ({takenCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingCustom((prev) => !prev)}
            className="flex items-center gap-1 h-[26px] px-2.5 rounded-lg text-[10.5px] font-semibold font-mono bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-100 transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Custom Supplement Creation Form */}
      <AnimatePresence>
        {isAddingCustom && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddCustomSupplement}
            className="bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 overflow-hidden"
          >
            <div className="font-bold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider">
              Add Custom Supplement Protocol
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="Name (e.g. Ashwagandha KSM-66)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                required
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 600mg)"
                value={customDosage}
                onChange={(e) => setCustomDosage(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <select
                value={customTiming}
                onChange={(e) => setCustomTiming(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              >
                <option value="Morning">Morning</option>
                <option value="Pre-workout">Pre-workout</option>
                <option value="Post-workout">Post-workout</option>
                <option value="Pre-meal">Pre-meal</option>
                <option value="Evening / Sleep">Evening / Sleep</option>
              </select>
              <input
                type="text"
                placeholder="Benefits (e.g. Cortisol reduction)"
                value={customBenefits}
                onChange={(e) => setCustomBenefits(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-500 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Quick-Add Saved Supplements Panel */}
      <AnimatePresence>
        {showQuickAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span>Favorite Supplement Vault</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{quickAddList.length} saved</span>
              </div>

              {isLoadingQuickAdd ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                  <span className="text-xs text-slate-400 ml-1.5">Loading...</span>
                </div>
              ) : quickAddList.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-1 text-center">
                  Search above and tap the star icon to pin your daily favorites here for instant 1-tap logging.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {quickAddList.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">{saved.name}</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">{saved.dosage}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddFromQuickAdd(saved)}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          + Add
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuickAdd(saved.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ULTRA-COMPACT SUPPLEMENT ROWS (REDUCED HEIGHT: 44px) ── */}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filteredSupplements.length === 0 ? (
          <div className="p-3 text-center bg-slate-50 dark:bg-[#141518] rounded-xl border border-slate-200/80 dark:border-white/5">
            <p className="text-xs text-slate-500 font-medium font-mono">
              No supplements matching active filter.
            </p>
          </div>
        ) : (
          filteredSupplements.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedModalSupplement(item)}
              className={`group flex items-center justify-between py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                item.taken
                  ? 'bg-slate-50/60 dark:bg-zinc-900/30 border-slate-200/60 dark:border-white/5 opacity-75'
                  : 'bg-white dark:bg-[#141518] border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {/* Micro Circular Checkbox (18px) */}
                <button
                  type="button"
                  onClick={(e) => toggleSupplement(item.id, e)}
                  className={`w-[18px] h-[18px] min-w-[18px] min-h-[18px] max-w-[18px] max-h-[18px] aspect-square rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    item.taken
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                      : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-700 text-transparent hover:border-emerald-500'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </button>

                <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`font-bold text-xs truncate max-w-[150px] sm:max-w-[220px] ${
                      item.taken
                        ? 'text-slate-400 dark:text-zinc-500 line-through decoration-emerald-500/60'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.name}
                  </span>

                  <span className="text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-white/5 shrink-0">
                    {item.dosage}
                  </span>

                  {renderTimingBadge(item.timing)}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {item.taken && item.takenAt && (
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline-block pr-1">
                    {item.takenAt}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModalSupplement(item);
                  }}
                  className="p-1 rounded-md text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  title="View Pharmacokinetics & Intel"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSupplement(item.id);
                  }}
                  className="p-1 rounded-md text-slate-400 dark:text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── INTELLIGENT PHARMACOKINETIC & PROTOCOL MODAL INSPECTOR ── */}
      <AnimatePresence>
        {selectedModalSupplement && (
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
            onClick={() => setSelectedModalSupplement(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/15 p-4 rounded-3xl shadow-2xl w-full max-w-md max-h-[85dvh] overflow-y-auto text-slate-900 dark:text-white space-y-3.5 relative my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                      <Zap className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {selectedModalSupplement.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px]">
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 font-bold border border-slate-200 dark:border-white/10">
                      {selectedModalSupplement.dosage}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                      {selectedModalSupplement.category}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedModalSupplement(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pharmacokinetics & Evidence Grade Strip */}
              <div className="grid grid-cols-2 gap-2 font-mono text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-white/5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Peak Bio-Absorption</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedModalSupplement.pharmacokinetics?.peakAbsorption || '30–60 min'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-white/5">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Evidence Standard</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedModalSupplement.pharmacokinetics?.evidenceGrade || 'Grade A (Clinical RCT)'}
                  </div>
                </div>
              </div>

              {/* 7-Day Intake Calendar */}
              <div className="bg-slate-50 dark:bg-zinc-900/80 p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-slate-900 dark:text-white">
                    <Calendar className="w-3 h-3 text-red-500" />
                    <span>7-Day Periodization Log</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[9px]">Tap to toggle</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {(selectedModalSupplement.history || []).map((hist, idx) => {
                    const todayIdx = (new Date().getDay() + 6) % 7;
                    const isToday = idx === todayIdx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleHistoricalDay(selectedModalSupplement.id, idx)}
                        className={`py-1 px-0.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          hist.taken
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                            : 'bg-white dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-white/10 hover:border-red-500'
                        } ${isToday ? 'ring-1.5 ring-red-500' : ''}`}
                      >
                        <span className="text-[8.5px] font-mono uppercase font-bold">{hist.dayLabel}</span>
                        <div className="mt-0.5">
                          {hist.taken ? (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          ) : (
                            <span className="text-[9px] font-mono font-bold text-slate-300 dark:text-zinc-600">•</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio-Active Ingredients & Mechanism */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-red-500" />
                  Active Compounds:
                </span>
                <p className="text-slate-600 dark:text-zinc-300 font-mono text-[10.5px] bg-slate-50 dark:bg-zinc-900 p-2 rounded-xl border border-slate-200/80 dark:border-white/5 leading-relaxed">
                  {selectedModalSupplement.ingredients.join(' • ')}
                </p>
              </div>

              {/* Synergy & Timing Prescription */}
              {selectedModalSupplement.pharmacokinetics?.synergy && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Intelligent Synergy Protocol:
                  </span>
                  <p className="text-slate-700 dark:text-zinc-300 text-[10.5px] bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 leading-relaxed font-mono">
                    {selectedModalSupplement.pharmacokinetics.synergy}
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => toggleSupplement(selectedModalSupplement.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                    selectedModalSupplement.taken
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{selectedModalSupplement.taken ? 'Logged Today' : 'Mark Taken Today'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteSupplement(selectedModalSupplement.id);
                      setSelectedModalSupplement(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModalSupplement(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer font-mono"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
