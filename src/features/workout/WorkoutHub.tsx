import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabaseClient';
import { tactileEngine } from '../../services/tactileEngine';
import { subscribeToCoachDirectives } from '../../services/coachSync';
import { useAthleteRealtime } from './hooks/useAthleteRealtime';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useLogStore } from '../../stores/useLogStore';
import { useCoachStore } from '../../stores/useCoachStore';
import { modalActions } from '../../components/modals/useModalStore';
import { WorkoutHeroBanner } from './components/WorkoutHeroBanner';
import { ProgramReelsScroller } from './components/ProgramReelsScroller';
import { TrainingHubCards } from './components/TrainingHubCards';
import { ExerciseHubDrawer } from './components/ExerciseHubDrawer';
import { ActiveLogCard } from './components/ActiveLogCard';
import { CoachProtocolAccordionPanel } from './components/CoachProtocolAccordionPanel';
import { IntelCoachAccordionPanel } from './components/IntelCoachAccordionPanel';
import { MicrocycleStrainTracker } from './components/MicrocycleStrainTracker';
import { WeeklyReportCard } from './components/WeeklyReportCard';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { IntelCoachIntelligenceCard } from './components/IntelCoachIntelligenceCard';
import { WorkoutBlueprintModal } from './components/WorkoutBlueprintModal';
import { EliteReelsHub } from '../reels/EliteReelsHub';
import { WORKOUT_BLUEPRINTS, WorkoutBlueprint } from '../../data/workoutBlueprints';
import { readAthleteSettingsSnapshot } from '../../utils/athleteSettingsSnapshot';
import { getAuthenticatedUserId } from '../../services/authUser';

