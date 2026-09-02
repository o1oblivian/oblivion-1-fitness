import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Play,
  Dumbbell,
  CheckCircle2,
  Bookmark,
  Share2,
  Plus,
  Compass,
  Film,
  ArrowRight,
} from 'lucide-react';
import { EliteReelData, MiniMediaWindow } from '@/components/FullEliteReelsModal';

export interface ExerciseItem {
  id: string;
  title: string;
  coachName: string;
  coachAvatar: string;
  badge: 'CUE' | 'DRILL' | 'PHOTO' | 'WORKOUT';
  badgeColor: string;
  category: string;
  muscleGroup: string;
  views: string;
  likes: number;
  duration?: string;
  videoUrl?: string;
  thumbnail: string;
  coachReelId: string;
  description?: string;
  repsRecommended?: string;
}

interface ReelsExploreGridProps {
  reels: EliteReelData[];
  onSelectReel: (reelId: string, mediaWindow?: MiniMediaWindow) => void;
  onOpenCoachProfile?: (coachId: string) => void;
  onClose?: () => void;
  onSwitchToStream?: () => void;
  initialTab?: 'reels' | 'coaches';
}

const CATEGORIES = [
  'FOR YOU',
  'ALL',
  'CHEST & TRICEPS',
  'BACK & BICEPS',
  'QUADS & GLUTES',
  'MOBILITY',
  'BIOMECHANICS',
  'HYPERTROPHY',
  'STRENGTH',
  'REHAB',
  'CARDIO & HIIT',
] as const;

