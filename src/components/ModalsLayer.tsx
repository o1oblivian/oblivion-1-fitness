import React, { useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import type { useAppState } from '@/hooks/useAppState';
import { formatDuration } from '@/hooks/useAppState';
import { ROUTINE_TEMPLATES } from '@/data/exerciseDatabase';
import { ExerciseLog } from '@/types';
import { buildSessionFromLogs, saveCompletedSession } from '@/utils/sessionVaultStore';
import { injectTrialExercise, setCoachUnlocked } from '@/utils/coachMarketplaceStore';
import { getInputMethod } from '@/utils/inputMethodStore';
import type { SearchAction } from '@/components/GlobalSearchModal';
import { Settings, Dumbbell, Globe, CreditCard, Plane, Image, Share2, Moon } from 'lucide-react';

// Lightweight core / immediate modals
import { RotaryDialModal } from '@/components/RotaryDialModal';
import { TacticalNumpadModal } from '@/components/TacticalNumpadModal';
import { TandemView } from '@/components/TandemView';

// Code-split dynamic modals for maximum performance & instant boot
const ScheduleModal = lazy(() => import('@/components/ScheduleModal').then(m => ({ default: m.ScheduleModal })));
const RoutineSwapperModal = lazy(() => import('@/components/RoutineSwapperModal').then(m => ({ default: m.RoutineSwapperModal })));
const CommitSaveModal = lazy(() => import('@/components/CommitSaveModal').then(m => ({ default: m.CommitSaveModal })));
const AutoPilotModal = lazy(() => import('@/components/AutoPilotModal').then(m => ({ default: m.AutoPilotModal })));
const FoodEntryModal = lazy(() => import('@/components/FoodEntryModal').then(m => ({ default: m.FoodEntryModal })));
const CustomFoodModal = lazy(() => import('@/components/CustomFoodModal').then(m => ({ default: m.CustomFoodModal })));
const AIMealScanModal = lazy(() => import('@/components/AIMealScanModal').then(m => ({ default: m.AIMealScanModal })));
const ClientDetailModal = lazy(() => import('@/components/ClientDetailModal').then(m => ({ default: m.ClientDetailModal })));
const ClientProgressShareModal = lazy(() => import('@/components/ClientProgressShareModal').then(m => ({ default: m.ClientProgressShareModal })));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const ExportHelpModal = lazy(() => import('@/components/ExportHelpModal').then(m => ({ default: m.ExportHelpModal })));
const GymNetworkModal = lazy(() => import('@/components/GymNetworkModal').then(m => ({ default: m.GymNetworkModal })));
const BuddyRadarEngine = lazy(() => import('@/components/BuddyRadarEngine').then(m => ({ default: m.BuddyRadarEngine })));
const PayPlanHubModal = lazy(() => import('@/components/PayPlanHubModal').then(m => ({ default: m.PayPlanHubModal })));
const TravelPassModal = lazy(() => import('@/components/TravelPassModal').then(m => ({ default: m.TravelPassModal })));
const ShareableGoalCardModal = lazy(() => import('@/components/ShareableGoalCardModal').then(m => ({ default: m.ShareableGoalCardModal })));
const CommunityHubModal = lazy(() => import('@/components/CommunityHubModal').then(m => ({ default: m.CommunityHubModal })));
const SwipeableMediaViewer = lazy(() => import('@/components/SwipeableMediaViewer').then(m => ({ default: m.SwipeableMediaViewer })));
const CycleSyncModal = lazy(() => import('@/components/CycleSyncModal').then(m => ({ default: m.CycleSyncModal })));
const GlobalSearchModal = lazy(() => import('@/components/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const AICoachInsightsModal = lazy(() => import('@/components/AICoachInsightsModal').then(m => ({ default: m.AICoachInsightsModal })));
const MediaVaultModal = lazy(() => import('@/components/MediaVaultModal').then(m => ({ default: m.MediaVaultModal })));
const AthleteProfileCard = lazy(() => import('@/components/AthleteProfileCard').then(m => ({ default: m.AthleteProfileCard })));
const ProgramPurchaseModal = lazy(() => import('@/components/ProgramPurchaseModal').then(m => ({ default: m.ProgramPurchaseModal })));
const ReminderManager = lazy(() => import('@/components/ReminderManager').then(m => ({ default: m.ReminderManager })));

type AppState = ReturnType<typeof useAppState>;

interface Props {
  s: AppState;
}

export function ModalsLayer({ s }: Props) {
  const handle = s.handleForCurrentUserHandle ? s.handleForCurrentUserHandle() : '@athlete';

  return (
    <div id="o1fc-modals-root" className="contents">
      <Suspense fallback={null}>
      {/* Schedule Modal */}
      {s.isScheduleModalOpen && (
        <ScheduleModal
          isOpen={s.isScheduleModalOpen}
          schedule={s.weeklySchedule}
          onSave={(newSched) => {
            s.setWeeklySchedule(newSched);
            try {
              localStorage.setItem('lumina_weekly_schedule', JSON.stringify(newSched));
            } catch {}
            s.showToast('Weekly Schedule Saved!');
          }}
          onClose={() => s.setIsScheduleModalOpen(false)}
        />
      )}

      {/* Routine Swapper Modal */}
      {s.isRoutineSwapperOpen && (
        <RoutineSwapperModal
          isOpen={s.isRoutineSwapperOpen}
          onSelectRoutine={(routineId) => {
            if (ROUTINE_TEMPLATES[routineId]) {
              const newLogs: ExerciseLog[] = ROUTINE_TEMPLATES[routineId].map((exName) => ({
                id: 'ex_' + Math.random().toString(36).substring(2, 9),
                exerciseName: exName,
                sets: [
                  {
                    id: 'set_' + Math.random().toString(36).substring(2, 9),
                    reps: 0,
                    weight: 0,
                    rpe: 0,
                  },
                ],
              }));
              s.setActiveLogs(newLogs);
              s.handleModeChange('tracker');
              s.showToast("Session loaded into Workout — let's go!");
            }
          }}
          onClose={() => s.setIsRoutineSwapperOpen(false)}
        />
      )}

      {/* Commit / Save Workout Modal */}
      {s.isCommitModalOpen && (
        <CommitSaveModal
          isOpen={s.isCommitModalOpen}
          exerciseCount={s.activeLogs.length}
          totalSets={s.activeLogs.reduce((sum, l) => sum + l.sets.length, 0)}
          totalVolume={s.activeLogs.reduce(
            (sum, l) =>
              sum +
              l.sets.reduce((ss, st) => ss + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0),
            0
          )}
          onSaveToDay={async (day) => {
            const durationSecs = Math.round((Date.now() - s.workoutStartRef.current) / 1000);
            const sessionData = buildSessionFromLogs(s.currentUserEmail, s.activeLogs, durationSecs);
            await saveCompletedSession(sessionData);
            s.setSessionVaultRefresh((p: number) => p + 1);
            const exercises = s.activeLogs.map((l) => l.exerciseName);
            const customKey = 'custom_' + day.toLowerCase();
            ROUTINE_TEMPLATES[customKey] = exercises;
            const updatedSched = { ...s.weeklySchedule, [day]: customKey };
            s.setWeeklySchedule(updatedSched);
            try {
              localStorage.setItem('lumina_weekly_schedule', JSON.stringify(updatedSched));
            } catch {}
            s.setActiveLogs([]);
            s.workoutStartRef.current = Date.now();
            s.showToast(`Workout saved to ${day} & logged to Vault!`);
            s.setIsCommitModalOpen(false);
          }}
          onSaveStandalone={async () => {
            const durationSecs = Math.round((Date.now() - s.workoutStartRef.current) / 1000);
            const sessionData = buildSessionFromLogs(s.currentUserEmail, s.activeLogs, durationSecs);
            await saveCompletedSession(sessionData);
            s.setSessionVaultRefresh((p: number) => p + 1);
            const totalVol = s.activeLogs.reduce(
              (sum, l) =>
                sum +
                l.sets.reduce((ss, st) => ss + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0),
              0
            );
            const title =
              s.activeLogs.length > 0
                ? s.activeLogs
                    .map((l) => l.exerciseName)
                    .slice(0, 2)
                    .join(' / ')
                : 'Power Session';
            const now = Date.now();
            const historyEntry = {
              id: `h_${now}`,
              date: 'TODAY',
              title: title.toUpperCase(),
              volume: (totalVol / 1000).toFixed(1),
              duration: formatDuration(durationSecs),
              exercises: s.activeLogs.map((l) => ({
                name: l.exerciseName,
                sets: l.sets.map((st) => ({
                  weight: Number(st.weight) || 0,
                  reps: Number(st.reps) || 0,
                  rpe: Number(st.rpe) || 0,
                })),
              })),
            };
            const coachLog = {
              id: `log_${now}`,
              athleteName: s.currentUserEmail.split('@')[0] || 'Athlete',
              handle: `@${s.currentUserEmail.split('@')[0] || 'athlete'}`,
              volume: `${(totalVol / 1000).toFixed(1)} MT`,
              timeAgo: 'JUST NOW',
              approved: false,
              duration: formatDuration(durationSecs),
              readiness: Math.max(
                50,
                Math.round(
                  100 -
                    (s.activeLogs.reduce(
                      (sum, l) =>
                        sum + l.sets.reduce((ss, st) => ss + (Number(st.rpe) || 0), 0),
                      0
                    ) /
                      Math.max(
                        1,
                        s.activeLogs.reduce((sum, l) => sum + l.sets.length, 0)
                      )) *
                      5
                )
              ),
              title: title.toUpperCase(),
              date: 'TODAY',
              exercises: s.activeLogs.map((l) => ({
                name: l.exerciseName,
                sets: l.sets.map((st) => ({
                  weight: Number(st.weight) || 0,
                  reps: Number(st.reps) || 0,
                  rpe: Number(st.rpe) || 0,
                })),
                hasVideo: false,
                coachNote: '',
              })),
            };
            if (s.registerWorkoutRef.current)
              s.registerWorkoutRef.current({ historyEntry, coachLog });
            s.setActiveLogs([]);
            s.workoutStartRef.current = Date.now();
            s.showToast('Session saved to your Vault!', 'success');
            s.setIsCommitModalOpen(false);
          }}
          onClose={() => s.setIsCommitModalOpen(false)}
        />
      )}

      {/* Auto Pilot Modal */}
      {s.isAutoPilotOpen && (
        <AutoPilotModal
          isOpen={s.isAutoPilotOpen}
          onApply={(newBmr, targetCals, p, c, f) => {
            s.setBmr(newBmr);
            s.setGoalCals(targetCals);
            s.setGoalP(p);
            s.setGoalC(c);
            s.setGoalF(f);
            s.showToast(
              `Mifflin-St Jeor Targets Applied: ${targetCals.toLocaleString()} kcal`,
              'success'
            );
          }}
          onClose={() => s.setIsAutoPilotOpen(false)}
        />
      )}

      {/* Core Food Entry Modal */}
      {s.foodModalMeal && (
        <FoodEntryModal
          isOpen={!!s.foodModalMeal}
          mealName={s.foodModalMeal || ''}
          foodDB={s.foodDB}
          onSelectFood={s.handleSelectFoodForMeal}
          onOpenCustomModal={(query) => s.setCustomFoodQuery(query)}
          onClose={() => s.setFoodModalMeal(null)}
          onOpenDial={s.openDial}
        />
      )}

      {/* Custom Food Creation Modal */}
      {s.customFoodQuery !== null && (
        <CustomFoodModal
          isOpen={s.customFoodQuery !== null}
          initialQuery={s.customFoodQuery || ''}
          onSaveFood={s.handleSaveCustomFood}
          onClose={() => s.setCustomFoodQuery(null)}
        />
      )}

      {/* AI Meal Scan Modal */}
      {s.aiScanMeal && (
        <AIMealScanModal
          isOpen={!!s.aiScanMeal}
          defaultMeal={s.aiScanMeal || 'lunch'}
          onLogMeal={(meal, items) => {
            s.setDailyMeals((prev) => ({
              ...prev,
              [meal]: [...(prev[meal] || []), ...items],
            }));
          }}
          onClose={() => s.setAiScanMeal(null)}
          showToast={s.showToast}
          onOpenPayPlan={(tier) => {
            s.setPayPlanHighlightTier(tier || 'premium');
            s.setIsPayPlanOpen(true);
          }}
        />
      )}

      {/* Client Detail Modal */}
      {s.selectedCoachClient && (
        <ClientDetailModal
          athlete={s.selectedCoachClient}
          onSendFeedback={(msg) => {
            if (s.selectedCoachClient) {
              s.showToast(`Feedback dispatched to ${s.selectedCoachClient.name}!`);
              s.setSelectedCoachClient(null);
            }
          }}
          onApproveProtocol={() => {
            if (s.selectedCoachClient) {
              s.showToast(`Protocol approved for ${s.selectedCoachClient.name}!`);
              s.setSelectedCoachClient(null);
            }
          }}
          onClose={() => s.setSelectedCoachClient(null)}
          onOpenShareClientProgress={(athlete) => {
            s.setSelectedCoachClient(null);
            s.setShareClientProgressAthlete(athlete);
          }}
          showToast={s.showToast}
        />
      )}

      {/* Client Progress Share Modal */}
      {s.shareClientProgressAthlete && (
        <ClientProgressShareModal
          isOpen={!!s.shareClientProgressAthlete}
          onClose={() => s.setShareClientProgressAthlete(null)}
          athlete={s.shareClientProgressAthlete}
          showToast={s.showToast}
        />
      )}

      {/* Profile & Settings Page */}
      {s.isEditProfileOpen && (
        <SettingsPage
          isOpen={s.isEditProfileOpen}
          onClose={() => s.setIsEditProfileOpen(false)}
          onOpenGymNetwork={() => {
            s.setModalOpenedFromSettings(true);
            s.setIsEditProfileOpen(false);
            s.setIsGymNetworkOpen(true);
          }}
          onExportData={s.handleExportData}
          onLogout={s.handleLogout}
          onSaveProfileImage={s.handleUpdateProfileImage}
          onSendFeedback={() => s.showToast('Feedback submitted!', 'success')}
          onOpenPayPlan={(tier) => {
            if (tier === 'coach' || tier === 'premium') s.setPayPlanHighlightTier(tier);
            s.setModalOpenedFromSettings(true);
            s.setIsEditProfileOpen(false);
            s.setIsPayPlanOpen(true);
          }}
          onOpenTravelPass={() => {
            s.setModalOpenedFromSettings(true);
            s.setIsEditProfileOpen(false);
            s.setIsTravelPassOpen(true);
          }}
          onOpenWallpaperSettings={() => {
            s.setModalOpenedFromSettings(true);
            s.setIsEditProfileOpen(false);
            window.dispatchEvent(new CustomEvent('open-wallpaper-settings'));
          }}
          onDeleteAccount={() => {
            s.setIsEditProfileOpen(false);
            s.handleLogout();
          }}
          triggerToast={(msg) => s.showToast(msg)}
        />
      )}

      {/* Rotary Dial or Tactical Numpad Modals (Direct imports) */}
      {s.dialConfig.isOpen && (getInputMethod() === 'dial' ? (
        <RotaryDialModal
          isOpen={s.dialConfig.isOpen}
          type={s.dialConfig.type}
          maxVal={s.dialConfig.maxVal}
          initialVal={s.dialConfig.currentVal}
          onConfirm={s.dialConfig.onConfirm}
          onClose={() => s.setDialConfig((p) => ({ ...p, isOpen: false }))}
        />
      ) : (
        <TacticalNumpadModal
          isOpen={s.dialConfig.isOpen}
          type={s.dialConfig.type}
          maxVal={s.dialConfig.maxVal}
          initialVal={s.dialConfig.currentVal}
          onConfirm={s.dialConfig.onConfirm}
          onClose={() => s.setDialConfig((p) => ({ ...p, isOpen: false }))}
        />
      ))}

      {/* Export Data Help Modal */}
      {s.isExportHelpOpen && (
        <ExportHelpModal
          isOpen={s.isExportHelpOpen}
          onClose={() => s.setIsExportHelpOpen(false)}
          showToast={s.showToast}
          onOpenPayPlan={(tier) => {
            s.setPayPlanHighlightTier(tier || 'premium');
            s.setIsPayPlanOpen(true);
          }}
        />
      )}

      {/* Gym Network Modal */}
      {s.isGymNetworkOpen && (
        <GymNetworkModal
          isOpen={s.isGymNetworkOpen}
          onClose={() => {
            s.setIsGymNetworkOpen(false);
            if (s.modalOpenedFromSettings) {
              s.setModalOpenedFromSettings(false);
              s.setIsEditProfileOpen(true);
            }
          }}
          currentUserEmail={s.currentUserEmail}
          currentUserName={s.athleteName}
          currentUserAvatar={s.profileImage}
          showToast={s.showToast}
          onOpenPayPlan={(tier) => {
            if (tier === 'coach' || tier === 'premium') s.setPayPlanHighlightTier(tier);
            s.setIsPayPlanOpen(true);
          }}
        />
      )}

      {/* Buddy Radar Modal */}
      {s.isBuddyRadarOpen && (
        <BuddyRadarEngine
          isOpen={s.isBuddyRadarOpen}
          onClose={() => s.setIsBuddyRadarOpen(false)}
          currentUserEmail={s.currentUserEmail}
          showToast={s.showToast}
          onOpenPayPlan={(tier) => {
            if (tier === 'coach' || tier === 'premium') s.setPayPlanHighlightTier(tier);
            s.setIsPayPlanOpen(true);
          }}
        />
      )}

      {/* Own Profile Card */}
      {s.isOwnProfileOpen && s.currentUserId && (
        <AthleteProfileCard
          userId={s.currentUserId}
          userName={s.athleteName || s.currentUserEmail?.split('@')[0] || 'You'}
          userAvatar={s.profileImage}
          handle={handle}
          isOwnProfile={true}
          onClose={() => s.setIsOwnProfileOpen(false)}
          showToast={s.showToast}
        />
      )}

      {/* Tandem Partner Floating Panel */}
      {s.showTandemPanel && (
        <div className="fixed inset-0 z-[300] bg-[#FFFFFF] dark:bg-[#0A0A0C] overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#FFFFFF]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[rgba(0,0,0,0.08)] dark:border-white/5">
            <button
              onClick={() => s.setShowTandemPanel(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-white">Partner Activity</span>
          </div>
          <TandemView theme={s.theme} showToast={s.showToast} currentUserEmail={s.currentUserEmail} />
        </div>
      )}

      {/* Pay Plan Hub Modal */}
      {s.isPayPlanOpen && (
        <PayPlanHubModal
          isOpen={s.isPayPlanOpen}
          onClose={() => {
            s.setIsPayPlanOpen(false);
            if (s.modalOpenedFromSettings) {
              s.setModalOpenedFromSettings(false);
              s.setIsEditProfileOpen(true);
            }
          }}
          defaultTier={s.payPlanHighlightTier}
          showToast={s.showToast}
        />
      )}

      {/* Travel Pass Modal */}
      {s.isTravelPassOpen && (
        <TravelPassModal
          isOpen={s.isTravelPassOpen}
          onClose={() => {
            s.setIsTravelPassOpen(false);
            if (s.modalOpenedFromSettings) {
              s.setModalOpenedFromSettings(false);
              s.setIsEditProfileOpen(true);
            }
          }}
          onOpenPayPlan={(tier) => {
            if (tier === 'coach' || tier === 'premium') s.setPayPlanHighlightTier(tier);
            s.setIsPayPlanOpen(true);
          }}
          showToast={s.showToast}
        />
      )}

      {/* Shareable Goal Card Modal */}
      {s.isShareModalOpen && (
        <ShareableGoalCardModal
          isOpen={s.isShareModalOpen}
          onClose={() => s.setIsShareModalOpen(false)}
          showToast={s.showToast}
          athleteName={s.athleteName}
        />
      )}

      {/* Community Hub Modal */}
      {s.isCommunityHubOpen && (
        <CommunityHubModal
          isOpen={s.isCommunityHubOpen}
          onClose={() => s.setIsCommunityHubOpen(false)}
          onOpenShareModal={() => s.setIsShareModalOpen(true)}
        />
      )}

      {/* Swipeable Media Viewer */}
      {s.isVaultViewerOpen && (
        <SwipeableMediaViewer
          isOpen={s.isVaultViewerOpen}
          onClose={() => s.setIsVaultViewerOpen(false)}
          items={s.buildVaultMediaItems()}
          startIndex={s.vaultViewerIndex}
          ownerName={s.athleteName}
        />
      )}

      {/* Cycle Sync Modal */}
      {s.isCycleSyncOpen && (
        <CycleSyncModal
          isOpen={s.isCycleSyncOpen}
          onClose={() => s.setIsCycleSyncOpen(false)}
          showToast={s.showToast}
          currentUserEmail={s.currentUserEmail || 'athlete@o1fc.app'}
        />
      )}

      {/* Global Search Modal */}
      {s.isGlobalSearchOpen && (
        <GlobalSearchModal
          isOpen={s.isGlobalSearchOpen}
          onClose={() => s.setIsGlobalSearchOpen(false)}
          showToast={s.showToast}
          onNavigate={s.handleModeChange}
          quickActions={
            [
              {
                id: 'qa_profile',
                label: 'Profile & Settings',
                description: 'Edit your profile, theme, notifications, billing',
                icon: <Settings className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: [
                  'settings',
                  'profile',
                  'theme',
                  'dark mode',
                  'notifications',
                  'billing',
                  'account',
                  'preferences',
                  'wallpaper',
                  'gym',
                ],
                action: () => s.setIsEditProfileOpen(true),
              },
              {
                id: 'qa_gym_network',
                label: 'Gym Network',
                description: 'Find training partners and gym buddies nearby',
                icon: <Dumbbell className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: [
                  'gym',
                  'network',
                  'buddies',
                  'partners',
                  'nearby',
                  'connections',
                  'friends',
                ],
                action: () => s.setIsGymNetworkOpen(true),
              },
              {
                id: 'qa_community',
                label: 'Community Hub',
                description: 'Social feed, posts, and community updates',
                icon: <Globe className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: ['community', 'social', 'feed', 'posts', 'hub', 'share', 'network'],
                action: () => s.setIsCommunityHubOpen(true),
              },
              {
                id: 'qa_payplan',
                label: 'Membership & Pay Plan',
                description: 'View subscription tiers and billing',
                icon: <CreditCard className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: [
                  'pay',
                  'plan',
                  'membership',
                  'billing',
                  'subscription',
                  'premium',
                  'coach',
                  'upgrade',
                  'pricing',
                ],
                action: () => s.setIsPayPlanOpen(true),
              },
              {
                id: 'qa_travel',
                label: 'Travel Network Pass',
                description: 'Set travel dates and connect with athletes worldwide',
                icon: <Plane className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: ['travel', 'pass', 'global', 'destination', 'trip', 'abroad', 'worldwide'],
                action: () => s.setIsTravelPassOpen(true),
              },
              {
                id: 'qa_wallpaper',
                label: 'Wallpaper Settings',
                description: 'Change app background and live landscapes',
                icon: <Image className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: ['wallpaper', 'background', 'theme', 'landscape', 'image', 'photo'],
                action: () => window.dispatchEvent(new CustomEvent('open-wallpaper-settings')),
              },
              {
                id: 'qa_share_goal',
                label: 'Share Goal Card',
                description: 'Create and share your fitness goal card',
                icon: <Share2 className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: ['share', 'goal', 'card', 'social', 'export', 'progress'],
                action: () => s.setIsShareModalOpen(true),
              },
              {
                id: 'qa_cycle_sync',
                label: 'Cycle Sync',
                description: 'Track menstrual cycle and training phase',
                icon: <Moon className="w-4 h-4 text-stone-300" />,
                category: 'quick_action',
                keywords: [
                  'cycle',
                  'menstrual',
                  'period',
                  'hormonal',
                  'phase',
                  'luna',
                  'sync',
                  'bio',
                ],
                action: () => s.setIsCycleSyncOpen(true),
              },
            ] as SearchAction[]
          }
        />
      )}

      {/* AI Coach Insights Modal */}
      {s.isAIInsightsOpen && (
        <AICoachInsightsModal
          isOpen={s.isAIInsightsOpen}
          onClose={() => s.setIsAIInsightsOpen(false)}
          activeLogs={s.activeLogs}
          dailyMeals={s.dailyMeals}
          goalCals={s.goalCals}
          goalP={s.goalP}
          goalC={s.goalC}
          goalF={s.goalF}
          bmr={s.bmr}
          currentUserEmail={s.currentUserEmail || 'athlete@o1fc.app'}
          weeklySchedule={s.weeklySchedule}
          selectedDay={s.selectedDay}
          showToast={s.showToast}
          onOpenPayPlan={(tier) => {
            s.setPayPlanHighlightTier(tier || 'premium');
            s.setIsPayPlanOpen(true);
          }}
        />
      )}

      {/* Coach Showroom Vault */}
      {s.isCoachShowroomOpen && s.coachShowroomData && (
        <MediaVaultModal
          isOpen={s.isCoachShowroomOpen}
          onClose={() => s.setIsCoachShowroomOpen(false)}
          vaultTitle="Coach Showroom"
          ownerName={s.coachShowroomData.maskedName}
          items={s.coachShowroomData.items}
          showToast={s.showToast}
          showroomMode={true}
          maskedName={s.coachShowroomData.maskedName}
          isUnlocked={s.coachShowroomData.isUnlocked}
          realName={s.coachShowroomData.realName}
          socialLinks={s.coachShowroomData.socialLinks}
          programPrice={s.coachShowroomData.programPrice}
          onTestExercise={(item) => {
            injectTrialExercise({
              name: item.title,
              sets: 3,
              reps: '8-12',
              targetLoad: 'Moderate',
              notes: item.coachNote,
            });
            s.setIsCoachShowroomOpen(false);
          }}
          onBuyProgram={() => {
            if (s.coachShowroomData?.program && s.coachShowroomData?.coachEmail) {
              const prog = s.coachShowroomData.program;
              s.setProgramToBuy({
                id: prog.programId,
                title: prog.programTitle,
                description: '',
                category: 'General',
                difficulty: 'Intermediate',
                duration_weeks: prog.durationWeeks,
                price_cents: prog.priceCents,
                cover_image_url: '',
                coach_email: prog.coachEmail,
                program_content: prog.exercises,
              });
            } else {
              if (s.coachShowroomData?.coachEmail) setCoachUnlocked(s.coachShowroomData.coachEmail);
              s.showToast('Coach Hub Unlocked!', 'success');
            }
            s.setIsCoachShowroomOpen(false);
          }}
        />
      )}

      {/* Program Purchase Modal */}
      {s.programToBuy && (
        <ProgramPurchaseModal
          program={s.programToBuy}
          currentUserEmail={s.currentUserEmail}
          onClose={() => s.setProgramToBuy(null)}
          onPurchased={() => {
            if (s.coachShowroomData?.coachEmail)
              setCoachUnlocked(s.coachShowroomData.coachEmail);
            s.setCoachShowroomData((prev) => (prev ? { ...prev, isUnlocked: true } : prev));
            s.showToast(
              'Program purchased and enrolled! Workouts will be delivered on your schedule.',
              'success'
            );
            s.setProgramToBuy(null);
          }}
        />
      )}

      {/* Reminder Manager Modal */}
      {s.showReminderManager && (
        <ReminderManager
          isOpen={s.showReminderManager}
          onClose={() => s.setShowReminderManager(false)}
          currentUserEmail={s.currentUserEmail}
          showToast={s.showToast}
        />
      )}
      </Suspense>
    </div>
  );
}
