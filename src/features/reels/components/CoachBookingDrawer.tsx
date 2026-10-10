import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Grid3x3, Layers, MessageCircle, Play, Share2, X } from 'lucide-react';
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
  saveStorefront,
  setFollowing,
  submitApplication,
} from '../services/coachStorefront';
import { coachUrl, shareLink } from '../services/reelLinks';
import { ShareLinkSheet, ShareLinkTarget } from './ShareLinkSheet';
import { fetchMyPrograms } from '../../coach/services/myPrograms';
import { CoachProgramsTab } from './profile/CoachProgramsTab';
import { CoachConsultTab } from './profile/CoachConsultTab';

export interface CoachBookingDrawerProps {
  coach: ExploreCoach | null;
  initialTab?: ProfileTab;
  onClose: () => void;
  onSelectReel?: (reel: ExploreReelItem, coachReels: ExploreReelItem[]) => void;
  onMessageCoach?: (coach: ExploreCoach) => void;
}

export type ProfileTab = 'reels' | 'programs' | 'coaching';

function compact(value: number | null): string {
  if (value == null) return '--';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

function wholeOrNull(raw: string): number | null {
  const n = Number(raw);
  return raw.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export const CoachBookingDrawer: React.FC<CoachBookingDrawerProps> = ({ coach, initialTab, onClose, onSelectReel, onMessageCoach }) => {
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
  const [draft, setDraft] = useState({ years: '', capacity: '', monthly: '' });

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

  const share = async () => {
    tactileEngine.triggerLightTick();
    const target = {
      title: coach.name,
      text: [coach.name, coach.specialtyTitle].filter(Boolean).join(' \u00b7 '),
      url: coachUrl(coach.id),
    };
    if ((await shareLink(target)) === 'options') setLinkSheet(target);
  };

  const startEdit = () => {
    setDraft({
      years: stats.years != null ? String(stats.years) : '',
      capacity: stats.capacity != null ? String(stats.capacity) : '',
      monthly: stats.monthlyPriceCents != null ? String(stats.monthlyPriceCents / 100) : '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const years = wholeOrNull(draft.years);
    const capacity = wholeOrNull(draft.capacity);
    const monthlyRaw = Number(draft.monthly);
    const monthlyPriceCents = draft.monthly.trim() && Number.isFinite(monthlyRaw) && monthlyRaw >= 0 ? Math.round(monthlyRaw * 100) : null;
    const ok = await saveStorefront({ years, capacity, monthlyPriceCents });
    if (!ok) {
      flash('Could not save');
      return;
    }
    setStats((prev) => ({ ...prev, years, capacity, monthlyPriceCents }));
    setEditing(false);
    flash('Profile saved');
  };

  const tabs: { id: ProfileTab; label: string; icon: typeof Grid3x3 }[] = [
    { id: 'reels', label: 'Reels', icon: Grid3x3 },
    { id: 'programs', label: 'Programs', icon: Layers },
    { id: 'coaching', label: 'Coaching', icon: MessageCircle },
  ];

  return (
    <div id="coach-athletic-dossier-modal" className="fixed inset-0 z-50 flex flex-col bg-black text-[#EAE8DF] select-none animate-in fade-in duration-200">
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
        <div className="mx-auto w-full max-w-xl px-4">
          <div className="flex items-center gap-5 pt-2">
            <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#1F1F1F] bg-[#0E0E0E]">
              {coach.avatar ? (
                <img src={coach.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-semibold">{coach.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="grid flex-1 grid-cols-3 text-center">
              <div>
                <p className="tabular-nums text-[17px] font-semibold">{compact(stats.followers)}</p>
                <p className="text-[11px] text-[#8A887F]">Followers</p>
              </div>
              <div>
                <p className="tabular-nums text-[17px] font-semibold">{stats.years != null ? `${stats.years}` : '--'}</p>
                <p className="text-[11px] text-[#8A887F]">Years coaching</p>
              </div>
              <div>
                <p className="tabular-nums text-[17px] font-semibold">{stats.rating != null ? `★ ${stats.rating.toFixed(1)}` : '--'}</p>
                <p className="text-[11px] text-[#8A887F]">{stats.reviewCount > 0 ? `${stats.reviewCount} reviews` : 'Rating'}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-0.5">
            <p className="flex items-center gap-1 text-[15px] font-semibold">
              {coach.name}
              {coach.verified ? <BadgeCheck size={16} className="text-[#0284c7]" aria-label="Verified" /> : null}
            </p>
            {coach.specialtyTitle ? <p className="text-[13px] text-[#8A887F]">{coach.specialtyTitle}</p> : null}
            {coach.bio ? <p className="line-clamp-3 pt-1 text-[13px] leading-snug">{coach.bio}</p> : null}
          </div>

          {isOwn ? (
            editing ? (
              <div className="mt-3 space-y-2 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-3">
                {([
                  ['years', 'Years coaching'],
                  ['capacity', 'Athlete spots'],
                  ['monthly', 'Monthly price (USD)'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-[#8A887F]">{label}</span>
                    <input
                      inputMode="decimal"
                      value={draft[key]}
                      onChange={(event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }))}
                      className="h-[44px] w-28 rounded-xl border border-[#1F1F1F] bg-black px-3 text-right text-[13px] outline-none focus:border-[#C4121A]"
                    />
                  </label>
                ))}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditing(false)} className="h-[44px] flex-1 rounded-xl border border-[#1F1F1F] text-[13px] font-semibold">
                    Cancel
                  </button>
                  <button type="button" onClick={() => void saveEdit()} className="h-[44px] flex-1 rounded-xl bg-white text-[13px] font-semibold text-neutral-950">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={startEdit} className="mt-3 h-[44px] w-full rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] text-[13px] font-semibold active:scale-[0.98]">
                Edit profile
              </button>
            )
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void toggleFollow()}
                className={`h-[44px] flex-1 rounded-xl text-[13px] font-semibold active:scale-[0.98] ${stats.following ? 'border border-[#1F1F1F] bg-[#0E0E0E] text-[#EAE8DF]' : 'bg-white text-neutral-950'}`}
              >
                {stats.following ? 'Following' : 'Follow'}
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onMessageCoach?.(coach);
                }}
                className="h-[44px] flex-1 rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] text-[13px] font-semibold active:scale-[0.98]"
              >
                Message
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-xl border-b border-[#1F1F1F]">
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
                className={`flex h-11 flex-1 items-center justify-center gap-1.5 border-b-2 text-[12px] font-semibold ${on ? 'border-white text-white' : 'border-transparent text-[#8A887F]'}`}
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
              <p className="py-10 text-center text-[13px] text-[#8A887F]">No reels yet.</p>
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
                    className="relative aspect-[3/4] overflow-hidden bg-[#0E0E0E] active:scale-[0.98]"
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
