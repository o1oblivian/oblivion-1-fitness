import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { ExerciseDefinition, ExerciseItem, DisciplineType } from '../../../types/workout';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ManualModeExerciseCard } from './ManualModeExerciseCard';
import { LIFT_CHIPS, SPORTS_CHIPS, RECOVERY_CHIPS, EQUIPMENT_OPTIONS } from './hub/hubConstants';
import { defaultEmptyLoadKg } from '../../../utils/defaultEmptyLoad';

const MANUAL_CATEGORIES: Record<string, string[]> = {
  lift: LIFT_CHIPS,
  sports: SPORTS_CHIPS,
  recovery: RECOVERY_CHIPS,
};

const MANUAL_EQUIPMENT = EQUIPMENT_OPTIONS.map((eq) =>
  eq === 'All Equipment' ? 'All' : eq
);

function namesCollide(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return true;
  return na === `${nb} press` || nb === `${na} press`;
}

interface ManualModeViewProps {
  discipline?: DisciplineType;
  onShowToast?: (msg: string) => void;
  onAddExercise?: (exercise: ExerciseItem) => void;
}

export const ManualModeView: React.FC<ManualModeViewProps> = ({
  discipline = 'lift',
  onShowToast,
  onAddExercise,
}) => {
  const addExercisesToActiveLog = useWorkoutStore((s) => s.addExercisesToActiveLog);
  const safeDiscipline = discipline === 'sports' || discipline === 'recovery' ? discipline : 'lift';
  const categories = MANUAL_CATEGORIES[safeDiscipline] || LIFT_CHIPS;
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEquip, setSelectedEquip] = useState<string>('All');
  const [showGear, setShowGear] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('o1fc_hub_last_focus');
      const map = raw ? JSON.parse(raw) : {};
      const remembered = map?.[safeDiscipline];
      const next =
        remembered && categories.some((c) => c.toLowerCase() === String(remembered).toLowerCase())
          ? remembered
          : categories[0];
      setSelectedCategory(next);
    } catch {
      setSelectedCategory(categories[0]);
    }
    setSearchQuery('');
    setShowGear(false);
  }, [discipline, categories, safeDiscipline]);

  const filteredExercises = useMemo(() => {
    const pool = EXERCISE_DATABASE.filter((e) => {
      const matchDiscipline = e.discipline === safeDiscipline;
      const matchCat = e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchEquip =
        selectedEquip === 'All' || e.equipment?.toLowerCase() === selectedEquip.toLowerCase();
      const matchQuery =
        !searchQuery.trim() ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDiscipline && matchCat && matchEquip && matchQuery;
    });

    const unique: ExerciseDefinition[] = [];
    for (const ex of pool) {
      if (unique.some((u) => namesCollide(u.name, ex.name))) continue;
      unique.push(ex);
    }
    return unique;
  }, [safeDiscipline, selectedCategory, selectedEquip, searchQuery]);

  const handleAdd = (def: ExerciseDefinition) => {
    tactileEngine.triggerSelectionBuzz();
    const seedKg = defaultEmptyLoadKg(String(def.equipment || ''));
    const item: ExerciseItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: def.name,
      targetMuscle: def.category,
      restSecs: def.restSecs || 90,
      equipment: def.equipment as any,
      tier: def.tier,
      sets: Array.from({ length: def.defaultSets || 3 }, (_, i) => ({
        id: `set-${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
        setNumber: i + 1,
        weightKg: seedKg,
        weight: seedKg,
        reps: 0,
        rpe: 0,
        completed: false,
      })),
    };
    if (onAddExercise) onAddExercise(item);
    else addExercisesToActiveLog([item]);
    onShowToast?.(`Added ${def.name} to active log`);
  };

  return (
    <div className="space-y-2.5 pt-1 select-none">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-neutral-950 border-transparent'
                : 'bg-black text-neutral-400 border-white/[0.07] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedCategory.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 bg-black rounded-xl border border-white/[0.07] text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-white/[0.14]"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setShowGear((v) => !v);
          }}
          className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1 cursor-pointer ${
            showGear || selectedEquip !== 'All'
              ? 'bg-white text-neutral-950 border-transparent'
              : 'bg-black text-neutral-300 border-white/[0.07]'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Gear
        </button>
      </div>

      {showGear && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {MANUAL_EQUIPMENT.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setSelectedEquip(eq);
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                selectedEquip === eq
                  ? 'bg-white text-neutral-950 border-transparent'
                  : 'bg-o1-card text-neutral-400 border-white/[0.07]'
              }`}
            >
              {eq}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
        {filteredExercises.length === 0 ? (
          <div className="p-6 bg-black rounded-2xl border border-white/[0.07] text-center text-xs text-neutral-400">
            No matching exercises. Try another search or filter.
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <ManualModeExerciseCard key={exercise.id} exercise={exercise} onAdd={handleAdd} />
          ))
        )}
      </div>
    </div>
  );
};

export default ManualModeView;
