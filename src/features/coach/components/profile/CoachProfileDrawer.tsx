import React, { useEffect, useRef, useState } from 'react';
import { Layers, MessageCircle, Share2, X } from 'lucide-react';
import { ExploreCoach } from '../../coachTypes';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { tactileEngine } from '../../../../services/tactileEngine';
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
} from '../../services/coachStorefront';
import { coachUrl, shareLink } from '../../services/coachLinks';
import { ShareLinkSheet, ShareLinkTarget } from '../ShareLinkSheet';
import { fetchMyPrograms } from '../../services/myPrograms';
import { CoachProgramsTab } from './CoachProgramsTab';
import { CoachConsultTab } from './CoachConsultTab';
import {
  CoachProfileHeader,
  ProfileActionButton,
  compactCount,
  ratingLabel,
} from './CoachProfileHeader';
import { StorefrontEditor } from './StorefrontEditor';
import type { CoachConsoleAction } from '../../services/coachConsoleBus';
import {
  markCheckoutPending,
  stripeConnectService,
} from '../../../../services/stripeConnectService';
import { Capacitor } from '@capacitor/core';

const NATIVE_APP = Capacitor.isNativePlatform();

export interface CoachProfileDrawerProps {
  coach: ExploreCoach | null;
  initialTab?: ProfileTab;
  onClose: () => void;
  onMessageCoach?: (coach: ExploreCoach) => void;
  /** Own profile only: jump to the Coach console's program builder or workout dispatch. */
  onOpenConsole?: (action: CoachConsoleAction) => void;
}

export type ProfileTab = 'programs' | 'coaching';

