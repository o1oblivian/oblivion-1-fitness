import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Grid3x3, Layers, MessageCircle, Play, Share2, X } from 'lucide-react';
import { ExploreCoach, ExploreReelItem } from '../reelTypes';
import { useReelsStore } from '../../../stores/useReelsStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { nextReelCover, reelCover } from '../coverPresets';
import {
  CoachingApplication,
  EMPTY_STATS,
  StorefrontProgram,
  StorefrontStats,
  enrollInProgram,
  fetchMyApplication,
  fetchStorefrontPrograms,
  fetchStorefrontStats,
  setFollowing,
  submitApplication,
} from '../services/coachStorefront';
import { coachUrl, shareLink } from '../services/reelLinks';
import { ShareLinkSheet, ShareLinkTarget } from './ShareLinkSheet';
import { fetchMyPrograms } from '../../coach/services/myPrograms';
import { CoachProgramsTab } from './profile/CoachProgramsTab';
import { CoachConsultTab } from './profile/CoachConsultTab';
import { CoachProfileHeader, ProfileActionButton, compactCount, ratingLabel } from '../../coach/components/profile/CoachProfileHeader';
import { StorefrontEditor } from '../../coach/components/profile/StorefrontEditor';
import type { CoachConsoleAction } from '../../coach/services/coachConsoleBus';
import { stripeConnectService } from '../../../services/stripeConnectService';

export interface CoachBookingDrawerProps {
  coach: ExploreCoach | null;
  initialTab?: ProfileTab;
  onClose: () => void;
  onSelectReel?: (reel: ExploreReelItem, coachReels: ExploreReelItem[]) => void;
  onMessageCoach?: (coach: ExploreCoach) => void;
  /** Own profile only: jump to the Coach console's program builder or workout dispatch. */
  onOpenConsole?: (action: CoachConsoleAction) => void;
}

export type ProfileTab = 'reels' | 'programs' | 'coaching';

