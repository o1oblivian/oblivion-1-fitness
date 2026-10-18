import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, Flag } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { SafetyReportSheet } from '../../../components/common/SafetyReportSheet';
import {
  REEL_REPORT_REASONS,
  useReelSafetyStore,
  type ReportOutcome,
} from '../services/reelSafety';
import type { ExploreReelItem } from '../reelTypes';
import { isClubCoach } from '../clubReels';

type Step = 'menu' | 'report' | 'block' | 'done';

const REPORT_TEXT: Record<ReportOutcome | 'pending', string> = {
  pending: 'Sending your report…',
  sent: 'Report sent. This reel is hidden for you, and the Oblivion 1 team reviews reports within 24 hours.',
  'signed-out': 'This reel is hidden for you. Sign in to send the report to the Oblivion 1 team.',
  failed:
    'This reel is hidden for you, but the report did not send. Check your connection and report it again later.',
};

interface ReelSafetyMenuProps {
  reel: ExploreReelItem;
  open: boolean;
  onClose: () => void;
}

const ROW =
  'flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-white/[0.07] bg-o1-surface px-3 text-left text-o1-control text-o1-text active:bg-white/[0.06] cursor-pointer';

export const ReelSafetyMenu: React.FC<ReelSafetyMenuProps> = ({ reel, open, onClose }) => {
  const reportReel = useReelSafetyStore((s) => s.reportReel);
  const blockCoach = useReelSafetyStore((s) => s.blockCoach);
  const [step, setStep] = useState<Step>('menu');
  const [doneText, setDoneText] = useState('');
  const coachName = reel.coach?.name || 'this coach';

  if (!open) return null;

  const finish = () => {
    setStep('menu');
    setDoneText('');
    onClose();
  };

  if (step === 'report') {
    return createPortal(
      <SafetyReportSheet
        open
        name={coachName}
        title="Report this reel"
        reasons={REEL_REPORT_REASONS}
        onClose={() => setStep((s) => (s === 'report' ? 'menu' : s))}
        onSubmit={(reason, details, alsoBlock) => {
          setDoneText(REPORT_TEXT.pending);
          setStep('done');
          void reportReel(reel, reason, details).then((outcome) =>
            setDoneText(REPORT_TEXT[outcome]),
          );
          if (alsoBlock) void blockCoach(reel.coach.id);
        }}
      />,
      document.body,
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 o1-sheet-scrim"
      onClick={finish}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reel options"
        className="o1-sheet-card w-full max-w-md rounded-t-3xl border border-white/[0.07] bg-o1-sheet px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'menu' && (
          <>
            <button
              type="button"
              className={ROW}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setStep('report');
              }}
            >
              <Flag className="w-4 h-4 text-o1-muted" strokeWidth={1.75} />
              Report reel
            </button>
            {reel.coach?.id && !isClubCoach(reel.coach.id) ? (
              <button
                type="button"
                className={ROW}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setStep('block');
                }}
              >
                <Ban className="w-4 h-4 text-o1-muted" strokeWidth={1.75} />
                Block {coachName}
              </button>
            ) : null}
            <button
              type="button"
              onClick={finish}
              className="w-full h-11 text-o1-body text-o1-muted cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}

        {step === 'block' && (
          <>
            <p className="text-o1-control text-o1-text">Block {coachName}?</p>
            <p className="text-o1-caption text-o1-muted leading-snug">
              You will not see their reels, and they cannot message you. Blocking is private.
            </p>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                void blockCoach(reel.coach.id);
                setDoneText(`${coachName} is blocked. Their reels are hidden.`);
                setStep('done');
              }}
              className="w-full h-11 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover text-o1-control text-white cursor-pointer"
            >
              Block
            </button>
            <button
              type="button"
              onClick={() => setStep('menu')}
              className="w-full h-11 text-o1-body text-o1-muted cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}

        {step === 'done' && (
          <>
            <p role="status" className="text-o1-body text-o1-text leading-snug">
              {doneText}
            </p>
            <button
              type="button"
              onClick={finish}
              className="w-full h-11 rounded-full bg-o1-surface border border-white/[0.07] text-o1-control text-o1-text cursor-pointer"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