export const CoachProfileDrawer: React.FC<CoachProfileDrawerProps> = ({
  coach,
  initialTab,
  onClose,
  onMessageCoach,
  onOpenConsole,
}) => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<ProfileTab>('programs');
  const [stats, setStats] = useState<StorefrontStats>(EMPTY_STATS);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [application, setApplication] = useState<CoachingApplication | null>(null);
  const [applyProgram, setApplyProgram] = useState<StorefrontProgram | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkingOut = useRef(false);
  const [linkSheet, setLinkSheet] = useState<ShareLinkTarget | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState(false);

  const coachId = coach?.id || '';
  const isOwn = Boolean(user?.id && user.id === coachId);

  useEffect(() => {
    if (!coachId) return;
    let live = true;
    setTab(initialTab ?? 'programs');
    setStats(EMPTY_STATS);
    setPrograms(null);
    setApplication(null);
    setApplyProgram(null);
    setEditing(false);
    setLinkSheet(null);
    const failed = (what: string) => (error: unknown) => {
      console.warn(`[CoachProfile] Could not load ${what}`, error);
      if (live) setToast(`Could not load ${what}. Check your connection.`);
    };
    void fetchStorefrontStats(coachId)
      .then((next) => live && setStats(next))
      .catch(failed('profile stats'));
    void fetchStorefrontPrograms(coachId)
      .then((next) => live && setPrograms(next))
      .catch((error: unknown) => {
        failed('programs')(error);
        if (live) setPrograms([]);
      });
    void fetchMyApplication(coachId)
      .then((next) => live && setApplication(next))
      .catch(failed('your application'));
    setEnrolledIds(new Set());
    void fetchMyPrograms()
      .then(
        (mine) =>
          live &&
          setEnrolledIds(
            new Set((mine ?? []).filter((p) => p.status === 'active').map((p) => p.id)),
          ),
      )
      .catch(failed('your programs'));
    return () => {
      live = false;
    };
  }, [coachId, initialTab]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  if (!coach) return null;

  const flash = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const athleteName = () => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const email = profile?.email || user?.email || '';
    return (
      profile?.name ||
      (typeof meta.full_name === 'string' ? meta.full_name : '') ||
      (email.includes('@') ? email.split('@')[0] : '')
    );
  };

  const toggleFollow = async () => {
    tactileEngine.triggerSelectionBuzz();
    const next = !stats.following;
    setStats((prev) => ({
      ...prev,
      following: next,
      followers:
        prev.followers == null ? prev.followers : Math.max(0, prev.followers + (next ? 1 : -1)),
    }));
    const ok = await setFollowing(coach.id, next);
    if (!ok) {
      setStats((prev) => ({
        ...prev,
        following: !next,
        followers:
          prev.followers == null ? prev.followers : Math.max(0, prev.followers + (next ? -1 : 1)),
      }));
      flash('Sign in to follow coaches');
    }
  };

  const checkout = async (input: { kind: 'program' | 'coaching'; programId?: string }) => {
    if (checkingOut.current) return;
    checkingOut.current = true;
    try {
      const res = await stripeConnectService.createCheckout({
        ...input,
        coachId: coach.id,
        athleteName: athleteName(),
      });
      if (res.url) {
        // On the phone Stripe opens in the browser, so the app only learns of the payment when it returns.
        markCheckoutPending();
        window.location.assign(res.url);
        return;
      }
      flash(res.error || 'Could not start checkout');
    } finally {
      checkingOut.current = false;
    }
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

  const tabs: { id: ProfileTab; label: string; icon: typeof Layers }[] = [
    { id: 'programs', label: 'Programs', icon: Layers },
    { id: 'coaching', label: 'Coaching', icon: MessageCircle },
  ];

  return (
    <div
      id="coach-athletic-dossier-modal"
      className="fixed inset-0 z-50 flex flex-col bg-o1-canvas text-o1-text select-none animate-in fade-in duration-200"
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-1 pt-safe">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center"
          aria-label="Close profile"
        >
          <X size={20} />
        </button>
        <span className="truncate text-o1-control font-semibold">{coach.handle}</span>
        <button
          type="button"
          onClick={() => void share()}
          className="flex h-11 w-11 items-center justify-center"
          aria-label="Share profile"
        >
          <Share2 size={18} />
        </button>
      </div>

      {toast && (
        <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+4rem)] z-10 -translate-x-1/2 rounded-full border border-white/[0.07] bg-o1-sheet px-4 py-2 text-o1-caption font-semibold text-o1-text">
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
            onEdit={isOwn && !editing ? () => setEditing(true) : undefined}
            stats={[
              { label: 'Followers', value: compactCount(stats.followers) },
              isOwn
                ? {
                    label: 'Clients',
                    value: stats.athletes != null ? String(stats.athletes) : '--',
                  }
                : {
                    label: 'Years coaching',
                    value: stats.years != null ? String(stats.years) : '--',
                  },
              {
                label: stats.reviewCount > 0 ? `${stats.reviewCount} reviews` : 'Rating',
                value: ratingLabel(stats.rating),
              },
            ]}
            actions={
              isOwn ? (
                <>
                  <ProfileActionButton
                    label="Program"
                    onPress={() => onOpenConsole?.('programs')}
                  />
                  <ProfileActionButton
                    label="Daily Dispatch"
                    primary
                    onPress={() => onOpenConsole?.('dispatch')}
                  />
                </>
              ) : (
                <>
                  <ProfileActionButton
                    label={stats.following ? 'Following' : 'Follow'}
                    primary={!stats.following}
                    onPress={() => void toggleFollow()}
                  />
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
                className={`flex h-11 flex-1 items-center justify-center gap-1.5 border-b-2 text-o1-caption font-semibold ${on ? 'border-white text-white' : 'border-transparent text-o1-muted'}`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-xl">
          {tab === 'programs' && (
            <div className="px-4">
              <CoachProgramsTab
                programs={programs}
                enrolledIds={enrolledIds}
                isOwn={isOwn}
                onCreate={isOwn ? () => onOpenConsole?.('programs') : undefined}
                onEnroll={(program) => {
                  const owner = {
                    id: coach.id,
                    name: coach.name,
                    handle: coach.handle,
                    avatar: coach.avatar,
                  };
                  void enrollInProgram(owner, program).then((result) => {
                    if (result === 'enrolled') {
                      setEnrolledIds((prev) => new Set(prev).add(program.id));
                      flash('Added to My programs on your Coach tab');
                    } else {
                      flash(
                        result === 'signed-out'
                          ? 'Sign in to enroll'
                          : 'Could not enroll. Try again.',
                      );
                    }
                  });
                }}
                onApply={(program) => {
                  setApplyProgram(program);
                  setTab('coaching');
                }}
                showPrices={!NATIVE_APP}
                onBuy={
                  isOwn || NATIVE_APP
                    ? undefined
                    : (program) => checkout({ kind: 'program', programId: program.id })
                }
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
