import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mapAssignedRow } from '../log/todaySession';
import { subscribeToCoachDirectives } from '../../services/coachSync';
import { useAthleteRealtime } from './hooks/useAthleteRealtime';
import { useWorkoutStore } from './store/useWorkoutStore';
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
  const handleLoadAssignedProtocol = React.useCallback((protocol: any) => {
    if (!protocol || protocol.status === 'completed') return;
    if (protocol.id && loadedProtocolIdsRef.current.has(protocol.id)) return;
    if (protocol.id) loadedProtocolIdsRef.current.add(protocol.id);
    const mapped = mapAssignedRow(protocol);
    useCoachStore.getState().ingestAssigned(mapped);
    if (readAthleteSettingsSnapshot().coachUpdates) {
      showToast(`Coach sent "${mapped.title}". Start it from Log.`);
    }
  }, [showToast]);

  useEffect(() => {
    void getAuthenticatedUserId().then((id) => setAthleteUid(id || ''));
  }, []);

  useAthleteRealtime({
    athleteId: athleteUid,
    onProtocolDispatched: handleLoadAssignedProtocol,
  });

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
        showToast(`Coach updated protocol status: ${payload.new.status}`);
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
              onLoaded={(title) => showToast(`Started ${title}`)}
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
