import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useModalStore } from '../../../components/modals/useModalStore';
import { fetchMyApplication, submitApplication } from '../../reels/services/coachStorefront';
import { NearbyCoach, coachDistanceLabel, coachPriceLabel } from '../services/coachesNearby';
import { CoachPill } from './CoachesNearbyStrip';

type IntroState = 'idle' | 'sending' | 'sent' | 'pending' | 'accepted';

interface CoachNearbySheetProps {
  coach: NearbyCoach | null;
  viewerId: string;
  viewerName: string;
  onClose: () => void;
  onToast: (message: string) => void;
}

/** A coach from the Buddy strip: their offer, a one-tap free intro request, and their full profile. */
export const CoachNearbySheet: React.FC<CoachNearbySheetProps> = ({ coach, viewerId, viewerName, onClose, onToast }) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const [intro, setIntro] = useState<IntroState>('idle');

  useEffect(() => {
    setIntro('idle');
    if (!coach || coach.id === viewerId) return;
    let live = true;
    void fetchMyApplication(coach.id).then((row) => {
      if (!live || !row) return;
      if (row.status === 'pending') setIntro('pending');
      else if (row.status === 'accepted') setIntro('accepted');
    });
    return () => {
      live = false;
    };
  }, [coach, viewerId]);

  if (!coach) return null;
  const isSelf = coach.id === viewerId;
  const stats = [
    { label: coach.reviewCount > 0 ? `${coach.reviewCount} reviews` : 'Rating', value: coach.rating != null ? `★ ${coach.rating.toFixed(1)}` : '--' },
    { label: 'Years', value: coach.years != null ? String(coach.years) : '--' },
    { label: 'Spots', value: !coach.accepting ? 'Full' : coach.capacity != null ? String(coach.capacity) : '--' },
  ];
  const where = [coach.gym, coachDistanceLabel(coach.distanceKm)].filter(Boolean).join(' · ');
  const price = coachPriceLabel(coach.monthlyPriceCents);

  const requestIntro = async () => {
    if (!viewerId) {
      onToast('Sign in to request a session');
      return;
    }
    tactileEngine.triggerImpactPulse();
    setIntro('sending');
    const ok = await submitApplication({
      coachId: coach.id,
      coachName: coach.name,
      coachHandle: coach.handle,
      coachAvatar: coach.photo,
      athleteName: viewerName || 'Athlete',
      intake: { source: 'Buddy radar', gym: coach.gym, discipline: coach.discipline },
      goal: 'Free intro session',
    });
    setIntro(ok ? 'sent' : 'idle');
    onToast(ok ? `Request sent to ${coach.name}` : 'Could not send. Check your connection.');
  };

  const introLabel =
    intro === 'sending' ? 'Sending…'
      : intro === 'sent' || intro === 'pending' ? 'Request sent'
      : intro === 'accepted' ? 'You train with this coach'
      : !coach.accepting ? 'Not taking new clients'
      : 'Free intro session';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 sm:items-center" role="dialog" aria-modal="true" aria-label={`${coach.name}, coach`} onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-t-2xl border border-white/[0.07] bg-o1-sheet p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-o1-surface">
            {coach.photo ? <img src={coach.photo} alt="" className="h-full w-full object-cover" /> : null}
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-[16px] font-semibold text-o1-text">{coach.name}</h2>
              <CoachPill />
            </div>
            {coach.handle ? <p className="truncate text-[12px] text-o1-muted">{coach.handle.startsWith('@') ? coach.handle : `@${coach.handle}`}</p> : null}
            {coach.discipline ? <p className="text-[13px] text-o1-text">{coach.discipline}</p> : null}
            {where ? <p className="truncate text-[12px] text-o1-muted">{where}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-o1-muted active:scale-95">
            <X size={16} />
          </button>
        </div>

        <dl className="grid grid-cols-3 gap-1.5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-o1-surface px-2 py-2 text-center">
              <dd className="text-[14px] font-semibold tabular-nums text-o1-text">{stat.value}</dd>
              <dt className="text-[10px] text-o1-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
        {price ? <p className="text-center text-[12px] text-o1-muted">{price}</p> : null}

        <div className="space-y-2">
          {!isSelf ? (
            <button
              type="button"
              disabled={intro !== 'idle' || !coach.accepting}
              onClick={() => void requestIntro()}
              className="h-[48px] w-full rounded-xl bg-o1-crimson text-[14px] font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            >
              {introLabel}
            </button>
          ) : (
            <p className="text-center text-[12px] text-o1-muted">This is how athletes nearby see you.</p>
          )}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
              openFullEliteReels({ initialMode: 'grid', initialCoachId: coach.id });
            }}
            className="h-[44px] w-full rounded-xl border border-white/[0.07] bg-o1-surface text-[13px] font-semibold text-o1-text active:scale-[0.98]"
          >
            View full profile
          </button>
        </div>
      </div>
    </div>
  );
};