export const CoachBookingDrawer: React.FC<CoachBookingDrawerProps> = ({ coach, initialTab, onClose, onSelectReel, onMessageCoach, onOpenConsole }) => {
  const reels = useReelsStore((s) => s.reels);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<ProfileTab>('reels');
  const [stats, setStats] = useState<StorefrontStats>(EMPTY_STATS);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [application, setApplication] = useState<CoachingApplication | null>(null);
  const [applyProgram, setApplyProgram] = useState<StorefrontProgram | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [linkSheet, setLinkSheet] = useState<ShareLinkTarget | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState(false);

  const coachId = coach?.id || '';
  const isOwn = Boolean(user?.id && user.id === coachId);
  const coachReels = useMemo(() => reels.filter((reel) => reel.coach?.id === coachId), [reels, coachId]);

  useEffect(() => {
    if (!coachId) return;
    let live = true;
    setTab(initialTab ?? 'reels');
    setStats(EMPTY_STATS);
    setPrograms(null);
    setApplication(null);
    setApplyProgram(null);
    setEditing(false);
    setLinkSheet(null);
    void fetchStorefrontStats(coachId).then((next) => live && setStats(next)).catch(() => undefined);
    void fetchStorefrontPrograms(coachId).then((next) => live && setPrograms(next)).catch(() => live && setPrograms([]));
    void fetchMyApplication(coachId).then((next) => live && setApplication(next)).catch(() => undefined);
    setEnrolledIds(new Set());
    void fetchMyPrograms()
      .then((mine) => live && setEnrolledIds(new Set((mine ?? []).filter((p) => p.status === 'active').map((p) => p.id))))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [coachId]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  if (!coach) return null;

  const flash = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const athleteName = () => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const email = profile?.email || user?.email || '';
    return profile?.name || (typeof meta.full_name === 'string' ? meta.full_name : '') || (email.includes('@') ? email.split('@')[0] : '');
  };

  const toggleFollow = async () => {
    tactileEngine.triggerSelectionBuzz();
    const next = !stats.following;
    setStats((prev) => ({ ...prev, following: next, followers: prev.followers == null ? prev.followers : Math.max(0, prev.followers + (next ? 1 : -1)) }));
    const ok = await setFollowing(coach.id, next);
    if (!ok) {
      setStats((prev) => ({ ...prev, following: !next, followers: prev.followers == null ? prev.followers : Math.max(0, prev.followers + (next ? -1 : 1)) }));
      flash('Sign in to follow coaches');
    }
  };

  const checkout = async (input: { kind: 'program' | 'coaching'; programId?: string }) => {
    const res = await stripeConnectService.createCheckout({ ...input, coachId: coach.id, athleteName: athleteName() });
    if (res.url) {
      window.location.assign(res.url);
      return;
    }
    flash(res.error || 'Could not start checkout');
  };

  const share = async () => {
    tactileEngine.triggerLightTick();
    const target = {
      title: coach.name,
      text: [coach.name, coach.specialtyTitle].filter(Boolean).join(' \u00b7 '),
      url: coachUrl(coach.id),
    };
    if ((await shareLink(target)) === 'options') setLinkSheet(target);
  };

  const tabs: { id: ProfileTab; label: string; icon: typeof Grid3x3 }[] = [
    { id: 'reels', label: 'Reels', icon: Grid3x3 },
    { id: 'programs', label: 'Programs', icon: Layers },
    { id: 'coaching', label: 'Coaching', icon: MessageCircle },
  ];

  return (
    <div id="coach-athletic-dossier-modal" className="fixed inset-0 z-50 flex flex-col bg-o1-canvas text-o1-text select-none animate-in fade-in duration-200">
      <div className="flex h-14 shrink-0 items-center justify-between px-1 pt-safe">
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center" aria-label="Close profile">
          <X size={20} />
        </button>
        <span className="truncate text-[14px] font-semibold">{coach.handle}</span>
        <button type="button" onClick={() => void share()} className="flex h-11 w-11 items-center justify-center" aria-label="Share profile">
          <Share2 size={18} />
        </button>
      </div>

      {toast && (
        <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+4rem)] z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-neutral-950">
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto w-full max-w-xl space-y-3 px-4 pt-2">
          <CoachProfileHeader
            name={coach.name}
            handle={coach.handle}
            avatar={coach.avatar}
            specialty={coach.specialtyTitle}
            bio={coach.bio}
            verified={coach.verified}
            hasStory={coachReels.length > 0}
            onAvatarPress={coachReels.length > 0 ? () => onSelectReel?.(coachReels[0], coachReels) : undefined}
            onEdit={isOwn && !editing ? () => setEditing(true) : undefined}
            stats={[
              { label: 'Followers', value: compactCount(stats.followers) },
              isOwn
                ? { label: 'Clients', value: stats.athletes != null ? String(stats.athletes) : '--' }
                : { label: 'Years coaching', value: stats.years != null ? String(stats.years) : '--' },
              { label: stats.reviewCount > 0 ? `${stats.reviewCount} reviews` : 'Rating', value: ratingLabel(stats.rating) },
            ]}
            actions={
              isOwn ? (
                <>
                  <ProfileActionButton label="Program" onPress={() => onOpenConsole?.('programs')} />
                  <ProfileActionButton label="Daily Dispatch" primary onPress={() => onOpenConsole?.('dispatch')} />
                </>
              ) : (
                <>
                  <ProfileActionButton label={stats.following ? 'Following' : 'Follow'} primary={!stats.following} onPress={() => void toggleFollow()} />
                  <ProfileActionButton label="Message" onPress={() => onMessageCoach?.(coach)} />
                </>
              )
            }
          />
          {editing ? (
            <StorefrontEditor
              stats={stats}
              onCancel={() => setEditing(false)}
              onError={flash}
              onSaved={(next) => {
                setStats((prev) => ({ ...prev, ...next }));
                setEditing(false);
                flash('Profile saved');
              }}
            />
          ) : null}
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-xl border-b border-white/[0.07]">
          {tabs.map((item) => {
            const Icon = item.icon;
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setTab(item.id);
                }}
                className={`flex h-11 flex-1 items-center justify-center gap-1.5 border-b-2 text-[12px] font-semibold ${on ? 'border-white text-white' : 'border-transparent text-o1-muted'}`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-xl">
          {tab === 'reels' && (
            coachReels.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-o1-muted">No reels yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 pt-0.5">
                {coachReels.map((reel) => (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      onSelectReel?.(reel, coachReels);
                    }}
                    className="relative aspect-[3/4] overflow-hidden bg-o1-surface active:scale-[0.98]"
                    aria-label={reel.title}
                  >
                    <img
                      src={reelCover(reel.id, reel.thumbnail)}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.dataset.cover === '1') return;
                        img.dataset.cover = '1';
                        img.src = nextReelCover(img.src);
                      }}
                    />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <Play size={14} className="pointer-events-none absolute bottom-1.5 left-1.5 fill-white text-white drop-shadow" />
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'programs' && (
            <div className="px-4">
              <CoachProgramsTab
                programs={programs}
                enrolledIds={enrolledIds}
                isOwn={isOwn}
                onCreate={isOwn ? () => onOpenConsole?.('programs') : undefined}
                onEnroll={(program) => {
                  const owner = { id: coach.id, name: coach.name, handle: coach.handle, avatar: coach.avatar };
                  void enrollInProgram(owner, program).then((result) => {
                    if (result === 'enrolled') {
                      setEnrolledIds((prev) => new Set(prev).add(program.id));
                      flash('Added to My programs on your Coach tab');
                    } else {
                      flash(result === 'signed-out' ? 'Sign in to enroll' : 'Could not enroll. Try again.');
                    }
                  });
                }}
                onApply={(program) => {
                  setApplyProgram(program);
                  setTab('coaching');
                }}
                onBuy={isOwn ? undefined : (program) => checkout({ kind: 'program', programId: program.id })}
              />
            </div>
          )}

          {tab === 'coaching' && (
            <div className="px-4">
              <CoachConsultTab
                coach={coach}
                stats={stats}
                application={application}
                program={applyProgram}
                isOwn={isOwn}
                onClearProgram={() => setApplyProgram(null)}
                onPay={() => checkout({ kind: 'coaching' })}
                onMessage={() => onMessageCoach?.(coach)}
                onSubmit={async (goal, intake) => {
                  const ok = await submitApplication({
                    coachId: coach.id,
                    coachName: coach.name,
                    coachHandle: coach.handle,
                    coachAvatar: coach.avatar,
                    athleteName: athleteName(),
                    intake,
                    goal,
                    programId: applyProgram?.id,
                  });
                  if (!ok) {
                    flash('Sign in to apply');
                    return;
                  }
                  setApplyProgram(null);
                  setApplication(await fetchMyApplication(coach.id));
                  flash('Application sent');
                }}
              />
            </div>
          )}
        </div>
      </div>
      <ShareLinkSheet link={linkSheet} onClose={() => setLinkSheet(null)} />
    </div>
  );
};
