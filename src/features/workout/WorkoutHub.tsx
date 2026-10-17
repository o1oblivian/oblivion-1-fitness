import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mapAssignedRow } from '../log/todaySession';
import { subscribeToCoachDirectives } from '../../services/coachSync';
import { useAthleteRealtime } from './hooks/useAthleteRealtime';
import { useCoachStore } from '../../stores/useCoachStore';
import { modalActions } from '../../components/modals/useModalStore';
import { WorkoutHeroBanner } from './components/WorkoutHeroBanner';
import { ProgramReelsScroller, ReelCategory, reelStoryId } from './components/ProgramReelsScroller';
import { TrainingHubCards } from './components/TrainingHubCards';
import { ExerciseHubDrawer } from './components/ExerciseHubDrawer';
import { ActiveLogCard } from './components/ActiveLogCard';
import { CoachProtocolAccordionPanel } from './components/CoachProtocolAccordionPanel';
import { IntelCoachAccordionPanel } from './components/IntelCoachAccordionPanel';
import { MicrocycleStrainTracker } from './components/MicrocycleStrainTracker';
import { IntelInsightsCard } from './components/IntelInsightsCard';
import { EliteReelsHub } from '../reels/EliteReelsHub';
import { readAthleteSettingsSnapshot } from '../../utils/athleteSettingsSnapshot';
import { getAuthenticatedUserId } from '../../services/authUser';
import type { AssignedWorkoutRow } from '../../types/coach';
import { HealthDisclaimerBanner } from '../legal/HealthDisclaimerBanner';

export const WorkoutHub: React.FC = () => {
  const [expandedHubTab, setExpandedHubTab] = useState<'intel' | 'coach' | null>(null);
  const [coachNote, setCoachNote] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<'lift' | 'sports' | 'recovery' | null>(() =>
    readAthleteSettingsSnapshot().restRecoveryMode ? 'recovery' : null
  );
  const [isEliteReelsOpen, setIsEliteReelsOpen] = useState(false);
  const [reelsCategory, setReelsCategory] = useState<ReelCategory>('ALL');
  const [reelsFilter, setReelsFilter] = useState<string>('ALL');
  const [athleteUid, setAthleteUid] = useState('');
  const activeReelId = isEliteReelsOpen ? reelStoryId(reelsCategory) : '';

  const handleToggleHubTab = (tab: 'intel' | 'coach') => {
    if (tab === 'coach') setCoachNote(null);
    setExpandedHubTab((prev) => (prev === tab ? null : tab));
  };

  // Track loaded protocol IDs to prevent redundant processing
  const loadedProtocolIdsRef = React.useRef<Set<string>>(new Set());

  /**
   * Ingest coach assigned protocol into the app's activeLogs schema
   */
  const handleLoadAssignedProtocol = React.useCallback((protocol: AssignedWorkoutRow) => {
    if (!protocol || protocol.status === 'completed') return;
    if (protocol.id && loadedProtocolIdsRef.current.has(protocol.id)) return;
    if (protocol.id) loadedProtocolIdsRef.current.add(protocol.id);
    const mapped = mapAssignedRow(protocol);
    useCoachStore.getState().ingestAssigned(mapped);
    if (readAthleteSettingsSnapshot().coachUpdates) setCoachNote(`New: ${mapped.title}`);
  }, []);

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
      } else if (payload.new && payload.new.status && readAthleteSettingsSnapshot().coachUpdates) {
        setCoachNote(`${payload.new.title || 'Workout'} marked ${payload.new.status}`);
      }
    });
    return () => unsubscribe();
  }, [athleteUid, handleLoadAssignedProtocol]);

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
        />
      </div>

      <div className="px-1 pt-2">
        <HealthDisclaimerBanner compact />
      </div>

      {/* 2. PROGRAM REELS & STORIES */}
      <ProgramReelsScroller
        activeId={activeReelId}
        onSelect={(category, filterTag) => {
          setReelsCategory(category);
          setReelsFilter(filterTag);
          setIsEliteReelsOpen(true);
        }}
      />

      {/* 3. TRAINING HUB SECTION (With Accordion Tabs) */}
      <TrainingHubCards expandedHubTab={expandedHubTab} onToggleTab={handleToggleHubTab} coachNote={coachNote} />

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
            <CoachProtocolAccordionPanel onClose={() => setExpandedHubTab(null)} />
          </motion.div>
        )}

        {expandedHubTab === 'intel' && (
          <motion.div
            key="intel-drawer"
            id="intel-coach-accordion-drawer"
            initial={{ opacity: 0, height: 0, y: -6, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', y: 0, transitionEnd: { overflow: 'visible' } }}
            exit={{ opacity: 0, height: 0, y: -6, overflow: 'hidden' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="my-2"
          >
            <IntelCoachAccordionPanel
              onClose={() => setExpandedHubTab(null)}
              onDeployProtocol={() => {
                setExpandedHubTab(null);
                document.getElementById('active-log-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      />

      {/* 5. ACTIVE LOG (Target for Ingested Protocols & Manual Logging) */}
      <div id="active-log-section" className="scroll-mt-3">
        <ActiveLogCard
          onBuildWorkout={() => {
            setExpandedHubTab('intel');
            window.setTimeout(() => {
              document.getElementById('card-intel-coach')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }}
        />
      </div>

      {/* 6. MICROCYCLE STRAIN TRACKER (Recharts Weekly Load Trends & Anatomy Towers) */}
      <MicrocycleStrainTracker />

      {/* 7. BOTTOM BANNER CARDS */}
      <IntelInsightsCard />

      <EliteReelsHub
        isOpen={isEliteReelsOpen}
        onClose={() => setIsEliteReelsOpen(false)}
        initialMode="grid"
        initialCategory={reelsCategory}
        initialFilter={reelsFilter}
      />
    </div>
  );
};


