import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { ExerciseDefinition, ExerciseItem, DisciplineType } from '../../../types/workout';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ManualModeExerciseCard } from './ManualModeExerciseCard';
import { CATEGORIES_BY_DISCIPLINE, EQUIPMENT_FILTERS } from '../constants/workoutCategories';

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
  const categories = CATEGORIES_BY_DISCIPLINE[discipline] || CATEGORIES_BY_DISCIPLINE.lift;
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEquip, setSelectedEquip] = useState<string>('All');

  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory((prev) => (prev !== categories[0] ? categories[0] : prev));
    }
    setSearchQuery('');
  }, [discipline, categories]);

  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter((e) => {
      const matchDiscipline = e.discipline === discipline;
      const matchCat = e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchEquip = selectedEquip === 'All' || e.equipment?.toLowerCase() === selectedEquip.toLowerCase();
      const matchQuery = !searchQuery.trim() ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDiscipline && matchCat && matchEquip && matchQuery;
    });
  }, [discipline, selectedCategory, selectedEquip, searchQuery]);

  const handleAdd = (def: ExerciseDefinition) => {
    tactileEngine.triggerSelectionBuzz();
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
        weightKg: def.defaultWeightKg || 60,
        reps: def.defaultReps || 10,
        rpe: 8,
        completed: false,
      })),
    };
    if (onAddExercise) onAddExercise(item);
    else addExercisesToActiveLog([item]);
    onShowToast?.(`Added ${def.name} to active log`);
  };

  return (
    <div className="space-y-2.5 pt-1 select-none">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedCategory(cat); }}
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-neutral-900 border-white shadow-xs font-black'
                : 'bg-[#0E0E11] text-neutral-400 border-white/5 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search in ${selectedCategory}...`}
          className="w-full pl-9 pr-3 py-1.5 bg-[#18181F] rounded-xl border border-white/10 text-xs font-mono text-white placeholder:text-neutral-400 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Equipment Filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {EQUIPMENT_FILTERS.map((eq) => (
          <button
            key={eq}
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedEquip(eq); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              selectedEquip === eq
                ? 'bg-red-600 text-white font-black'
                : 'bg-[#18181F] text-neutral-400 border border-white/10 hover:text-white'
            }`}
          >
            {eq}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
        {filteredExercises.length === 0 ? (
          <div className="p-6 bg-[#0E0E11] rounded-2xl border border-white/5 text-center text-xs font-mono text-neutral-400">
            No matching exercises found. Try another search or filter.
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