export const WorkoutHub: React.FC = () => {
  const showToast = useWorkoutStore((s) => s.showToast);
  const setActiveLogs = useWorkoutStore((s) => s.setActiveLogs);
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);
  const setActiveRoutine = useWorkoutStore((s) => s.setActiveRoutine);

  const [expandedHubTab, setExpandedHubTab] = useState<'intel' | 'coach' | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<'lift' | 'sports' | 'recovery' | null>(() =>
    readAthleteSettingsSnapshot().restRecoveryMode ? 'recovery' : null
  );
  const [activeBlueprint, setActiveBlueprint] = useState<WorkoutBlueprint | null>(null);
  const [isEliteReelsOpen, setIsEliteReelsOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string | undefined>(undefined);
  const [reelsMode, setReelsMode] = useState<'grid' | 'player'>('player');
  const [reelsCategory, setReelsCategory] = useState<'ALL' | 'TUTORIAL' | 'MOBILITY' | 'BIOMECHANICS' | 'HYPERTROPHY' | 'STRENGTH' | 'REHAB'>('ALL');
  const [reelsFilter, setReelsFilter] = useState<string>('ALL');
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [athleteUid, setAthleteUid] = useState('');

  const handleToggleHubTab = (tab: 'intel' | 'coach') => {
    setExpandedHubTab((prev) => (prev === tab ? null : tab));
  };

  // Track loaded protocol IDs to prevent redundant processing
  const loadedProtocolIdsRef = React.useRef<Set<string>>(new Set());

  /**
   * Ingest coach assigned protocol into the app's activeLogs schema
   */
  const handleLoadAssignedProtocol = React.useCallback(async (protocol: any) => {
    if (!protocol || protocol.status === 'active') return;
    if (!readAthleteSettingsSnapshot().autoDispatch) {
      showToast(`Coach protocol "${protocol.title || 'Protocol'}" is waiting in My Coach (auto-dispatch off).`);
      return;
    }
    if (protocol.id && loadedProtocolIdsRef.current.has(protocol.id)) return;
    if (protocol.id) {
      loadedProtocolIdsRef.current.add(protocol.id);
    }

    tactileEngine.playPRCelebration();

    const rawExercises = protocol.exercises || protocol.workout_data?.exercises || [];
    const newActiveExercises = rawExercises.map((ex: any, idx: number) => {
      const uniqueExId = `assigned-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        id: uniqueExId,
        exerciseName: ex.name || 'Prescribed Exercise',
        name: ex.name || 'Prescribed Exercise',
        targetMuscle: ex.targetMuscle || 'Full Body',
        equipment: 'barbell',
        tier: 'Coach Directive',
        restSecs: Number(ex.restSecs || 90),
        sets: Array.from({ length: Number(ex.sets) || 3 }, (_, sIdx) => ({
          id: `set-${Date.now()}-${sIdx}-${Math.random().toString(36).slice(2, 6)}`,
          setNumber: sIdx + 1,
          reps: parseInt(ex.reps, 10) || 10,
          weight: Number(ex.weightKg || ex.weight || 0),
          weightKg: Number(ex.weightKg || ex.weight || 0),
          rpe: ex.rpe || 8,
          completed: false,
        })),
        notes: ex.notes || `Assigned by Coach • Target: ${ex.reps} reps @ RPE ${ex.rpe || 8}`,
      };
    });

    setActiveLogs((prev: any[]) => [...prev, ...newActiveExercises]);
    setActiveSession(true);
    setActiveRoutine(protocol.title || 'Coach Assigned Routine');

    // Trigger confirmation toast
    showToast(`⚡ Assigned protocol "${protocol.title || 'Protocol'}" loaded into Active Log!`);

    // Mark protocol status in Supabase table assigned_workouts from 'pending' to 'active'
    if (protocol.id) {
      try {
        await supabase
          .from('assigned_workouts')
          .update({ status: 'active' })
          .eq('id', protocol.id);
      } catch (err) {
        console.warn('[WorkoutHub] Failed to update protocol status in Supabase:', err);
      }
    }

    // Automatically collapse the My Coach drawer and scroll smoothly down to Active Log
    setExpandedHubTab(null);
    setTimeout(() => {
      const activeLogEl = document.getElementById('active-log-section') || document.getElementById('active-log-card');
      activeLogEl?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }, [setActiveLogs, setActiveSession, setActiveRoutine, showToast]);

  useEffect(() => {
    void getAuthenticatedUserId().then((id) => setAthleteUid(id || ''));
  }, []);

  useAthleteRealtime({
    athleteId: athleteUid,
    onProtocolDispatched: handleLoadAssignedProtocol,
  });

  useEffect(() => {
    async function loadCloudSessions() {
      const currentUserId = athleteUid || (await getAuthenticatedUserId());
      if (!currentUserId) return;
      try {
        // Query completed_sessions supporting both client_id and user_id schema conventions
        let res = await supabase
          .from('completed_sessions')
          .select('*')
          .or(`user_id.eq.${currentUserId},client_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false })
          .limit(15);

        if (res.error) {
          // Fallback if specific or filter failed
          res = await supabase
            .from('completed_sessions')
            .select('*')
            .eq('user_id', currentUserId)
            .limit(15);
        }

        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((row: any) => {
            const rawTonnage = row.tonnage_kg ?? row.volume_kg ?? row.tonnage ?? 0;
            const completedAt = row.completed_at || row.created_at;
            const sessionName = row.session_name || row.title || 'Gym Protocol';
            const durSeconds = row.duration_seconds || (row.duration_minutes ? row.duration_minutes * 60 : 2700);

            return {
              id: row.id || `session-${Date.now()}`,
              title: sessionName,
              timestamp: completedAt ? new Date(completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
              duration: `${Math.round(durSeconds / 60)}m`,
              tonnageKg: Number(rawTonnage) || 0,
              totalSets: Number(row.total_sets || row.sets_count) || 0,
              strain: Number(row.strain) || 14.5,
              exercises: [],
            };
          });
          useLogStore.getState().setRecentSessions(formatted);
        }
      } catch (err) {
        console.warn('[WorkoutHub] Cloud sessions lookup note:', err);
      }
    }
    void loadCloudSessions();
  }, [athleteUid]);

  useEffect(() => {
    if (!athleteUid) return;
    const unsubscribe = subscribeToCoachDirectives(athleteUid, (payload) => {
      if (
        payload.new &&
        (payload.new.exercises || payload.new.workout_data) &&
        payload.new.status !== 'active'
      ) {
        handleLoadAssignedProtocol(payload.new);
      } else if (payload.new && payload.new.status) {
        showToast(`⚡ Coach updated protocol status: ${payload.new.status}`);
      }
    });
    return () => unsubscribe();
  }, [athleteUid, handleLoadAssignedProtocol, showToast]);

  return (
    <div
      id="workout-hub-page"
      className="w-full h-auto min-h-full bg-transparent text-white pb-8 pt-1 select-none transition-colors"
    >
      {/* 1. TOP HERO CARD CONTAINER (Nude, No Atmospheric Fog Depth) */}
      <div id="hero-card-container" className="relative w-full">
        <WorkoutHeroBanner
          onOpenCardioModal={() => modalActions.openCardioScanner()}
          onOptionsClick={() => modalActions.openSettings()}
          onOpenSupplements={() => modalActions.openSupplements()}
          onShowToast={(msg) => showToast(msg)}
        />
      </div>

      {/* 2. PROGRAM REELS & STORIES */}
      <ProgramReelsScroller
        activeId={reelsCategory === 'ALL' ? (reelsFilter === 'HYROX' ? 'hyrox' : 'elite-reels') : reelsCategory.toLowerCase()}
        onSelectCategory={(category, filterTag) => {
          setReelsCategory(category);
          setReelsFilter(filterTag);
          setReelsMode('grid');
          setIsEliteReelsOpen(true);
        }}
        onOpenExploreHub={() => {
          setReelsCategory('ALL');
          setReelsFilter('ALL');
          setReelsMode('grid');
          setIsEliteReelsOpen(true);
        }}
        onSelectBlueprint={(blueprintKey) => {
          const blueprint = WORKOUT_BLUEPRINTS.find((b) => b.id === blueprintKey) || null;
          setActiveBlueprint(blueprint);
        }}
      />

      {/* 3. TRAINING HUB SECTION (With Accordion Tabs) */}
      <TrainingHubCards
        expandedHubTab={expandedHubTab}
        onToggleTab={handleToggleHubTab}
        renderAccordionsInline={false}
        onShowToast={(msg) => showToast(msg)}
      />

      {/* Animated Hub Drawer Accordions */}
      <AnimatePresence>
        {expandedHubTab === 'coach' && (
          <motion.div
            key="coach-drawer"
            id="my-coach-accordion-drawer"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden my-2"
          >
            <CoachProtocolAccordionPanel
              onClose={() => setExpandedHubTab(null)}
              onDeployProtocol={(exs) => {
                handleLoadAssignedProtocol({
                  title: 'Push Day • Chest & Shoulder Overload',
                  exercises: exs,
                });
                showToast('Protocol successfully loaded into Active Session!');
                setExpandedHubTab(null);
              }}
            />
          </motion.div>
        )}

        {expandedHubTab === 'intel' && (
          <motion.div
            key="intel-drawer"
            id="intel-coach-accordion-drawer"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden my-2"
          >
            <IntelCoachAccordionPanel
              onClose={() => setExpandedHubTab(null)}
              onDeployProtocol={(exs) => {
                showToast(`Intel Session Deployed: ${exs.length} exercises scheduled.`);
                setExpandedHubTab(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. EXERCISE HUB TOGGLE & DISCIPLINE SELECTOR (Default Closed) */}
      <ExerciseHubDrawer
        selectedDiscipline={selectedDiscipline}
        onSelectDiscipline={(d) => {
          setSelectedDiscipline(d);
          if (d) setExpandedHubTab(null);
        }}
        onShowToast={(msg: string) => showToast(msg)}
      />

      {/* 5. ACTIVE LOG (Target for Ingested Protocols & Manual Logging) */}
      <div id="active-log-section">
        <ActiveLogCard onShowToast={(msg: string) => showToast(msg)} />
      </div>

      {/* 6. MICROCYCLE STRAIN TRACKER (Recharts Weekly Load Trends & Anatomy Towers) */}
      <MicrocycleStrainTracker />

      {/* 7. BOTTOM BANNER CARDS */}
      <WeeklyReportCard onClick={() => setIsWeeklyReportOpen(true)} />
      <IntelCoachIntelligenceCard />

      {/* Intel Coach Performance Weekly Report Modal */}
      <WeeklyReportModal
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
      />

      {/* Workout Blueprint Modal */}
      <WorkoutBlueprintModal
        blueprint={activeBlueprint}
        isOpen={activeBlueprint !== null}
        onClose={() => setActiveBlueprint(null)}
        onLoaded={(count) => showToast(`Loaded ${count} exercises into Active Log`)}
      />

      {/* Elite Reels Hub */}
      <EliteReelsHub
        isOpen={isEliteReelsOpen}
        onClose={() => {
          setIsEliteReelsOpen(false);
          setSelectedReelId(undefined);
        }}
        initialMode={reelsMode}
        initialCategory={reelsCategory}
        initialFilter={reelsFilter}
        initialReelId={selectedReelId}
      />
    </div>
  );
};

export default WorkoutHub;