export const ReelsExploreGrid: React.FC<ReelsExploreGridProps> = ({
  reels,
  onSelectReel,
  onOpenCoachProfile,
  onClose,
  onSwitchToStream,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('FOR YOU');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Extract all movements & workout clips from all reels into an indexable explore library
  const allExercises = useMemo<ExerciseItem[]>(() => {
    const list: ExerciseItem[] = [];

    reels.forEach((reel) => {
      // Main Reel Clip
      list.push({
        id: `${reel.id}-main`,
        title: reel.title,
        coachName: reel.coachName,
        coachAvatar: reel.avatar,
        badge: 'WORKOUT',
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
        category: reel.category,
        muscleGroup: reel.specialtyPills?.[0] || 'Full Body',
        views: `${Math.floor(12 + Math.random() * 45)}.${Math.floor(1 + Math.random() * 9)}k`,
        likes: 700 + Math.floor(Math.random() * 1200),
        duration: '0:45',
        videoUrl: reel.videoUrl,
        thumbnail: reel.thumbnail,
        coachReelId: reel.id,
        description: reel.description,
        repsRecommended: '3-4 Sets • 8-12 Reps • RPE 8',
      });

      // Window 1: Workout / Drill
      if (reel.window1) {
        list.push({
          id: `${reel.id}-w1`,
          title: `${reel.window1.title} (${reel.coachName.split(' ').slice(0, 2).join(' ')})`,
          coachName: reel.coachName,
          coachAvatar: reel.avatar,
          badge: 'DRILL',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          category: reel.category,
          muscleGroup: reel.specialtyPills?.[1] || 'Dynamic Drill',
          views: `${Math.floor(5 + Math.random() * 30)}.${Math.floor(1 + Math.random() * 9)}k`,
          likes: 420 + Math.floor(Math.random() * 800),
          duration: '0:30',
          videoUrl: reel.window1.url,
          thumbnail: reel.window1.poster || reel.thumbnail,
          coachReelId: reel.id,
          description: `Kinetic execution drill focused on neuromuscular activation and peak tension.`,
          repsRecommended: '3 Sets • 10-15 Reps • Tempo 3-0-1',
        });
      }

      // Window 2: Cue / Biomechanics
      if (reel.window2) {
        list.push({
          id: `${reel.id}-w2`,
          title: `${reel.window2.title} Biomechanics`,
          coachName: reel.coachName,
          coachAvatar: reel.avatar,
          badge: 'CUE',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          category: reel.category,
          muscleGroup: reel.specialtyPills?.[2] || 'Kinetic Cue',
          views: `${Math.floor(8 + Math.random() * 50)}.${Math.floor(1 + Math.random() * 9)}k`,
          likes: 890 + Math.floor(Math.random() * 950),
          duration: '0:25',
          videoUrl: reel.window2.url,
          thumbnail: reel.window2.poster || reel.thumbnail,
          coachReelId: reel.id,
          description: `Key joint alignment cues to protect spinal erectors and maximize force output.`,
          repsRecommended: '2 Warm-up Primer Sets • 5 Focused Reps',
        });
      }
    });

    return list;
  }, [reels]);

  // Filter based on search query & category for exercise explore
  const filteredExercises = useMemo(() => {
    return allExercises.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'FOR YOU' || selectedCategory === 'ALL') return true;
      if (selectedCategory === 'CHEST & TRICEPS') {
        return (
          item.title.toLowerCase().includes('chest') ||
          item.title.toLowerCase().includes('press') ||
          item.title.toLowerCase().includes('tricep') ||
          item.muscleGroup.toLowerCase().includes('chest')
        );
      }
      if (selectedCategory === 'BACK & BICEPS') {
        return (
          item.title.toLowerCase().includes('back') ||
          item.title.toLowerCase().includes('row') ||
          item.title.toLowerCase().includes('lat') ||
          item.title.toLowerCase().includes('pull') ||
          item.muscleGroup.toLowerCase().includes('back')
        );
      }
      if (selectedCategory === 'QUADS & GLUTES') {
        return (
          item.title.toLowerCase().includes('squat') ||
          item.title.toLowerCase().includes('lunge') ||
          item.title.toLowerCase().includes('leg') ||
          item.title.toLowerCase().includes('glute') ||
          item.muscleGroup.toLowerCase().includes('quad')
        );
      }
      if (selectedCategory === 'MOBILITY') return item.category.toLowerCase().includes('mobility');
      if (selectedCategory === 'BIOMECHANICS') return item.badge === 'CUE' || item.category.toLowerCase().includes('biomechanic');
      if (selectedCategory === 'HYPERTROPHY') return item.category.toLowerCase().includes('hypertrophy');
      if (selectedCategory === 'STRENGTH') return item.category.toLowerCase().includes('strength');
      if (selectedCategory === 'REHAB') return item.category.toLowerCase().includes('rehab') || item.category.toLowerCase().includes('mobility');
      if (selectedCategory === 'CARDIO & HIIT') return item.category.toLowerCase().includes('cardio') || item.category.toLowerCase().includes('hiit');

      return true;
    });
  }, [allExercises, searchQuery, selectedCategory]);

  const handleAddToWorkout = (exercise: ExerciseItem) => {
    setAddedToast(`Added "${exercise.title}" to workout session`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="h-full w-full bg-[#050507] text-white flex flex-col overflow-hidden font-sans">
      {/* ── Obsidian Glass Header & Navigation Hub ── */}
      <div className="shrink-0 bg-[#08080a]/90 backdrop-blur-2xl border-b border-white/[0.08] z-20">
        
        {/* Top Header Row: Close | Mode Switcher (Elite Reels vs Coaches) | Stream Icon */}
        <div className="pt-[max(env(safe-area-inset-top),10px)] px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Left: Close Button */}
          {onClose ? (
            <button
              onClick={onClose}
              className="p-2 -ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-full active:scale-90"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          ) : (
            <div className="w-9" />
          )}

          {/* Center: Elite Reels & Coaches Pill Switcher */}
          <div className="flex items-center justify-center flex-1 max-w-[240px]">
            <div className="grid grid-cols-2 p-1 bg-[#141418] border border-white/10 rounded-full w-full shadow-inner">
              <button
                className="py-1.5 px-3 rounded-full text-xs tracking-tight transition-all flex items-center justify-center gap-1 cursor-pointer bg-white text-black font-black shadow-sm"
              >
                Elite Reels
              </button>

              <button
                onClick={() => {
                  if (onSwitchToStream) {
                    onSwitchToStream();
                  } else if (reels.length > 0) {
                    onSelectReel(reels[0].id);
                  }
                }}
                className="py-1.5 px-3 rounded-full text-xs tracking-tight transition-all flex items-center justify-center gap-1 cursor-pointer text-zinc-400 hover:text-white font-semibold"
              >
                Coaches
              </button>
            </div>
          </div>

          {/* Right: Switch to Full-Screen Stream Mode */}
          {onSwitchToStream ? (
            <button
              onClick={onSwitchToStream}
              className="p-2 -mr-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-full active:scale-90"
              title="Full-Screen Stream Mode"
              aria-label="Full-Screen Stream Mode"
            >
              <Film className="w-5 h-5 stroke-[2]" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* Divider Line Under Switcher */}
        <div className="h-px bg-white/[0.08] w-full" />

        {/* Search & Categories Section (Under the Line) */}
        <div className="p-3 sm:p-4 space-y-2.5 max-w-lg mx-auto">
          {/* Instagram Explore-Style Minimalist Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises, muscle groups, form cues..."
              className="w-full bg-[#121215] border border-white/[0.08] rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Capsule Rail (Under Search) */}
          {/* Horizontal Category Capsules */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-xs font-black'
                      : 'bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1] border border-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ELITE REELS & EXERCISE EXPLORE GRID ── */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3">
        {filteredExercises.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Compass className="w-10 h-10 text-zinc-600 animate-pulse" strokeWidth={1.5} />
            <p className="text-sm font-bold text-zinc-300">No matching movements found</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Try searching for &ldquo;squat&rdquo;, &ldquo;mobility&rdquo;, &ldquo;Elena&rdquo;, or &ldquo;hypertrophy&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {filteredExercises.map((item, idx) => {
              // Instagram Explore dynamic staggered grid: every 7th item is a 2x2 highlight tile
              const isLarge = idx % 7 === 0;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedExercise(item)}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer bg-[#121214] border border-white/[0.08] hover:border-white/20 transition-all duration-300 active:scale-[0.98] ${
                    isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'
                  }`}
                >
                  {/* Thumbnail / Poster */}
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Subtle Top-Right Video Indicator (Clean Glyph Only, Zero Fonts/Text) */}
                  <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 group-hover:bg-black/60 transition-colors">
                    <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Exercise Quick-Preview Modal ── */}
      {selectedExercise && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Canvas Header */}
            <div className="relative aspect-video bg-black overflow-hidden">
              {selectedExercise.videoUrl ? (
                <video
                  src={selectedExercise.videoUrl}
                  poster={selectedExercise.thumbnail}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={selectedExercise.thumbnail}
                  alt={selectedExercise.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-black/40" />

              <button
                onClick={() => setSelectedExercise(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-3 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border backdrop-blur-md ${selectedExercise.badgeColor}`}
                >
                  {selectedExercise.badge}
                </span>
                <span className="text-[10px] text-zinc-300 font-mono">{selectedExercise.muscleGroup}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3.5">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedExercise.title}</h3>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{selectedExercise.description}</p>
              </div>

              {/* Recommended Protocol */}
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Prescribed Volume</p>
                    <p className="text-xs font-semibold text-zinc-200">{selectedExercise.repsRecommended}</p>
                  </div>
                </div>
              </div>

              {/* Coach Attribution */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedExercise.coachAvatar}
                    alt={selectedExercise.coachName}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                  <span className="text-xs font-medium text-zinc-300">{selectedExercise.coachName}</span>
                </div>
                <span className="text-[10px] text-zinc-500">{selectedExercise.views} plays</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    const targetReelId = selectedExercise.coachReelId;
                    setSelectedExercise(null);
                    onSelectReel(targetReelId);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-black flex items-center justify-center gap-1.5 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Watch Reel
                </button>

                <button
                  onClick={() => handleAddToWorkout(selectedExercise)}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Add to OS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          {addedToast}
        </div>
      )}
    </div>
  );
};
