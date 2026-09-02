import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Search,
  Clock,
  DollarSign,
  Dumbbell,
  Target,
  Layers,
  Image as ImageIcon,
  Video,
  GripVertical,
  Check,
  Copy,
  Sparkles,
  BookOpen,
  Zap,
  Flame,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Activity,
  Calendar,
  FileText,
  Sliders,
  FolderOpen,
  Lock,
} from 'lucide-react';
import { useSubscription } from '@/utils/useSubscription';
import { EXERCISE_DATABASE } from '@/data/exerciseDatabase';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import {
  generateSmartBlueprint,
  getIntelligentExercises,
  CATEGORY_FOCUS_OPTIONS,
  getDefaultFocusForCategory,
  CATEGORY_DEFAULT_SPLITS,
} from '@/utils/intelligentWorkoutEngine';
import { ProgramCoverVaultPicker } from './ProgramCoverVaultPicker';

export const PROGRAM_DESCRIPTION_TEMPLATES: { label: string; category: string; short: string; full: string }[] = [
  {
    label: 'Hypertrophy Power Protocol',
    category: 'Hypertrophy',
    short: 'High-volume hypertrophy system engineering maximum myofibrillar growth with calibrated mechanical tension.',
    full: 'Targeted at intermediate to advanced lifters seeking rapid muscle growth. Combines heavy primary compound movements in the 6-8 rep range with high-density isolation volume (10-15 reps) to maximize muscular tension and metabolic stress across a structured split.',
  },
  {
    label: 'Push Pull Legs Mastery',
    category: 'Push Pull Legs',
    short: 'Classic 6-day PPL split structured for maximum weekly frequency and balanced muscular development.',
    full: 'Built for lifters wanting consistent frequency per muscle group. Sessions alternate between upper pressing, pulling, and lower body drive with built-in autoregulation and progressive overload tracking.',
  },
  {
    label: 'HYROX Race Conditioning',
    category: 'HYROX',
    short: 'Hybrid engine builder blending sled work, skierg intervals, running pacing, and functional power.',
    full: 'Engineered specifically for hybrid fitness racers and HYROX competitors. Combines compromised running stamina with station-specific strength endurance (sled push/pull, burpee broad jumps, wall balls) to peak aerobic and anaerobic capacity.',
  },
  {
    label: 'Pure Strength 5x5 System',
    category: 'Strength',
    short: 'Linear and undulating barbell strength blueprint focused on bench press, squat, deadlift, and overhead press.',
    full: 'A foundational strength methodology built around progressive overload on the core power lifts. Focuses on nervous system efficiency, force production, and sub-maximal volume with dedicated deload protocols.',
  },
  {
    label: 'Powerlifting Meet Prep Peak',
    category: 'Powerlifting',
    short: 'Peaking protocol targeting maximal 1RM strength on Squat, Bench Press, and Deadlift with calibrated RPE.',
    full: 'Designed for competitive powerlifters and strength athletes. Features heavy compound singles/doubles, specific accessory weakness targeting, pausing variations, and a structured taper to peak on meet day.',
  },
  {
    label: 'Combat & Striking Conditioning',
    category: 'Combat & Boxing',
    short: 'Rotational power, footwork agility, punch endurance, and neck/core bulletproofing for combat athletes.',
    full: 'Tailored for boxers, martial artists, and combat athletes. Blends high-velocity rotational med-ball throws, heavy bag sprint intervals, neck isometric bridges, and shoulder endurance circuits for 12-round stamina.',
  },
  {
    label: 'Endurance & Zone 2 Aerobic Base',
    category: 'Endurance',
    short: 'Mitochondrial density, lactate threshold pacing, and high-efficiency aerobic stamina development.',
    full: 'A comprehensive aerobic conditioning protocol for runners, triathletes, and hybrid performers. Structures Zone 2 base building, VO2 max high-intensity intervals, and muscular endurance sessions.',
  },
  {
    label: 'Functional Mobility & Joint Longevity',
    category: 'Mobility',
    short: 'Joint stability, hip & shoulder mobility, and structural bulletproofing for injury resilience and posture.',
    full: 'Focuses on end-range joint strength, spinal decompression, hip opening, and posterior chain activation. Ideal as an active recovery cycle or foundational movement restoration block.',
  },
  {
    label: 'Sport Speed & Athletic Agility',
    category: 'Sport-Specific',
    short: 'First-step acceleration, plyometric vertical force, deceleration control, and field agility.',
    full: 'Built for court, turf, and field athletes. Incorporates sprint mechanics, plyometric depth jumps, reactive ladder footwork, and unilateral lower-body deceleration strength to dominate on game day.',
  },
  {
    label: 'Calisthenics & Bodyweight Dominance',
    category: 'Calisthenics',
    short: 'Relative strength, straight-arm levers, muscle-up mastery, and strict gymnastics strength.',
    full: 'Focuses on mastery over one’s own bodyweight. Progresses pull-ups, ring dips, pistol squats, handstand push-ups, and lever isometric holds with strict mechanical control.',
  },
  {
    label: 'Athletic Body Recomposition',
    category: 'Body Recomp',
    short: 'Metabolic resistance training and high-yield supersets designed to shed body fat while preserving lean tissue.',
    full: 'Optimized for simultaneous fat loss and lean mass retention. Features undulating rep ranges, active rest intervals, and targeted metabolic conditioning circuits to elevate daily energy expenditure.',
  },
];

/* ───────── types ───────── */

export interface ProgramExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  notes: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | '';
}

export interface ProgramDay {
  id: string;
  label: string;
  focus: string;
  exercises: ProgramExercise[];
}

export interface ProgramWeek {
  id: string;
  days: ProgramDay[];
}

