import { useState, useMemo, useEffect } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem } from '../../../types';
import { DisciplineType, ExerciseDefinition } from '../../../types/workout';
import {
  estimateSessionCalorieBurn,
  getAthleteWeightKg,
} from '../../../utils/physiologyEngine';
import { LIFT_CHIPS, SPORTS_CHIPS, RECOVERY_CHIPS } from '../components/hub/hubConstants';
import { filterEffectivePool } from '../utils/exerciseFilterUtils';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { defaultEmptyLoadKg } from '../../../utils/defaultEmptyLoad';

const LAST_FOCUS_KEY = 'o1fc_hub_last_focus';

function readLastFocus(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_FOCUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLastFocus(discipline: string, category: string) {
  try {
    const next = { ...readLastFocus(), [discipline]: category };
    localStorage.setItem(LAST_FOCUS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

interface UseExerciseHubAutoLogicProps {
  discipline: DisciplineType;
  selectedDiscipline: 'lift' | 'sports' | 'recovery' | null;
  onAddBatch?: (exercises: ExerciseItem[]) => void;
  addExercisesToActiveLog: (exercises: ExerciseItem[]) => void;
  showToast: (msg: string) => void;
}

export function useExerciseHubAutoLogic({
  discipline,
  selectedDiscipline,
  onAddBatch,
  addExercisesToActiveLog,
  showToast,
}: UseExerciseHubAutoLogicProps) {
  const currentChips = useMemo(() => {
    if (discipline === 'lift') return LIFT_CHIPS;
    if (discipline === 'sports') return SPORTS_CHIPS;
    return RECOVERY_CHIPS;
  }, [discipline]);

  const [selectedCategory, setSelectedCategory] = useState<string>(LIFT_CHIPS[0]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All Equipment');
  const [targetVolume, setTargetVolume] = useState<number>(5);
  const [isChangeOpen, setIsChangeOpen] = useState(false);

  const [isEquipOpen, setIsEquipOpen] = useState(false);
  const [isVolOpen, setIsVolOpen] = useState(false);
  const [activeSetsSlot, setActiveSetsSlot] = useState<number | null>(null);

  const [slotOverrides, setSlotOverrides] = useState<Record<number, string>>({});
  const [slotSets, setSlotSets] = useState<Record<number, number>>({});

  const athleteWeightKg = getAthleteWeightKg();

  useEffect(() => {
    if (!selectedDiscipline) {
      setIsChangeOpen(false);
      return;
    }
    const remembered = readLastFocus()[selectedDiscipline];
    const nextCat =
      remembered && currentChips.some((c) => c.toLowerCase() === remembered.toLowerCase())
        ? remembered
        : currentChips[0];
    setSelectedCategory(nextCat);
    setSlotOverrides({});
    setSlotSets({});
    setActiveSetsSlot(null);
    setIsChangeOpen(false);
  }, [selectedDiscipline, currentChips]);

  useEffect(() => {
    if (selectedDiscipline && selectedCategory) {
      writeLastFocus(selectedDiscipline, selectedCategory);
    }
  }, [selectedDiscipline, selectedCategory]);

  const effectivePool = useMemo(() => {
    return filterEffectivePool(discipline, selectedCategory, selectedEquipment);
  }, [discipline, selectedCategory, selectedEquipment]);

  const routineItems: ExerciseDefinition[] = useMemo(() => {
    if (effectivePool.length === 0) return [];
    return Array.from({ length: targetVolume }).map((_, idx) => {
      const overrideId = slotOverrides[idx];
      return (
        (overrideId && effectivePool.find((p) => p.id === overrideId)) ||
        effectivePool[idx % effectivePool.length]
      );
    });
  }, [effectivePool, targetVolume, slotOverrides]);

  const handleSwapSlot = (slotIdx: number) => {
    tactileEngine.triggerSelectionBuzz();
    if (effectivePool.length <= 1) return;
    const currentItem = routineItems[slotIdx];
    const currentIndex = effectivePool.findIndex((p) => p.id === currentItem.id);
    const nextIndex = (currentIndex + 1) % effectivePool.length;
    const nextItem = effectivePool[nextIndex];
    setSlotOverrides((prev) => ({ ...prev, [slotIdx]: nextItem.id }));
    showToast(`Swapped to ${nextItem.name}`);
  };

  const totalSets = useMemo(() => {
    return routineItems.reduce(
      (acc, it, idx) => acc + (slotSets[idx] !== undefined ? slotSets[idx] : it.defaultSets || 3),
      0
    );
  }, [routineItems, slotSets]);

  const totalMins = Math.max(15, Math.round(totalSets * 2.25));
  const totalKcal = estimateSessionCalorieBurn(routineItems, totalMins, 'STEADY', athleteWeightKg);
  const exerciseCount = routineItems.length;

  const handleAddExercises = () => {
    if (routineItems.length === 0) return;
    tactileEngine.playPRCelebration();
    const formatted: ExerciseItem[] = routineItems.map((def, idx) => {
      const countSets = slotSets[idx] !== undefined ? slotSets[idx] : def.defaultSets || 3;
      const seedKg = defaultEmptyLoadKg(String(def.equipment || ''));

      return {
        id: `hub-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: def.name,
        targetMuscle: def.primaryMuscleGroup || def.category || 'Compound',
        restSecs: def.defaultRestSeconds || def.restSecs || readAthleteSettingsSnapshot().defaultRestSeconds || 90,
        equipment: def.equipment as any,
        tier: def.tier as any,
        baseMET: def.baseMET,
        mechanic: def.mechanic,
        movementPattern: def.movementPattern as any,
        sets: Array.from({ length: countSets }, (_, s) => ({
          id: `set-${Date.now()}-${s + 1}-${Math.random().toString(36).slice(2, 6)}`,
          setNumber: s + 1,
          weightKg: seedKg,
          weight: seedKg,
          reps: 0,
          rpe: 0,
          completed: false,
        })),
      };
    });

    if (onAddBatch) {
      onAddBatch(formatted);
    } else {
      addExercisesToActiveLog(formatted);
    }
    showToast(`Added ${formatted.length} exercises to active session!`);
  };

  return {
    currentChips,
    selectedCategory,
    setSelectedCategory,
    selectedEquipment,
    setSelectedEquipment,
    targetVolume,
    setTargetVolume,
    isChangeOpen,
    setIsChangeOpen,
    isEquipOpen,
    setIsEquipOpen,
    isVolOpen,
    setIsVolOpen,
    activeSetsSlot,
    setActiveSetsSlot,
    slotSets,
    setSlotSets,
    setSlotOverrides,
    routineItems,
    handleSwapSlot,
    totalMins,
    totalKcal,
    exerciseCount,
    totalSets,
    handleAddExercises,
  };
}
