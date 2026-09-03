import React, { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';

interface RoutineSwapperModalProps {
  isOpen: boolean;
  onSelectRoutine: (routineId: string) => void;
  onClose: () => void;
}

export const RoutineSwapperModal: React.FC<RoutineSwapperModalProps> = ({
  isOpen,
  onSelectRoutine,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'lift' | 'sports' | 'recovery'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const routines = [
    // Lift & Hypertrophy
    {
      id: 'functional_hypertrophy',
      category: 'lift',
      name: 'Functional Hypertrophy',
      desc: 'Heavy compound strength and targeted muscle growth',
      badge: 'POPULAR',
    },
    {
      id: 'hybrid_racing',
      category: 'sports',
      name: 'Hybrid Training & Fitness Racing',
      desc: 'Hyrox race pace, SkiErg, sled push and functional stamina',
      badge: 'POPULAR',
    },
    { id: 'push_a', category: 'lift', name: 'Push A (Strength)', desc: 'Bench press, overhead press & heavy triceps' },
    { id: 'pull_a', category: 'lift', name: 'Pull A (Strength)', desc: 'Deadlift, pull-ups & heavy rows' },
    { id: 'legs_a', category: 'lift', name: 'Legs A (Strength)', desc: 'Back squat, leg press & Romanian deadlifts' },
    { id: 'push_b', category: 'lift', name: 'Push B (Hypertrophy)', desc: 'Incline press, lateral raises & dips' },
    { id: 'pull_b', category: 'lift', name: 'Pull B (Hypertrophy)', desc: 'Lat pulldowns, cable rows & curls' },
    { id: 'legs_b', category: 'lift', name: 'Legs B (Hypertrophy)', desc: 'Front squats, hack squats & calves' },
    { id: 'upper', category: 'lift', name: 'Upper Body Power', desc: 'Full upper body strength matrix' },
    { id: 'lower', category: 'lift', name: 'Lower Body Power', desc: 'Posterior chain and quad overload' },
    { id: 'full', category: 'lift', name: 'Full Body Conditioning', desc: 'Compound movements and core stability' },
    { id: 'arms', category: 'lift', name: 'Arms & Shoulders', desc: 'Biceps, triceps and deltoid isolation' },
    { id: 'core', category: 'lift', name: 'Core & Stability', desc: 'L-sits, hanging raises and rollouts' },
    { id: 'glutes', category: 'lift', name: 'Glute Hypertrophy', desc: 'Hip thrusts, Romanian deadlifts & split squats' },
    { id: 'powerlifting_full', category: 'lift', name: 'Powerlifting SBD', desc: 'Low bar squat, bench press, deadlift' },
    { id: 'olympic_lifting', category: 'lift', name: 'Olympic Weightlifting Flow', desc: 'Snatch, clean and jerk, hang cleans' },
    { id: 'strongman', category: 'lift', name: 'Strongman Matrix', desc: 'Log clean, atlas stones, farmer walk' },
    { id: 'crossfit_wod', category: 'sports', name: 'Cross-Training Conditioning', desc: 'Thrusters, pull-ups, box jumps, kettlebell swings' },
    { id: 'calisthenics', category: 'lift', name: 'Calisthenics Bodyweight', desc: 'Strict pull-ups, dips, muscle-ups, handstands' },

    // Sports & Conditioning
    { id: 'cardio', category: 'sports', name: 'Cardio & Endurance Engine', desc: '5k tempo, Concept2 row and assault bike sprints' },
    { id: 'endurance_run', category: 'sports', name: 'Marathon & Distance Running', desc: 'Zone 2 aerobic base, intervals & tempo runs' },
    { id: 'cycling', category: 'sports', name: 'Road & Track Cycling', desc: 'FTP tests, sweet spot intervals and sprint wattage' },
    { id: 'swim', category: 'sports', name: 'Aquatic Conditioning & Swim', desc: '100m pace repeats, kickboard and endurance' },
    { id: 'martial_arts', category: 'sports', name: 'Boxing & Striking Conditioning', desc: 'Heavy bag rounds, shadow boxing, jump rope' },
    { id: 'bjj', category: 'sports', name: 'Brazilian Jiu-Jitsu & Grappling', desc: 'Guard passing drills, rolling and takedowns' },
    { id: 'soccer', category: 'sports', name: 'Football / Soccer Conditioning', desc: 'Cone drills, sprint intervals and agility work' },
    { id: 'basketball', category: 'sports', name: 'Basketball Skills & Agility', desc: 'Shooting drills, defensive slides & scrimmages' },
    { id: 'climbing', category: 'sports', name: 'Rock Climbing & Grip Strength', desc: 'Hangboard repeaters, bouldering projects' },
    { id: 'trail_hiking', category: 'sports', name: 'Mountain Ruck & Trail Hiking', desc: 'Elevation climbing, heavy rucking & technical terrain' },
    { id: 'hiit', category: 'sports', name: 'Tactical HIIT & Calorie Burner', desc: 'Max acceleration sprints, assault bike & explosive jumps' },

    // Recovery & Restoration
    { id: 'mobility', category: 'recovery', name: 'Full-Body Mobility Flow', desc: '90/90 hips, couch stretch, World\'s Greatest & CARs' },
    { id: 'yoga_flow', category: 'recovery', name: 'Yoga Flow & Alignment', desc: 'Sun salutations, warrior series, pigeon & savasana' },
    { id: 'breathwork', category: 'recovery', name: 'Respiration & Nervous System Sync', desc: 'Box breathing, Wim Hof cycles, 4-7-8 down-regulation' },
    { id: 'recovery', category: 'recovery', name: 'Myofascial Release & Regeneration', desc: 'Foam rolling, massage percussion & active walking' },
    { id: 'cold_therapy', category: 'recovery', name: 'Cold Plunge & Thermal Contrast', desc: 'Ice bath immersion, sauna contrast cycles' },
  ];

  const filteredRoutines = useMemo(() => {
    return routines.filter((r) => {
      const matchesTab = activeTab === 'all' || r.category === activeTab;
      const matchesSearch =
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        r.desc.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md font-sans flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121214] text-zinc-900 dark:text-white w-full max-w-lg max-h-[88dvh] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative border border-black/10 dark:border-white/10 flex flex-col select-none overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/10 shrink-0">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
              Routine Swapper & Preset Library
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Load targeted presets directly into your active session
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="py-3 space-y-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search routines (e.g., Push, Hyrox, Boxing, Mobility)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#C4121A] transition-colors"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-white/5 rounded-xl p-1">
            {[
              { key: 'all' as const, label: 'All', count: routines.length },
              { key: 'lift' as const, label: 'Lift & Strength', count: routines.filter((r) => r.category === 'lift').length },
              { key: 'sports' as const, label: 'Sports & Hybrid', count: routines.filter((r) => r.category === 'sports').length },
              { key: 'recovery' as const, label: 'Recovery', count: routines.filter((r) => r.category === 'recovery').length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Routine Cards Scrollable List */}
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
          {filteredRoutines.length > 0 ? (
            filteredRoutines.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelectRoutine?.(r.id);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-red-50/40 dark:hover:bg-red-950/10 rounded-xl transition-all flex flex-col justify-between bg-zinc-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-[#C4121A]/40 text-zinc-900 dark:text-white cursor-pointer group active:scale-[0.99] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-white group-hover:text-[#C4121A] transition-colors">
                    {r.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.badge && (
                      <span className="text-[9px] font-semibold bg-red-50 dark:bg-red-950/40 text-[#C4121A] px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/50">
                        {r.badge}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-[#C4121A] opacity-80 group-hover:opacity-100">
                      Load
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  {r.desc}
                </p>
              </button>
            ))
          ) : (
            <div className="text-center py-8 space-y-1 text-zinc-400">
              <p className="text-xs">No routines matched &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