export type Step = 'details' | 'builder' | 'pricing' | 'review';
const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'details', label: 'Details', number: 1 },
  { key: 'builder', label: 'Builder', number: 2 },
  { key: 'pricing', label: 'Pricing', number: 3 },
  { key: 'review', label: 'Review', number: 4 },
];

const CATEGORIES = [
  'Hypertrophy',
  'Push Pull Legs',
  'Strength',
  'Powerlifting',
  'HYROX',
  'Combat & Boxing',
  'Endurance',
  'Mobility',
  'Sport-Specific',
  'Calisthenics',
  'Conditioning',
  'Body Recomp',
  'Weight Loss',
  'Upper / Lower',
  'Full Body',
  'Beginner Friendly',
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const WEEK_COUNTS = [1, 2, 3, 4, 6, 8, 10, 12, 16];
const DAYS_PER_WEEK = [2, 3, 4, 5, 6, 7];

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FOCUS_OPTIONS = [
  'Push',
  'Pull',
  'Legs',
  'Upper Body',
  'Lower Body',
  'Chest & Triceps',
  'Back & Biceps',
  'Legs & Calves',
  'Shoulders & Abs',
  'Glutes & Chain',
  'Full Body',
  'HYROX Simulation',
  'Conditioning',
  'Active Recovery',
  'Rest Day',
];

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop',
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeExercise(): ProgramExercise {
  return {
    id: uid(),
    name: '',
    sets: 3,
    reps: '8-12',
    restSec: 90,
    notes: '',
    mediaUrl: '',
    mediaType: '',
  };
}

function makeDay(index: number, cat = 'Hypertrophy'): ProgramDay {
  return {
    id: uid(),
    label: DAY_LABELS[index] || `Day ${index + 1}`,
    focus: getDefaultFocusForCategory(cat, index),
    exercises: [makeExercise(), makeExercise()],
  };
}

function makeWeek(daysCount: number, cat = 'Hypertrophy'): ProgramWeek {
  return {
    id: uid(),
    days: Array.from({ length: daysCount }, (_, i) => makeDay(i, cat)),
  };
}

/* ───────── main component ───────── */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  coachEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ProgramCreatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  coachEmail,
  showToast,
}) => {
  const { isCoachRole } = useSubscription();

  /* step */
  const [step, setStep] = useState<Step>('details');

  /* details */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [descTab, setDescTab] = useState<'short' | 'full' | 'starters'>('short');
  const [category, setCategory] = useState('Hypertrophy');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [weekCount, setWeekCount] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [coverUrl, setCoverUrl] = useState(PRESET_BANNERS[0]);

  /* pricing */
  const [priceDollars, setPriceDollars] = useState('29.99');
  const [isFree, setIsFree] = useState(false);

  /* builder */
  const [weeks, setWeeks] = useState<ProgramWeek[]>([]);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState<string | null>(null);

  /* review expanded week tracking */
  const [expandedReviewWeeks, setExpandedReviewWeeks] = useState<Record<number, boolean>>({ 0: true });

  /* publish */
  const [publishing, setPublishing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* initialize weeks when opening or moving to builder */
  const initWeeks = (customWeekCount = weekCount, customDays = daysPerWeek, customCat = category) => {
    if (weeks.length === 0) {
      setWeeks(Array.from({ length: customWeekCount }, () => makeWeek(customDays, customCat)));
    }
  };

  useEffect(() => {
    if (isOpen && weeks.length === 0) {
      initWeeks();
    }
  }, [isOpen]);

  /* dynamic focus options based on selected coaching category */
  const availableFocusOptions = useMemo(() => {
    return CATEGORY_FOCUS_OPTIONS[category] || FOCUS_OPTIONS;
  }, [category]);

  /* sync category change across program */
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (weeks.length > 0) {
      setWeeks((prev) =>
        prev.map((wk) => ({
          ...wk,
          days: wk.days.map((d, dIdx) => {
            const isEmpty = d.exercises.every((e) => !e.name || !e.name.trim());
            return {
              ...d,
              focus: isEmpty ? getDefaultFocusForCategory(newCat, dIdx) : d.focus,
            };
          }),
        }))
      );
    }
  };

  /* sync weeks count if changed in step 1 */
  const handleWeekCountChange = (w: number) => {
    setWeekCount(w);
    if (weeks.length > 0) {
      if (w > weeks.length) {
        const added = Array.from({ length: w - weeks.length }, () => makeWeek(daysPerWeek, category));
        setWeeks((prev) => [...prev, ...added]);
      } else if (w < weeks.length) {
        setWeeks((prev) => prev.slice(0, w));
        if (activeWeek >= w) setActiveWeek(Math.max(0, w - 1));
      }
    }
  };

  const handleDaysPerWeekChange = (d: number) => {
    setDaysPerWeek(d);
    if (weeks.length > 0) {
      setWeeks((prev) =>
        prev.map((wk) => {
          if (d > wk.days.length) {
            const added = Array.from({ length: d - wk.days.length }, (_, i) =>
              makeDay(wk.days.length + i, category)
            );
            return { ...wk, days: [...wk.days, ...added] };
          } else if (d < wk.days.length) {
            return { ...wk, days: wk.days.slice(0, d) };
          }
          return wk;
        })
      );
      if (activeDay >= d) setActiveDay(Math.max(0, d - 1));
    }
  };

  /* sync entire week split to the recommended discipline split */
  const syncWeekSplitToCategory = (weekIdx: number) => {
    setWeeks((prev) => {
      const next = structuredClone(prev);
      if (next[weekIdx]) {
        next[weekIdx].days.forEach((day, dIdx) => {
          day.focus = getDefaultFocusForCategory(category, dIdx);
        });
      }
      return next;
    });
    showToast(`Synced Week ${weekIdx + 1} schedule to ${category} split`, 'success');
  };

  /* exercise database query */
  const allCategories = useMemo(() => Object.keys(EXERCISE_DATABASE), []);
  const filteredExercises = useMemo(() => {
    const results: { category: string; name: string }[] = [];
    const cats = searchCategory ? [searchCategory] : allCategories;
    const q = exerciseSearch.toLowerCase().trim();
    for (const cat of cats) {
      const exercises = EXERCISE_DATABASE[cat];
      if (!exercises) continue;
      for (const name of exercises) {
        if (!q || name.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
          results.push({ category: cat, name });
        }
      }
      if (results.length > 100) break;
    }
    return results;
  }, [exerciseSearch, searchCategory, allCategories]);

  /* builder helpers */
  const updateExercise = (
    weekIdx: number,
    dayIdx: number,
    exIdx: number,
    patch: Partial<ProgramExercise>
  ) => {
    setWeeks((prev) => {
      const next = structuredClone(prev);
      if (next[weekIdx]?.days[dayIdx]?.exercises[exIdx]) {
        Object.assign(next[weekIdx].days[dayIdx].exercises[exIdx], patch);
      }
      return next;
    });
  };

  const addExercise = (weekIdx: number, dayIdx: number) => {
    setWeeks((prev) => {
      const next = structuredClone(prev);
      next[weekIdx]?.days[dayIdx]?.exercises.push(makeExercise());
      return next;
    });
  };

  const removeExercise = (weekIdx: number, dayIdx: number, exIdx: number) => {
    setWeeks((prev) => {
      const next = structuredClone(prev);
      next[weekIdx]?.days[dayIdx]?.exercises.splice(exIdx, 1);
      return next;
    });
  };

  const updateDayFocus = (weekIdx: number, dayIdx: number, focus: string) => {
    setWeeks((prev) => {
      const next = structuredClone(prev);
      if (next[weekIdx]?.days[dayIdx]) {
        next[weekIdx].days[dayIdx].focus = focus;
      }
      return next;
    });
  };

  const applySmartBlueprint = (weekIdx: number, dayIdx: number) => {
    const focus = weeks[weekIdx]?.days[dayIdx]?.focus || getDefaultFocusForCategory(category, dayIdx);
    const blueprint = generateSmartBlueprint(focus, category, difficulty);
    setWeeks((prev) => {
      const next = structuredClone(prev);
      if (next[weekIdx]?.days[dayIdx]) {
        next[weekIdx].days[dayIdx].exercises = blueprint.map((item) => ({
          id: uid(),
          name: item.name,
          sets: item.sets,
          reps: item.reps,
          restSec: item.restSec,
          notes: item.notes,
          mediaUrl: '',
          mediaType: '',
        }));
      }
      return next;
    });
    showToast(`Applied ${focus} Blueprint (${blueprint.length} movements)`, 'success');
  };

  const quickAddExercise = (weekIdx: number, dayIdx: number, exerciseName: string) => {
    setWeeks((prev) => {
      const next = structuredClone(prev);
      const day = next[weekIdx]?.days[dayIdx];
      if (day) {
        // If the last exercise is empty, replace it, else append
        const emptyIdx = day.exercises.findIndex((e) => !e.name || !e.name.trim());
        if (emptyIdx >= 0) {
          day.exercises[emptyIdx].name = exerciseName;
        } else {
          day.exercises.push({
            id: uid(),
            name: exerciseName,
            sets: 3,
            reps: '8-12',
            restSec: 90,
            notes: '',
            mediaUrl: '',
            mediaType: '',
          });
        }
      }
      return next;
    });
    showToast(`Added ${exerciseName}`, 'success');
  };

  const duplicateDayToAllWeeks = (sourceWeekIdx: number, dayIdx: number) => {
    const sourceDay = weeks[sourceWeekIdx]?.days[dayIdx];
    if (!sourceDay) return;
    setWeeks((prev) => {
      const next = structuredClone(prev);
      next.forEach((wk, wIdx) => {
        if (wIdx !== sourceWeekIdx && wk.days[dayIdx]) {
          wk.days[dayIdx].focus = sourceDay.focus;
          wk.days[dayIdx].exercises = sourceDay.exercises.map((e) => ({
            ...structuredClone(e),
            id: uid(),
          }));
        }
      });
      return next;
    });
    showToast(`Duplicated ${sourceDay.label} routine to all ${weeks.length} weeks!`, 'success');
  };

  const duplicateWeek = (weekIdx: number) => {
    setWeeks((prev) => {
      const copy = structuredClone(prev[weekIdx]);
      copy.id = uid();
      copy.days.forEach((d) => {
        d.id = uid();
        d.exercises.forEach((e) => {
          e.id = uid();
        });
      });
      return [...prev.slice(0, weekIdx + 1), copy, ...prev.slice(weekIdx + 1)];
    });
    setWeekCount((w) => w + 1);
    setActiveWeek(weekIdx + 1);
    showToast(`Week ${weekIdx + 1} duplicated`, 'success');
  };

  const addWeek = () => {
    setWeeks((prev) => [...prev, makeWeek(daysPerWeek)]);
    setWeekCount((w) => w + 1);
    setActiveWeek(weeks.length);
  };

  const removeWeek = (weekIdx: number) => {
    if (weeks.length <= 1) {
      showToast('Program must contain at least 1 week', 'error');
      return;
    }
    setWeeks((prev) => prev.filter((_, i) => i !== weekIdx));
    setWeekCount((w) => Math.max(1, w - 1));
    if (activeWeek >= weeks.length - 1) setActiveWeek(Math.max(0, weeks.length - 2));
    showToast(`Week ${weekIdx + 1} removed`);
  };

  /* calculation totals */
  const totalExercises = useMemo(() => {
    return weeks.reduce(
      (sum, w) =>
        sum +
        w.days.reduce(
          (ds, d) => ds + d.exercises.filter((e) => e.name && e.name.trim().length > 0).length,
          0
        ),
      0
    );
  }, [weeks]);

  const totalTrainingDays = useMemo(() => {
    return weeks.reduce(
      (sum, w) => sum + w.days.filter((d) => d.focus !== 'Rest Day').length,
      0
    );
  }, [weeks]);

  /* navigation */
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  const goNext = () => {
    if (step === 'details') {
      if (!title.trim()) {
        showToast('Please enter a Program Title', 'error');
        return;
      }
      initWeeks();
    }
    if (step === 'builder') {
      if (totalExercises < 1) {
        showToast('Add at least one named exercise to your program', 'error');
        return;
      }
    }
    if (step === 'pricing') {
      const priceCents = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100);
      if (!isFree && priceCents < 100) {
        showToast('Minimum price for paid programs is $1.00', 'error');
        return;
      }
    }

    if (stepIdx < STEPS.length - 1) {
      setStep(STEPS[stepIdx + 1].key);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (stepIdx > 0) {
      setStep(STEPS[stepIdx - 1].key);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* publish action */
  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('Give your program a title', 'error');
      setStep('details');
      return;
    }
    if (totalExercises < 1) {
      showToast('Add at least one named exercise', 'error');
      setStep('builder');
      return;
    }

    const priceCents = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100);
    if (!isFree && priceCents < 100) {
      showToast('Minimum price is $1.00', 'error');
      setStep('pricing');
      return;
    }

    setPublishing(true);

    const programContent = weeks.map((w, wi) => ({
      week: wi + 1,
      days: w.days.map((d) => ({
        label: d.label,
        focus: d.focus,
        exercises: d.exercises
          .filter((e) => e.name && e.name.trim().length > 0)
          .map((e) => ({
            name: e.name.trim(),
            sets: e.sets || 3,
            reps: e.reps || '10',
            restSec: e.restSec || 90,
            notes: e.notes || '',
            mediaUrl: e.mediaUrl || '',
            mediaType: e.mediaType || '',
          })),
      })),
    }));

    const finalDescription = shortDescription.trim()
      ? description.trim()
        ? `${shortDescription.trim()}\n\n${description.trim()}`
        : shortDescription.trim()
      : description.trim();

    const payload = {
      coach_email: coachEmail || 'coach@o1fc.app',
      title: title.trim(),
      description: finalDescription,
      category,
      difficulty,
      duration_weeks: weeks.length,
      price_cents: priceCents,
      cover_image_url: coverUrl || PRESET_BANNERS[0],
      program_content: programContent,
      is_published: true,
      created_at: new Date().toISOString(),
    };

    let publishSuccess = false;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('coach_programs').insert(payload);
        if (!error) {
          publishSuccess = true;
        }
      } catch (err) {
        console.warn('Supabase program publish skipped/fallback:', err);
      }
    }

    // Local Storage backup / store
    try {
      const stored = JSON.parse(localStorage.getItem('o1fc_coach_programs') || '[]');
      const newProgram = { ...payload, id: `prog_${Date.now()}` };
      localStorage.setItem('o1fc_coach_programs', JSON.stringify([newProgram, ...stored]));
      publishSuccess = true;
    } catch {
      // ignore
    }

    setPublishing(false);

    if (publishSuccess) {
      showToast(`Program "${title.trim()}" published to Marketplace!`, 'success');
      onClose();
      resetForm();
    } else {
      showToast('Failed to publish program. Please retry.', 'error');
    }
  };

  const resetForm = () => {
    setStep('details');
    setTitle('');
    setDescription('');
    setShortDescription('');
    setDescTab('short');
    setCategory('Hypertrophy');
    setDifficulty('Intermediate');
    setWeekCount(4);
    setDaysPerWeek(4);
    setCoverUrl(PRESET_BANNERS[0]);
    setPriceDollars('29.99');
    setIsFree(false);
    setWeeks([]);
    setActiveWeek(0);
    setActiveDay(0);
  };

  const currentDay = weeks[activeWeek]?.days[activeDay];

  if (!isOpen) return null;

  if (!isCoachRole) {
    return createPortal(
      <div
        id="program-creator-auth-guard"
        className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      >
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] p-6 text-center flex flex-col items-center gap-3.5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-600/10 dark:bg-red-500/15 border border-red-600/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <Lock size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black dark:text-white">
              Coach Pro License Required
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
              Program authoring, pricing matrices, and marketplace publishing are reserved for certified O1FC coaches.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                showToast('Opening Coach Pro Licensing options...', 'success');
                window.dispatchEvent(new CustomEvent('open_pay_plan_coach'));
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Upgrade to Coach Pro
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      id="program-creator-modal-overlay"
      className="fixed inset-0 z-[250] flex flex-col bg-[#FFFFFF] dark:bg-[#000000] text-black dark:text-white font-sans overflow-hidden select-none"
    >
      {/* ── 1. CLEAN ELEGANT HEADER (Uber App Style) ── */}
      <header className="shrink-0 z-10 border-b border-black/10 dark:border-white/10 obsidian-panel shadow-sm backdrop-blur-xl pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Close Program Creator"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight text-black dark:text-white">
              Program Creator
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
              Step {stepIdx + 1} of 4
            </span>
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="max-w-xl mx-auto px-4 sm:px-6 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s, idx) => {
              const isPast = idx < stepIdx;
              const isCurrent = idx === stepIdx;
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    if (idx <= stepIdx || title.trim()) {
                      setStep(s.key);
                    }
                  }}
                  className="flex flex-col gap-1.5 cursor-pointer text-left group"
                >
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'bg-black dark:bg-white'
                        : isPast
                        ? 'bg-black/70 dark:bg-white/70'
                        : 'bg-black/10 dark:bg-white/10'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-medium tracking-tight ${
                        isCurrent
                          ? 'text-black dark:text-white font-semibold'
                          : isPast
                          ? 'text-zinc-700 dark:text-zinc-300'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {s.label}
                    </span>
                    {isPast && <Check className="w-3 h-3 text-black dark:text-white" strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── 2. SINGLE CENTRAL SCROLL CONTAINER ── */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 py-3.5 w-full"
      >
        <div className="max-w-md mx-auto space-y-3.5 pb-4">

          {/* ═════════ STEP 1: DETAILS ═════════ */}
          {step === 'details' && (
            <div className="space-y-3.5 animate-fadeIn">
              <SectionHeader
                icon={<BookOpen className="w-3.5 h-3.5 text-black dark:text-white" />}
                title="Program Details"
                subtitle="Set title, athletic overview, cover asset, and training schedule"
              />

              {/* Title Input */}
              <div className="space-y-1">
                <FieldLabel label="Program Title" required />
                <input
                  id="program-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 12-Week Strength & Power Protocol"
                  className="w-full obsidian-input rounded-xl px-3 py-2 text-xs font-medium placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all shadow-2xs focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Description Section with Tabs (Short Overview / Full Methodology / Quick Starters) */}
              <div className="space-y-2 obsidian-panel rounded-xl p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <FieldLabel label="Program Description & Overview" />
                  <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDescTab('short')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                        descTab === 'short'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Short Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('full')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                        descTab === 'full'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Full Methodology
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('starters')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        descTab === 'starters'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Starters
                    </button>
                  </div>
                </div>

                {/* Tab 1: Short Overview */}
                {descTab === 'short' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span>Catchy 1-2 sentence hook for program cards & marketplace preview</span>
                      <span className={`${shortDescription.length > 140 ? 'text-amber-500' : 'text-zinc-400'}`}>
                        {shortDescription.length}/140
                      </span>
                    </div>
                    <textarea
                      id="program-short-desc-input"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="e.g. High-volume hypertrophy system engineering maximum myofibrillar growth with calibrated mechanical tension."
                      rows={2}
                      className="w-full obsidian-input rounded-xl px-3 py-2 text-xs font-normal placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all resize-none shadow-2xs leading-relaxed focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                )}

                {/* Tab 2: Full Methodology */}
                {descTab === 'full' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      In-depth breakdown of target athletes, weekly progression rules, and recovery guidance
                    </div>
                    <textarea
                      id="program-desc-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Summarize target athletes, training frequency, expected progress, and methodology..."
                      rows={3}
                      className="w-full obsidian-input rounded-xl px-3 py-2 text-xs font-normal placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all resize-none shadow-2xs leading-relaxed focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                )}

                {/* Tab 3: Quick Starters */}
                {descTab === 'starters' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Select a proven high-performance template to auto-populate description & overview:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                      {PROGRAM_DESCRIPTION_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.label}
                          type="button"
                          onClick={() => {
                            setShortDescription(tmpl.short);
                            setDescription(tmpl.full);
                            if (CATEGORIES.includes(tmpl.category)) {
                              setCategory(tmpl.category);
                            }
                            setDescTab('short');
                            showToast(`Loaded "${tmpl.label}" description`, 'success');
                          }}
                          className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-black dark:text-white group-hover:text-red-500 transition-colors">
                              {tmpl.label}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 font-medium">
                              {tmpl.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-normal">
                            {tmpl.short}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Quick-Pills */}
              <div className="space-y-1.5">
                <FieldLabel label="Category & Discipline" />
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs font-semibold'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selector Pills */}
              <div className="space-y-1.5">
                <FieldLabel label="Difficulty Level" />
                <div className="grid grid-cols-4 gap-1.5">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-1.5 rounded-lg text-[11px] font-medium text-center transition-all cursor-pointer ${
                        difficulty === diff
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs font-semibold'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration (Weeks) & Days/Week Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                {/* Duration Weeks */}
                <div className="space-y-1.5 obsidian-panel rounded-xl p-2.5 shadow-2xs">
                  <FieldLabel label="Duration (Weeks)" />
                  <div className="flex flex-wrap gap-1">
                    {WEEK_COUNTS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleWeekCountChange(w)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          weekCount === w
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                            : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days Per Week */}
                <div className="space-y-1.5 obsidian-panel rounded-xl p-2.5 shadow-2xs">
                  <FieldLabel label="Training Days / Week" />
                  <div className="flex flex-wrap gap-1">
                    {DAYS_PER_WEEK.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDaysPerWeekChange(d)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          daysPerWeek === d
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                            : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upgraded Vault Cover Media Selector */}
              <ProgramCoverVaultPicker
                coverUrl={coverUrl}
                onSelectCover={setCoverUrl}
                programCategory={category}
                showToast={showToast}
              />
            </div>
          )}

          {/* ═════════ STEP 2: BUILDER (Bare Minimalist Ergonomics) ═════════ */}
          {step === 'builder' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Top Compact Curriculum Metrics Strip */}
              <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span className="text-xs font-semibold text-black dark:text-white">Curriculum</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  <span>{weeks.length}w</span>
                  <span>·</span>
                  <span>{totalTrainingDays}d</span>
                  <span>·</span>
                  <span className="text-black dark:text-white font-semibold">{totalExercises} exercises</span>
                </div>
              </div>

              {/* Bare Week Selector Ribbon */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                    Weeks
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateWeek(activeWeek)}
                      className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title="Duplicate active week"
                      aria-label="Duplicate active week"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {weeks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWeek(activeWeek)}
                        className="p-1 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete active week"
                        aria-label="Delete active week"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Week Tabs Strip */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {weeks.map((_, wIdx) => {
                    const isActive = activeWeek === wIdx;
                    const exCount = weeks[wIdx].days.reduce(
                      (acc, d) => acc + d.exercises.filter((e) => e.name).length,
                      0
                    );
                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => {
                          setActiveWeek(wIdx);
                          setActiveDay(0);
                        }}
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs font-semibold'
                            : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[11px]">W{wIdx + 1}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded ${isActive ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-black/5 dark:bg-white/5 text-zinc-400'}`}>
                          {exCount}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addWeek}
                    className="shrink-0 px-2 py-1.5 rounded-lg border border-dashed border-black/20 dark:border-white/20 text-zinc-500 hover:text-black dark:hover:text-white text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-2.5 h-2.5" /> Week
                  </button>
                </div>
              </div>

              {/* Bare Day Schedule Grid */}
              {weeks[activeWeek] && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                    {weeks[activeWeek].days.map((day, dIdx) => {
                      const isSelected = activeDay === dIdx;
                      const hasEx = day.exercises.some((e) => e.name);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => setActiveDay(dIdx)}
                          className={`p-1.5 rounded-lg text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-2xs'
                              : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[10px] block font-semibold">{day.label.slice(0, 3)}</span>
                          <span className={`text-[8.5px] block truncate mt-0.5 ${isSelected ? 'opacity-80' : 'text-zinc-400'}`}>
                            {day.focus || 'Train'}
                          </span>
                          {hasEx && (
                            <span className={`w-1 h-1 rounded-full mx-auto mt-0.5 block ${isSelected ? 'bg-white dark:bg-black' : 'bg-red-500'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Discipline Header & Split Synchronizer */}
                  <div className="flex items-center justify-between px-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>Discipline: <strong className="text-black dark:text-white font-semibold">{category}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => syncWeekSplitToCategory(activeWeek)}
                      className="hover:text-black dark:hover:text-white text-[9.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Reset Week ${activeWeek + 1} schedule to ${category} recommended split`}
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      <span>Sync {category} Split</span>
                    </button>
                  </div>

                  {/* Focus Row + Duplicate to All Weeks */}
                  {currentDay && (
                    <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
                      <div className="flex items-center gap-1 shrink-0">
                        {availableFocusOptions.map((focus) => (
                          <button
                            key={focus}
                            type="button"
                            onClick={() => updateDayFocus(activeWeek, activeDay, focus)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                              currentDay.focus === focus
                                ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-2xs'
                                : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                          >
                            {focus}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => duplicateDayToAllWeeks(activeWeek, activeDay)}
                        className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-700 dark:text-zinc-300 text-[9.5px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy routine to all weeks"
                      >
                        <Copy className="w-2.5 h-2.5" /> Sync All Wks
                      </button>
                    </div>
                  )}

                  {/* Blueprint & Quick Add Chips */}
                  {currentDay && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => applySmartBlueprint(activeWeek, activeDay)}
                        className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-[10px] flex items-center gap-1 shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer hover:opacity-90"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>AI {currentDay.focus || category} Blueprint</span>
                      </button>
                      {getIntelligentExercises(currentDay.focus, '', '', category).slice(0, 6).map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => quickAddExercise(activeWeek, activeDay, item.name)}
                          className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95 border border-black/5 dark:border-white/5"
                        >
                          <Plus className="w-2 h-2 text-zinc-400" />
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bare Exercise Stack */}
              {currentDay && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-semibold text-black dark:text-white">
                      {currentDay.label} · {currentDay.exercises.length} Exercises
                    </span>
                    <button
                      type="button"
                      onClick={() => addExercise(activeWeek, activeDay)}
                      className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:opacity-90"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Exercise
                    </button>
                  </div>

                  {currentDay.exercises.map((ex, exIdx) => (
                    <div
                      key={ex.id}
                      className="rounded-xl border border-black/10 dark:border-white/10 p-2.5 space-y-2 bg-black/[0.02] dark:bg-white/[0.02] transition-all hover:border-black/20 dark:hover:border-white/20"
                    >
                      {/* Top: Name Selector & Delete */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-semibold flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                          {exIdx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => setShowExercisePicker(ex.id)}
                          className="flex-1 text-left px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <span
                            className={`text-[11px] font-medium ${
                              ex.name ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {ex.name || 'Select exercise...'}
                          </span>
                          <Search className="w-2.5 h-2.5 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                        </button>

                        {currentDay.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExercise(activeWeek, activeDay, exIdx)}
                            className="p-1 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label="Remove exercise"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Middle: Sets / Reps / Rest */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Sets */}
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
                          <span className="text-[9px] text-zinc-400 mr-1.5 font-medium">Sets</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={ex.sets}
                            onChange={(e) =>
                              updateExercise(activeWeek, activeDay, exIdx, {
                                sets: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-full bg-transparent text-[11px] font-semibold text-black dark:text-white outline-none"
                          />
                        </div>

                        {/* Reps */}
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
                          <span className="text-[9px] text-zinc-400 mr-1.5 font-medium">Reps</span>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) =>
                              updateExercise(activeWeek, activeDay, exIdx, {
                                reps: e.target.value,
                              })
                            }
                            placeholder="8-12"
                            className="w-full bg-transparent text-[11px] font-medium text-black dark:text-white outline-none"
                          />
                        </div>

                        {/* Rest Sec */}
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
                          <span className="text-[9px] text-zinc-400 mr-1.5 font-medium">Rest</span>
                          <input
                            type="number"
                            step={15}
                            min={0}
                            value={ex.restSec}
                            onChange={(e) =>
                              updateExercise(activeWeek, activeDay, exIdx, {
                                restSec: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-transparent text-[11px] font-medium text-black dark:text-white outline-none"
                          />
                          <span className="text-[9px] text-zinc-400 ml-0.5">s</span>
                        </div>
                      </div>

                      {/* Coach Notes & Media URL (Inline Bare Rows) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={ex.notes}
                          onChange={(e) =>
                            updateExercise(activeWeek, activeDay, exIdx, {
                              notes: e.target.value,
                            })
                          }
                          placeholder="Coach cue / tempo (optional)"
                          className="w-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-[10px] text-black dark:text-white placeholder-zinc-400 outline-none"
                        />
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
                          <input
                            type="url"
                            value={ex.mediaUrl}
                            onChange={(e) =>
                              updateExercise(activeWeek, activeDay, exIdx, {
                                mediaUrl: e.target.value,
                                mediaType: e.target.value.match(/\.(mp4|mov|webm)/i)
                                  ? 'video'
                                  : e.target.value
                                  ? 'image'
                                  : '',
                              })
                            }
                            placeholder="Demo video / media link (optional)"
                            className="w-full bg-transparent text-black dark:text-white placeholder-zinc-400 outline-none text-[10px]"
                          />
                          {ex.mediaUrl && (
                            <span className="text-[8px] font-semibold px-1 rounded bg-black/10 dark:bg-white/10 text-black dark:text-white shrink-0 ml-1">
                              {ex.mediaType === 'video' ? 'VID' : 'IMG'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ STEP 3: PRICING ═════════ */}
          {step === 'pricing' && (
            <div className="space-y-4 animate-fadeIn">
              <SectionHeader
                icon={<DollarSign className="w-4 h-4 text-black dark:text-white" />}
                title="Pricing & Access"
                subtitle="Set program pricing, evaluate profit margins, and terms"
              />

              {/* Free vs Paid Toggle Card */}
              <div
                onClick={() => {
                  setIsFree(!isFree);
                  if (!isFree) setPriceDollars('');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isFree
                    ? 'obsidian-panel border-black/30 dark:border-white/40 shadow-sm'
                    : 'obsidian-panel border-transparent hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-black dark:text-white">
                      Free Community Program
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/10 dark:bg-white/15 text-black dark:text-white">
                      Free Access
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                    Give athletes free access to build your coaching community and reputation.
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    isFree ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'border-zinc-400'
                  }`}
                >
                  {isFree && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Paid Pricing Input */}
              {!isFree && (
                <div className="obsidian-panel rounded-2xl p-4 shadow-sm space-y-3.5">
                  <FieldLabel label="Program Price (USD)" required />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                      $
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={0.01}
                      value={priceDollars}
                      onChange={(e) => setPriceDollars(e.target.value)}
                      placeholder="29.99"
                      className="w-full obsidian-input rounded-xl pl-9 pr-4 py-3 text-2xl font-bold placeholder-zinc-400 dark:placeholder-zinc-600 outline-none"
                    />
                  </div>

                  {/* Revenue Breakdown */}
                  {parseFloat(priceDollars || '0') >= 1 && (
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">
                        Net Revenue Split (85% Coach / 15% Platform)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                          <span className="text-[10px] text-zinc-400 block">Sale Price</span>
                          <span className="text-sm font-bold text-black dark:text-white">
                            ${parseFloat(priceDollars).toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                          <span className="text-[10px] text-zinc-400 block">Platform (15%)</span>
                          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                            ${(parseFloat(priceDollars) * 0.15).toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/20 text-center">
                          <span className="text-[10px] text-black dark:text-white font-semibold block">
                            Your Payout (85%)
                          </span>
                          <span className="text-sm font-bold text-black dark:text-white">
                            ${(parseFloat(priceDollars) * 0.85).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Revenue Forecast */}
                      <div className="p-3.5 rounded-xl obsidian-pill space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">10 Athlete Purchases:</span>
                          <span className="font-semibold text-black dark:text-white">
                            ${(parseFloat(priceDollars) * 0.85 * 10).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">50 Athlete Purchases:</span>
                          <span className="font-semibold text-black dark:text-white">
                            ${(parseFloat(priceDollars) * 0.85 * 50).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">100 Athlete Purchases:</span>
                          <span className="font-bold text-black dark:text-white">
                            ${(parseFloat(priceDollars) * 0.85 * 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═════════ STEP 4: REVIEW & PUBLISH ═════════ */}
          {step === 'review' && (
            <div className="space-y-4 animate-fadeIn">
              <SectionHeader
                icon={<Target className="w-4 h-4 text-black dark:text-white" />}
                title="Review & Publish"
                subtitle="Confirm full curriculum integrity before publishing"
              />

              {/* Main Summary Card */}
              <div className="obsidian-panel rounded-2xl overflow-hidden shadow-sm">
                {coverUrl && (
                  <div className="relative w-full h-36 bg-black">
                    <img src={coverUrl} alt="Program Cover" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-black">
                        {category}
                      </span>
                      <span className="text-base font-bold text-white">
                        {isFree ? 'FREE' : `$${parseFloat(priceDollars || '0').toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3.5">
                  <div>
                    <h3 className="text-base font-bold text-black dark:text-white">
                      {title || 'Untitled Program'}
                    </h3>
                    {shortDescription && (
                      <p className="text-xs font-medium text-black dark:text-zinc-200 mt-1 leading-relaxed">
                        {shortDescription}
                      </p>
                    )}
                    {description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Badges Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                      <span className="text-[10px] text-zinc-400 block">Duration</span>
                      <span className="text-xs font-semibold text-black dark:text-white">
                        {weeks.length} Weeks
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                      <span className="text-[10px] text-zinc-400 block">Frequency</span>
                      <span className="text-xs font-semibold text-black dark:text-white">
                        {daysPerWeek} Days/Wk
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                      <span className="text-[10px] text-zinc-400 block">Tier</span>
                      <span className="text-xs font-semibold text-black dark:text-white">
                        {difficulty}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                      <span className="text-[10px] text-zinc-400 block">Volume</span>
                      <span className="text-xs font-semibold text-black dark:text-white">
                        {totalExercises} Exercises
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Accordion */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block px-1">
                  Curriculum Breakdown
                </span>

                {weeks.map((wk, wIdx) => {
                  const isExpanded = !!expandedReviewWeeks[wIdx];
                  const exCount = wk.days.reduce(
                    (acc, d) => acc + d.exercises.filter((e) => e.name).length,
                    0
                  );
                  return (
                    <div
                      key={wk.id}
                      className="obsidian-panel rounded-xl overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReviewWeeks((prev) => ({
                            ...prev,
                            [wIdx]: !prev[wIdx],
                          }))
                        }
                        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-black dark:text-white">
                            Week {wIdx + 1}
                          </span>
                          <span className="text-xs text-zinc-400">
                            · {exCount} total exercises
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3.5 pt-0 space-y-2 border-t border-black/5 dark:border-white/5">
                          {wk.days.map((day) => {
                            const activeExs = day.exercises.filter((e) => e.name);
                            return (
                              <div
                                key={day.id}
                                className="p-3 rounded-xl obsidian-pill space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-black dark:text-white">
                                    {day.label} — {day.focus}
                                  </span>
                                  <span className="text-[11px] text-zinc-400">
                                    {activeExs.length} exercises
                                  </span>
                                </div>
                                {activeExs.length > 0 && (
                                  <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                    {activeExs.map((ex, i) => (
                                      <li key={ex.id} className="flex justify-between">
                                        <span>
                                          {i + 1}. {ex.name}
                                        </span>
                                        <span className="text-zinc-400">
                                          {ex.sets}x{ex.reps} ({ex.restSec}s rest)
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── 3. EXERCISE DATABASE SEARCH DRAWER ── */}
      {showExercisePicker && currentDay && (
        <div className="fixed inset-0 z-[270] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div
            id="exercise-library-drawer"
            className="w-full max-w-lg obsidian-panel-elevated rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-slideUp"
          >
            {/* Drawer Header */}
            <div className="shrink-0 p-4 border-b border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-black dark:text-white" />
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Exercise Library · {currentDay.focus}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowExercisePicker(null);
                    setExerciseSearch('');
                    setSearchCategory('');
                  }}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder={`Search ${currentDay.focus} movements, barbell, cable, dumbbells...`}
                  autoFocus
                  className="w-full obsidian-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
                />
              </div>

              {/* Muscle Group Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSearchCategory('')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    !searchCategory
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  Matched Focus ({currentDay.focus})
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSearchCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      searchCategory === cat
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises List Area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1">
              {getIntelligentExercises(searchCategory || currentDay.focus, exerciseSearch, searchCategory, category).map((item) => (
                <button
                  key={`${item.category}-${item.name}`}
                  type="button"
                  onClick={() => {
                    const exIdx = currentDay.exercises.findIndex((e) => e.id === showExercisePicker);
                    if (exIdx >= 0) {
                      updateExercise(activeWeek, activeDay, exIdx, { name: item.name });
                    }
                    setShowExercisePicker(null);
                    setExerciseSearch('');
                    setSearchCategory('');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-black dark:text-white block group-hover:opacity-80 transition-opacity">
                        {item.name}
                      </span>
                      {item.isCompound && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                          Compound
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">{item.category}</span>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </button>
              ))}

              {getIntelligentExercises(searchCategory || currentDay.focus, exerciseSearch, searchCategory, category).length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-zinc-400">No exercises found for &quot;{exerciseSearch}&quot;</p>
                  <button
                    type="button"
                    onClick={() => {
                      const exIdx = currentDay.exercises.findIndex((e) => e.id === showExercisePicker);
                      if (exIdx >= 0 && exerciseSearch.trim()) {
                        updateExercise(activeWeek, activeDay, exIdx, { name: exerciseSearch.trim() });
                      }
                      setShowExercisePicker(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Add &quot;{exerciseSearch.trim()}&quot;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. FIXED BOTTOM ACTION BAR ── */}
      <footer className="shrink-0 border-t border-black/10 dark:border-white/10 obsidian-panel pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.875rem))] shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3 max-w-lg mx-auto px-4 sm:px-6 py-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIdx === 0}
            className={`flex-1 py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              stepIdx === 0
                ? 'opacity-30 border-transparent text-zinc-400 cursor-not-allowed'
                : 'obsidian-pill border-transparent hover:border-black/20 dark:hover:border-white/20 text-black dark:text-white active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step === 'review' ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex-2 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish Program'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex-2 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm hover:opacity-90"
            >
              <span>Next: {STEPS[stepIdx + 1]?.label}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>,
    document.body
  );
};

/* ───────── small UI helper components ───────── */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm sm:text-base font-semibold tracking-tight text-black dark:text-white">
          {title}
        </h3>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
      <span>{label}</span>
      {required && <span className="text-black dark:text-white font-bold">*</span>}
    </label>
  );
}

export default ProgramCreatorModal;
